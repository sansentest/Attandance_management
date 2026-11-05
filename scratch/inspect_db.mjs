import fs from 'fs';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const envContent = fs.readFileSync('.env', 'utf8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[match[1].trim()] = val;
  }
});

const app = getApps().length === 0 ? initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
}) : getApps()[0];

const db = getFirestore(app);

const snapAtt = await getDocs(collection(db, 'attendance_records'));
console.log('Total attendance records:', snapAtt.size);
snapAtt.forEach(d => {
  const data = d.data();
  console.log('Record ID:', d.id, 'studentId:', data.studentId, 'name:', data.name, 'date:', data.date, 'status:', data.status);
});

const snapInv = await getDocs(collection(db, 'invitation_letters'));
console.log('Total invitation letters:', snapInv.size);
snapInv.forEach(d => {
  const data = d.data();
  console.log('Letter ID:', d.id, 'studentId:', data.studentId, 'name:', data.name, 'status:', data.status, 'cycle:', data.cycle);
});

const snapRes = await getDocs(collection(db, 'discipline_resolutions'));
console.log('Total discipline resolutions:', snapRes.size);
snapRes.forEach(d => {
  const data = d.data();
  console.log('Res ID:', d.id, 'studentId:', data.studentId, 'name:', data.studentName, 'cycle:', data.cycle);
});

