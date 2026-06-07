import { useState } from 'react';
import Layout from '../components/Layout';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function DevSeedAdmin() {
  const [email, setEmail] = useState('admin@eduquest.com');
  const [password, setPassword] = useState('Admin123!');
  const [status, setStatus] = useState<string | null>(null);

  async function runSeed() {
    setStatus('Creating user...');
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;
      await setDoc(doc(db, 'users', uid), {
        uid,
        email,
        name: 'Admin',
        level: 2,
        xp: 705,
        streak: 0,
        lastActiveDate: new Date().toISOString(),
        targetMajor: 'Teknik Informatika',
        subjects: ['TPS','Literasi','Matematika'],
        onboardingComplete: true,
        createdAt: new Date().toISOString(),
        role: 'admin',
      }, { merge: true });
      setStatus('Admin user created: ' + uid);
    } catch (err: any) {
      setStatus('Error: ' + (err.message || String(err)));
    }
  }

  if (!import.meta.env.DEV) return <div style={{ padding: 24 }}>Dev seeder disabled in production.</div>;

  return (
    <Layout>
      <div style={{ padding: 24 }}>
        <h2>Dev: Seed Admin</h2>
        <p style={{ color: '#666' }}>Hanya tersedia di development. Membuat akun admin menggunakan Firebase Client SDK.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 480 }}>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email" />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="password" />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={runSeed}>Create Admin</button>
          </div>
          {status && <div style={{ marginTop: 8 }}>{status}</div>}
        </div>
      </div>
    </Layout>
  );
}
