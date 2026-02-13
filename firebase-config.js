// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBq_W7mqTahL2HqSEZXy0oKc7xCPLfJfOA",
    authDomain: "law-office-system-115b7.firebaseapp.com",
    projectId: "law-office-system-115b7",
    storageBucket: "law-office-system-115b7.firebasestorage.app",
    messagingSenderId: "315385140336",
    appId: "1:315385140336:web:3b77bb8c8e0599f84a50b5",
    measurementId: "G-EG96J46ETJ"
};

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

export { auth, db, googleProvider };
