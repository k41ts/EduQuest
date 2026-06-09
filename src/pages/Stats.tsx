import { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import {
  AlertCircle,
  BarChart2,
  BookOpen,
  CheckCircle,
  ClipboardList,
  Clock,
  Flame,
  Gauge,
  LineChart,
  RefreshCw,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import Layout from '../components/Layout';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

interface SubjectStat {
  subject: string;
  correct: number;
  total: number;
  accuracy: number;
  xp: number;
}

interface FocusArea {
  subject: string;
  accuracy: number;
  total: number;
  reason: string;
}

interface UserStatsDoc {
  userId: string;
  generatedAt: string;
  totalXp: number;
  level: number;
  streak: number;
  targetMajor: string;
  activeSubjects: string[];
  lastActiveDate: string;
  xpProgress: {
    current: number;
    total: number;
    pct: number;
    remaining: number;
  };
  dailyQuest: {
    sessions: number;
    totalXp: number;
    totalQuestions: number;
    correct: number;
    accuracy: number;
    bestSessionXp: number;
  };
  mockTest: {
    sessions: number;
    averageScore: number;
    bestScore: number;
    averageTime: number;
    lastScore: number;
  };
  subjects: SubjectStat[];
  focusAreas: FocusArea[];
}

interface ActivityDoc {
  userId: string;
  date: string;
  xp: number;
  questSessions: number;
  mockSessions: number;
  correct: number;
  total: number;
  accuracy: number;
}

const COLORS = {
  ink: '#26215C',
  muted: '#888780',
  softMuted: '#B4B2A9',
  border: '#EDE9FE',
  canvas: '#F7F6F2',
  primary: '#7F77DD',
  primaryDark: '#534AB7',
  primarySoft: '#EEEDFE',
  primaryLighter: '#F7F6FF',
  amber: '#F0A84B',
  amberDark: '#EF9F27',
  amberSoft: '#FAEEDA',
  green: '#1D9E75',
  greenSoft: '#E1F5EE',
  red: '#D85A30',
  redSoft: '#FAECE7',
};

const cardStyle: React.CSSProperties = {
  background: 'white',
  border: `1px solid ${COLORS.border}`,
  borderRadius: '16px',
};

function getXpProgress(level: number, xp: number) {
  const xpPerLevel = Math.max(level, 1) * 500;
  const current = xp % xpPerLevel;
  const pct = Math.min((current / xpPerLevel) * 100, 100);
  return { current, total: xpPerLevel, pct, remaining: xpPerLevel - current };
}

function formatDate(date: string) {
  if (!date) return 'Belum ada';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function formatTime(seconds: number) {
  if (!seconds) return '-';
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}m ${rest}s`;
}

function Skeleton() {
  return (
    <Layout>
      <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ ...cardStyle, padding: '26px', width: '100%', maxWidth: '420px', textAlign: 'center' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            border: `3px solid ${COLORS.primarySoft}`,
            borderTopColor: COLORS.primary,
            animation: 'statsSpin 0.8s linear infinite',
            margin: '0 auto 14px',
          }} />
          <div style={{ fontSize: '15px', fontWeight: '700', color: COLORS.ink, marginBottom: '4px' }}>
            Memuat statistik
          </div>
          <div style={{ fontSize: '13px', color: COLORS.muted }}>Membaca snapshot analitik belajar kamu.</div>
          <style>{`@keyframes statsSpin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    </Layout>
  );
}

function DataBadge({
  label,
  value,
  icon: Icon,
  color,
  bg,
}: {
  label: string;
  value: string;
  icon: typeof Trophy;
  color: string;
  bg: string;
}) {
  return (
    <div style={{
      ...cardStyle,
      padding: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    }}>
      <div style={{
        width: '42px',
        height: '42px',
        borderRadius: '13px',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={19} color={color} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '22px', lineHeight: 1, fontWeight: '700', color, overflowWrap: 'anywhere' }}>
          {value}
        </div>
        <div style={{ fontSize: '11px', color: COLORS.muted, marginTop: '5px' }}>{label}</div>
      </div>
    </div>
  );
}

function EmptyAnalytics() {
  return (
    <div style={{
      ...cardStyle,
      padding: '22px',
      background: COLORS.amberSoft,
      borderColor: '#F4C77E',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
    }}>
      <AlertCircle size={20} color={COLORS.amberDark} style={{ flexShrink: 0, marginTop: '1px' }} />
      <div>
        <div style={{ fontSize: '15px', fontWeight: '700', color: '#412402', marginBottom: '5px' }}>
          Statistik belum punya aktivitas
        </div>
        <div style={{ fontSize: '13px', lineHeight: 1.55, color: '#6F4B13' }}>
          Akun baru otomatis punya dokumen statistik. Selesaikan Daily Quest atau Mock Test untuk mulai mengisi grafik.
        </div>
      </div>
    </div>
  );
}

export default function Stats() {
  const { currentUser, userProfile } = useAuth();
  const [stats, setStats] = useState<UserStatsDoc | null>(null);
  const [activity, setActivity] = useState<ActivityDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      if (!currentUser) return;
      setLoading(true);
      setError('');

      try {
        const statsSnap = await getDoc(doc(db, 'userStats', currentUser.uid));
        const activitySnap = await getDocs(query(collection(db, 'userActivity'), where('userId', '==', currentUser.uid)));

        if (cancelled) return;
        setStats(statsSnap.exists() ? statsSnap.data() as UserStatsDoc : null);
        setActivity(
          activitySnap.docs
            .map(docSnap => docSnap.data() as ActivityDoc)
            .sort((a, b) => a.date.localeCompare(b.date))
        );
      } catch (err) {
        console.error(err);
        if (!cancelled) setError('Statistik belum bisa dibaca. Pastikan collection userStats dan userActivity sudah dibuat dan rules mengizinkan user membaca datanya sendiri.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadStats();
    return () => { cancelled = true; };
  }, [currentUser, reloadKey]);

  const freshXp = userProfile?.xp ?? 0;
  const freshLevel = userProfile?.level ?? 1;
  const freshStreak = userProfile?.streak ?? 0;
  const freshProgress = getXpProgress(freshLevel, freshXp);

  const profileStats: UserStatsDoc = {
    ...(stats ?? {
      userId: currentUser?.uid ?? '',
      generatedAt: '',
      totalXp: freshXp,
      level: freshLevel,
      streak: freshStreak,
      targetMajor: userProfile?.targetMajor ?? '',
      activeSubjects: userProfile?.subjects ?? [],
      lastActiveDate: userProfile?.lastActiveDate ?? '',
      xpProgress: freshProgress,
      dailyQuest: { sessions: 0, totalXp: 0, totalQuestions: 0, correct: 0, accuracy: 0, bestSessionXp: 0 },
      mockTest: { sessions: 0, averageScore: 0, bestScore: 0, averageTime: 0, lastScore: 0 },
      subjects: [],
      focusAreas: [],
    }),
    // Always use fresh values from users collection (source of truth)
    totalXp: freshXp,
    level: freshLevel,
    streak: freshStreak,
    xpProgress: freshProgress,
  };

  const maxActivityXp = Math.max(...activity.map(item => item.xp), 1);
  const strongestSubject = useMemo(() => {
    if (profileStats.subjects.length === 0) return null;
    return [...profileStats.subjects].sort((a, b) => b.accuracy - a.accuracy)[0];
  }, [profileStats.subjects]);

  if (loading) return <Skeleton />;

  return (
    <Layout>
      <style>
        {`
          .stats-page {
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .stats-shell {
            display: grid;
            grid-template-columns: 220px minmax(0, 1fr);
            gap: 16px;
            align-items: start;
          }

          .stats-rail {
            display: flex;
            flex-direction: column;
            gap: 12px;
            position: sticky;
            top: 16px;
          }

          .stats-main {
            display: flex;
            flex-direction: column;
            gap: 16px;
            min-width: 0;
          }

          .stats-kpi-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }

          .stats-analysis-grid {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .stats-subject-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 12px;
          }

          .activity-bars {
            display: grid;
            grid-template-columns: repeat(7, minmax(0, 1fr));
            gap: 10px;
            align-items: end;
            min-height: 180px;
          }

          @media (max-width: 1120px) {
            .stats-shell,
            .stats-analysis-grid {
              grid-template-columns: 1fr;
            }

            .stats-rail {
              position: static;
            }

            .stats-kpi-grid,
            .stats-subject-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 680px) {
            .stats-page {
              padding: 16px;
            }

            .stats-kpi-grid,
            .stats-subject-grid,
            .activity-bars {
              grid-template-columns: 1fr;
            }

            .activity-bars {
              min-height: auto;
              align-items: stretch;
            }
          }
        `}
      </style>
      
      <div style={{ marginBottom: '8px', paddingLeft: '24px', paddingTop: '24px' }}>
        <div
          style={{
            fontSize: '28px',
            fontWeight: '700',
            color: COLORS.ink,
          }}
        >
          Statistics
        </div>

        <div
          style={{
            fontSize: '14px',
            color: COLORS.muted,
            marginTop: '6px',
          }}
        >
          Learning analytics and progress overview
        </div>
      </div>

      <div className="stats-page">
        {error && (
          <div style={{
            ...cardStyle,
            padding: '14px',
            background: COLORS.redSoft,
            borderColor: '#F0997B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#993C1D', fontSize: '13px', lineHeight: 1.5 }}>
              <AlertCircle size={18} color={COLORS.red} />
              {error}
            </div>
            <button
              onClick={() => setReloadKey(key => key + 1)}
              style={{
                border: 'none',
                background: COLORS.red,
                color: 'white',
                borderRadius: '10px',
                padding: '8px 11px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        )}

        {!stats && <EmptyAnalytics />}

        <div className="stats-shell">
          <aside className="stats-rail">
            <section style={{
              ...cardStyle,
              overflow: 'hidden',
              background: `linear-gradient(135deg, ${COLORS.ink} 0%, ${COLORS.primaryDark} 100%)`,
              borderRadius: '20px',
              color: 'white',
            }}>
              <div style={{ padding: '24px' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.62)', marginBottom: '7px' }}>
                  Learning pulse
                </div>
                <div style={{ fontSize: '42px', lineHeight: 1, fontWeight: '700', marginBottom: '8px' }}>
                  {profileStats.xpProgress.pct.toFixed(0)}%
                </div>
                <div style={{ fontSize: '13px', lineHeight: 1.55, color: 'rgba(255,255,255,0.7)', marginBottom: '18px' }}>
                  progress menuju Level {profileStats.level + 1}
                </div>
                <div style={{ height: '9px', borderRadius: '99px', background: 'rgba(255,255,255,0.18)', overflow: 'hidden', marginBottom: '10px' }}>
                  <div style={{
                    width: `${profileStats.xpProgress.pct}%`,
                    height: '100%',
                    borderRadius: '99px',
                    background: `linear-gradient(90deg, ${COLORS.amber}, #FFD58B)`,
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255,255,255,0.68)' }}>
                  <span>{profileStats.xpProgress.current} XP</span>
                  <span>{profileStats.xpProgress.total} XP</span>
                </div>
              </div>
            </section>

            <section style={{ ...cardStyle, padding: '18px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: COLORS.ink, marginBottom: '12px' }}>
                Next best action
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '11px',
                  background: COLORS.amberSoft,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Target size={17} color={COLORS.amberDark} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', lineHeight: 1.45, fontWeight: '700', color: COLORS.ink }}>
                    {profileStats.focusAreas[0]?.subject ?? strongestSubject?.subject ?? 'Daily Quest'}
                  </div>
                  <div style={{ fontSize: '12px', lineHeight: 1.55, color: COLORS.muted, marginTop: '4px' }}>
                    {profileStats.focusAreas[0]?.reason ?? 'Selesaikan satu quest lagi untuk membuat insight lebih akurat.'}
                  </div>
                </div>
              </div>
            </section>

            <section style={{ ...cardStyle, padding: '18px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: COLORS.ink, marginBottom: '12px' }}>
                Data freshness
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', color: stats ? COLORS.green : COLORS.amberDark, fontSize: '13px', fontWeight: '700' }}>
                <CheckCircle size={16} />
                {stats ? `Updated ${formatDate(stats.generatedAt)}` : 'Menunggu aktivitas'}
              </div>
              <div style={{ fontSize: '12px', lineHeight: 1.55, color: COLORS.muted, marginTop: '8px' }}>
                Source collections: `userStats` and `userActivity`.
              </div>
            </section>
          </aside>

          <main className="stats-main">
            <section className="stats-kpi-grid" aria-label="Statistik utama">
              <DataBadge icon={Zap} label="Total XP" value={`${profileStats.totalXp}`} color={COLORS.primary} bg={COLORS.primarySoft} />
              <DataBadge icon={Trophy} label="Level" value={`${profileStats.level}`} color={COLORS.green} bg={COLORS.greenSoft} />
              <DataBadge icon={Flame} label="Streak" value={`${profileStats.streak} hari`} color={COLORS.amberDark} bg={COLORS.amberSoft} />
              <DataBadge icon={Gauge} label="Akurasi quest" value={`${profileStats.dailyQuest.accuracy}%`} color={COLORS.red} bg={COLORS.redSoft} />
            </section>

            <section className="stats-analysis-grid">
              <div style={{ ...cardStyle, padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '18px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: COLORS.ink }}>7-day activity rhythm</div>
                    <div style={{ fontSize: '12px', color: COLORS.muted, marginTop: '4px' }}>
                      XP, quest, dan mock test dari collection userActivity
                    </div>
                  </div>
                  <LineChart size={22} color={COLORS.primary} />
                </div>

                {activity.length === 0 ? (
                  <div style={{
                    background: COLORS.canvas,
                    border: '1px dashed #D8D5CA',
                    borderRadius: '14px',
                    padding: '18px',
                    color: COLORS.muted,
                    fontSize: '13px',
                    lineHeight: 1.55,
                  }}>
                    Belum ada aktivitas belajar tersimpan. Selesaikan Daily Quest atau Mock Test dulu.
                  </div>
                ) : (
                  <div className="activity-bars">
                    {activity.map(item => {
                      const height = Math.max((item.xp / maxActivityXp) * 150, item.xp > 0 ? 18 : 8);
                      return (
                        <div key={item.date} style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'flex-end' }}>
                          <div style={{
                            height: `${height}px`,
                            minHeight: '8px',
                            borderRadius: '12px',
                            background: item.xp > 0 ? `linear-gradient(180deg, ${COLORS.primary}, ${COLORS.primaryDark})` : COLORS.canvas,
                            border: item.xp > 0 ? 'none' : '1px dashed #D8D5CA',
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'center',
                            padding: '8px 4px',
                            color: item.xp > 0 ? 'white' : COLORS.softMuted,
                            fontSize: '11px',
                            fontWeight: '700',
                          }}>
                            {item.xp}
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: COLORS.ink }}>{formatDate(item.date)}</div>
                            <div style={{ fontSize: '10px', color: COLORS.softMuted, marginTop: '2px' }}>
                              {item.questSessions + item.mockSessions} sesi
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ ...cardStyle, padding: '20px' }}>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: COLORS.ink, marginBottom: '14px' }}>
                    Session mix
                  </div>
                  {[
                    { label: 'Daily Quest', value: profileStats.dailyQuest.sessions, icon: BookOpen, color: COLORS.primary, bg: COLORS.primarySoft },
                    { label: 'Mock Test', value: profileStats.mockTest.sessions, icon: ClipboardList, color: COLORS.amberDark, bg: COLORS.amberSoft },
                    { label: 'Best Mock', value: `${profileStats.mockTest.bestScore}%`, icon: Trophy, color: COLORS.green, bg: COLORS.greenSoft },
                    { label: 'Avg Mock Time', value: formatTime(profileStats.mockTest.averageTime), icon: Clock, color: COLORS.red, bg: COLORS.redSoft },
                  ].map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '11px',
                        background: bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Icon size={17} color={color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: COLORS.ink }}>{value}</div>
                        <div style={{ fontSize: '11px', color: COLORS.muted, marginTop: '3px' }}>{label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ ...cardStyle, padding: '20px', background: 'linear-gradient(135deg, #FFF8EC 0%, #FFFFFF 100%)' }}>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: COLORS.ink, marginBottom: '8px' }}>
                    Target context
                  </div>
                  <div style={{ fontSize: '13px', lineHeight: 1.6, color: COLORS.muted }}>
                    Target: <strong style={{ color: COLORS.ink }}>{profileStats.targetMajor || 'Belum diisi'}</strong>. Aktif terakhir {formatDate(profileStats.lastActiveDate)}.
                  </div>
                </div>
              </div>
            </section>

            <section style={{ ...cardStyle, padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: COLORS.ink }}>Subject performance matrix</div>
                  <div style={{ fontSize: '12px', color: COLORS.muted, marginTop: '4px' }}>
                    Dibentuk dari hasil Daily Quest dan Mock Test
                  </div>
                </div>
                <BarChart2 size={22} color={COLORS.primary} />
              </div>

              {profileStats.subjects.length === 0 ? (
                <div style={{ background: COLORS.canvas, border: '1px dashed #D8D5CA', borderRadius: '14px', padding: '18px', fontSize: '13px', color: COLORS.muted }}>
                  Belum ada performa mapel tersimpan. Selesaikan Daily Quest atau Mock Test dulu.
                </div>
              ) : (
                <div className="stats-subject-grid">
                  {profileStats.subjects.map(subject => {
                    const color = subject.accuracy >= 70 ? COLORS.green : subject.accuracy >= 45 ? COLORS.amberDark : COLORS.red;
                    const bg = subject.accuracy >= 70 ? COLORS.greenSoft : subject.accuracy >= 45 ? COLORS.amberSoft : COLORS.redSoft;
                    return (
                      <article key={subject.subject} style={{ borderRadius: '14px', background: bg, padding: '16px', border: `1px solid ${color}22` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: COLORS.ink }}>{subject.subject}</div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color }}>{subject.accuracy}%</div>
                        </div>
                        <div style={{ height: '8px', borderRadius: '99px', background: 'rgba(255,255,255,0.7)', overflow: 'hidden', marginBottom: '10px' }}>
                          <div style={{ width: `${subject.accuracy}%`, height: '100%', borderRadius: '99px', background: color }} />
                        </div>
                        <div style={{ fontSize: '11px', color: COLORS.muted }}>
                          {subject.correct}/{subject.total} benar - {subject.xp} XP
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section style={{ ...cardStyle, padding: '20px' }}>
              <div style={{ fontSize: '16px', fontWeight: '700', color: COLORS.ink, marginBottom: '14px' }}>
                Focus queue
              </div>
              {profileStats.focusAreas.length === 0 ? (
                <div style={{ background: COLORS.greenSoft, border: '1px solid #5DCAA5', borderRadius: '14px', padding: '16px', fontSize: '13px', color: '#0F6E56', lineHeight: 1.55 }}>
                  Belum ada area lemah yang cukup jelas dari data saat ini. Tambahkan sesi belajar untuk membaca pola.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {profileStats.focusAreas.map((area, index) => (
                    <div key={area.subject} style={{
                      display: 'grid',
                      gridTemplateColumns: '42px minmax(0, 1fr) 74px',
                      gap: '12px',
                      alignItems: 'center',
                      padding: '12px',
                      borderRadius: '14px',
                      background: COLORS.primaryLighter,
                    }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '11px',
                        background: index === 0 ? COLORS.redSoft : COLORS.amberSoft,
                        color: index === 0 ? COLORS.red : COLORS.amberDark,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: '700',
                      }}>
                        {index + 1}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: COLORS.ink }}>{area.subject}</div>
                        <div style={{ fontSize: '12px', color: COLORS.muted, marginTop: '3px' }}>{area.reason}</div>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: area.accuracy < 45 ? COLORS.red : COLORS.amberDark }}>
                        {area.accuracy}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </Layout>
  );
}
