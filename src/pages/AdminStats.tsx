import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import {
  adminCard,
  adminPage,
  adminTitle,
  adminBadge,
} from '../components/adminUi';
import {
  BookOpen, Users, ClipboardList, TrendingUp,
  Brain, Calculator, Trophy, Star, BarChart2,
} from 'lucide-react';

// ─── colour tokens (mirrored from AdminDashboard / AdminQuestions) ────────────
const SUBJECT_META: Record<string, { color: string; bg: string; icon: typeof BookOpen }> = {
  TPS:        { color: '#7F77DD', bg: '#EEEDFE', icon: Brain },
  Literasi:   { color: '#1D9E75', bg: '#E1F5EE', icon: BookOpen },
  Matematika: { color: '#EF9F27', bg: '#FAEEDA', icon: Calculator },
};

// ─── types ────────────────────────────────────────────────────────────────────
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

// ─── KPI card (matches AdminDashboard KpiCard) ────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, color, bg,
}: {
  label: string; value: string | number; sub?: string;
  icon: typeof BookOpen; color: string; bg: string;
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

// ─── subject progress bar (matches AdminDashboard SubjectBar) ─────────────────
function SubjectBar({ subject, count, total }: { subject: string; count: number; total: number }) {
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

// ─── leaderboard row (matches AdminDashboard TopUserRow) ──────────────────────
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

// ─── accuracy row with inline progress bar ────────────────────────────────────
function AccuracyRow({
  rank, name, email, accuracy, sessionsCompleted, totalAnswered,
}: {
  rank: number; name: string; email: string; accuracy: number;
  sessionsCompleted: number; totalAnswered: number;
}) {
  const accentColor = accuracy >= 90 ? '#1D9E75' : accuracy >= 75 ? '#EF9F27' : '#7F77DD';
  const accentBg    = accuracy >= 90 ? '#E1F5EE'  : accuracy >= 75 ? '#FAEEDA'  : '#EEEDFE';

  return (
    <div style={{
      padding: '12px 14px', borderRadius: '12px',
      background: 'rgba(127,119,221,0.04)',
      border: '1px solid rgba(127,119,221,0.08)',
      marginBottom: '8px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          padding: '3px 8px', borderRadius: '6px',
          background: accentBg, color: accentColor,
          fontSize: '11px', fontWeight: '700', flexShrink: 0,
        }}>
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
          <div style={{ fontSize: '18px', fontWeight: '800', color: accentColor }}>{accuracy}%</div>
          <div style={{ fontSize: '11px', color: '#726F86' }}>{sessionsCompleted} sesi · {totalAnswered} soal</div>
        </div>
      </div>
      <div style={{ height: '5px', background: accentBg, borderRadius: '99px' }}>
        <div style={{
          height: '100%', borderRadius: '99px', background: accentColor,
          width: `${accuracy}%`, transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────
export default function AdminStats() {
  const [bySubject, setBySubject] = useState<Record<string, number>>({});
  const [sessions, setSessions]   = useState<SessionDoc[]>([]);

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
      current.totalCorrect      += session.correctCount ?? 0;
      current.totalAnswered     += session.totalCount   ?? 0;
      current.totalXp           += session.xpEarned     ?? 0;
      if (session.completedAt && session.completedAt > current.lastCompletedAt) {
        current.lastCompletedAt = session.completedAt;
      }
      if (current.name  === 'Unknown' && session.userName)  current.name  = session.userName;
      if (current.email === '-'       && session.userEmail) current.email = session.userEmail;
      current.accuracy = current.totalAnswered > 0
        ? Math.round((current.totalCorrect / current.totalAnswered) * 100)
        : 0;

      map.set(key, current);
    });

    return Array.from(map.values());
  }, [sessions]);

  const topProgress = [...aggregates].sort((a, b) => {
    if (b.sessionsCompleted !== a.sessionsCompleted) return b.sessionsCompleted - a.sessionsCompleted;
    if (b.totalAnswered     !== a.totalAnswered)     return b.totalAnswered     - a.totalAnswered;
    return b.totalXp - a.totalXp;
  }).slice(0, 5);

  const topAccuracy = [...aggregates].sort((a, b) => {
    if (b.accuracy      !== a.accuracy)      return b.accuracy      - a.accuracy;
    if (b.totalAnswered !== a.totalAnswered) return b.totalAnswered - a.totalAnswered;
    return b.totalXp - a.totalXp;
  }).slice(0, 5);

  const totalQuestions = Object.values(bySubject).reduce((sum, n) => sum + n, 0);
  const avgAccuracy    = aggregates.length > 0
    ? Math.round(aggregates.reduce((sum, a) => sum + a.accuracy, 0) / aggregates.length)
    : 0;

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

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ ...adminTitle.title, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart2 size={22} color="#7F77DD" strokeWidth={1.8} />
            Admin Statistics
          </h2>
          <p style={adminTitle.subtitle}>
            Monitor statistik lengkap platform termasuk user activity, akurasi, dan sebaran soal.
          </p>
        </div>

        {/* ── KPI row ──────────────────────────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: '14px',
          marginBottom: '20px',
        }}>
          <KpiCard
            label="Total Sessions"
            value={sessions.length}
            sub="sesi diselesaikan"
            icon={ClipboardList}
            color="#7F77DD"
            bg="#EEEDFE"
          />
          <KpiCard
            label="Active Users"
            value={aggregates.length}
            sub="user aktif"
            icon={Users}
            color="#1D9E75"
            bg="#E1F5EE"
          />
          <KpiCard
            label="Total Questions"
            value={totalQuestions}
            sub="soal tersedia"
            icon={BookOpen}
            color="#EF9F27"
            bg="#FAEEDA"
          />
          <KpiCard
            label="Avg Accuracy"
            value={`${avgAccuracy}%`}
            sub="rata-rata semua user"
            icon={TrendingUp}
            color="#7F77DD"
            bg="#EEEDFE"
          />
        </div>

        {/* ── Leaderboards ─────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

          {/* Top Progress */}
          <div style={{ ...adminCard, padding: '22px' }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#1F2240', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trophy size={16} color="#EF9F27" strokeWidth={1.8} />
                Top Progress
              </div>
              <div style={{ fontSize: '12px', color: '#726F86', marginTop: '3px' }}>
                User dengan jumlah pengerjaan terbanyak
              </div>
            </div>

            {topProgress.length === 0 ? (
              <div style={{ color: '#726F86', fontSize: '13px', padding: '20px 0', textAlign: 'center' }}>
                Belum ada session.
              </div>
            ) : (
              topProgress.map((item, index) => (
                <TopUserRow
                  key={item.userId}
                  rank={index + 1}
                  name={item.name}
                  email={item.email}
                  value={item.sessionsCompleted}
                  valueLabel={`sesi · ${item.totalXp} XP`}
                  badgeTone="admin"
                />
              ))
            )}
          </div>

          {/* Top Accuracy */}
          <div style={{ ...adminCard, padding: '22px' }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#1F2240', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Star size={16} color="#EF9F27" strokeWidth={1.8} />
                Top Accuracy
              </div>
              <div style={{ fontSize: '12px', color: '#726F86', marginTop: '3px' }}>
                User dengan akurasi pengerjaan tertinggi
              </div>
            </div>

            {topAccuracy.length === 0 ? (
              <div style={{ color: '#726F86', fontSize: '13px', padding: '20px 0', textAlign: 'center' }}>
                Belum ada session.
              </div>
            ) : (
              topAccuracy.map((item, index) => (
                <AccuracyRow
                  key={item.userId}
                  rank={index + 1}
                  name={item.name}
                  email={item.email}
                  accuracy={item.accuracy}
                  sessionsCompleted={item.sessionsCompleted}
                  totalAnswered={item.totalAnswered}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Questions Distribution ────────────────────────────────────────── */}
        <div style={{ ...adminCard, padding: '22px' }}>
          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#1F2240', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={16} color="#7F77DD" strokeWidth={1.8} />
              Questions Distribution
            </div>
            <div style={{ fontSize: '12px', color: '#726F86', marginTop: '3px' }}>
              {totalQuestions} soal · {Object.keys(bySubject).length} mapel
            </div>
          </div>

          {Object.keys(bySubject).length === 0 ? (
            <div style={{ color: '#726F86', fontSize: '13px', padding: '20px 0', textAlign: 'center' }}>
              Belum ada data soal.
            </div>
          ) : (
            <>
              {Object.keys(SUBJECT_META).map(subj =>
                bySubject[subj] != null ? (
                  <SubjectBar key={subj} subject={subj} count={bySubject[subj]} total={totalQuestions} />
                ) : null
              )}
              {Object.keys(bySubject)
                .filter(k => !SUBJECT_META[k])
                .map(k => (
                  <SubjectBar key={k} subject={k} count={bySubject[k]} total={totalQuestions} />
                ))}
            </>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}