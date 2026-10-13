/**
 * AppDock75 - Firebase SDK & Firestore Integration
 * Configured with user's project: appdock75
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  deleteUser as firebaseDeleteUser,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  getDocFromServer,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { UserDatabase } from './storage';
import { AuthProvider, DateFormatOption } from '../types';

export const firebaseConfig = {
  apiKey: "AIzaSyArHcFsZNQIvQwXMAEDj0Uz1wjDmJQs7fc",
  authDomain: "appdock75.firebaseapp.com",
  projectId: "appdock75",
  storageBucket: "appdock75.firebasestorage.app",
  messagingSenderId: "59344155103",
  appId: "1:59344155103:web:adab6a9a01a792ee9e546a",
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

// Error Handling specification from Firebase skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Test connection on boot per Firebase skill guidelines
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

/**
 * Ensures an active Firebase Auth user session is present.
 * Uses the default developer credentials if not already signed in.
 */
export async function ensureFirebaseAuth(): Promise<FirebaseUser | null> {
  if (auth.currentUser) return auth.currentUser;
  try {
    const cred = await signInWithEmailAndPassword(auth, 'alex.swift@appdock75.local', 'DemoPassword123!');
    return cred.user;
  } catch (err: any) {
    if (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
      try {
        const cred = await createUserWithEmailAndPassword(auth, 'alex.swift@appdock75.local', 'DemoPassword123!');
        return cred.user;
      } catch (createErr) {
        console.warn('Could not auto-create developer account in Firebase Auth:', createErr);
      }
    }
    return null;
  }
}

/**
 * Checks whether user is currently authenticated with Firebase Auth
 */
export function isUserFirebaseAuthenticated(userId?: string): boolean {
  if (!auth.currentUser) return false;
  return true;
}

export interface FirestoreUserRecord {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  providers: AuthProvider[];
  passwordHash?: string;
  appleSubToken?: string;
  createdAt: string;
  updatedAt?: string;
  settings: {
    theme: 'dark' | 'light' | 'system';
    emailNotifications: boolean;
    compactView: boolean;
    dateFormat?: DateFormatOption;
    bundlePrefix?: string;
  };
}

/**
 * Persist user account directly in Firestore /users/{userId}
 * Conforms to security rule: allow read, write: if request.auth != null && request.auth.uid == userId
 */
/**
 * Persist user account directly in Firestore /users/{userId}
 * Conforms to security rule: allow read, write: if request.auth != null && request.auth.uid == userId
 */
export async function saveUserToFirestore(userRecord: FirestoreUserRecord): Promise<boolean> {
  if (!auth.currentUser) {
    return false;
  }
  const targetId = auth.currentUser.uid;
  const path = `users/${targetId}`;
  try {
    const docRef = doc(db, 'users', targetId);
    await setDoc(docRef, {
      ...userRecord,
      id: targetId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

/**
 * Retrieve user profile directly from Firestore /users/{userId}
 */
export async function getUserFromFirestore(userId: string): Promise<FirestoreUserRecord | null> {
  if (!auth.currentUser) {
    return null;
  }
  const targetId = auth.currentUser.uid;
  const path = `users/${targetId}`;
  try {
    const snap = await getDoc(doc(db, 'users', targetId));
    if (snap.exists()) {
      return snap.data() as FirestoreUserRecord;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Helper to strip all unsupported `undefined` values from data before passing to Firestore setDoc
 */
function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined || data === null) return data;
  return JSON.parse(JSON.stringify(data, (_, value) => (value === undefined ? null : value)));
}

/**
 * Persist user workspace directly inside the /users/{userId} document in Firestore
 * Strictly stays within /users/{userId} to comply with owner-only security rules
 */
export async function saveWorkspaceToFirestore(userId: string, data: UserDatabase): Promise<boolean> {
  if (!auth.currentUser) {
    return false;
  }
  const targetId = auth.currentUser.uid;
  const path = `users/${targetId}`;
  try {
    const userDocRef = doc(db, 'users', targetId);
    const payload = sanitizeForFirestore({
      userId: targetId,
      updatedAt: new Date().toISOString(),
      ideas: data.ideas || [],
      projects: (data.projects || []).map(p => ({
        ...p,
        devSubstatus: p.devSubstatus || (p.status === 'In development' ? 'Design' : null),
      })),
      tasks: data.tasks || [],
      releases: data.releases || [],
      changelogEntries: data.changelogEntries || [],
      archivedApps: data.archivedApps || [],
      statuses: data.statuses || [],
      checklists: data.checklists || [],
      checklistTemplate: data.checklistTemplate || [],
      privacyPermissions: data.privacyPermissions || [],
      certificates: data.certificates || [],
      notifications: data.notifications || [],
      demoPurged: !!data.demoPurged,
    });

    await setDoc(userDocRef, payload, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

/**
 * Retrieve user workspace directly from /users/{userId} document in Firestore
 */
export async function loadWorkspaceFromFirestore(userId: string): Promise<UserDatabase | null> {
  if (!auth.currentUser) {
    return null;
  }
  const targetId = auth.currentUser.uid;
  const path = `users/${targetId}`;
  try {
    const userDocRef = doc(db, 'users', targetId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.projects !== undefined || data.ideas !== undefined || data.tasks !== undefined || data.statuses !== undefined) {
        return {
          ideas: data.ideas || [],
          projects: (data.projects || []).map((p: any) => ({
            ...p,
            devSubstatus: p.devSubstatus || (p.status === 'In development' ? 'Design' : undefined),
          })),
          tasks: data.tasks || [],
          releases: data.releases || [],
          changelogEntries: data.changelogEntries || [],
          archivedApps: data.archivedApps || [],
          statuses: data.statuses || [],
          checklists: data.checklists || [],
          checklistTemplate:
            Array.isArray(data.checklistTemplate) && data.checklistTemplate.length > 0
              ? data.checklistTemplate
              : undefined,
          privacyPermissions: data.privacyPermissions || [],
          certificates: data.certificates || [],
          notifications: data.notifications || [],
          demoPurged: !!data.demoPurged,
        };
      }
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Real-time listener for user workspace updates on /users/{userId}
 */
export function subscribeToWorkspace(
  userId: string,
  onData: (data: UserDatabase) => void,
  onError?: (err: any) => void
) {
  const targetId = auth.currentUser ? auth.currentUser.uid : userId;
  if (!auth.currentUser) {
    return () => {};
  }
  const path = `users/${targetId}`;
  const docRef = doc(db, 'users', targetId);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.projects !== undefined || data.ideas !== undefined || data.tasks !== undefined || data.statuses !== undefined) {
          onData({
            ideas: data.ideas || [],
            projects: (data.projects || []).map((p: any) => ({
              ...p,
              devSubstatus: p.devSubstatus || (p.status === 'In development' ? 'Design' : undefined),
            })),
            tasks: data.tasks || [],
            releases: data.releases || [],
            changelogEntries: data.changelogEntries || [],
            archivedApps: data.archivedApps || [],
            statuses: data.statuses || [],
            checklists: data.checklists || [],
            checklistTemplate:
              Array.isArray(data.checklistTemplate) && data.checklistTemplate.length > 0
                ? data.checklistTemplate
                : undefined,
            privacyPermissions: data.privacyPermissions || [],
            certificates: data.certificates || [],
            notifications: data.notifications || [],
            demoPurged: !!data.demoPurged,
          });
        }
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      if (onError) onError(error);
    }
  );
}

/**
 * Delete user workspace and profile from Firestore (PRD §5.2)
 */
export async function deleteWorkspaceFromFirestore(userId: string): Promise<boolean> {
  const targetId = auth.currentUser ? auth.currentUser.uid : userId;
  if (!auth.currentUser) {
    return true;
  }
  const path = `users/${targetId}`;
  try {
    await deleteDoc(doc(db, 'users', targetId));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
}
