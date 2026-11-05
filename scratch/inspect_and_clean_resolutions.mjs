import fs from 'fs';

const envText = fs.readFileSync('.env', 'utf8');
envText.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
});

async function main() {
  const { initializeApp } = await import('firebase/app');
  const { getFirestore, collection, getDocs, deleteDoc } = await import('firebase/firestore');

  const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
    measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const resSnap = await getDocs(collection(db, 'discipline_resolutions'));
  console.log(`Found ${resSnap.size} resolutions:`);
  for (const d of resSnap.docs) {
    console.log(`- Deleting resolution ${d.id}:`, d.data().studentName, d.data().studentId);
    await deleteDoc(d.ref);
  }
  console.log('All orphaned test resolutions cleared from Firestore.');
}

main().catch(console.error);

