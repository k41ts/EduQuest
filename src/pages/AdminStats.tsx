import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { AdminSection, adminBadge, adminCard, adminPage, adminStatCard, adminStatGrid, adminTitle } from '../components/adminUi';

type SessionDoc = {
  userId: string;
  userName?: string;
  userEmail?: string;
  completedAt?: string;
  xpEarned?: number;
  correctCount?: number;
  totalCount?: number;
};

type UserAggregate = {
  userId: string;
  name: string;
  email: string;
  sessionsCompleted: number;
  totalCorrect: number;
  totalAnswered: number;
  totalXp: number;
  accuracy: number;
  lastCompletedAt: string;
};

export default function AdminStats() {
  const [bySubject, setBySubject] = useState<Record<string, number>>({});
  const [sessions, setSessions] = useState<SessionDoc[]>([]);

  const aggregates = useMemo<UserAggregate[]>(() => {
    const map = new Map<string, UserAggregate>();

    sessions.forEach(session => {
      const key = session.userId;
      const current = map.get(key) ?? {
        userId: session.userId,
        name: session.userName || 'Unknown',
        email: session.userEmail || '-',
        sessionsCompleted: 0,
        totalCorrect: 0,
        totalAnswered: 0,
        totalXp: 0,
        accuracy: 0,
        lastCompletedAt: '',
      };

      current.sessionsCompleted += 1;
      current.totalCorrect += session.correctCount ?? 0;
      current.totalAnswered += session.totalCount ?? 0;
      current.totalXp += session.xpEarned ?? 0;
      if (session.completedAt && session.completedAt > current.lastCompletedAt) {
        current.lastCompletedAt = session.completedAt;
      }
      if (current.name === 'Unknown' && session.userName) current.name = session.userName;
      if (current.email === '-' && session.userEmail) current.email = session.userEmail;
      current.accuracy = current.totalAnswered > 0 ? Math.round((current.totalCorrect / current.totalAnswered) * 100) : 0;

      map.set(key, current);
    });

    return Array.from(map.values());
  }, [sessions]);

  const topProgress = [...aggregates].sort((a, b) => {
    if (b.sessionsCompleted !== a.sessionsCompleted) return b.sessionsCompleted - a.sessionsCompleted;
    if (b.totalAnswered !== a.totalAnswered) return b.totalAnswered - a.totalAnswered;
    return b.totalXp - a.totalXp;
  }).slice(0, 5);

  const topAccuracy = [...aggregates].sort((a, b) => {
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    if (b.totalAnswered !== a.totalAnswered) return b.totalAnswered - a.totalAnswered;
    return b.totalXp - a.totalXp;
  }).slice(0, 5);

  useEffect(() => {
    async function load() {
      const qSnap = await getDocs(collection(db, 'questions'));
      const counts: Record<string, number> = {};
      qSnap.docs.forEach(d => {
        const s = (d.data() as any).subject || 'unknown';
        counts[s] = (counts[s] || 0) + 1;
      });
      setBySubject(counts);

      const sSnap = await getDocs(collection(db, 'sessions'));
      setSessions(sSnap.docs.map(d => d.data() as SessionDoc));
    }
    load();
  }, []);

  return (
    <AdminLayout>
      <div style={adminPage}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={adminTitle.title}>Admin Statistics</h2>
          <p style={adminTitle.subtitle}>Pantau progress pengerjaan user dan leaderboard ketepatan pengerjaan tertinggi.</p>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={adminStatGrid}>
            <div style={adminStatCard}>
              <div style={{ fontSize: 12, color: '#726F86', marginBottom: 8 }}>Total sessions</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#1F2240' }}>{sessions.length}</div>
            </div>
            <div style={adminStatCard}>
              <div style={{ fontSize: 12, color: '#726F86', marginBottom: 8 }}>Active users</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#1F2240' }}>{aggregates.length}</div>
            </div>
            <div style={adminStatCard}>
              <div style={{ fontSize: 12, color: '#726F86', marginBottom: 8 }}>Questions total</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#1F2240' }}>{Object.values(bySubject).reduce((sum, n) => sum + n, 0)}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <AdminSection title="Top Progress" subtitle="User dengan jumlah pengerjaan terbanyak.">
            {topProgress.length === 0 ? (
              <div style={{ color: '#726F86' }}>Belum ada session.</div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {topProgress.map((item, index) => (
                  <div key={item.userId} style={{ ...adminCard, padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                          <span style={adminBadge('admin')}>#{index + 1}</span>
                          <strong style={{ color: '#1F2240' }}>{item.name}</strong>
                        </div>
                        <div style={{ fontSize: 12, color: '#726F86' }}>{item.email}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: '#1F2240' }}>{item.sessionsCompleted}</div>
                        <div style={{ fontSize: 12, color: '#726F86' }}>sessions</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={adminBadge('neutral')}>{item.totalAnswered} soal</span>
                      <span style={adminBadge('neutral')}>{item.totalCorrect} benar</span>
                      <span style={adminBadge('neutral')}>{item.totalXp} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AdminSection>

          <AdminSection title="Top Accuracy" subtitle="User dengan akurasi pengerjaan tertinggi.">
            {topAccuracy.length === 0 ? (
              <div style={{ color: '#726F86' }}>Belum ada session.</div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {topAccuracy.map((item, index) => (
                  <div key={item.userId} style={{ ...adminCard, padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                          <span style={adminBadge('easy')}>#{index + 1}</span>
                          <strong style={{ color: '#1F2240' }}>{item.name}</strong>
                        </div>
                        <div style={{ fontSize: 12, color: '#726F86' }}>{item.email}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: '#1D9E75' }}>{item.accuracy}%</div>
                        <div style={{ fontSize: 12, color: '#726F86' }}>accuracy</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={adminBadge('neutral')}>{item.sessionsCompleted} sessions</span>
                      <span style={adminBadge('neutral')}>{item.totalAnswered} soal</span>
                      <span style={adminBadge('neutral')}>{item.totalCorrect} benar</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AdminSection>
        </div>

        <AdminSection title="Questions by Subject" subtitle="Sebaran jumlah soal per mapel.">
          <div style={{ display: 'grid', gap: 10 }}>
            {Object.keys(bySubject).length === 0 ? (
              <div style={{ color: '#726F86' }}>Belum ada data soal.</div>
            ) : (
              Object.keys(bySubject).map(k => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F0EDF9' }}>
                  <div style={{ fontWeight: 700, color: '#1F2240' }}>{k}</div>
                  <div style={{ color: '#726F86' }}>{bySubject[k]}</div>
                </div>
              ))
            )}
          </div>
        </AdminSection>
      </div>
    </AdminLayout>
  );
}
