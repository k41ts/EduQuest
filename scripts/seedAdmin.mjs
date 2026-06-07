import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';

function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch (e) {
      console.error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON');
      process.exit(1);
    }
  }

  const provided = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccount.json';
  const resolved = path.resolve(process.cwd(), provided);
  if (!fs.existsSync(resolved)) {
    console.error('Service account file not found at', resolved);
    console.error('Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(resolved, 'utf8'));
}

async function main() {
  const serviceAccount = loadServiceAccount();
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

  const email = process.argv[2] || process.env.ADMIN_EMAIL || 'admin@eduquest.com';
  const password = process.argv[3] || process.env.ADMIN_PASSWORD || 'Admin123!';

  const auth = admin.auth();
  const db = admin.firestore();

  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
    console.log('User already exists:', userRecord.uid);
    // update password and displayName
    await auth.updateUser(userRecord.uid, { password, displayName: 'Admin' });
  } catch (err) {
    if (err.code && err.code === 'auth/user-not-found') {
      userRecord = await auth.createUser({ email, password, displayName: 'Admin' });
      console.log('Created user:', userRecord.uid);
    } else {
      // Some admin SDK errors don't have code property in all environments
      if (String(err).includes('user-not-found')) {
        userRecord = await auth.createUser({ email, password, displayName: 'Admin' });
        console.log('Created user:', userRecord.uid);
      } else {
        console.error(err);
        process.exit(1);
      }
    }
  }

  // Set custom claim admin: true
  await auth.setCustomUserClaims(userRecord.uid, { admin: true });
  console.log('Set custom claim admin:true');

  // Ensure Firestore users doc exists and has admin role
  const userDocRef = db.collection('users').doc(userRecord.uid);
  const now = new Date().toISOString();
  await userDocRef.set({
    uid: userRecord.uid,
    email,
    name: 'Admin',
    level: 2,
    xp: 705,
    streak: 0,
    lastActiveDate: now,
    targetMajor: 'Teknik Informatika',
    subjects: ['TPS', 'Literasi', 'Matematika'],
    onboardingComplete: true,
    createdAt: now,
    role: 'admin',
  }, { merge: true });

  console.log('Firestore user doc ensured with role=admin');
  console.log('Done. You can now login with:', email, 'and the password you provided (or default Admin123!)');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
