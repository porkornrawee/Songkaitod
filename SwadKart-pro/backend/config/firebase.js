import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = { /* config จาก Firebase console */ };
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);