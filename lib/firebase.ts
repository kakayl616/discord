// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCXpiFswNEIe5StLqWBxrteD7Mxjpoj1Z8",
  authDomain: "discordchat-37c86.firebaseapp.com",
  projectId: "discordchat-37c86",
  storageBucket: "discordchat-37c86.firebasestorage.app",
  messagingSenderId: "1027172456564",
  appId: "1:1027172456564:web:a2e339766c0880e442d921",
  measurementId: "G-KG5766RS6C"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Set up authentication and sign in anonymously
const auth = getAuth(app);
signInAnonymously(auth)
  .then(() => {
    console.log("Signed in anonymously");
  })
  .catch((error) => {
    console.error("Anonymous sign-in error:", error);
  });
