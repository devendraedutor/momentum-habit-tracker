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

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC-e0yNcG_hu2_S3_WYHZjIklr6798KZCM",
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
  measurementId:
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-P6V0YFV37K",
};

// Initialize Firebase App instance
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export const isFirebaseConfigured = true;

export const loginWithGoogle = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user; // Real Google User: uid, displayName, email, photoURL
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.error("Google Sign-In Error:", err);

    if (err.code === "auth/popup-blocked") {
      alert(
        "Popup Blocked by Browser!\n\nPlease click the popup blocked icon in your browser URL address bar and select 'Always allow popups'."
      );
    } else if (err.code === "auth/operation-not-allowed") {
      alert(
        "Google Sign-In is not enabled in Firebase Console!\n\nPlease go to Firebase Console > Authentication > Sign-in method, click Google, and enable it."
      );
    } else if (err.code === "auth/unauthorized-domain") {
      alert(
        "Unauthorized Domain in Firebase!\n\nPlease go to Firebase Console > Authentication > Settings > Authorized domains, and add your domain (e.g., flux-habit.vercel.app)."
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
  if (auth) {
    await signOut(auth);
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
