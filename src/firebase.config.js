import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCYNBjd6foBPJ0jka0gUDOMZBfYXF7xG34",
  authDomain: "healthcare-assistant-16aa2.firebaseapp.com",
  projectId: "healthcare-assistant-16aa2",
  storageBucket: "healthcare-assistant-16aa2.firebasestorage.app",
  messagingSenderId: "359303410560",
  appId: "1:359303410560:web:3e81d741c45d50cf978765",
  measurementId: "G-LDBNZE09SH"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
