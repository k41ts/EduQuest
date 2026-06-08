import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import {
  AdminSection,
  adminBadge,
  adminCard,
  adminPage,
  adminStatCard,
  adminStatGrid,
  adminTitle,
} from '../components/adminUi';

type SessionDoc = {
  userId: string;
  userName?: string;
  userEmail?: string;
  completedAt?: string;
  xpEarned?: number;
  correctCount?: number;
  totalCount?: number;
  subjectStats?: Record<string, { correct: number; total: number }>;
};

type MockSessionDoc = {
  userId: string;
  testName?: string;
  completedAt?: string;
  correctCount?: number;
  totalCount?: number;
  score?: number;
};

type UserDoc = {
  uid: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  streak: number;
  role?: string;
  createdAt?: string;
  lastActiveDate?: string;
};

type UserAggregate = {
  userId: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  streak: number;
  sessionsCompleted: number;
  totalCorrect: number;
  totalAnswered: number;
  totalXp: number;
  accuracy: number;
  lastCompletedAt: string;
};

type SubjectStat = {
  subject: string;
  total: number;
  correct: number;
  accuracy: number;
};

function StatSkeleton() {
  return (
    <div style={{ opacity: 0.5, animation: 'pulse 1.5s infinite' }}>
      <div style={{ height: 28, background: '#E8E5F5', borderRadius: 8, marginBottom: 8, width: '60%' }} />
      <div style={{ height: 14, background: '#E8E5F5', borderRadius: 8, width: '40%' }} />
    </div>
  );
}

export default function AdminStats() {
  const [bySubject, setBySubject] = useState<Record<string, number>>({});
  const [sessions, setSessions] = useState<SessionDoc[]>([]);
  const [mockSessions, setMockSessions] = useState<MockSessionDoc[]>([]);
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Load questions by subject
        const qSnap = await getDocs(collection(db, 'questions'));
        const counts: Record<string, number> = {};
        qSnap.docs.forEach(d => {
          const s = (d.data() as any).subject || 'unknown';
          counts[s] = (counts[s] || 0) + 1;
        });
        setBySubject(counts);

        // Load quest sessions
        const sSnap = await getDocs(collection(db, 'sessions'));
        setSessions(sSnap.docs.map(d => d.data() as SessionDoc));

        // Load mock sessions
        try {
          const mSnap = await getDocs(collection(db, 'mockSessions'));
          setMockSessions(mSnap.docs.map(d => d.data() as MockSessionDoc));
        } catch {
          // mockSessions might be empty/inaccessible
          setMockSessions([]);
        }

        // Load users
        const uSnap = await getDocs(collection(db, 'users'));
        setUsers(uSnap.docs.map(d => {
          const data = d.data() as any;
          return { uid: d.id, ...data } as UserDoc;
        }));

      } catch (err: any) {
        console.error('Error loading admin stats:', err);
        setError(err?.message || 'Gagal memuat data. Pastikan Firestore rules sudah diperbarui.');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const aggregates = useMemo<UserAggregate[]>(() => {
    const map = new Map<string, UserAggregate>();

    // Seed with user profiles
    users.forEach(u => {
      if (u.role === 'admin') return; // skip admin accounts
      map.set(u.uid, {
        userId: u.uid,
        name: u.name || 'Unknown',
        email: u.email || '-',
        xp: u.xp ?? 0,
        level: u.level ?? 1,
        streak: u.streak ?? 0,
        sessionsCompleted: 0,
        totalCorrect: 0,
        totalAnswered: 0,
        totalXp: u.xp ?? 0,
        accuracy: 0,
        lastCompletedAt: u.lastActiveDate || '',
      });
    });

    // Merge quest sessions
    sessions.forEach(session => {
      const key = session.userId;
      const current = map.get(key) ?? {
        userId: session.userId,
        name: session.userName || 'Unknown',
        email: session.userEmail || '-',
        xp: 0,
        level: 1,
        streak: 0,
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
      current.accuracy =
        current.totalAnswered > 0
          ? Math.round((current.totalCorrect / current.totalAnswered) * 100)
          : 0;

      map.set(key, current);
    });

    return Array.from(map.values()).filter(u => u.sessionsCompleted > 0 || users.some(uu => uu.uid === u.userId));
  }, [sessions, users]);

  // Subject performance from sessions
  const subjectPerformance = useMemo<SubjectStat[]>(() => {
    const map = new Map<string, SubjectStat>();
    sessions.forEach(session => {
      if (!session.subjectStats) return;
      Object.entries(session.subjectStats).forEach(([subject, stats]) => {
        const existing = map.get(subject) ?? { subject, total: 0, correct: 0, accuracy: 0 };
        existing.total += stats.total;
        existing.correct += stats.correct;
        existing.accuracy = existing.total > 0 ? Math.round((existing.correct / existing.total) * 100) : 0;
        map.set(subject, existing);
      });
    });
    return Array.from(map.values()).sort((a, b) => a.accuracy - b.accuracy);
  }, [sessions]);

  const topProgress = [...aggregates]
    .filter(a => a.sessionsCompleted > 0)
    .sort((a, b) => {
      if (b.sessionsCompleted !== a.sessionsCompleted) return b.sessionsCompleted - a.sessionsCompleted;
      if (b.totalAnswered !== a.totalAnswered) return b.totalAnswered - a.totalAnswered;
      return b.totalXp - a.totalXp;
    })
    .slice(0, 5);

  const topAccuracy = [...aggregates]
    .filter(a => a.totalAnswered >= 5)
    .sort((a, b) => {
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      if (b.totalAnswered !== a.totalAnswered) return b.totalAnswered - a.totalAnswered;
      return b.totalXp - a.totalXp;
    })
    .slice(0, 5);

  const topXp = [...aggregates]
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 5);

  const totalQuestions = Object.values(bySubject).reduce((sum, n) => sum + n, 0);
  const totalXpAll = aggregates.reduce((sum, a) => sum + a.xp, 0);
  const avgAccuracy =
    aggregates.filter(a => a.totalAnswered > 0).length > 0
      ? Math.round(
          aggregates
            .filter(a => a.totalAnswered > 0)
            .reduce((sum, a) => sum + a.accuracy, 0) /
            aggregates.filter(a => a.totalAnswered > 0).length
        )
      : 0;

  const regularUsers = users.filter(u => u.role !== 'admin');




  return (
    <AdminLayout>
      <div style={adminPage}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={adminTitle.title}>Admin Statistics</h2>
          <p style={adminTitle.subtitle}>
            Pantau progress pengerjaan user dan leaderboard ketepatan pengerjaan tertinggi.
          </p>
        </div>

        {error && (
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 14,
              padding: '14px 18px',
              marginBottom: 18,
              color: '#B91C1C',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Summary stats */}
        <div style={{ marginBottom: 18 }}>
          <div style={adminStatGrid}>
            <div style={adminStatCard}>
              <div style={{ fontSize: 12, color: '#726F86', marginBottom: 8 }}>Total Users</div>
              {loading ? (
                <StatSkeleton />
              ) : (
                <div style={{ fontSize: 26, fontWeight: 800, color: '#1F2240' }}>
                  {regularUsers.length}
                </div>
              )}
            </div>
            <div style={adminStatCard}>
              <div style={{ fontSize: 12, color: '#726F86', marginBottom: 8 }}>Total Sessions</div>
              {loading ? (
                <StatSkeleton />
              ) : (
                <div style={{ fontSize: 26, fontWeight: 800, color: '#1F2240' }}>
                  {sessions.length + mockSessions.length}
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#726F86', marginLeft: 6 }}>
                    ({sessions.length} quest · {mockSessions.length} mock)
                  </span>
                </div>
              )}
            </div>
            <div style={adminStatCard}>
              <div style={{ fontSize: 12, color: '#726F86', marginBottom: 8 }}>Total Questions</div>
              {loading ? (
                <StatSkeleton />
              ) : (
                <div style={{ fontSize: 26, fontWeight: 800, color: '#1F2240' }}>
                  {totalQuestions}
                </div>
              )}
            </div>
            <div style={adminStatCard}>
              <div style={{ fontSize: 12, color: '#726F86', marginBottom: 8 }}>Avg. Accuracy</div>
              {loading ? (
                <StatSkeleton />
              ) : (
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: avgAccuracy >= 70 ? '#1D9E75' : avgAccuracy >= 40 ? '#EF9F27' : '#D85A30',
                  }}
                >
                  {avgAccuracy}%
                </div>
              )}
            </div>
            <div style={adminStatCard}>
              <div style={{ fontSize: 12, color: '#726F86', marginBottom: 8 }}>Total XP Earned</div>
              {loading ? (
                <StatSkeleton />
              ) : (
                <div style={{ fontSize: 26, fontWeight: 800, color: '#7F77DD' }}>
                  {totalXpAll.toLocaleString('id-ID')}
                </div>
              )}
            </div>
            <div style={adminStatCard}>
              <div style={{ fontSize: 12, color: '#726F86', marginBottom: 8 }}>Active Players</div>
              {loading ? (
                <StatSkeleton />
              ) : (
                <div style={{ fontSize: 26, fontWeight: 800, color: '#1F2240' }}>
                  {aggregates.filter(a => a.sessionsCompleted > 0).length}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Progress & Top Accuracy */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <AdminSection title="🏆 Top Progress" subtitle="User dengan jumlah pengerjaan terbanyak.">
            {loading ? (
              <div style={{ color: '#726F86', fontSize: 13 }}>Memuat data...</div>
            ) : topProgress.length === 0 ? (
              <div style={{ color: '#726F86', fontSize: 13 }}>Belum ada session.</div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {topProgress.map((item, index) => (
                  <div key={item.userId} style={{ ...adminCard, padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                          <span
                            style={{
                              ...adminBadge('admin'),
                              minWidth: 28,
                              justifyContent: 'center',
                            }}
                          >
                            #{index + 1}
                          </span>
                          <strong style={{ color: '#1F2240', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.name}
                          </strong>
                        </div>
                        <div style={{ fontSize: 11, color: '#726F86', marginBottom: 6 }}>{item.email}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <span style={adminBadge('neutral')}>{item.totalAnswered} soal</span>
                          <span style={adminBadge('easy')}>{item.totalCorrect} benar</span>
                          <span style={adminBadge('neutral')}>⚡ {item.totalXp} XP</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#1F2240' }}>
                          {item.sessionsCompleted}
                        </div>
                        <div style={{ fontSize: 11, color: '#726F86' }}>sessions</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AdminSection>

          <AdminSection title="🎯 Top Accuracy" subtitle="User dengan akurasi pengerjaan tertinggi (min. 5 soal).">
            {loading ? (
              <div style={{ color: '#726F86', fontSize: 13 }}>Memuat data...</div>
            ) : topAccuracy.length === 0 ? (
              <div style={{ color: '#726F86', fontSize: 13 }}>
                Belum ada user dengan min. 5 soal terjawab.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {topAccuracy.map((item, index) => (
                  <div key={item.userId} style={{ ...adminCard, padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ ...adminBadge('easy'), minWidth: 28, justifyContent: 'center' }}>
                            #{index + 1}
                          </span>
                          <strong style={{ color: '#1F2240', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.name}
                          </strong>
                        </div>
                        <div style={{ fontSize: 11, color: '#726F86', marginBottom: 6 }}>{item.email}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <span style={adminBadge('neutral')}>{item.sessionsCompleted} sessions</span>
                          <span style={adminBadge('neutral')}>{item.totalAnswered} soal</span>
                          <span style={adminBadge('easy')}>{item.totalCorrect} benar</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div
                          style={{
                            fontSize: 22,
                            fontWeight: 800,
                            color:
                              item.accuracy >= 70
                                ? '#1D9E75'
                                : item.accuracy >= 40
                                ? '#EF9F27'
                                : '#D85A30',
                          }}
                        >
                          {item.accuracy}%
                        </div>
                        <div style={{ fontSize: 11, color: '#726F86' }}>accuracy</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AdminSection>
        </div>

        {/* Top XP & Subject Performance */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <AdminSection title="⚡ Top XP" subtitle="User dengan total XP tertinggi.">
            {loading ? (
              <div style={{ color: '#726F86', fontSize: 13 }}>Memuat data...</div>
            ) : topXp.length === 0 ? (
              <div style={{ color: '#726F86', fontSize: 13 }}>Belum ada data XP.</div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {topXp.map((item, index) => (
                  <div
                    key={item.userId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: index < topXp.length - 1 ? '1px solid #F0EDF9' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 8,
                          background:
                            index === 0
                              ? '#FFF3CD'
                              : index === 1
                              ? '#F0F0F0'
                              : index === 2
                              ? '#FFE8D6'
                              : '#F5F5FB',
                          color:
                            index === 0
                              ? '#B7791F'
                              : index === 1
                              ? '#6B7280'
                              : index === 2
                              ? '#9A3412'
                              : '#5B5A74',
                          fontSize: 11,
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {index + 1}
                      </span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1F2240' }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: '#726F86' }}>Lv.{item.level}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#7F77DD' }}>
                        {item.xp.toLocaleString('id-ID')}
                      </div>
                      <div style={{ fontSize: 11, color: '#726F86' }}>XP</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AdminSection>

          <AdminSection title="📚 Subject Performance" subtitle="Akurasi pengerjaan per mapel dari semua user.">
            {loading ? (
              <div style={{ color: '#726F86', fontSize: 13 }}>Memuat data...</div>
            ) : subjectPerformance.length === 0 ? (
              <div style={{ color: '#726F86', fontSize: 13 }}>Belum ada data session.</div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {subjectPerformance.map(stat => {
                  const color =
                    stat.accuracy >= 70 ? '#1D9E75' : stat.accuracy >= 40 ? '#EF9F27' : '#D85A30';
                  const bg =
                    stat.accuracy >= 70 ? '#E1F5EE' : stat.accuracy >= 40 ? '#FAEEDA' : '#FAECE7';
                  return (
                    <div key={stat.subject}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 6,
                        }}
                      >
                        <div style={{ fontWeight: 700, color: '#1F2240', fontSize: 13 }}>
                          {stat.subject}
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: '#726F86' }}>
                            {stat.correct}/{stat.total}
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 800,
                              color,
                              background: bg,
                              padding: '2px 8px',
                              borderRadius: 999,
                            }}
                          >
                            {stat.accuracy}%
                          </span>
                        </div>
                      </div>
                      <div style={{ height: 8, background: '#F0EDF9', borderRadius: 999 }}>
                        <div
                          style={{
                            height: '100%',
                            borderRadius: 999,
                            background: color,
                            width: `${stat.accuracy}%`,
                            transition: 'width 0.6s ease',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </AdminSection>
        </div>

        {/* Questions by Subject */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <AdminSection title="📋 Questions by Subject" subtitle="Sebaran jumlah soal per mapel.">
            {loading ? (
              <div style={{ color: '#726F86', fontSize: 13 }}>Memuat data...</div>
            ) : Object.keys(bySubject).length === 0 ? (
              <div style={{ color: '#726F86', fontSize: 13 }}>Belum ada data soal.</div>
            ) : (
              <div style={{ display: 'grid', gap: 4 }}>
                {Object.entries(bySubject)
                  .sort((a, b) => b[1] - a[1])
                  .map(([k, count]) => {
                    const pct = Math.round((count / totalQuestions) * 100);
                    return (
                      <div
                        key={k}
                        style={{
                          padding: '10px 0',
                          borderBottom: '1px solid #F0EDF9',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: 6,
                          }}
                        >
                          <div style={{ fontWeight: 700, color: '#1F2240', fontSize: 13 }}>{k}</div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: '#726F86' }}>{pct}%</span>
                            <span
                              style={{
                                fontWeight: 800,
                                color: '#7F77DD',
                                fontSize: 14,
                              }}
                            >
                              {count}
                            </span>
                          </div>
                        </div>
                        <div style={{ height: 6, background: '#F0EDF9', borderRadius: 999 }}>
                          <div
                            style={{
                              height: '100%',
                              borderRadius: 999,
                              background: 'linear-gradient(90deg, #7F77DD, #5F55D4)',
                              width: `${pct}%`,
                              transition: 'width 0.6s ease',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </AdminSection>

          <AdminSection title="👥 All Users" subtitle="Daftar semua user terdaftar.">
            {loading ? (
              <div style={{ color: '#726F86', fontSize: 13 }}>Memuat data...</div>
            ) : regularUsers.length === 0 ? (
              <div style={{ color: '#726F86', fontSize: 13 }}>Belum ada user terdaftar.</div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gap: 8,
                  maxHeight: 320,
                  overflowY: 'auto',
                  paddingRight: 4,
                }}
              >
                {regularUsers
                  .sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0))
                  .map(u => (
                    <div
                      key={u.uid}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 10px',
                        background: '#FAFAFA',
                        borderRadius: 10,
                        border: '1px solid #F0EDF9',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1F2240' }}>
                          {u.name || '-'}
                        </div>
                        <div style={{ fontSize: 11, color: '#726F86' }}>{u.email}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={adminBadge('neutral')}>Lv.{u.level ?? 1}</span>
                        <span style={adminBadge('admin')}>⚡{u.xp ?? 0}</span>
                        {(u.streak ?? 0) > 0 && (
                          <span style={adminBadge('medium')}>🔥{u.streak}</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </AdminSection>
        </div>
      </div>
    </AdminLayout>
  );
}
