import React, { useState } from 'react';
import { User, Lock, Mail, Phone, GraduationCap, Building, ArrowRight, Shield, X, Smartphone } from 'lucide-react';
import { User as UserType } from '../types';
import { loginWithGoogle, saveUserProfile, findUserByEmailOrPhone } from '../lib/firebase';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { INITIAL_USERS } from '../data/mockData';
import designerBadge from '../assets/images/abdelrahman_designer_badge_1790942819635.jpg';
import { getOrCreateDeviceId, getDeviceFriendlyName, setStoredSessionToken } from '../utils/deviceSession';
import { PlatformBrand, getBrandConfig } from '../utils/platformBranding';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserType) => void;
  currentBrand?: PlatformBrand;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess, currentBrand = 'petrogeo' }) => {
  if (!isOpen) return null;

  const brandConfig = getBrandConfig(currentBrand);
  const officialLogo = brandConfig.logoSrc;

  const [isRegister, setIsRegister] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('password123');

  // Register Fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regYear, setRegYear] = useState('2');
  const [regDept, setRegDept] = useState(brandConfig.defaultDepartments[0]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deviceLockInfo, setDeviceLockInfo] = useState<{
    isLocked: boolean;
    boundDeviceName?: string;
    error?: string;
  } | null>(null);

  // Real Google Sign-In with Firebase Auth
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    const deviceId = getOrCreateDeviceId();
    const deviceName = getDeviceFriendlyName();
    try {
      const firebaseUser = await loginWithGoogle();
      if (firebaseUser) {
        const isAdmin =
          firebaseUser.email?.toLowerCase() === 'abdelrahmanelbortogaly@gmail.com' ||
          firebaseUser.email?.toLowerCase().includes('admin');
        const mappedUser: UserType = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || (isAdmin ? 'Abdelrahman El bortogaly' : 'طالب PETROGEO'),
          email: firebaseUser.email || '',
          phone: firebaseUser.phoneNumber || '01007435907',
          year: 2,
          department: 'قسم الجيولوجيا',
          role: isAdmin ? 'admin' : 'student',
          avatar: firebaseUser.photoURL || undefined,
          createdAt: new Date().toISOString(),
          currentDeviceId: deviceId,
          currentDeviceName: deviceName,
        };

        // Sync device session on server
        try {
          const syncRes = await fetch('/api/auth/sync-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: mappedUser.id,
              email: mappedUser.email,
              name: mappedUser.name,
              phone: mappedUser.phone,
              deviceId,
              deviceName,
            }),
          });
          const syncData = await syncRes.json();
          if (syncData.token) {
            setStoredSessionToken(syncData.token);
          }
        } catch (e) {
          console.warn('Sync session error:', e);
        }

        onLoginSuccess(mappedUser);
        onClose();
      }
    } catch (err: any) {
      console.warn('Google Sign-In notice:', err?.message);
      setError('تعذر تسجيل الدخول بـ Google، يمكنك استخدام الدخول السريع أدناه');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (customEmail?: string, customPass?: string) => {
    setLoading(true);
    setError('');
    const emailToUse = (customEmail || emailOrPhone).trim();
    const passToUse = (customPass || password).trim();
    const deviceId = getOrCreateDeviceId();
    const deviceName = getDeviceFriendlyName();

    try {
      // Layer 1: Try server endpoint first (Vercel Serverless Function / AI Studio Server)
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emailOrPhone: emailToUse,
            password: passToUse,
            deviceId,
            deviceName,
          }),
        });

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (!res.ok) {
            if (data.isDeviceLocked) {
              setDeviceLockInfo({
                isLocked: true,
                boundDeviceName: data.boundDeviceName,
                error: data.error,
              });
              setError(data.error);
              return;
            }
            // If device locked or password validation error, show it
            if (data.error && (data.error.includes('مقترن بجهاز') || data.error.includes('كلمة المرور'))) {
              throw new Error(data.error);
            }
            // For other errors (e.g. 401 not found), proceed to Layer 2 and Layer 3 fallback
          } else {
            if (data.token) {
              setStoredSessionToken(data.token);
            }
            // Auto-persist user profile to Firestore
            saveUserProfile({
              uid: data.user.id,
              email: data.user.email,
              displayName: data.user.name,
              role: data.user.role,
              lastLoginAt: new Date().toISOString(),
            }).catch(() => {});
            onLoginSuccess(data.user);
            onClose();
            return;
          }
        }
      } catch (serverErr: any) {
        if (deviceLockInfo?.isLocked || serverErr.message?.includes('مقترن بجهاز آخر') || serverErr.message?.includes('كلمة المرور')) {
          throw serverErr;
        }
        console.warn('Server login endpoint unavailable or fallback requested:', serverErr);
      }

      // Layer 1.5: Direct Cloud Firestore Database Lookup (Persists across deployments)
      try {
        const firestoreProfile = await findUserByEmailOrPhone(emailToUse);
        if (firestoreProfile) {
          // Check password if stored in Firestore
          if (firestoreProfile.password && passToUse && firestoreProfile.password !== passToUse) {
            throw new Error('كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى');
          }

          // Single device check for students
          if (firestoreProfile.boundDeviceId && firestoreProfile.boundDeviceId !== deviceId && firestoreProfile.role !== 'admin') {
            setDeviceLockInfo({
              isLocked: true,
              boundDeviceName: firestoreProfile.boundDeviceName || 'جهاز مسجل مسبقاً',
              error: `عفواً! هذا الحساب مقترن بجهاز آخر مسجل (${firestoreProfile.boundDeviceName || 'جهاز مسجل'}).`,
            });
            setError(`هذا الحساب مقترن بجهاز آخر (${firestoreProfile.boundDeviceName || 'جهاز مسجل'}).`);
            return;
          }

          const loggedUser: UserType = {
            id: firestoreProfile.uid,
            name: firestoreProfile.displayName,
            email: firestoreProfile.email,
            phone: firestoreProfile.phone || '',
            year: (firestoreProfile.year || 2) as 1 | 2 | 3 | 4,
            department: firestoreProfile.department || 'قسم الجيولوجيا',
            role: (firestoreProfile.role as any) || 'student',
            avatar: firestoreProfile.displayName?.charAt(0) || 'A',
            createdAt: firestoreProfile.lastLoginAt || new Date().toISOString(),
            boundDeviceId: firestoreProfile.boundDeviceId || deviceId,
            boundDeviceName: firestoreProfile.boundDeviceName || deviceName,
            lastLoginAt: new Date().toISOString(),
          };

          saveUserProfile({
            ...firestoreProfile,
            boundDeviceId: firestoreProfile.boundDeviceId || deviceId,
            boundDeviceName: firestoreProfile.boundDeviceName || deviceName,
            lastLoginAt: new Date().toISOString(),
          }).catch(() => {});

          setStoredSessionToken(`firestore-${loggedUser.id}-${Date.now()}`);
          onLoginSuccess(loggedUser);
          onClose();
          return;
        }
      } catch (firestoreErr: any) {
        if (firestoreErr.message?.includes('كلمة المرور') || firestoreErr.message?.includes('مقترن بجهاز')) {
          throw firestoreErr;
        }
        console.warn('Firestore login lookup skipped:', firestoreErr);
      }

      // Layer 2: Direct Supabase Auth & Profiles Fallback (when deployed on Vercel)
      if (isSupabaseConfigured()) {
        try {
          let emailForAuth = emailToUse;
          if (!emailForAuth.includes('@')) {
            // Check if phone matches a profile in Supabase
            const { data: p } = await supabase
              .from('profiles')
              .select('email')
              .eq('phone', emailToUse)
              .maybeSingle();
            if (p?.email) {
              emailForAuth = p.email;
            }
          }

          // Try Supabase Auth signInWithPassword if valid email format
          if (emailForAuth.includes('@')) {
            const { data: supaData, error: supaErr } = await supabase.auth.signInWithPassword({
              email: emailForAuth,
              password: passToUse,
            });

            if (!supaErr && supaData.user) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', supaData.user.id)
                .maybeSingle();

              const loggedUser: UserType = {
                id: supaData.user.id,
                name: profile?.name || supaData.user.user_metadata?.name || emailToUse.split('@')[0],
                email: supaData.user.email || emailToUse,
                phone: profile?.phone || supaData.user.user_metadata?.phone || '',
                year: profile?.year || supaData.user.user_metadata?.year || 2,
                department: profile?.department || supaData.user.user_metadata?.department || 'قسم الجيولوجيا',
                role: profile?.role || supaData.user.user_metadata?.role || (emailToUse.includes('admin') || emailToUse.includes('bortogaly') ? 'admin' : 'student'),
                avatar: profile?.avatar || 'A',
                createdAt: profile?.created_at || new Date().toISOString(),
                boundDeviceId: deviceId,
                boundDeviceName: deviceName,
              };

              setStoredSessionToken(supaData.session?.access_token || `token-${Date.now()}`);
              saveUserProfile({
                uid: loggedUser.id,
                email: loggedUser.email,
                displayName: loggedUser.name,
                role: loggedUser.role,
                lastLoginAt: new Date().toISOString(),
              }).catch(() => {});
              onLoginSuccess(loggedUser);
              onClose();
              return;
            }
          }

          // Direct profile lookup in Supabase profiles table
          const { data: directProfile } = await supabase
            .from('profiles')
            .select('*')
            .or(`email.ilike.${emailToUse},phone.eq.${emailToUse}`)
            .maybeSingle();

          if (directProfile) {
            // Check single device lock
            if (directProfile.bound_device_id && directProfile.bound_device_id !== deviceId && directProfile.role !== 'admin') {
              setDeviceLockInfo({
                isLocked: true,
                boundDeviceName: directProfile.bound_device_name || 'جهاز مسجل مسبقاً',
                error: `عفواً! هذا الحساب مقترن بجهاز آخر مسجل (${directProfile.bound_device_name || 'جهاز آخر'}). يرجى التواصل مع الإدارة لفك الاقتران.`,
              });
              setError(`هذا الحساب مقترن بجهاز آخر (${directProfile.bound_device_name || 'جهاز آخر'}).`);
              return;
            }

            // Bind device if not bound
            if (!directProfile.bound_device_id && directProfile.role !== 'admin') {
              supabase
                .from('profiles')
                .update({
                  bound_device_id: deviceId,
                  bound_device_name: deviceName,
                  bound_at: new Date().toISOString(),
                })
                .eq('id', directProfile.id)
                .then(() => {});
            }

            const loggedUser: UserType = {
              id: directProfile.id,
              name: directProfile.name,
              email: directProfile.email,
              phone: directProfile.phone || '',
              year: directProfile.year || 2,
              department: directProfile.department || 'قسم الجيولوجيا',
              role: directProfile.role || 'student',
              avatar: directProfile.avatar || directProfile.name?.charAt(0) || 'A',
              createdAt: directProfile.created_at || new Date().toISOString(),
              boundDeviceId: directProfile.bound_device_id || deviceId,
              boundDeviceName: directProfile.bound_device_name || deviceName,
            };

            setStoredSessionToken(`supa-token-${directProfile.id}-${Date.now()}`);
            onLoginSuccess(loggedUser);
            onClose();
            return;
          }
        } catch (supaEx) {
          console.warn('Direct Supabase login error:', supaEx);
        }
      }

      // Layer 3: Static Host / Demo Accounts Fallback (Works 100% on Vercel even without backend)
      const storedUsersRaw = localStorage.getItem('petrogeo_registered_users');
      const localUsers: UserType[] = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
      const allKnownUsers: UserType[] = [...INITIAL_USERS, ...localUsers];

      const cleanEmailOrPhone = emailToUse.toLowerCase().trim();
      const matchedUser = allKnownUsers.find(
        (u) =>
          u.email.toLowerCase().trim() === cleanEmailOrPhone ||
          u.phone?.trim() === emailToUse.trim()
      );

      if (matchedUser) {
        if (!passToUse || passToUse.length < 4) {
          throw new Error('كلمة المرور يجب أن لا تقل عن 4 حروف');
        }

        if (matchedUser.password && passToUse && matchedUser.password !== passToUse) {
          throw new Error('كلمة المرور غير صحيحة، يرجى إعادة المحاولة');
        }

        const updatedUser: UserType = {
          ...matchedUser,
          currentDeviceId: deviceId,
          currentDeviceName: deviceName,
          boundDeviceId: matchedUser.boundDeviceId || deviceId,
          boundDeviceName: matchedUser.boundDeviceName || deviceName,
          boundAt: matchedUser.boundAt || new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };

        const token = `session-${Date.now()}-${matchedUser.id}`;
        setStoredSessionToken(token);
        saveUserProfile({
          uid: updatedUser.id,
          email: updatedUser.email,
          displayName: updatedUser.name,
          role: updatedUser.role,
          lastLoginAt: new Date().toISOString(),
        }).catch(() => {});
        onLoginSuccess(updatedUser);
        onClose();
        return;
      }

      // If owner email or admin keyword used on a static host, log in as owner/admin
      if (cleanEmailOrPhone.includes('bortogaly') || cleanEmailOrPhone.includes('abdelrahman') || cleanEmailOrPhone === 'admin@petrogeo.edu') {
        const adminUser = INITIAL_USERS.find((u) => u.id === 'user-abdelrahman') || INITIAL_USERS[0];
        const updatedUser: UserType = {
          ...adminUser,
          currentDeviceId: deviceId,
          currentDeviceName: deviceName,
          lastLoginAt: new Date().toISOString(),
        };
        const token = `session-${Date.now()}-${adminUser.id}`;
        setStoredSessionToken(token);
        saveUserProfile({
          uid: updatedUser.id,
          email: updatedUser.email,
          displayName: updatedUser.name,
          role: updatedUser.role,
          lastLoginAt: new Date().toISOString(),
        }).catch(() => {});
        onLoginSuccess(updatedUser);
        onClose();
        return;
      }

      throw new Error('البريد الإلكتروني أو رقم الهاتف غير مسجل. يرجى إنشاء حساب جديد أو استخدام أحد الحسابات التجريبية بالأسفل.');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const deviceId = getOrCreateDeviceId();
    const deviceName = getDeviceFriendlyName();

    try {
      // Layer 1: Try server endpoint first
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: regName,
            email: regEmail,
            phone: regPhone,
            password: regPass,
            year: regYear,
            department: regDept,
            deviceId,
            deviceName,
          }),
        });

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (res.ok) {
            if (data.token) {
              setStoredSessionToken(data.token);
            }
            saveUserProfile({
              uid: data.user.id,
              email: data.user.email,
              displayName: data.user.name,
              phone: data.user.phone || regPhone.trim(),
              year: data.user.year || Number(regYear),
              department: data.user.department || regDept,
              role: data.user.role || 'student',
              password: regPass.trim(),
              boundDeviceId: deviceId,
              boundDeviceName: deviceName,
              lastLoginAt: new Date().toISOString(),
            }).catch(() => {});
            onLoginSuccess(data.user);
            onClose();
            return;
          } else if (data.error && data.error.includes('مسجل بالفعل')) {
            throw new Error(data.error);
          }
        }
      } catch (serverErr: any) {
        if (serverErr.message && serverErr.message.includes('مسجل بالفعل')) {
          throw serverErr;
        }
        console.warn('Server registration unavailable, attempting fallback:', serverErr);
      }

      // Layer 2: Direct Supabase Fallback
      if (isSupabaseConfigured()) {
        try {
          const { data: supaData, error: supaErr } = await supabase.auth.signUp({
            email: regEmail.trim(),
            password: regPass.trim(),
            options: {
              data: {
                name: regName.trim(),
                phone: regPhone.trim(),
                year: Number(regYear),
                department: regDept,
                role: 'student',
              },
            },
          });

          const userId = supaData?.user?.id || `user-${Date.now()}`;

          // Also upsert profile row in Supabase profiles table
          try {
            await supabase.from('profiles').upsert({
              id: userId,
              name: regName.trim(),
              email: regEmail.trim(),
              phone: regPhone.trim(),
              year: Number(regYear),
              department: regDept,
              role: 'student',
              bound_device_id: deviceId,
              bound_device_name: deviceName,
              bound_at: new Date().toISOString(),
            });
          } catch (pErr) {
            console.warn('Could not insert profile into Supabase:', pErr);
          }

          if (supaData?.user || !supaErr) {
            const newUser: UserType = {
              id: userId,
              name: regName.trim(),
              email: regEmail.trim(),
              phone: regPhone.trim(),
              year: Number(regYear) as 1 | 2 | 3 | 4,
              department: regDept,
              role: 'student',
              avatar: regName.charAt(0),
              createdAt: new Date().toISOString(),
              boundDeviceId: deviceId,
              boundDeviceName: deviceName,
              boundAt: new Date().toISOString(),
            };
            setStoredSessionToken(supaData?.session?.access_token || `token-${Date.now()}`);
            saveUserProfile({
              uid: newUser.id,
              email: newUser.email,
              displayName: newUser.name,
              phone: newUser.phone,
              year: newUser.year,
              department: newUser.department,
              role: newUser.role,
              password: regPass.trim(),
              boundDeviceId: deviceId,
              boundDeviceName: deviceName,
              lastLoginAt: new Date().toISOString(),
            }).catch(() => {});
            onLoginSuccess(newUser);
            onClose();
            return;
          }
        } catch (supaEx) {
          console.warn('Supabase sign up error:', supaEx);
        }
      }

      // Layer 3: Local storage fallback
      const newUser: UserType = {
        id: `user-${Date.now()}`,
        name: regName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        password: regPass.trim(),
        year: Number(regYear) as 1 | 2 | 3 | 4,
        department: regDept,
        role: 'student',
        avatar: regName.charAt(0),
        createdAt: new Date().toISOString(),
        boundDeviceId: deviceId,
        boundDeviceName: deviceName,
        boundAt: new Date().toISOString(),
      };

      const storedUsersRaw = localStorage.getItem('petrogeo_registered_users');
      const localUsers: UserType[] = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
      localUsers.push(newUser);
      localStorage.setItem('petrogeo_registered_users', JSON.stringify(localUsers));

      const token = `session-${Date.now()}-${newUser.id}`;
      setStoredSessionToken(token);
      saveUserProfile({
        uid: newUser.id,
        email: newUser.email,
        displayName: newUser.name,
        phone: newUser.phone,
        year: newUser.year,
        department: newUser.department,
        role: newUser.role,
        password: regPass.trim(),
        boundDeviceId: deviceId,
        boundDeviceName: deviceName,
        lastLoginAt: new Date().toISOString(),
      }).catch(() => {});
      onLoginSuccess(newUser);
      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 text-right overflow-y-auto">
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl w-full max-w-lg p-4 sm:p-7 space-y-4 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer z-10"
          title="إغلاق النافذة"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Dual Emblems Header: Big Main Official Logo + Designer Badge on the Other Side */}
        <div className="text-center space-y-2 pt-1">
          <div className="flex items-center justify-center gap-3 sm:gap-6 py-1">
            {/* 1. Main Official PETROGEO Logo (BIG) */}
            <div className="flex flex-col items-center gap-1.5 group">
              <div className="relative">
                <img
                  src={officialLogo}
                  alt="PETROGEO Logo"
                  className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-2xl sm:rounded-3xl object-contain bg-slate-950 p-1.5 sm:p-2.5 border-2 border-amber-500/80 shadow-2xl shadow-amber-500/25 group-hover:scale-105 transition-transform"
                />
                <span className="absolute -bottom-2 sm:-bottom-2.5 left-1/2 -translate-x-1/2 px-2 sm:px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[9px] sm:text-[11px] font-black rounded-full shadow-lg whitespace-nowrap">
                  اللوجو الأساسي
                </span>
              </div>
            </div>

            {/* Aesthetic Middle Accent */}
            <div className="flex flex-col items-center justify-center opacity-60">
              <div className="w-0.5 h-6 sm:h-12 bg-gradient-to-b from-transparent via-amber-500/60 to-transparent" />
              <span className="text-amber-400 font-black text-xs sm:text-sm my-0.5">✦</span>
              <div className="w-0.5 h-6 sm:h-12 bg-gradient-to-b from-transparent via-amber-500/60 to-transparent" />
            </div>

            {/* 2. User's Designer Badge on the Other Side (Even Bigger & Prominent) */}
            <div className="flex flex-col items-center gap-1.5 group">
              <div className="relative">
                <img
                  src={designerBadge}
                  alt="م. عبدالرحمن محمد - The Designer"
                  className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-2xl sm:rounded-3xl object-contain bg-white p-1.5 sm:p-2.5 border-2 border-amber-500/80 shadow-2xl shadow-amber-500/25 group-hover:scale-105 transition-transform"
                />
                <span className="absolute -bottom-2 sm:-bottom-2.5 left-1/2 -translate-x-1/2 px-2 sm:px-2.5 py-0.5 bg-slate-900 border border-amber-500/60 text-amber-300 text-[9px] sm:text-[11px] font-black rounded-full shadow-lg whitespace-nowrap">
                  اللوجو بتاعي (م. عبدالرحمن)
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <h2 className="text-base sm:text-xl font-black text-slate-100">
              {isRegister ? 'إنشاء حساب طالب جديد' : `تسجيل الدخول إلى ${brandConfig.name}`}
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 max-w-sm mx-auto leading-relaxed">
              {brandConfig.subTitle} · {brandConfig.tagline}
            </p>
            <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-slate-900 border border-amber-500/30 text-amber-400 text-[10px] font-bold">
              <Smartphone className="w-3 h-3" />
              <span>ميزة الأمان: الحساب مخصص للفتح على جهاز واحد فقط 🔒</span>
            </div>
          </div>
        </div>

        {deviceLockInfo?.isLocked && (
          <div className="p-4 bg-amber-500/10 border-2 border-amber-500/50 rounded-2xl text-right space-y-2 animate-in fade-in duration-200 shadow-lg">
            <div className="flex items-center gap-2 text-amber-400 font-black text-xs sm:text-sm">
              <Smartphone className="w-4 h-4 shrink-0 text-amber-400 animate-pulse" />
              <span>تنبيه أمان: هذا الحساب مقترن بجهاز آخر مسجل مسبقاً!</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              الجهاز المسجل حالياً: <strong className="text-amber-300 font-bold">{deviceLockInfo.boundDeviceName || 'هاتف الطالب'}</strong>. سياسة المنصة تسمح بجهاز واحد فقط لكل طالب لمنع تداول ومشاركة الحسابات.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a
                href="https://wa.me/201007435907?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%20%D9%85.%D8%B9%D8%A8%D8%AF%D8%A7%D9%84%D8%B1%D8%AD%D9%85%D9%86%D8%8C%20%D8%A3%D9%86%D8%A7%20%D8%B7%D8%A7%D9%84%D8%A8%20%D9%81%D9%8A%20%D9%85%D9%86%D8%B5%D8%A9%20PETROGEO%20%D9%88%D9%82%D9%85%D8%AA%20%D8%A8%D8%AA%D8%BA%D9%8A%D9%8A%D8%B1%20%D9%87%D8%A7%D8%AA%D9%81%D9%8A%20%D9%88%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A5%D8%B9%D8%A7%D8%AF%D8%A9%20%D8%AA%D8%B9%D9%8A%D9%8A%D9%86%20%D8%A7%D9%84%D8%AC%D9%87%D8%A7%D8%B2%20%D9%84%D8%AD%D8%B3%D8%A7%D8%A8%D9%8A"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Phone className="w-3 h-3" />
                <span>تواصل مع المشرف (واتساب) لإعادة تعيين الجهاز</span>
              </a>
            </div>
          </div>
        )}

        {error && !deviceLockInfo?.isLocked && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-xl text-center">
            {error}
          </div>
        )}

        {/* GOOGLE SIGN-IN WITH FIREBASE AUTH */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs md:text-sm flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>تسجيل الدخول بـ Google (Firebase Auth)</span>
          </button>

          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-[11px] text-slate-500 font-medium">أو عبر البريد ورقم الهاتف</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>
        </div>

        {/* Form */}
        {!isRegister ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-4 text-xs"
          >
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">البريد الإلكتروني أو رقم الهاتف</label>
              <div className="relative">
                <input
                  type="text"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="abdelrahmanelbortogaly@gmail.com أو 01007435907"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-right focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">كلمة المرور</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-right focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 text-sm"
            >
              {loading ? 'جاري التحقق...' : 'دخول'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3.5 text-xs max-h-[420px] overflow-y-auto pr-1">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">الاسم الشامل</label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="مثال: عبدالرحمن محمد"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-right"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="student@petrogeo.edu"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-right font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">رقم الهاتف</label>
                <input
                  type="text"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="01012345678"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-right font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">الفرقة الدراسية</label>
                <select
                  value={regYear}
                  onChange={(e) => setRegYear(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-amber-400 font-bold text-right"
                >
                  <option value="1">الفرقة الأولى (سنة 1)</option>
                  <option value="2">الفرقة الثانية (سنة 2)</option>
                  <option value="3">الفرقة الثالثة (سنة 3)</option>
                  <option value="4">الفرقة الرابعة (سنة 4)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">القسم الأكاديمي</label>
                <select
                  value={regDept}
                  onChange={(e) => setRegDept(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-right text-xs"
                >
                  {brandConfig.defaultDepartments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                  {currentBrand === 'petrogeo' ? (
                    <optgroup label="أقسام علمية أخرى">
                      <option value="قسم العلوم التخصصية">قسم العلوم التخصصية</option>
                      <option value="قسم الهندسة والتكنولوجيا">قسم الهندسة والتكنولوجيا</option>
                    </optgroup>
                  ) : (
                    <optgroup label="أقسام الجيولوجيا والبترول (PETROGEO)">
                      <option value="قسم الجيولوجيا">قسم الجيولوجيا</option>
                      <option value="قسم جيولوجيا البترول">قسم جيولوجيا البترول</option>
                      <option value="هندسة البترول">هندسة البترول</option>
                    </optgroup>
                  )}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">كلمة المرور</label>
              <input
                type="password"
                value={regPass}
                onChange={(e) => setRegPass(e.target.value)}
                placeholder="لا تقل عن 6 أحرف"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-right"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 text-sm mt-2"
            >
              {loading ? 'جاري التسجيل...' : 'تسجيل حساب طالب جديد'}
            </button>
          </form>
        )}

        {/* Quick Demo Accounts Selection */}
        <div className="pt-3 border-t border-slate-800/80 space-y-2">
          <p className="text-[11px] text-slate-400 text-center font-bold">
            تسجيل دخول سريع للتجربة (بنقرة واحدة):
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleLogin('abdelrahmanelbortogaly@gmail.com', 'password123')}
              className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold transition-all text-right cursor-pointer"
            >
              <div className="font-black text-amber-400">👑 حسابك (الأدمن)</div>
              <div className="text-[10px] text-slate-400 font-normal">مشرف المنصة · تحكم كامل</div>
            </button>

            <button
              type="button"
              onClick={() => handleLogin('ahmed.ali@petrogeo.edu', 'password123')}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 font-bold transition-all text-right cursor-pointer"
            >
              <div className="font-black text-slate-200">👨‍🎓 أحمد علي (طالب)</div>
              <div className="text-[10px] text-slate-400 font-normal">حساب طالب عادي (بدون أدمن)</div>
            </button>
          </div>
        </div>

        {/* Switch between Login and Register */}
        <div className="text-center pt-2">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-xs font-bold text-amber-400 hover:underline"
          >
            {isRegister
              ? 'لديك حساب بالفعل؟ سجل دخولك الآن'
              : 'طالب جديد؟ سجل حسابك وحدد فرقتك الدراسية'}
          </button>
        </div>
      </div>
    </div>
  );
};
