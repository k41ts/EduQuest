import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { adminPage, adminCard, adminBadge, adminButton } from '../components/adminUi';
import {
  BookOpen, Users, ClipboardList, TrendingUp,
  Brain, Calculator, Zap, ArrowRight, Activity,
  CheckCircle, AlertCircle,
} from 'lucide-react';

// ─── colour tokens (mirrored from Dashboard.tsx) ─────────────────────────────
const SUBJECT_META: Record<string, { color: string; bg: string; icon: typeof BookOpen }> = {
  TPS:        { color: '#7F77DD', bg: '#EEEDFE', icon: Brain },
  Literasi:   { color: '#1D9E75', bg: '#E1F5EE', icon: BookOpen },
  Matematika: { color: '#EF9F27', bg: '#FAEEDA', icon: Calculator },
};

// ─── tiny reusable components ─────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, color, bg,
}: {
  label: string; value: string | number; sub?: string;
  icon: typeof Zap; color: string; bg: string;
}) {
  return (
    <div style={{
      ...adminCard,
      padding: '20px',
      display: 'flex', alignItems: 'center', gap: '16px',
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '14px',
        background: bg, display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={22} color={color} strokeWidth={1.8} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '26px', fontWeight: '800', color: '#1F2240', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: '12px', color: '#726F86', marginTop: '4px' }}>{label}</div>
        {sub && <div style={{ fontSize: '11px', color: '#B4B2A9', marginTop: '2px' }}>{sub}</div>}
      </div>
    </div>
  );
}

function SubjectBar({
  subject, count, total,
}: {
  subject: string; count: number; total: number;
}) {
  const meta = SUBJECT_META[subject] ?? { color: '#7F77DD', bg: '#EEEDFE', icon: BookOpen };
  const Icon = meta.icon;
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px' }}>
        <div style={{
          width: '26px', height: '26px', borderRadius: '7px', background: meta.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={14} color={meta.color} />
        </div>
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#1F2240', flex: 1 }}>{subject}</span>
        <span style={{ fontSize: '12px', fontWeight: '700', color: meta.color }}>{count} soal</span>
        <span style={{ fontSize: '11px', color: '#B4B2A9' }}>{pct}%</span>
      </div>
      <div style={{ height: '7px', background: meta.bg, borderRadius: '99px' }}>
        <div style={{
          height: '100%', borderRadius: '99px', background: meta.color,
          width: `${pct}%`, transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  );
}

function TopUserRow({
  rank, name, email, value, valueLabel, badgeTone,
}: {
  rank: number; name: string; email: string; value: string | number;
  valueLabel: string; badgeTone: 'admin' | 'easy';
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px 14px', borderRadius: '12px',
      background: 'rgba(127,119,221,0.04)',
      border: '1px solid rgba(127,119,221,0.08)',
      marginBottom: '8px',
    }}>
      <span style={{ ...adminBadge(badgeTone), minWidth: '32px', justifyContent: 'center' }}>
        #{rank}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#1F2240', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </div>
        <div style={{ fontSize: '11px', color: '#726F86', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {email}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: '18px', fontWeight: '800', color: '#1F2240' }}>{value}</div>
        <div style={{ fontSize: '11px', color: '#726F86' }}>{valueLabel}</div>
      </div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

type SessionDoc = {
  userId: string;
  userName?: string;
  userEmail?: string;
  xpEarned?: number;
  correctCount?: number;
  totalCount?: number;
  completedAt?: string;
};

type UserAggregate = {
  userId: string;
  name: string;
  email: string;
  sessions: number;
  totalXp: number;
  accuracy: number;
  totalAnswered: number;
};

export default function AdminDashboard() {
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [bySubject, setBySubject]         = useState<Record<string, number>>({});
  const [sessions, setSessions]           = useState<SessionDoc[]>([]);
  const [userCount, setUserCount]         = useState<number | null>(null);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    async function load() {
      const [qSnap, sSnap, uSnap] = await Promise.all([
        getDocs(collection(db, 'questions')),
        getDocs(collection(db, 'sessions')),
        getDocs(collection(db, 'users')),
      ]);

      // questions
      const counts: Record<string, number> = {};
      qSnap.docs.forEach(d => {
        const s = (d.data() as any).subject || 'unknown';
        counts[s] = (counts[s] || 0) + 1;
      });
      setBySubject(counts);
      setQuestionCount(qSnap.size);

      // sessions
      setSessions(sSnap.docs.map(d => d.data() as SessionDoc));

      // users
      setUserCount(uSnap.size);
      setLoading(false);
    }
    load();
  }, []);

  // aggregate users
  const aggregates: UserAggregate[] = (() => {
    const map = new Map<string, UserAggregate>();
    sessions.forEach(s => {
      const cur = map.get(s.userId) ?? {
        userId: s.userId, name: s.userName || 'Unknown',
        email: s.userEmail || '-',
        sessions: 0, totalXp: 0, accuracy: 0, totalAnswered: 0,
      };
      cur.sessions += 1;
      cur.totalXp   += s.xpEarned ?? 0;
      const corr = s.correctCount ?? 0;
      const tot  = s.totalCount ?? 0;
      cur.totalAnswered += tot;
      cur.accuracy = cur.totalAnswered > 0
        ? Math.round(((cur.accuracy * (cur.totalAnswered - tot) + corr) / cur.totalAnswered) * 100) / 100
        : 0;
      if (cur.name === 'Unknown' && s.userName) cur.name = s.userName;
      if (cur.email === '-'     && s.userEmail) cur.email = s.userEmail;
      map.set(s.userId, cur);
    });
    return Array.from(map.values()).map(u => ({
      ...u,
      accuracy: u.totalAnswered > 0 ? Math.round(u.accuracy) : 0,
    }));
  })();

  const topByXp  = [...aggregates].sort((a, b) => b.totalXp  - a.totalXp).slice(0, 5);
  const topByAcc = [...aggregates].sort((a, b) => {
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    return b.totalAnswered - a.totalAnswered;
  }).slice(0, 5);

  const totalSubjects = Object.values(bySubject).reduce((s, n) => s + n, 0);

  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Selamat pagi' : hour < 17 ? 'Selamat siang' : 'Selamat malam';

  return (
    <AdminLayout>
      <div style={adminPage}>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #26215C 0%, #534AB7 100%)',
          borderRadius: '20px', padding: '28px 32px', marginBottom: '20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', marginBottom: '4px' }}>
              {greeting}, Admin 👋
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'white', marginBottom: '8px' }}>
              Admin Dashboard
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', maxWidth: '420px', lineHeight: 1.5 }}>
              Ringkasan data utama dan status sistem EduQuest. Semua berjalan normal.
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <a href="/admin/questions" style={{ textDecoration: 'none' }}>
                <button style={{
                  ...adminButton('primary'),
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '10px 18px',
                }}>
                  <BookOpen size={14} /> Kelola Soal
                </button>
              </a>
              <a href="/admin/stats" style={{ textDecoration: 'none' }}>
                <button style={{
                  padding: '10px 18px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  fontSize: '13px', fontWeight: '700', color: 'white',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}>
                  <Activity size={14} /> Lihat Statistik
                </button>
              </a>
            </div>
          </div>

          {/* status pills */}
          <div style={{
            textAlign: 'center', marginLeft: '32px', flexShrink: 0,
            background: 'rgba(255,255,255,0.1)', borderRadius: '16px', padding: '20px 24px',
            minWidth: '160px',
          }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '12px', fontWeight: '700', letterSpacing: '0.06em' }}>
              STATUS SISTEM
            </div>
            {[
              { label: 'Firestore', ok: true },
              { label: 'Auth', ok: true },
              { label: 'Questions', ok: questionCount !== null },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                {item.ok
                  ? <CheckCircle size={14} color="#4ADE80" />
                  : <AlertCircle size={14} color="#FBBF24" />}
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>
                  {item.label}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: '11px', color: item.ok ? '#4ADE80' : '#FBBF24', fontWeight: '700' }}>
                  {item.ok ? 'OK' : '…'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── KPI row ──────────────────────────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '14px',
          marginBottom: '20px',
        }}>
          <KpiCard
            label="Total Soal"
            value={loading ? '—' : (questionCount ?? 0)}
            sub={`${Object.keys(bySubject).length} mata pelajaran`}
            icon={BookOpen}
            color="#7F77DD"
            bg="#EEEDFE"
          />
          <KpiCard
            label="Total Pengguna"
            value={loading ? '—' : (userCount ?? 0)}
            sub="terdaftar"
            icon={Users}
            color="#1D9E75"
            bg="#E1F5EE"
          />
          <KpiCard
            label="Total Sesi"
            value={loading ? '—' : sessions.length}
            sub="quest diselesaikan"
            icon={ClipboardList}
            color="#EF9F27"
            bg="#FAEEDA"
          />
        </div>

        {/* ── Main grid ────────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

          {/* Sebaran Soal */}
          <div style={{ ...adminCard, padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#1F2240' }}>Sebaran Soal</div>
                <div style={{ fontSize: '12px', color: '#726F86', marginTop: '3px' }}>
                  {totalSubjects} soal · {Object.keys(bySubject).length} mapel
                </div>
              </div>
              <a href="/admin/questions/new" style={{ textDecoration: 'none' }}>
                <button style={{
                  ...adminButton('secondary'),
                  display: 'flex', alignItems: 'center', gap: '6px',
                  fontSize: '12px', padding: '8px 12px',
                }}>
                  + Tambah Soal
                </button>
              </a>
            </div>

            {Object.keys(bySubject).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#B4B2A9', fontSize: '13px' }}>
                Belum ada soal di database.
              </div>
            ) : (
              Object.keys(SUBJECT_META).map(subj =>
                bySubject[subj] != null ? (
                  <SubjectBar
                    key={subj}
                    subject={subj}
                    count={bySubject[subj]}
                    total={totalSubjects}
                  />
                ) : null
              )
            )}

            {/* any "unknown" subjects */}
            {Object.keys(bySubject)
              .filter(k => !SUBJECT_META[k])
              .map(k => (
                <SubjectBar key={k} subject={k} count={bySubject[k]} total={totalSubjects} />
              ))}

            <a href="/admin/questions" style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '12px', color: '#7F77DD', fontWeight: '700',
                marginTop: '12px', cursor: 'pointer',
              }}>
                Kelola semua soal <ArrowRight size={13} />
              </div>
            </a>
          </div>

          {/* Quick Actions */}
          <div style={{ ...adminCard, padding: '22px' }}>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#1F2240', marginBottom: '4px' }}>
              Quick Actions
            </div>
            <div style={{ fontSize: '12px', color: '#726F86', marginBottom: '18px' }}>
              Akses cepat ke fungsi admin utama.
            </div>

            {[
              {
                href: '/admin/questions',
                icon: BookOpen,
                color: '#7F77DD', bg: '#EEEDFE',
                title: 'Manage Questions',
                desc: 'Lihat, edit, dan hapus soal',
              },
              {
                href: '/admin/questions/new',
                icon: Zap,
                color: '#EF9F27', bg: '#FAEEDA',
                title: 'Generate Question',
                desc: 'Buat soal baru dengan form',
              },
              {
                href: '/admin/stats',
                icon: TrendingUp,
                color: '#1D9E75', bg: '#E1F5EE',
                title: 'View Statistics',
                desc: 'Aktivitas dan akurasi pengguna',
              },
            ].map(item => (
              <a key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '14px', borderRadius: '14px',
                  border: '1px solid rgba(127,119,221,0.10)',
                  background: 'rgba(127,119,221,0.03)',
                  marginBottom: '10px', cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = item.bg; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(127,119,221,0.03)'; }}
                >
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '12px',
                    background: item.bg, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <item.icon size={18} color={item.color} strokeWidth={1.8} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#1F2240' }}>{item.title}</div>
                    <div style={{ fontSize: '11px', color: '#726F86', marginTop: '2px' }}>{item.desc}</div>
                  </div>
                  <ArrowRight size={14} color="#B4B2A9" />
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* ── Leaderboards ─────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

          {/* Top XP */}
          <div style={{ ...adminCard, padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#1F2240' }}>Top XP</div>
                <div style={{ fontSize: '12px', color: '#726F86', marginTop: '3px' }}>Pengguna dengan XP terbanyak</div>
              </div>
              <span style={adminBadge('admin')}>XP</span>
            </div>

            {topByXp.length === 0 ? (
              <div style={{ color: '#726F86', fontSize: '13px' }}>Belum ada sesi.</div>
            ) : (
              topByXp.map((u, i) => (
                <TopUserRow
                  key={u.userId}
                  rank={i + 1}
                  name={u.name}
                  email={u.email}
                  value={u.totalXp}
                  valueLabel="XP"
                  badgeTone="admin"
                />
              ))
            )}

            <a href="/admin/stats" style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '12px', color: '#7F77DD', fontWeight: '700',
                marginTop: '4px', cursor: 'pointer',
              }}>
                Lihat semua <ArrowRight size={13} />
              </div>
            </a>
          </div>

          {/* Top Akurasi */}
          <div style={{ ...adminCard, padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#1F2240' }}>Top Akurasi</div>
                <div style={{ fontSize: '12px', color: '#726F86', marginTop: '3px' }}>Pengguna dengan akurasi tertinggi</div>
              </div>
              <span style={adminBadge('easy')}>Akurasi</span>
            </div>

            {topByAcc.length === 0 ? (
              <div style={{ color: '#726F86', fontSize: '13px' }}>Belum ada sesi.</div>
            ) : (
              topByAcc.map((u, i) => (
                <TopUserRow
                  key={u.userId}
                  rank={i + 1}
                  name={u.name}
                  email={u.email}
                  value={`${u.accuracy}%`}
                  valueLabel={`${u.totalAnswered} soal`}
                  badgeTone="easy"
                />
              ))
            )}

            <a href="/admin/stats" style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '12px', color: '#1D9E75', fontWeight: '700',
                marginTop: '4px', cursor: 'pointer',
              }}>
                Lihat semua <ArrowRight size={13} />
              </div>
            </a>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}
