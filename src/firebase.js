import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, onValue, set } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { serverTimestamp } from 'firebase/database';
const firebaseConfig = {
    apiKey: "AIzaSyBkYvuSFsGzmHOh9t69ZlP1i004diCJJ6Y",
    authDomain: "chatbruh-266ac.firebaseapp.com",
    projectId: "chatbruh-266ac",
    storageBucket: "chatbruh-266ac.appspot.com",
    messagingSenderId: "738092687926",
    appId: "1:738092687926:web:e7ea4630dcc0cc60adae97",
    measurementId: "G-TLF28T8ZW5"
  };
  

  const app = initializeApp(firebaseConfig);

  export const auth = getAuth(app);
  export const database = getDatabase(app);
  export const storage = getStorage(app);
  
  export const loginUser = (email, password) => signInWithEmailAndPassword(auth, email, password);
  export const signOutUser = () => signOut(auth);
  
  export const sendMessage = (message) => {
    const messageListRef = ref(database, 'messages');
    const newMessageRef = push(messageListRef);
    set(newMessageRef, message);
  };
  
  export const updateTypingStatus = (userId, typing) => {
    const userTypingRef = ref(database, `users/${userId}/typing`);
    set(userTypingRef, typing);
  };
  
  export const updateUserStatus = (userId, online) => {
    const userStatusRef = ref(database, `users/${userId}/status`);
    set(userStatusRef, online);
  };