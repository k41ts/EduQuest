import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Zap, ClipboardList, Target, Trophy, TrendingUp, BookOpen, Brain, Calculator } from 'lucide-react';

const SUBJECT_META: Record<string, { color: string; bg: string; icon: typeof BookOpen }> = {
  TPS:        { color: '#7F77DD', bg: '#EEEDFE', icon: Brain },
  Literasi:   { color: '#1D9E75', bg: '#E1F5EE', icon: BookOpen },
  Matematika: { color: '#EF9F27', bg: '#FAEEDA', icon: Calculator },
};

function StatCard({ label, value, icon: Icon, color, bg }: {
  label: string; value: string; icon: typeof Zap; color: string; bg: string;
}) {
  return (
    <div style={{
      background: 'white', borderRadius: '16px', padding: '18px 20px',
      border: '1px solid #EDE9FE', display: 'flex', alignItems: 'center', gap: '14px',
    }}>
      <div style={{
        width: '44px', height: '44px', borderRadius: '12px', background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={20} color={color} strokeWidth={1.8} />
      </div>
      <div>
        <div style={{ fontSize: '24px', fontWeight: '700', color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '12px', color: '#B4B2A9', marginTop: '4px' }}>{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [subjectStats, setSubjectStats] = useState<{ subject: string; accuracy: number; total: number }[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    async function fetchStats() {
      try {
        const snap = await getDoc(doc(db, 'userStats', currentUser!.uid));
        if (snap.exists()) {
          const data = snap.data();
          setSubjectStats(data.subjects ?? []);
        }
      } catch (err) {
        console.error('Failed to load subject stats:', err);
      }
    }
    fetchStats();
  }, [currentUser]);

  const level = userProfile?.level ?? 1;
  const xp = userProfile?.xp ?? 0;
  const xpPerLevel = level * 500;
  const xpProgress = xp % xpPerLevel;
  const xpPct = Math.min((xpProgress / xpPerLevel) * 100, 100);
  const firstName = userProfile?.name?.split(' ')[0] ?? 'Kamu';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Selamat pagi' : hour < 17 ? 'Selamat siang' : 'Selamat malam';

  return (
    <Layout>
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Hero card */}
        <div style={{
          background: 'linear-gradient(135deg, #26215C 0%, #534AB7 100%)',
          borderRadius: '20px', padding: '28px 32px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
              {greeting},
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'white', marginBottom: '16px' }}>
              {firstName}! Siap belajar hari ini?
            </div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Level {level}</span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{xpProgress} / {xpPerLevel} XP</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '99px', background: '#F0A84B',
                  width: `${xpPct}%`, transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => navigate('/quest')} style={{
                padding: '10px 20px', borderRadius: '12px', background: '#F0A84B',
                border: 'none', fontSize: '13px', fontWeight: '700', color: '#fefcf9',
                cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                display: 'flex', alignItems: 'center', gap: '6px', transition: 'background 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#e09738'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#F0A84B'; }}
              >
                <Zap size={14} /> Mulai Daily Quest
              </button>
              <button onClick={() => navigate('/mock')} style={{
                padding: '10px 20px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                fontSize: '13px', fontWeight: '600', color: 'white',
                cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                display: 'flex', alignItems: 'center', gap: '6px', transition: 'background 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
              >
                <ClipboardList size={14} /> Mock Test
              </button>
            </div>
          </div>

          <div style={{
            textAlign: 'center', marginLeft: '32px', flexShrink: 0,
            background: 'rgba(255,255,255,0.1)', borderRadius: '16px', padding: '20px 24px',
          }}>
            <Target size={28} color="#F0A84B" style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Target kamu</div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'white', maxWidth: '140px', lineHeight: '1.3' }}>
              {userProfile?.targetMajor || '-'}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          <StatCard label="Streak aktif" value={`${userProfile?.streak ?? 0} hari`} icon={Zap} color="#EF9F27" bg="#FAEEDA" />
          <StatCard label="Total XP" value={`${userProfile?.xp ?? 0}`} icon={TrendingUp} color="#7F77DD" bg="#EEEDFE" />
          <StatCard label="Level saat ini" value={`${userProfile?.level ?? 1}`} icon={Trophy} color="#1D9E75" bg="#E1F5EE" />
        </div>

        {/* Bottom row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

          {/* Daily quest card */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #EDE9FE' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#26215C' }}>Daily Quest</div>
              <span style={{
                background: '#E1F5EE', color: '#1D9E75', fontSize: '11px',
                fontWeight: '600', padding: '3px 10px', borderRadius: '99px',
              }}>Tersedia</span>
            </div>
            <div style={{ fontSize: '13px', color: '#888780', marginBottom: '10px' }}>
              10 soal · ~15 menit · Adaptif
            </div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {(userProfile?.subjects ?? []).map(s => (
                <span key={s} style={{
                  background: SUBJECT_META[s]?.bg ?? '#EEEDFE',
                  color: SUBJECT_META[s]?.color ?? '#7F77DD',
                  fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '99px',
                }}>{s}</span>
              ))}
            </div>
            <button onClick={() => navigate('/quest')} style={{
              width: '100%', padding: '12px', borderRadius: '12px',
              background: '#7F77DD', border: 'none',
              fontSize: '13px', fontWeight: '700', color: 'white',
              cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', transition: 'background 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#534AB7'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#7F77DD'; }}
            >
              Mulai sekarang
            </button>
          </div>

          {/* Subject performance */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #EDE9FE' }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#26215C', marginBottom: '16px' }}>
              Performa Mapel
            </div>
            {(userProfile?.subjects ?? []).length === 0 ? (
              <div style={{ fontSize: '13px', color: '#B4B2A9', textAlign: 'center', paddingTop: '24px' }}>
                Belum ada data. Mulai quest dulu yuk!
              </div>
            ) : (
              (userProfile?.subjects ?? []).map(s => {
                const meta = SUBJECT_META[s] ?? { color: '#7F77DD', bg: '#EEEDFE', icon: BookOpen };
                const Icon = meta.icon;
                const stat = subjectStats.find(st => st.subject === s);
                const accuracy = stat?.accuracy ?? 0;
                const total = stat?.total ?? 0;
                return (
                  <div key={s} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px' }}>
                      <div style={{
                        width: '26px', height: '26px', borderRadius: '7px', background: meta.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={14} color={meta.color} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#26215C', flex: 1 }}>{s}</span>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: meta.color }}>
                        {total > 0 ? `${accuracy}%` : '--%'}
                      </span>
                    </div>
                    <div style={{ height: '7px', background: meta.bg, borderRadius: '99px' }}>
                      <div style={{ height: '100%', borderRadius: '99px', background: meta.color, width: `${accuracy}%`, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })
            )}
<<<<<<< Updated upstream
            <div style={{ fontSize: '11px', color: '#B4B2A9', marginTop: '4px' }}>
              Data akan muncul setelah kamu selesai quest pertama
            </div>
=======
            {subjectStats.length === 0 && (userProfile?.subjects ?? []).length > 0 && (
              <div style={{ fontSize: '11px', color: '#B4B2A9', marginTop: '4px'}}>
                Data akan muncul setelah kamu selesai quest pertama
              </div>
            )}
>>>>>>> Stashed changes
          </div>
        </div>
      </div>
    </Layout>
  );
}