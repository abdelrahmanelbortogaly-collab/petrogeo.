import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
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
} from 'firebase/firestore';
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

export const saveUserProfile = async (profile: FirestoreUserProfile) => {
  try {
    const userRef = doc(db, 'users', profile.uid);
    await setDoc(userRef, profile, { merge: true });
  } catch (err) {
    console.warn('Could not save user profile to Firestore:', err);
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
