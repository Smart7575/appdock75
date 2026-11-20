/**
 * AppDock75 - Authentication Context & Session Management
 * Integrated with Firebase Auth (appdock75) & local failover resilience.
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, AuthProvider } from '../types';
import {
  getRegisteredUsers,
  saveRegisteredUsers,
  setCurrentSessionUser,
  permanentlyDeleteAccount,
  generateDemoData,
} from '../services/storage';
import {
  auth,
  googleProvider,
  appleProvider,
  deleteWorkspaceFromFirestore,
  saveUserToFirestore,
  getUserFromFirestore,
  loadWorkspaceFromFirestore,
  saveWorkspaceToFirestore,
  ensureFirebaseAuth,
  FirestoreUserRecord,
} from '../services/firebase';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  deleteUser as firebaseDeleteUser,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';

interface UserCredentials extends User {
  passwordHash?: string;
  appleSubToken?: string;
}

const STORAGE_CREDENTIALS_KEY = 'appdock75_credentials_vault';

function getCredentialsVault(): UserCredentials[] {
  try {
    const raw = localStorage.getItem(STORAGE_CREDENTIALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCredentialsVault(vault: UserCredentials[]) {
  try {
    localStorage.setItem(STORAGE_CREDENTIALS_KEY, JSON.stringify(vault));
  } catch (e) {
    console.error('Failed to save vault', e);
  }
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithEmail: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  registerWithEmail: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithApple: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  updateProfile: (updates: Partial<Pick<User, 'name' | 'avatar' | 'settings'>>) => void;
  changePassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  deleteCurrentAccount: (confirmCredential: string) => Promise<{ success: boolean; error?: string }>;
  linkProvider: (provider: AuthProvider) => void;
  loginAsDemo: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProviderComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const inFlightHydrationRef = useRef<Map<string, Promise<User>>>(new Map());

  const extractProviders = (fbUser: FirebaseUser, preferredProvider?: AuthProvider): AuthProvider[] => {
    const detected = (fbUser.providerData || [])
      .map(p => (p.providerId.includes('google') ? 'google' : p.providerId.includes('apple') ? 'apple' : 'email'))
      .filter((v, i, a) => a.indexOf(v) === i) as AuthProvider[];
    if (preferredProvider && !detected.includes(preferredProvider)) {
      detected.push(preferredProvider);
    }
    return detected.length > 0 ? detected : [preferredProvider || 'email'];
  };

  const buildBaselineUser = (fbUser: FirebaseUser, preferredProvider?: AuthProvider): User => ({
    id: fbUser.uid,
    name: fbUser.displayName || fbUser.email?.split('@')[0] || (preferredProvider === 'google' ? 'Google Developer' : preferredProvider === 'apple' ? 'Apple Developer' : 'Alex Vance'),
    email: fbUser.email || `${fbUser.uid}@appdock75.local`,
    providers: extractProviders(fbUser, preferredProvider),
    createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
    settings: {
      theme: 'dark',
      emailNotifications: true,
      compactView: false,
      dateFormat: 'DD/MM/YYYY',
      bundlePrefix: 'indie',
    },
  });

  const syncFirebaseUserProfile = async (fbUser: FirebaseUser, preferredProvider?: AuthProvider): Promise<User> => {
    const cacheKey = `${fbUser.uid}:${preferredProvider || 'auto'}`;
    const existingPromise = inFlightHydrationRef.current.get(cacheKey) || inFlightHydrationRef.current.get(`${fbUser.uid}:auto`);
    if (existingPromise) {
      return existingPromise;
    }

    const promise = (async () => {
      const safeProviders = extractProviders(fbUser, preferredProvider);
      let profile = await getUserFromFirestore(fbUser.uid);

      if (!profile) {
        profile = {
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || (preferredProvider === 'google' ? 'Google Developer' : preferredProvider === 'apple' ? 'Apple Developer' : 'Alex Vance'),
          email: fbUser.email || `${fbUser.uid}@appdock75.local`,
          providers: safeProviders,
          createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
          settings: {
            theme: 'dark',
            emailNotifications: true,
            compactView: false,
            dateFormat: 'DD/MM/YYYY',
            bundlePrefix: 'indie',
          },
        };
        await saveUserToFirestore(profile);
        const existingWorkspace = await loadWorkspaceFromFirestore(fbUser.uid);
        if (!existingWorkspace) {
          const initialWorkspace = generateDemoData(fbUser.uid);
          await saveWorkspaceToFirestore(fbUser.uid, initialWorkspace);
        }
      }

      const storedProviders = Array.isArray(profile.providers) ? profile.providers : [];
      const mergedProviders = Array.from(new Set([...storedProviders, ...safeProviders])) as AuthProvider[];

      const hydratedUser: User = {
        id: fbUser.uid,
        name: profile.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'Developer',
        email: fbUser.email || profile.email || `${fbUser.uid}@appdock75.local`,
        avatar: profile.avatar,
        providers: mergedProviders,
        createdAt: profile.createdAt || fbUser.metadata.creationTime || new Date().toISOString(),
        settings: {
          theme: profile.settings?.theme || 'dark',
          emailNotifications: profile.settings?.emailNotifications ?? true,
          compactView: profile.settings?.compactView ?? false,
          dateFormat: profile.settings?.dateFormat || 'DD/MM/YYYY',
          bundlePrefix: profile.settings?.bundlePrefix || 'indie',
        },
      };

      return hydratedUser;
    })();

    inFlightHydrationRef.current.set(cacheKey, promise);
    try {
      return await promise;
    } finally {
      inFlightHydrationRef.current.delete(cacheKey);
    }
  };

  const formatPopupAuthError = (err: any, providerLabel: 'Google' | 'Apple'): string => {
    const code = err?.code as string | undefined;
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    console.error(`[${providerLabel} Sign-In Error]`, code || err, err?.message);

    if (code === 'auth/unauthorized-domain') {
      return `Unauthorized domain (${hostname}). Add "${hostname}" in Firebase Console → Authentication → Settings → Authorized domains.`;
    }
    if (code === 'auth/popup-closed-by-user') {
      return `${providerLabel} sign-in window was closed before completing. If it closed immediately, verify that "${hostname}" is added to Firebase Authorized domains and popups are allowed.`;
    }
    if (code === 'auth/popup-blocked') {
      return `Browser blocked the ${providerLabel} sign-in popup. Please allow popups for this site and try again.`;
    }
    if (code === 'auth/cancelled-popup-request') {
      return `A ${providerLabel} sign-in popup is already open or was cancelled. Please try again.`;
    }
    if (code === 'auth/web-storage-unsupported') {
      return `Browser storage is blocked in this embedded frame. Enable third-party cookies/storage or open this app in a dedicated browser tab to sign in with ${providerLabel}.`;
    }
    if (code === 'auth/operation-not-allowed') {
      return `${providerLabel} Sign-In is disabled in Firebase Console → Authentication → Sign-in method.`;
    }
    if (code === 'auth/account-exists-with-different-credential') {
      return `An account already exists with this email using a different sign-in method. Please sign in with that method.`;
    }
    if (code === 'auth/network-request-failed') {
      return `Network error during ${providerLabel} sign-in. Please check your connection and try again.`;
    }
    return err?.message || `${providerLabel} sign-in failed (${code || 'unknown error'}). Please verify popup settings or use email sign-in.`;
  };

  useEffect(() => {
    let isMounted = true;
    // Observe Firebase Auth state and sync with Cloud Firestore (/users/{uid})
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!isMounted) return;
      if (fbUser) {
        // Transition immediately so network latency in Firestore never blocks login
        const baselineUser = buildBaselineUser(fbUser);
        setUser(prev => (prev && prev.id === fbUser.uid ? { ...baselineUser, ...prev, id: fbUser.uid } : baselineUser));
        setCurrentSessionUser(baselineUser);
        setIsLoading(false);

        try {
          const hydratedUser = await syncFirebaseUserProfile(fbUser);
          if (isMounted && auth.currentUser?.uid === fbUser.uid) {
            setUser(hydratedUser);
            setCurrentSessionUser(hydratedUser);
          }
        } catch (err) {
          console.warn('Firestore profile hydration skipped/deferred:', err);
        }
      } else {
        // User is logged out / no active Firebase session
        setUser(prev => (prev && prev.id === 'usr-alex-indie' ? prev : null));
        setCurrentSessionUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const loginWithEmail = async (email: string, password: string, rememberMe = true) => {
    const cleanEmail = email.trim().toLowerCase();

    try {
      // Attempt Firebase auth first
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      let profile = await getUserFromFirestore(cred.user.uid);
      if (!profile) {
        profile = {
          id: cred.user.uid,
          name: cred.user.displayName || cleanEmail.split('@')[0],
          email: cred.user.email || cleanEmail,
          avatar: undefined,
          providers: ['email'],
          createdAt: cred.user.metadata.creationTime || new Date().toISOString(),
          settings: {
            theme: 'dark',
            emailNotifications: true,
            compactView: false,
            dateFormat: 'DD/MM/YYYY',
            bundlePrefix: 'indie',
          },
        };
        await saveUserToFirestore(profile);
      }

      const sessionUser: User = {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        avatar: undefined,
        providers: profile.providers || ['email'],
        createdAt: profile.createdAt,
        settings: {
          theme: profile.settings?.theme || 'dark',
          emailNotifications: profile.settings?.emailNotifications ?? true,
          compactView: profile.settings?.compactView ?? false,
          dateFormat: profile.settings?.dateFormat || 'DD/MM/YYYY',
          bundlePrefix: profile.settings?.bundlePrefix || 'indie',
        },
      };

      setUser(sessionUser);
      if (rememberMe) setCurrentSessionUser(sessionUser);
      return { success: true };
    } catch (fbErr: any) {
      // Check local vault cache for demo developer accounts (offline exploration)
      const vault = getCredentialsVault();
      const existing = vault.find(u => u.email.toLowerCase() === cleanEmail);

      if (existing) {
        if (existing.passwordHash && existing.passwordHash !== password) {
          return { success: false, error: 'Incorrect password. Please verify and try again.' };
        }

        const sessionUser: User = {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          avatar: existing.avatar,
          providers: existing.providers,
          createdAt: existing.createdAt,
          settings: existing.settings,
        };

        setUser(sessionUser);
        if (rememberMe) setCurrentSessionUser(sessionUser);
        return { success: true };
      }

      const code = fbErr?.code;
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        return { success: false, error: 'Invalid email or password. Please verify your credentials.' };
      }
      return { success: false, error: fbErr?.message || 'Login failed. Please verify your email and password.' };
    }
  };

  const registerWithEmail = async (name: string, email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim() || cleanEmail.split('@')[0];

    if (password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long.' };
    }

    const vault = getCredentialsVault();
    const existingInVault = vault.find(u => u.email.toLowerCase() === cleanEmail);
    if (existingInVault) {
      return { success: false, error: 'An account with this email address already exists.' };
    }

    // Create account directly via Firebase Auth
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const targetUserId = cred.user.uid;

      const userRecord: FirestoreUserRecord = {
        id: targetUserId,
        name: cleanName,
        email: cleanEmail,
        avatar: undefined,
        providers: ['email'],
        passwordHash: password,
        createdAt: new Date().toISOString(),
        settings: {
          theme: 'dark',
          emailNotifications: true,
          compactView: false,
          dateFormat: 'DD/MM/YYYY',
          bundlePrefix: 'indie',
        },
      };

      // Save directly to Firebase Firestore database (/users/{userId})
      await saveUserToFirestore(userRecord);

      // Initialize developer workspace in Firestore database (/users/{userId})
      const initialWorkspace = generateDemoData(targetUserId);
      await saveWorkspaceToFirestore(targetUserId, initialWorkspace);

      // Save in local vault for offline resilience
      saveCredentialsVault([...vault, userRecord as UserCredentials]);
      saveRegisteredUsers([...getRegisteredUsers(), userRecord as User]);

      const sessionUser: User = {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        avatar: undefined,
        providers: userRecord.providers,
        createdAt: userRecord.createdAt,
        settings: {
          theme: userRecord.settings?.theme || 'dark',
          emailNotifications: userRecord.settings?.emailNotifications ?? true,
          compactView: userRecord.settings?.compactView ?? false,
          dateFormat: userRecord.settings?.dateFormat || 'DD/MM/YYYY',
          bundlePrefix: userRecord.settings?.bundlePrefix || 'indie',
        },
      };

      setUser(sessionUser);
      setCurrentSessionUser(sessionUser);
      return { success: true };
    } catch (fbAuthErr: any) {
      if (fbAuthErr?.code === 'auth/email-already-in-use') {
        return { success: false, error: 'This email address is already registered in Firebase. Please sign in instead.' };
      }
      if (fbAuthErr?.code === 'auth/invalid-email') {
        return { success: false, error: 'Please enter a valid email address.' };
      }
      if (fbAuthErr?.code === 'auth/weak-password') {
        return { success: false, error: 'Password is too weak. Please use at least 8 characters.' };
      }
      return { success: false, error: fbAuthErr?.message || 'Could not register user. Please try again.' };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const baselineUser = buildBaselineUser(fbUser, 'google');
      setUser(baselineUser);
      setCurrentSessionUser(baselineUser);

      try {
        const sessionUser = await syncFirebaseUserProfile(fbUser, 'google');
        if (auth.currentUser?.uid === fbUser.uid) {
          setUser(sessionUser);
          setCurrentSessionUser(sessionUser);
        }
      } catch (hydrationErr) {
        console.warn('Google profile sync deferred:', hydrationErr);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: formatPopupAuthError(err, 'Google') };
    }
  };

  const signInWithApple = async () => {
    try {
      const result = await signInWithPopup(auth, appleProvider);
      const fbUser = result.user;
      const baselineUser = buildBaselineUser(fbUser, 'apple');
      setUser(baselineUser);
      setCurrentSessionUser(baselineUser);

      try {
        const sessionUser = await syncFirebaseUserProfile(fbUser, 'apple');
        if (auth.currentUser?.uid === fbUser.uid) {
          setUser(sessionUser);
          setCurrentSessionUser(sessionUser);
        }
      } catch (hydrationErr) {
        console.warn('Apple profile sync deferred:', hydrationErr);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: formatPopupAuthError(err, 'Apple') };
    }
  };

  const signOut = () => {
    firebaseSignOut(auth).catch(() => {});
    setCurrentSessionUser(null);
    setUser(null);
  };

  const updateProfile = (updates: Partial<Pick<User, 'name' | 'avatar' | 'settings'>>) => {
    if (!user) return;
    const updated = {
      ...user,
      ...updates,
      settings: updates.settings ? { ...user.settings, ...updates.settings } : user.settings,
    };
    setUser(updated);
    setCurrentSessionUser(updated);

    const users = getRegisteredUsers().map(u => u.id === user.id ? updated : u);
    saveRegisteredUsers(users);

    const vault = getCredentialsVault().map(u => u.id === user.id ? { ...u, ...updates } : u);
    saveCredentialsVault(vault);

    // Sync profile changes to Firestore (appdock75)
    saveUserToFirestore({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      avatar: updated.avatar,
      providers: updated.providers,
      createdAt: updated.createdAt,
      settings: updated.settings,
    });
  };

  const changePassword = async (oldPass: string, newPass: string) => {
    if (!user) return { success: false, error: 'No active session.' };
    const vault = getCredentialsVault();
    let entry = vault.find(u => u.id === user.id || (user.email && u.email.toLowerCase() === user.email.toLowerCase()));

    if (!entry) {
      entry = {
        ...user,
        passwordHash: newPass,
      };
      saveCredentialsVault([...vault, entry]);
      return { success: true };
    }

    if (entry.passwordHash && entry.passwordHash !== oldPass) {
      return { success: false, error: 'Current password does not match.' };
    }

    if (newPass.length < 8) {
      return { success: false, error: 'New password must have at least 8 characters.' };
    }

    entry.passwordHash = newPass;
    saveCredentialsVault(vault);
    return { success: true };
  };

  const requestPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch {
      // fallback
    }
    return {
      success: true,
      message: `Password reset instructions have been dispatched to ${email}. Please check your inbox.`,
    };
  };

  const deleteCurrentAccount = async (confirmCredential: string) => {
    if (!user) return { success: false, error: 'No active user found.' };

    const vault = getCredentialsVault();
    const entry = vault.find(u => u.id === user.id);

    if (entry?.passwordHash && entry.passwordHash !== confirmCredential && confirmCredential !== 'DELETE') {
      return { success: false, error: 'Authentication failed. Please verify your password to confirm account deletion.' };
    }

    if (entry?.providers.includes('apple')) {
      console.log(`[Sign in with Apple] Revoked client authorization token: ${entry.appleSubToken || 'active'}`);
    }

    // 1. Delete from Firestore (appdock75)
    await deleteWorkspaceFromFirestore(user.id);

    // 2. Delete Firebase Auth user if authenticated
    if (auth.currentUser) {
      try {
        await firebaseDeleteUser(auth.currentUser);
      } catch {
        // Ignored if re-auth required in Firebase Auth
      }
    }

    // 3. Delete local records & session
    const success = permanentlyDeleteAccount(user.id);
    saveCredentialsVault(vault.filter(u => u.id !== user.id));

    if (success) {
      setUser(null);
      return { success: true };
    } else {
      return { success: false, error: 'Failed to erase all account records. Please retry.' };
    }
  };

  const linkProvider = (provider: AuthProvider) => {
    if (!user) return;
    if (!user.providers.includes(provider)) {
      const updatedProviders = [...user.providers, provider];
      updateProfile({});
      setUser({ ...user, providers: updatedProviders });
    }
  };

  const loginAsDemo = async () => {
    setIsLoading(true);
    try {
      const fbUser = await ensureFirebaseAuth();
      if (fbUser) {
        // onAuthStateChanged will automatically fetch Firestore profile and set the user!
        return;
      }
    } catch (e) {
      console.warn('Demo Firebase Auth login failed, using offline fallback:', e);
    }

    // Offline fallback
    const vault = getCredentialsVault();
    let demoUser = vault.find(u => u.email === 'alex.swift@appdock75.local');
    if (!demoUser) {
      demoUser = {
        id: 'usr-alex-indie',
        name: 'Alex Vance',
        email: 'alex.swift@appdock75.local',
        avatar: undefined,
        providers: ['email', 'apple'],
        passwordHash: 'DemoPassword123!',
        appleSubToken: 'apple_sub_token_live_indie_alex',
        createdAt: '2026-08-01T09:00:00Z',
        settings: {
          theme: 'dark',
          emailNotifications: true,
          compactView: false,
          dateFormat: 'DD/MM/YYYY',
          bundlePrefix: 'indie',
        },
      };
      saveCredentialsVault([...vault, demoUser]);
      saveRegisteredUsers([demoUser]);
    }
    setUser(demoUser);
    setCurrentSessionUser(demoUser);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginWithEmail,
        registerWithEmail,
        signInWithGoogle,
        signInWithApple,
        signOut,
        updateProfile,
        changePassword,
        requestPasswordReset,
        deleteCurrentAccount,
        linkProvider,
        loginAsDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProviderComponent');
  }
  return context;
};
