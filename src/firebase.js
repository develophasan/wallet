import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDpyWxrM6jxOxEUEbb6VkV5eMaviv6fBaQ",
  authDomain: "piwa-ec527.firebaseapp.com",
  databaseURL: "https://piwa-ec527-default-rtdb.firebaseio.com",
  projectId: "piwa-ec527",
  storageBucket: "piwa-ec527.firebasestorage.app",
  messagingSenderId: "987555046428",
  appId: "1:987555046428:web:486e6476728d0ae12f6bd9",
  measurementId: "G-F4WG6VHXXW"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database }; 