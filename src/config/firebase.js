import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  push,
  set,
  get,
  update,
  query,
  orderByChild,
  equalTo,
  increment,
  onValue,
} from "firebase/database";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAs2Gz0ofXnCmePl50-tGHqGTsBvOgj7o0",
  authDomain: "rakshak-official-8e6b1.firebaseapp.com",
  databaseURL: "https://rakshak-official-8e6b1-default-rtdb.firebaseio.com",
  projectId: "rakshak-official-8e6b1",
  storageBucket: "rakshak-official-8e6b1.firebasestorage.app",
  messagingSenderId: "406498340217",
  appId: "1:406498340217:web:0b0e588b6f6ae73ca4d3a8",
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Re-export database utilities
export { ref, push, set, get, update, query, orderByChild, equalTo, increment, onValue };

export default app;

