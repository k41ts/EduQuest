import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { AdminSection, adminBadge, adminButton, adminCard, adminPage, adminTitle } from '../components/adminUi';

export default function AdminDashboard() {
  const [questionCount, setQuestionCount] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const qSnap = await getDocs(collection(db, 'questions'));
      setQuestionCount(qSnap.size);
    }
    load();
  }, []);

  return (
    <AdminLayout>
      <div style={adminPage}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={adminTitle.title}>Admin Dashboard</h2>
          <p style={adminTitle.subtitle}>Ringkasan data utama dan status sistem EduQuest.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, marginBottom: 16 }}>
          <div style={{ ...adminCard, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, color: '#726F86', marginBottom: 8 }}>Total Questions</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: '#1F2240' }}>{questionCount ?? '—'}</div>
              </div>
              <span style={adminBadge('admin')}>Questions</span>
            </div>
          </div>

          <div style={{ ...adminCard, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, color: '#726F86', marginBottom: 8 }}>Quick Status</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: '#1F2240' }}>Ready</div>
              </div>
              <span style={adminBadge('neutral')}>System</span>
            </div>
          </div>
        </div>

        <AdminSection title="Quick Actions" subtitle="Akses cepat untuk pengelolaan admin.">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="/admin/questions" style={{ textDecoration: 'none' }}>
              <button style={adminButton('primary')}>Manage Questions</button>
            </a>
            <a href="/admin/stats" style={{ textDecoration: 'none' }}>
              <button style={adminButton('secondary')}>View Statistics</button>
            </a>
          </div>
        </AdminSection>
      </div>
    </AdminLayout>
  );
}
