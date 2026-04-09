import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, getAdditionalUserInfo, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
}, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const additionalInfo = getAdditionalUserInfo(result);
    return { user: result.user, isNewUser: additionalInfo?.isNewUser };
  } catch (error: any) {
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      // Try to create the user if they don't exist
      try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const additionalInfo = getAdditionalUserInfo(result);
        return { user: result.user, isNewUser: additionalInfo?.isNewUser };
      } catch (createError) {
        console.error("Error creating user with email", createError);
        throw createError;
      }
    }
    console.error("Error signing in with email", error);
    throw error;
  }
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const additionalInfo = getAdditionalUserInfo(result);
    return { user: result.user, isNewUser: additionalInfo?.isNewUser };
  } catch (error: any) {
    console.error("Error signing in with Google popup", error);
    // If popup is blocked or not supported (like in APK/WebView), fallback to redirect
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/unsupported-browser-operation' || error.message.includes('popup')) {
      console.log("Falling back to redirect sign-in...");
      await signInWithRedirect(auth, googleProvider);
      return { user: null, isNewUser: false }; // Will redirect
    }
    throw error;
  }
};

export const checkRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const additionalInfo = getAdditionalUserInfo(result);
      return { user: result.user, isNewUser: additionalInfo?.isNewUser };
    }
    return null;
  } catch (error) {
    console.error("Error getting redirect result", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};
