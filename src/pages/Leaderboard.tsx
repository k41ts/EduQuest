import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  getDocs,
} from 'firebase/firestore';
import {
  AlertCircle,
  Award,
  ChevronRight,
  Flame,
  Medal,
  Minus,
  RefreshCw,
  Star,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import Layout from '../components/Layout';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { UserProfile } from '../types';

type RankedUser = UserProfile & {
  rank: number;
};

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

function getInitials(name: string) {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
}

function getXpProgress(level: number, xp: number) {
  const xpPerLevel = Math.max(level, 1) * 500;
  const current = xp % xpPerLevel;
  const pct = Math.min((current / xpPerLevel) * 100, 100);
  return { current, total: xpPerLevel, pct, remaining: xpPerLevel - current };
}

function getRankLabel(rank: number) {
  if (rank === 1) return 'Juara 1';
  if (rank <= 3) return 'Top 3';
  if (rank <= 10) return 'Top 10';
  return `Peringkat ${rank}`;
}

function formatLastActive(date: string) {
  if (!date) return 'Belum ada aktivitas';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function Avatar({ name, rank, compact = false }: { name: string; rank: number; compact?: boolean }) {
  const podiumColor = rank === 1 ? COLORS.amber : rank === 2 ? COLORS.primary : rank === 3 ? COLORS.green : COLORS.primary;

  return (
    <div style={{
      width: compact ? '38px' : '48px',
      height: compact ? '38px' : '48px',
      borderRadius: compact ? '12px' : '15px',
      background: rank <= 3 ? podiumColor : COLORS.primarySoft,
      color: rank <= 3 ? 'white' : COLORS.primary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: compact ? '12px' : '14px',
      fontWeight: '700',
      flexShrink: 0,
      border: rank <= 3 ? 'none' : `1px solid ${COLORS.border}`,
    }}>
      {getInitials(name)}
    </div>
  );
}

function MetricPill({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <div style={{
      minWidth: 0,
      padding: '12px',
      borderRadius: '14px',
      background: bg,
      display: 'flex',
      alignItems: 'center',
      gap: '9px',
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '10px',
        background: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={16} color="white" strokeWidth={2} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '15px', lineHeight: 1, fontWeight: '700', color, overflowWrap: 'anywhere' }}>
          {value}
        </div>
        <div style={{ fontSize: '11px', color: COLORS.muted, marginTop: '4px' }}>{label}</div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <Layout>
      <div style={{
        minHeight: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{ ...cardStyle, padding: '26px', width: '100%', maxWidth: '420px', textAlign: 'center' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            border: `3px solid ${COLORS.primarySoft}`,
            borderTopColor: COLORS.primary,
            animation: 'leaderboardSpin 0.8s linear infinite',
            margin: '0 auto 14px',
          }} />
          <div style={{ fontSize: '15px', fontWeight: '700', color: COLORS.ink, marginBottom: '4px' }}>
            Memuat leaderboard
          </div>
          <div style={{ fontSize: '13px', color: COLORS.muted }}>
            Sedang menyusun peringkat belajar terbaru.
          </div>
          <style>{`@keyframes leaderboardSpin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    </Layout>
  );
}

function EmptyState({ onRetry }: { onRetry: () => void }) {
  return (
    <Layout>
      <div style={{ padding: '24px', minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...cardStyle, padding: '28px', maxWidth: '480px', textAlign: 'center' }}>
          <div style={{
            width: '58px',
            height: '58px',
            borderRadius: '18px',
            background: COLORS.primarySoft,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <Trophy size={28} color={COLORS.primary} />
          </div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: COLORS.ink, marginBottom: '6px' }}>
            Belum ada peringkat
          </div>
          <div style={{ fontSize: '13px', lineHeight: 1.6, color: COLORS.muted, marginBottom: '18px' }}>
            Leaderboard akan muncul setelah ada profil pengguna yang punya data XP.
          </div>
          <button
            onClick={onRetry}
            style={{
              border: 'none',
              background: COLORS.primary,
              color: 'white',
              borderRadius: '12px',
              padding: '11px 16px',
              fontSize: '13px',
              fontWeight: '700',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
            }}
          >
            <RefreshCw size={14} /> Muat ulang
          </button>
        </div>
      </div>
    </Layout>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Layout>
      <div style={{ padding: '24px', minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...cardStyle, padding: '28px', maxWidth: '500px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            background: COLORS.redSoft,
            border: '2px solid #F0997B',
            borderRadius: '14px',
            padding: '14px',
            marginBottom: '16px',
          }}>
            <AlertCircle size={20} color={COLORS.red} style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#993C1D', marginBottom: '4px' }}>
                Leaderboard gagal dimuat
              </div>
              <div style={{ fontSize: '13px', lineHeight: 1.55, color: '#993C1D' }}>
                {message}
              </div>
            </div>
          </div>
          <button
            onClick={onRetry}
            style={{
              width: '100%',
              border: 'none',
              background: COLORS.primary,
              color: 'white',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '13px',
              fontWeight: '700',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
            }}
          >
            <RefreshCw size={14} /> Coba lagi
          </button>
        </div>
      </div>
    </Layout>
  );
}

function PersonalRankCard({
  user,
  nextUser,
}: {
  user: RankedUser;
  nextUser: RankedUser | null;
}) {
  const xpProgress = getXpProgress(user.level, user.xp);
  const xpToOvertake = nextUser ? Math.max(nextUser.xp - user.xp + 1, 0) : 0;

  return (
    <section className="leaderboard-personal-card" style={{
      ...cardStyle,
      overflow: 'hidden',
      position: 'relative',
      background: `linear-gradient(135deg, ${COLORS.ink} 0%, ${COLORS.primaryDark} 100%)`,
      borderRadius: '20px',
      color: 'white',
    }}>
      <div style={{ padding: '26px', position: 'relative' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          marginBottom: '24px',
        }}>
          <div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.62)', marginBottom: '5px' }}>
              Peringkat kamu
            </div>
            <div style={{ fontSize: '46px', lineHeight: 0.95, fontWeight: '700', color: 'white' }}>
              #{user.rank}
            </div>
          </div>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '18px',
            background: 'rgba(255,255,255,0.13)',
            border: '1px solid rgba(255,255,255,0.24)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Trophy size={28} color={COLORS.amber} />
          </div>
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          padding: '6px 11px',
          borderRadius: '99px',
          background: 'rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.86)',
          fontSize: '12px',
          fontWeight: '700',
          marginBottom: '14px',
        }}>
          <Award size={14} color={COLORS.amber} /> {getRankLabel(user.rank)}
        </div>

        <h1 style={{ fontSize: '22px', lineHeight: 1.25, fontWeight: '700', marginBottom: '8px', overflowWrap: 'anywhere' }}>
          {user.name}
        </h1>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.68)', marginBottom: '22px' }}>
          Level {user.level} dengan {user.xp} XP
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '7px' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>Progress level</span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.82)' }}>
              {xpProgress.current} / {xpProgress.total} XP
            </span>
          </div>
          <div style={{ height: '9px', background: 'rgba(255,255,255,0.18)', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${xpProgress.pct}%`,
              background: `linear-gradient(90deg, ${COLORS.amber}, #FFD58B)`,
              borderRadius: '99px',
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>

        <div style={{
          borderRadius: '16px',
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.18)',
          padding: '14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px' }}>
            <Target size={16} color={COLORS.amber} />
            <span style={{ fontSize: '13px', fontWeight: '700' }}>
              {nextUser ? `${xpToOvertake} XP untuk naik rank` : 'Kamu di posisi teratas'}
            </span>
          </div>
          <div style={{ fontSize: '12px', lineHeight: 1.5, color: 'rgba(255,255,255,0.68)' }}>
            {nextUser
              ? `Kejar ${nextUser.name} di peringkat #${nextUser.rank}.`
              : 'Pertahankan ritme belajar supaya posisimu tetap aman.'}
          </div>
        </div>
      </div>
    </section>
  );
}

function PodiumCard({ user }: { user: RankedUser }) {
  const rankStyle = user.rank === 1
    ? { bg: COLORS.amberSoft, color: COLORS.amberDark, icon: Trophy, height: '148px' }
    : user.rank === 2
      ? { bg: COLORS.primarySoft, color: COLORS.primary, icon: Medal, height: '126px' }
      : { bg: COLORS.greenSoft, color: COLORS.green, icon: Medal, height: '112px' };
  const Icon = rankStyle.icon;

  return (
    <article
      tabIndex={0}
      className={`podium-card podium-rank-${user.rank}`}
      style={{
        ...cardStyle,
        minHeight: rankStyle.height,
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
        outline: 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
        <Avatar name={user.name} rank={user.rank} />
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '5px 9px',
          borderRadius: '99px',
          background: rankStyle.bg,
          color: rankStyle.color,
          fontSize: '12px',
          fontWeight: '700',
        }}>
          <Icon size={14} /> #{user.rank}
        </div>
      </div>
      <div>
        <div style={{ fontSize: '14px', fontWeight: '700', color: COLORS.ink, marginBottom: '5px', overflowWrap: 'anywhere' }}>
          {user.name}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: COLORS.muted }}>Level {user.level}</span>
          <span style={{ fontSize: '12px', color: rankStyle.color, fontWeight: '700' }}>{user.xp} XP</span>
        </div>
      </div>
    </article>
  );
}

function LeaderboardRow({
  user,
  isCurrentUser,
}: {
  user: RankedUser;
  isCurrentUser: boolean;
}) {
  return (
    <div
      tabIndex={0}
      className="leaderboard-row"
      style={{
        display: 'grid',
        gridTemplateColumns: '64px minmax(190px, 1.5fr) 96px 110px 110px 130px',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 14px',
        borderRadius: '14px',
        border: `1px solid ${isCurrentUser ? COLORS.primary : 'transparent'}`,
        background: isCurrentUser ? COLORS.primarySoft : 'white',
        transition: 'background 0.15s ease, border-color 0.15s ease, transform 0.15s ease',
        outline: 'none',
      }}
      aria-label={`${user.name}, peringkat ${user.rank}, level ${user.level}, ${user.xp} XP`}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          width: '34px',
          height: '34px',
          borderRadius: '11px',
          background: user.rank <= 3 ? COLORS.amberSoft : COLORS.canvas,
          color: user.rank <= 3 ? COLORS.amberDark : COLORS.muted,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '13px',
          fontWeight: '700',
        }}>
          #{user.rank}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0 }}>
        <Avatar name={user.name} rank={user.rank} compact />
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: '13px',
            fontWeight: '700',
            color: COLORS.ink,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {user.name} {isCurrentUser && <span style={{ color: COLORS.primary }}>- Kamu</span>}
          </div>
          <div style={{ fontSize: '11px', color: COLORS.softMuted, marginTop: '3px' }}>
            {user.targetMajor || 'Target belum diisi'}
          </div>
        </div>
      </div>

      <div style={{ fontSize: '13px', color: COLORS.ink, fontWeight: '700' }}>Level {user.level}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: COLORS.primary, fontSize: '13px', fontWeight: '700' }}>
        <Star size={14} fill={COLORS.primary} color={COLORS.primary} /> {user.xp}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: COLORS.amberDark, fontSize: '13px', fontWeight: '700' }}>
        <Flame size={14} color={COLORS.amberDark} /> {user.streak} hari
      </div>
      <div style={{ fontSize: '12px', color: COLORS.muted, fontWeight: '600' }}>
        {formatLastActive(user.lastActiveDate)}
      </div>
    </div>
  );
}

function InsightCard({
  icon: Icon,
  label,
  value,
  detail,
  color,
  bg,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
  detail: string;
  color: string;
  bg: string;
}) {
  return (
    <div style={{ ...cardStyle, padding: '16px' }}>
      <div style={{
        width: '38px',
        height: '38px',
        borderRadius: '12px',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '12px',
      }}>
        <Icon size={18} color={color} />
      </div>
      <div style={{ fontSize: '12px', color: COLORS.muted, marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '19px', lineHeight: 1.1, fontWeight: '700', color }}>{value}</div>
      <div style={{ fontSize: '11px', lineHeight: 1.45, color: COLORS.muted, marginTop: '8px' }}>{detail}</div>
    </div>
  );
}

export default function Leaderboard() {
  const { currentUser, userProfile } = useAuth();
  const [users, setUsers] = useState<RankedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dataNotice, setDataNotice] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadLeaderboard() {
      setLoading(true);
      setError('');
      setDataNotice('');

      try {
        let baseUsers: RankedUser[] = [];

        try {
          const userSnap = await getDocs(collection(db, 'users'));
          baseUsers = userSnap.docs
            .map(docSnap => docSnap.data() as UserProfile)
            .filter(profile => profile.uid && profile.name)
            .sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0))
            .map((profile, index) => ({
              ...profile,
              rank: index + 1,
            }));
        } catch (err) {
          console.warn('Leaderboard users query failed, falling back to current profile.', err);
          if (!userProfile) throw err;
          baseUsers = [{
            ...userProfile,
            rank: 1,
          }];
          setDataNotice('Leaderboard publik belum bisa dibaca dari Firestore, jadi halaman ini menampilkan ringkasan personal dulu.');
        }

        if (!cancelled) setUsers(baseUsers);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError('Coba cek koneksi atau aturan Firestore, lalu muat ulang halaman ini.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadLeaderboard();
    return () => { cancelled = true; };
  }, [currentUser, reloadKey, userProfile]);

  const enrichedUsers = useMemo(() => {
    if (!userProfile) return users;
    const exists = users.some(user => user.uid === userProfile.uid);
    if (exists) return users;
    return [
      ...users,
      {
        ...userProfile,
        rank: users.length + 1,
      },
    ].sort((a, b) => b.xp - a.xp).map((user, index) => ({ ...user, rank: index + 1 }));
  }, [userProfile, users]);

  const currentRankedUser = enrichedUsers.find(user => user.uid === currentUser?.uid)
    ?? (userProfile ? {
      ...userProfile,
      rank: enrichedUsers.length + 1,
    } : null);

  const topUsers = enrichedUsers.slice(0, 3);
  const nextUser = currentRankedUser
    ? enrichedUsers.find(user => user.rank === currentRankedUser.rank - 1) ?? null
    : null;
  const averageXp = enrichedUsers.length
    ? Math.round(enrichedUsers.reduce((total, user) => total + user.xp, 0) / enrichedUsers.length)
    : 0;
  const nearbyUsers = currentRankedUser
    ? enrichedUsers.filter(user => Math.abs(user.rank - currentRankedUser.rank) <= 2)
    : enrichedUsers;
  const leaderboardRows = enrichedUsers.length > 8 && currentRankedUser
    ? Array.from(new Map([...enrichedUsers.slice(0, 8), ...nearbyUsers].map(user => [user.uid, user])).values())
        .sort((a, b) => a.rank - b.rank)
    : enrichedUsers;
  const isPersonalFallback = Boolean(dataNotice && enrichedUsers.length === 1 && currentRankedUser);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={() => setReloadKey(key => key + 1)} />;
  if (enrichedUsers.length === 0) return <EmptyState onRetry={() => setReloadKey(key => key + 1)} />;

  return (
    <Layout>
      <style>
        {`
          .leaderboard-page {
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .leaderboard-hero-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
            gap: 16px;
            align-items: stretch;
          }

          .leaderboard-side-stack {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .leaderboard-podium-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 12px;
            align-items: end;
          }

          .leaderboard-insights-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 12px;
          }

          .leaderboard-table-scroll {
            overflow-x: auto;
          }

          .leaderboard-row:hover,
          .leaderboard-row:focus-visible {
            background: ${COLORS.primaryLighter} !important;
            border-color: ${COLORS.primary} !important;
            transform: translateY(-1px);
          }

          .podium-card:hover,
          .podium-card:focus-visible {
            border-color: ${COLORS.primary};
            box-shadow: 0 12px 28px rgba(38, 33, 92, 0.08);
            transform: translateY(-2px);
          }

          @media (max-width: 1100px) {
            .leaderboard-hero-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 840px) {
            .leaderboard-podium-grid,
            .leaderboard-insights-grid {
              grid-template-columns: 1fr;
            }

            .leaderboard-table-head {
              display: none !important;
            }

            .leaderboard-row {
              min-width: 0 !important;
              grid-template-columns: 48px minmax(0, 1fr) !important;
              gap: 10px !important;
            }

            .leaderboard-row > :nth-child(n+3) {
              grid-column: 2;
            }
          }

          @media (max-width: 620px) {
            .leaderboard-page {
              padding: 16px;
            }

            .leaderboard-personal-card {
              position: sticky;
              top: 0;
              z-index: 2;
            }
          }
        `}
      </style>

      <div className="leaderboard-page">
        {dataNotice && (
          <div style={{
            ...cardStyle,
            padding: '13px 15px',
            background: COLORS.amberSoft,
            borderColor: '#F4C77E',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}>
            <AlertCircle size={17} color={COLORS.amberDark} style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#412402', marginBottom: '3px' }}>
                Mode data terbatas
              </div>
              <div style={{ fontSize: '12px', lineHeight: 1.5, color: '#6F4B13' }}>
                {dataNotice}
              </div>
            </div>
          </div>
        )}

        <section className="leaderboard-hero-grid" aria-label="Ringkasan leaderboard">
          {currentRankedUser && (
            <PersonalRankCard user={currentRankedUser} nextUser={nextUser} />
          )}

          <div className="leaderboard-side-stack">
            <div style={{ ...cardStyle, padding: '20px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
                marginBottom: '16px',
              }}>
                <div>
                  <div style={{ fontSize: '17px', fontWeight: '700', color: COLORS.ink }}>
                    {isPersonalFallback ? 'Ringkasan performa' : 'Top performers'}
                  </div>
                  <div style={{ fontSize: '12px', color: COLORS.muted, marginTop: '4px' }}>
                    {isPersonalFallback
                      ? 'Data publik belum tersedia, jadi kartu ini memakai profilmu.'
                      : 'Tiga learner dengan XP tertinggi saat ini'}
                  </div>
                </div>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '14px',
                  background: COLORS.amberSoft,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Medal size={21} color={COLORS.amberDark} />
                </div>
              </div>

              <div
                className="leaderboard-podium-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: topUsers.length === 1
                    ? "1fr"
                    : topUsers.length === 2
                    ? "1fr 1fr"
                    : "repeat(3, 1fr)",
                  gap: "16px",
                }}
              >
                {topUsers.map(user => (
                  <PodiumCard key={user.uid} user={user} />
                ))}
              </div>
            </div>

            {currentRankedUser && (
            <div
              style={{
                ...cardStyle,
                padding: '20px',
                borderRadius: '20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '14px',
                }}
              >
                <Trophy size={18} color={COLORS.primary} />
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: COLORS.ink,
                  }}
                >
                  Statistik Kamu
                </span>
              </div>

              <div
                className="leaderboard-insights-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: '12px',
                }}
              >
                <MetricPill
                  icon={Star}
                  label="Total XP"
                  value={`${currentRankedUser.xp}`}
                  color={COLORS.amberDark}
                  bg={COLORS.amberSoft}
                />
                <MetricPill
                  icon={Flame}
                  label="Streak aktif"
                  value={`${currentRankedUser.streak} hari`}
                  color={COLORS.green}
                  bg={COLORS.greenSoft}
                />
                <MetricPill
                  icon={Target}
                  label="Mapel aktif"
                  value={`${currentRankedUser.subjects?.length ?? 0}`}
                  color={COLORS.primary}
                  bg={COLORS.primarySoft}
                />
              </div>
            </div>
          )}
          </div>
        </section>

        <section className="leaderboard-insights-grid" aria-label="Insight leaderboard">
          <InsightCard
            icon={Target}
            label="Target berikutnya"
            value={nextUser && currentRankedUser ? `${Math.max(nextUser.xp - currentRankedUser.xp + 1, 0)} XP` : 'Top rank'}
            detail={nextUser ? `Untuk melewati ${nextUser.name} di #${nextUser.rank}.` : 'Pertahankan posisi dengan quest rutin.'}
            color={COLORS.primary}
            bg={COLORS.primarySoft}
          />
          <InsightCard
            icon={TrendingUp}
            label="Rata-rata XP"
            value={`${averageXp} XP`}
            detail="Bandingkan progresmu dengan ritme seluruh leaderboard."
            color={COLORS.green}
            bg={COLORS.greenSoft}
          />
          <InsightCard
            icon={Minus}
            label="Aktivitas terakhir"
            value={currentRankedUser ? formatLastActive(currentRankedUser.lastActiveDate) : '-'}
            detail="Ayo tetap belajar terus!."
            color={COLORS.muted}
            bg={COLORS.canvas}
          />
        </section>

        <section style={{ ...cardStyle, padding: '18px' }} aria-label="Daftar leaderboard">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            marginBottom: '14px',
          }}>
            <div>
              <div style={{ fontSize: '17px', fontWeight: '700', color: COLORS.ink }}>
                Full leaderboard
              </div>
              <div style={{ fontSize: '12px', color: COLORS.muted, marginTop: '4px' }}>
                {isPersonalFallback
                  ? 'Mode personal menampilkan barismu sampai izin baca leaderboard publik tersedia.'
                  : 'Urut berdasarkan total XP. Barismu selalu diberi sorotan.'}
              </div>
            </div>
            <button
              onClick={() => setReloadKey(key => key + 1)}
              style={{
                border: `1px solid ${COLORS.border}`,
                background: 'white',
                borderRadius: '12px',
                padding: '9px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                color: COLORS.primary,
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                flexShrink: 0,
              }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          <div className="leaderboard-table-scroll">
            <div className="leaderboard-table-head" style={{
              minWidth: '780px',
              display: 'grid',
              gridTemplateColumns: '64px minmax(190px, 1.5fr) 96px 110px 110px 130px',
              gap: '12px',
              padding: '0 14px 9px',
              color: COLORS.softMuted,
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
            }}>
              <div>Rank</div>
              <div>Nama</div>
              <div>Level</div>
              <div>XP</div>
              <div>Streak</div>
              <div>Aktif</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', minWidth: '780px' }}>
              {leaderboardRows.map(user => (
                <LeaderboardRow
                  key={user.uid}
                  user={user}
                  isCurrentUser={user.uid === currentUser?.uid}
                />
              ))}
            </div>
          </div>

          {enrichedUsers.length > leaderboardRows.length && (
            <div style={{
              marginTop: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              fontSize: '12px',
              color: COLORS.muted,
            }}>
              <ChevronRight size={14} color={COLORS.primary} />
              Menampilkan top 8 dan posisi terdekat kamu agar daftar tetap mudah dipindai.
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
