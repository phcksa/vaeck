// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// إعدادات مشروعك الخاصة (تم نسخها من صورتك)
const firebaseConfig = {
  apiKey: "AIzaSyC485uy3kzrgSDXrRmBI0BbZV5rtxpqDcA",
  authDomain: "vaeck-app.firebaseapp.com",
  projectId: "vaeck-app",
  storageBucket: "vaeck-app.firebasestorage.app",
  messagingSenderId: "468592919948",
  appId: "1:468592919948:web:eb476346d3ba6e588fc2a9"
};

// تهيئة الاتصال
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
