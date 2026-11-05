const fs = require('fs');
let code = fs.readFileSync('src/services/firebase.js', 'utf8');

// 1. In clearAllAttendanceDataFromFirestore
const oldClearAtt = `      await deleteCollectionDocs(COL_ATTENDANCE);
      await deleteCollectionDocs(COL_PERIOD_STATE);
      await deleteCollectionDocs(COL_FULL_DAY);
      await deleteCollectionDocs(COL_INVITATIONS);`;

const newClearAtt = `      await deleteCollectionDocs(COL_ATTENDANCE);
      await deleteCollectionDocs(COL_PERIOD_STATE);
      await deleteCollectionDocs(COL_FULL_DAY);
      await deleteCollectionDocs(COL_INVITATIONS);
      await deleteCollectionDocs(COL_DISCIPLINE_RESOLUTIONS);`;

code = code.replace(oldClearAtt, newClearAtt);

const oldClearLocal = `    localStorage.removeItem('school_invitations_cache');
    localStorage.removeItem('attendance_records');`;

const newClearLocal = `    localStorage.removeItem('school_invitations_cache');
    localStorage.removeItem('school_discipline_resolutions_cache');
    localStorage.removeItem('school_discipline_cache');
    localStorage.removeItem('attendance_records');`;

code = code.replace(oldClearLocal, newClearLocal);

// 2. In wipeAllDatabaseDataFromFirestore
const oldWipe = `      await deleteCollectionDocs(COL_ATTENDANCE);
      await deleteCollectionDocs(COL_PERIOD_STATE);
      await deleteCollectionDocs(COL_FULL_DAY);
      await deleteCollectionDocs(COL_INVITATIONS);
      await deleteCollectionDocs(COL_STUDENTS);`;

const newWipe = `      await deleteCollectionDocs(COL_ATTENDANCE);
      await deleteCollectionDocs(COL_PERIOD_STATE);
      await deleteCollectionDocs(COL_FULL_DAY);
      await deleteCollectionDocs(COL_INVITATIONS);
      await deleteCollectionDocs(COL_DISCIPLINE_RESOLUTIONS);
      await deleteCollectionDocs(COL_STUDENTS);`;

code = code.replace(oldWipe, newWipe);

fs.writeFileSync('src/services/firebase.js', code, 'utf8');
console.log('clearAllAttendanceDataFromFirestore updated with COL_DISCIPLINE_RESOLUTIONS');

