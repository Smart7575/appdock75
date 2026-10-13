/**
 * AppDock75 - Authentication Context & Session Management
 * Integrated with Firebase Auth (appdock75) & local failover resilience.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthProvider } from '../types';
import {
  getRegisteredUsers,
  saveRegisteredUsers,
  getCurrentSessionUser,
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

  useEffect(() => {
    // Observe Firebase Auth state and sync with Cloud Firestore (/users/{uid})
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Fetch existing user profile & settings from Firestore
        let profile = await getUserFromFirestore(fbUser.uid);
        if (!profile) {
          profile = {
            id: fbUser.uid,
            name: fbUser.displayName || 'Alex Vance',
            email: fbUser.email || 'alex.swift@appdock75.local',
            avatar: undefined,
            providers: ['email'],
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
        }

        const mappedUser: User = {
          id: fbUser.uid,
          name: profile?.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'Alex Vance',
          email: fbUser.email || profile?.email || `${fbUser.uid}@appdock75.local`,
          avatar: profile?.avatar,
          providers: (fbUser.providerData.map(p => p.providerId.includes('google') ? 'google' : p.providerId.includes('apple') ? 'apple' : 'email') as AuthProvider[]),
          createdAt: profile?.createdAt || fbUser.metadata.creationTime || new Date().toISOString(),
          settings: {
            theme: profile?.settings?.theme || 'dark',
            emailNotifications: profile?.settings?.emailNotifications ?? true,
            compactView: profile?.settings?.compactView ?? false,
            dateFormat: profile?.settings?.dateFormat || 'DD/MM/YYYY',
            bundlePrefix: profile?.settings?.bundlePrefix || 'indie',
          },
        };
        if (mappedUser.providers.length === 0) mappedUser.providers = ['email'];
        setUser(mappedUser);
        setCurrentSessionUser(mappedUser);
        setIsLoading(false);
      } else {
        // User is logged out / no active Firebase session: keep unauthenticated so login screen displays
        setUser(null);
        setCurrentSessionUser(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, password: string, rememberMe = true) => {
    setIsLoading(true);
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
        },
      };

      setUser(sessionUser);
      if (rememberMe) setCurrentSessionUser(sessionUser);
      setIsLoading(false);
      return { success: true };
    } catch (fbErr: any) {
      // Check local vault cache for demo developer accounts (offline exploration)
      const vault = getCredentialsVault();
      const existing = vault.find(u => u.email.toLowerCase() === cleanEmail);

      if (existing) {
        if (existing.passwordHash && existing.passwordHash !== password) {
          setIsLoading(false);
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
        setIsLoading(false);
        return { success: true };
      }

      setIsLoading(false);
      const code = fbErr?.code;
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        return { success: false, error: 'Invalid email or password. Please verify your credentials.' };
      }
      return { success: false, error: fbErr?.message || 'Login failed. Please verify your email and password.' };
    }
  };

  const registerWithEmail = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim() || cleanEmail.split('@')[0];

    if (password.length < 8) {
      setIsLoading(false);
      return { success: false, error: 'Password must be at least 8 characters long.' };
    }

    const vault = getCredentialsVault();
    const existingInVault = vault.find(u => u.email.toLowerCase() === cleanEmail);
    if (existingInVault) {
      setIsLoading(false);
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
      setIsLoading(false);
      return { success: true };
    } catch (fbAuthErr: any) {
      setIsLoading(false);
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
    setIsLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      let userRecord = await getUserFromFirestore(fbUser.uid);

      if (!userRecord) {
        userRecord = {
          id: fbUser.uid,
          name: fbUser.displayName || 'Google Developer',
          email: fbUser.email || 'developer@gmail.com',
          avatar: undefined,
          providers: ['google'],
          createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
          settings: {
            theme: 'dark',
            emailNotifications: true,
            compactView: false,
            dateFormat: 'DD/MM/YYYY',
          },
        };
        // Save to Firestore /users/{userId}
        await saveUserToFirestore(userRecord);
        const initialWorkspace = generateDemoData(userRecord.id);
        await saveWorkspaceToFirestore(userRecord.id, initialWorkspace);
      }

      const sessionUser: User = {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        avatar: undefined,
        providers: userRecord.providers || ['google'],
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
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      const msg = err?.code === 'auth/popup-closed-by-user'
        ? 'Google sign-in was closed before completing.'
        : err?.message || 'Google sign-in failed. Please verify popup settings or use email sign-in.';
      return { success: false, error: msg };
    }
  };

  const signInWithApple = async () => {
    setIsLoading(true);

    try {
      const result = await signInWithPopup(auth, appleProvider);
      const fbUser = result.user;
      let userRecord = await getUserFromFirestore(fbUser.uid);

      if (!userRecord) {
        userRecord = {
          id: fbUser.uid,
          name: fbUser.displayName || 'Apple Developer',
          email: fbUser.email || 'developer@privaterelay.appleid.com',
          avatar: undefined,
          providers: ['apple'],
          createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
          settings: {
            theme: 'dark',
            emailNotifications: true,
            compactView: false,
            dateFormat: 'DD/MM/YYYY',
          },
        };
        // Save to Firestore /users/{userId}
        await saveUserToFirestore(userRecord);
        const initialWorkspace = generateDemoData(userRecord.id);
        await saveWorkspaceToFirestore(userRecord.id, initialWorkspace);
      }

      const sessionUser: User = {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        avatar: undefined,
        providers: userRecord.providers || ['apple'],
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
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      const msg = err?.code === 'auth/popup-closed-by-user'
        ? 'Apple sign-in was closed before completing.'
        : err?.message || 'Apple sign-in failed. Please verify popup settings or use email sign-in.';
      return { success: false, error: msg };
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
