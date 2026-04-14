
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ✅ Your Firebase config (from console)
const firebaseConfig = {
  apiKey: "AIzaSyCUY278SVCs0XuvjBx9y5okFtWm4c2HO9w",
  authDomain: "task-manager-7cd00.firebaseapp.com",
  projectId: "task-manager-7cd00",
  storageBucket: "task-manager-7cd00.firebasestorage.app",
  messagingSenderId: "327061407401",
  appId: "1:327061407401:web:f10c3353d61bc41bf34bb8",
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Services
export const db = getFirestore(app);
export const auth = getAuth(app);
