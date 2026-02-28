// import { initializeApp } from "firebase/app";
// import { getAuth, GoogleAuthProvider } from "firebase/auth";
// import { getFirestore } from "firebase/firestore";

// const firebaseConfig = {
//   apiKey: "AIzaSyBWmmb55mNgWonR_awBD3C3JiMSVTEfCzM",
//   authDomain: "gyms-16e6d.firebaseapp.com",
//   projectId: "gyms-16e6d",
//   messagingSenderId: "108835387183",
//   appId: "1:108835387183:web:3a9e962bfa6e804d14d3da",
// };

// // 🔥 MAIN APP (Admin)
// const app = initializeApp(firebaseConfig);

// export const auth = getAuth(app);
// export const db = getFirestore(app);
// export const googleProvider = new GoogleAuthProvider();

// // 🔥 SECONDARY APP (for creating member auth without logout)
// const secondaryApp = initializeApp(firebaseConfig, "Secondary");
// export const secondaryAuth = getAuth(secondaryApp);

// export default app;


import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBWmmb55mNgWonR_awBD3C3JiMSVTEfCzM",
  authDomain: "gyms-16e6d.firebaseapp.com",
  projectId: "gyms-16e6d",
  messagingSenderId: "108835387183",
  appId: "1:108835387183:web:3a9e962bfa6e804d14d3da",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);


const secondaryApp = initializeApp(firebaseConfig, "Secondary");
export const secondaryAuth = getAuth(secondaryApp);

// Attempt to set local persistence on initialization. Some hosting
// environments or browsers may disallow this (third-party cookie
// restrictions). We catch & log errors so sign-in still proceeds.
(async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    console.log("✅ Firebase auth persistence set to local");
  } catch (err) {
    console.warn("⚠️ Failed to set auth persistence:", err.code || err.message || err);
  }
})();

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export default app;