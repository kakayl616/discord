// lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCXpiFswNEIe5StLqWBxrteD7Mxjpoj1Z8",
  authDomain: "discordchat-37c86.firebaseapp.com",
  projectId: "discordchat-37c86",
  storageBucket: "discordchat-37c86.firebasestorage.app",
  messagingSenderId: "1027172456564",
  appId: "1:1027172456564:web:a2e339766c0880e442d921",
  measurementId: "G-KG5766RS6C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// (Optional) Initialize analytics if you want
// import { getAnalytics } from 'firebase/analytics';
// const analytics = getAnalytics(app);

// Initialize Firestore
export const db = getFirestore(app);
