import fs from 'fs';

const envText = fs.readFileSync('.env', 'utf8');
envText.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
});

async function test() {
  const { getStudentDisciplineTrackingFromFirestore } = await import('../src/services/firebase.js');
  const tracking = await getStudentDisciplineTrackingFromFirestore(true);

  const withAbsence = tracking.filter(s => (s.absent || 0) > 0 || (s.totalAbsent || 0) > 0);
  console.log(`Students with absence: ${withAbsence.length}`);
  withAbsence.forEach(s => {
    console.log(`Name: ${s.name}, ID: ${s.id}, Class: ${s.class}, absent(cycle): ${s.absent}, totalAbsent: ${s.totalAbsent}, cycle: ${s.cycle}`);
  });
}

test().catch(console.error);

