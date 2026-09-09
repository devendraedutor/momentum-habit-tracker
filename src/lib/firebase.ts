import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  type User,
  type Auth,
  type NextOrObserver,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";

export { getFirestore, doc, setDoc, getDoc, onSnapshot, type Firestore, type Unsubscribe };

const apiKey =
  import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC-e0yNcG_hu2_S3_WYHZjlKlr6798KZCM";

const firebaseConfig = {
  apiKey: apiKey,
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "flux-habit.firebaseapp.com",
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID || "flux-habit",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "flux-habit.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "380205132195",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID || "1:380205132195:web:04b796fd2707c6b8e85216",
};

export const isFirebaseConfigured = Boolean(
  apiKey && apiKey.trim().length > 0 && !apiKey.includes("your_firebase_api_key")
);

let authInstance: Auth | null = null;
let googleProviderInstance: GoogleAuthProvider | null = null;
let dbInstance: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    authInstance = getAuth(app);
    dbInstance = getFirestore(app);
    googleProviderInstance = new GoogleAuthProvider();
    googleProviderInstance.setCustomParameters({
      prompt: "select_account",
    });
  } catch (err) {
    console.warn("[Firebase] Initialization error:", err);
  }
} else {
  console.info(
    "[Firebase] VITE_FIREBASE_API_KEY not configured yet. App will run in local guest mode until keys are provided in .env.local."
  );
}

export const auth = authInstance;
export const googleProvider = googleProviderInstance;
export const db = dbInstance;

export const loginWithGoogle = async (): Promise<User | null> => {
  if (!authInstance || !googleProviderInstance) {
    alert(
      "Firebase Configuration Missing!\n\nPlease add your Firebase credentials to .env.local:\n- VITE_FIREBASE_API_KEY\n- VITE_FIREBASE_AUTH_DOMAIN\n- VITE_FIREBASE_PROJECT_ID\n\n(See .env.example for details)"
    );
    return null;
  }

  try {
    const result = await signInWithPopup(authInstance, googleProviderInstance);
    return result.user; // Real Google User: uid, displayName, email, photoURL
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.error("Google Sign-In Error:", err);

    if (err.code === "auth/popup-blocked") {
      alert(
        "Popup Blocked by Browser!\n\nPlease click the popup blocked icon in your browser URL address bar and select 'Always allow popups from localhost'."
      );
    } else if (err.code === "auth/operation-not-allowed") {
      alert(
        "Google Sign-In is not enabled in Firebase Console!\n\nPlease go to Firebase Console > Authentication > Sign-in method, click Google, and enable it."
      );
    } else if (err.code === "auth/unauthorized-domain") {
      alert(
        "Unauthorized Domain in Firebase!\n\nPlease go to Firebase Console > Authentication > Settings > Authorized domains, and add 'localhost'."
      );
    } else if (err.code === "auth/popup-closed-by-user") {
      console.info("Google Sign-In popup closed by user.");
    } else {
      alert(`Sign-In Error: ${err.message || "Unable to complete Google Sign-In."}`);
    }
    return null;
  }
};

export const logoutUser = async () => {
  if (authInstance) {
    await signOut(authInstance);
  }
};

export const onAuthStateChanged = (
  authParam: Auth | null,
  observer: NextOrObserver<User>
) => {
  if (!authParam) {
    if (typeof observer === "function") {
      observer(null);
    } else if (observer && typeof observer.next === "function") {
      observer.next(null);
    }
    return () => {};
  }
  return fbOnAuthStateChanged(authParam, observer);
};

export { type User };
