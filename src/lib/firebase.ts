import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  limit,
  serverTimestamp,
  deleteDoc,
} from 'firebase/firestore';
import { Course, Exam, PlatformSettings } from '../types';
import config from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(config);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore with specific database ID if configured
export const db = config.firestoreDatabaseId
  ? getFirestore(app, config.firestoreDatabaseId)
  : getFirestore(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Auth helper functions
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    // Auto sync user profile to Firestore
    if (user) {
      await saveUserProfile({
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'طالب PETROGEO',
        photoURL: user.photoURL || '',
        lastLoginAt: new Date().toISOString(),
      });
    }
    return user;
  } catch (error: any) {
    console.warn('Firebase Google Sign-In Error:', error?.code, error?.message);
    throw error;
  }
};

export const logoutFirebase = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Firebase Logout Error:', error);
  }
};

export const registerWithFirebaseAuth = async (email: string, pass: string): Promise<FirebaseUser | null> => {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    return cred.user;
  } catch (error: any) {
    console.warn('Firebase createUser error / notice:', error?.code, error?.message);
    return null;
  }
};

export const loginWithFirebaseAuth = async (email: string, pass: string): Promise<FirebaseUser | null> => {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    return cred.user;
  } catch (error: any) {
    console.warn('Firebase signIn error / notice:', error?.code, error?.message);
    return null;
  }
};

export const subscribeToAuthChanges = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// ------------------- FIRESTORE DATA PERSISTENCE HELPERS -------------------

export interface FirestoreUserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  year?: number;
  department?: string;
  role?: string;
  password?: string;
  boundDeviceId?: string;
  boundDeviceName?: string;
  enrolledCourses?: string[];
  lastLoginAt: string;
}

export const saveUserProfile = async (profile: FirestoreUserProfile): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', profile.uid);
    // Sanitize: remove any undefined values so Firestore doesn't reject write
    const cleanData: Record<string, any> = {};
    for (const [key, value] of Object.entries(profile)) {
      if (value !== undefined) {
        cleanData[key] = value;
      }
    }
    await setDoc(userRef, cleanData, { merge: true });
    console.log('[Firestore] User profile successfully saved to Firestore:', profile.uid);
    return true;
  } catch (err) {
    console.error('Could not save user profile to Firestore:', err);
    return false;
  }
};

export const getUserProfile = async (uid: string): Promise<FirestoreUserProfile | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data() as FirestoreUserProfile;
    }
  } catch (err) {
    console.warn('Could not fetch user profile from Firestore:', err);
  }
  return null;
};

export const findUserByEmailOrPhone = async (input: string): Promise<FirestoreUserProfile | null> => {
  try {
    const clean = input.trim().toLowerCase();
    const usersCol = collection(db, 'users');
    const emailQ = query(usersCol, where('email', '==', clean), limit(1));
    const emailSnap = await getDocs(emailQ);
    if (!emailSnap.empty) {
      return emailSnap.docs[0].data() as FirestoreUserProfile;
    }
    const phoneQ = query(usersCol, where('phone', '==', input.trim()), limit(1));
    const phoneSnap = await getDocs(phoneQ);
    if (!phoneSnap.empty) {
      return phoneSnap.docs[0].data() as FirestoreUserProfile;
    }
  } catch (err) {
    console.warn('Firestore findUserByEmailOrPhone error:', err);
  }
  return null;
};

// Fetch all registered students directly from Firestore
export const getAllFirestoreStudents = async (): Promise<FirestoreUserProfile[]> => {
  try {
    const q = query(collection(db, 'users'));
    const snap = await getDocs(q);
    const list: FirestoreUserProfile[] = [];
    snap.forEach((d) => {
      const data = d.data() as FirestoreUserProfile;
      if (data && data.role !== 'admin') {
        list.push({ ...data, uid: d.id });
      }
    });
    return list;
  } catch (err) {
    console.warn('Could not fetch all students from Firestore:', err);
    return [];
  }
};

// Delete single student from Firestore
export const deleteStudentFromFirestore = async (studentId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'users', studentId));
    return true;
  } catch (err) {
    console.error('Could not delete student in Firestore:', err);
    return false;
  }
};

// Delete co-admin from Firestore
export const deleteAdminFromFirestore = async (adminId: string, email?: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'users', adminId));
    if (email) {
      const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase()));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }
    }
    return true;
  } catch (err) {
    console.warn('Could not delete admin from Firestore:', err);
    return false;
  }
};

// Clear all students from Firestore (keeps admins)
export const clearAllFirestoreStudents = async (): Promise<boolean> => {
  try {
    const snap = await getDocs(collection(db, 'users'));
    const deletePromises = snap.docs
      .filter((d) => {
        const u = d.data();
        return u.role !== 'admin' && !u.email?.includes('abdelrahman') && !u.email?.includes('bortogaly');
      })
      .map((d) => deleteDoc(doc(db, 'users', d.id)));
    await Promise.all(deletePromises);
    return true;
  } catch (err) {
    console.error('Could not clear students in Firestore:', err);
    return false;
  }
};

// ------------------- FIRESTORE COURSES & LECTURES PERSISTENCE -------------------

// Fetch all courses from Firestore (with timeout and cache fallback)
export const getAllFirestoreCourses = async (): Promise<Course[]> => {
  try {
    const q = query(collection(db, 'courses'));
    const snap = await withTimeout(getDocs(q), 3000, null);
    if (snap) {
      const list: Course[] = [];
      snap.forEach((d) => {
        const c = d.data() as Course;
        list.push({ ...c, id: d.id });
      });
      if (list.length > 0) {
        try {
          localStorage.setItem('petrogeo_cached_courses', JSON.stringify(list));
        } catch {}
      }
      return list;
    }
    // If timed out, read from local cache
    const stored = localStorage.getItem('petrogeo_cached_courses');
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.warn('Could not fetch courses from Firestore, reading local cache:', err);
    try {
      const stored = localStorage.getItem('petrogeo_cached_courses');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  }
};

// Check if courses were explicitly cleared by admin
export const isCoursesClearedInFirestore = async (): Promise<boolean> => {
  try {
    const docRef = doc(db, 'settings', 'courses_status');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return Boolean(snap.data()?.cleared);
    }
  } catch (err) {
    console.warn('Could not check courses status in Firestore:', err);
  }
  return false;
};

// Helper: Promise timeout wrapper to prevent hanging on Firestore quota limits
export function withTimeout<T>(promise: Promise<T>, ms = 3000, fallback?: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve, reject) => {
      setTimeout(() => {
        if (fallback !== undefined) resolve(fallback);
        else reject(new Error(`Timeout after ${ms}ms`));
      }, ms);
    }),
  ]);
}

// Save or update a course with its lectures directly in Firestore
export const saveCourseToFirestore = async (course: Course): Promise<boolean> => {
  try {
    // 1. Immediately cache in localStorage for instant responsiveness & offline resilience
    try {
      const cacheKey = 'petrogeo_cached_courses';
      const stored = localStorage.getItem(cacheKey);
      const list: Course[] = stored ? JSON.parse(stored) : [];
      const idx = list.findIndex((c) => c.id === course.id);
      if (idx !== -1) list[idx] = course;
      else list.push(course);
      localStorage.setItem(cacheKey, JSON.stringify(list));
    } catch {}

    const docRef = doc(db, 'courses', course.id);
    const cleanData: Record<string, any> = {};
    for (const [key, value] of Object.entries(course)) {
      if (value !== undefined) {
        cleanData[key] = value;
      }
    }

    // 2. Wrap write in 3-second timeout so quota limits NEVER freeze the browser
    await withTimeout(setDoc(docRef, cleanData, { merge: true }), 3000);
    withTimeout(
      setDoc(doc(db, 'settings', 'courses_status'), { cleared: false, updatedAt: new Date().toISOString() }, { merge: true }),
      2000
    ).catch(() => {});

    console.log('[Firestore] Course saved successfully:', course.id);
    return true;
  } catch (err: any) {
    console.warn('[Firestore] Course write notice (quota limit or timeout), cached locally:', err?.message || err);
    return true;
  }
};

// Delete a course from Firestore
export const deleteCourseFromFirestore = async (courseId: string): Promise<boolean> => {
  try {
    await withTimeout(deleteDoc(doc(db, 'courses', courseId)), 3000);
    console.log('[Firestore] Course deleted successfully:', courseId);
    return true;
  } catch (err) {
    console.warn('Could not delete course from Firestore:', err);
    return true;
  }
};

// Clear all courses in Firestore
export const clearAllFirestoreCourses = async (): Promise<boolean> => {
  try {
    const snap = await getDocs(collection(db, 'courses'));
    const deletePromises = snap.docs.map((d) => deleteDoc(doc(db, 'courses', d.id)));
    await Promise.all(deletePromises);
    // Mark courses as explicitly cleared so demo courses are not shown
    await setDoc(doc(db, 'settings', 'courses_status'), { cleared: true, updatedAt: new Date().toISOString() });
    console.log('[Firestore] All courses cleared successfully');
    return true;
  } catch (err) {
    console.error('Could not clear courses in Firestore:', err);
    return false;
  }
};

// ------------------- FIRESTORE EXAMS & QUIZZES PERSISTENCE -------------------

// Fetch all exams from Firestore
export const getAllFirestoreExams = async (): Promise<Exam[]> => {
  try {
    const q = query(collection(db, 'exams'));
    const snap = await getDocs(q);
    const list: Exam[] = [];
    snap.forEach((d) => {
      const e = d.data() as Exam;
      list.push({ ...e, id: d.id });
    });
    return list;
  } catch (err) {
    console.warn('Could not fetch exams from Firestore:', err);
    return [];
  }
};

// Check if exams were explicitly cleared by admin
export const isExamsClearedInFirestore = async (): Promise<boolean> => {
  try {
    const docRef = doc(db, 'settings', 'exams_status');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return Boolean(snap.data()?.cleared);
    }
  } catch (err) {
    console.warn('Could not check exams status in Firestore:', err);
  }
  return false;
};

// Save or update an exam in Firestore
export const saveExamToFirestore = async (exam: Exam): Promise<boolean> => {
  try {
    const docRef = doc(db, 'exams', exam.id);
    const cleanData: Record<string, any> = {};
    for (const [key, value] of Object.entries(exam)) {
      if (value !== undefined) {
        cleanData[key] = value;
      }
    }
    await setDoc(docRef, cleanData, { merge: true });
    // Also reset cleared flag
    await setDoc(doc(db, 'settings', 'exams_status'), { cleared: false, updatedAt: new Date().toISOString() }, { merge: true });
    console.log('[Firestore] Exam saved successfully:', exam.id);
    return true;
  } catch (err) {
    console.error('Could not save exam to Firestore:', err);
    return false;
  }
};

// Delete an exam from Firestore
export const deleteExamFromFirestore = async (examId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'exams', examId));
    console.log('[Firestore] Exam deleted successfully:', examId);
    return true;
  } catch (err) {
    console.error('Could not delete exam from Firestore:', err);
    return false;
  }
};

// Clear all exams in Firestore
export const clearAllFirestoreExams = async (): Promise<boolean> => {
  try {
    const snap = await getDocs(collection(db, 'exams'));
    const deletePromises = snap.docs.map((d) => deleteDoc(doc(db, 'exams', d.id)));
    await Promise.all(deletePromises);
    // Mark exams as explicitly cleared so demo exams are never resurrected
    await setDoc(doc(db, 'settings', 'exams_status'), { cleared: true, updatedAt: new Date().toISOString() });
    console.log('[Firestore] All exams cleared successfully');
    return true;
  } catch (err) {
    console.error('Could not clear exams in Firestore:', err);
    return false;
  }
};

// ------------------- FIRESTORE PLATFORM SETTINGS PERSISTENCE -------------------

// Save platform settings (InstaPay, price, strictSingleDevice, etc.) to Firestore
export const savePlatformSettingsToFirestore = async (settings: PlatformSettings): Promise<boolean> => {
  try {
    const docRef = doc(db, 'settings', 'platform');
    const cleanData: Record<string, any> = {};
    for (const [key, value] of Object.entries(settings)) {
      if (value !== undefined) {
        cleanData[key] = value;
      }
    }
    cleanData.updatedAt = new Date().toISOString();
    await setDoc(docRef, cleanData, { merge: true });
    console.log('[Firestore] Platform settings saved successfully:', cleanData);
    return true;
  } catch (err) {
    console.error('Could not save platform settings to Firestore:', err);
    return false;
  }
};

// Fetch live platform settings from Firestore
export const getPlatformSettingsFromFirestore = async (): Promise<PlatformSettings | null> => {
  try {
    const docRef = doc(db, 'settings', 'platform');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as PlatformSettings;
    }
  } catch (err) {
    console.warn('Could not fetch platform settings from Firestore:', err);
  }
  return null;
};

// Chat turn persistence
export interface FirestoreChatMessage {
  uid: string;
  role: 'user' | 'model';
  text: string;
  model: string;
  searchSources?: Array<{ title: string; uri: string }>;
  mapLocations?: Array<{ title: string; uri: string }>;
  timestamp: string;
}

export const saveChatMessage = async (msg: FirestoreChatMessage) => {
  try {
    await addDoc(collection(db, 'chatHistory'), {
      ...msg,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Could not persist chat message to Firestore:', err);
  }
};

export const getRecentChatHistory = async (uid: string, maxItems: number = 20): Promise<FirestoreChatMessage[]> => {
  try {
    const q = query(
      collection(db, 'chatHistory'),
      where('uid', '==', uid),
      orderBy('createdAt', 'asc'),
      limit(maxItems)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data() as FirestoreChatMessage);
  } catch (err) {
    console.warn('Could not load chat history from Firestore:', err);
    return [];
  }
};

// Image persistence
export interface FirestoreGeneratedImage {
  id?: string;
  uid: string;
  prompt: string;
  imageUrl: string;
  createdAt: string;
  isPublic?: boolean;
}

export const saveGeneratedImageDoc = async (img: FirestoreGeneratedImage) => {
  try {
    const docRef = await addDoc(collection(db, 'generatedImages'), {
      ...img,
      createdAt: new Date().toISOString(),
      isPublic: true,
    });
    return docRef.id;
  } catch (err) {
    console.warn('Could not save image to Firestore:', err);
    return null;
  }
};

export const getUserGeneratedImages = async (uid: string): Promise<FirestoreGeneratedImage[]> => {
  try {
    const q = query(
      collection(db, 'generatedImages'),
      where('uid', '==', uid),
      limit(20)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreGeneratedImage));
  } catch (err) {
    console.warn('Could not load user generated images from Firestore:', err);
    return [];
  }
};
