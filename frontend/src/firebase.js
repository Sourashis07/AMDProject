import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCfwb91Rtf5YRBrfcrfe__zL7ym7ln3lT0",
  authDomain: "amdproject-ea8f9.firebaseapp.com",
  projectId: "amdproject-ea8f9",
  storageBucket: "amdproject-ea8f9.firebasestorage.app",
  messagingSenderId: "151150853952",
  appId: "1:151150853952:web:929221952c5665c10f04a5",
  measurementId: "G-7L8QQXGMS7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
