import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Zap, ClipboardList, Trophy,
  BarChart2, User, Settings, BookOpen, LogOut,
} from 'lucide-react';

const NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/quest', label: 'Daily Quest', icon: Zap },
  { path: '/mock', label: 'Mock Test', icon: ClipboardList },
  { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { path: '/stats', label: 'Statistik', icon: BarChart2 },
];

const BOTTOM_NAV = [
  { path: '/profile', label: 'Profil', icon: User },
  { path: '/settings', label: 'Pengaturan', icon: Settings },
];

export default function Sidebar() {
  const { userProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const initials = userProfile?.name
    ? userProfile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  async function handleLogout() {
    await signOut(auth);
    navigate('/login');
  }

  function NavItem({ path, label, icon: Icon }: { path: string; label: string; icon: typeof BookOpen }) {
    const active = location.pathname === path;
    return (
      <Link to={path} style={{ textDecoration: 'none' }}>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '9px 12px', borderRadius: '10px', marginBottom: '2px',
            background: active ? '#EEEDFE' : 'transparent',
            color: active ? '#26215C' : '#888780',
            fontSize: '13px', fontWeight: active ? '600' : '400',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (!active) (e.currentTarget.style.background = '#F7F6FF'); }}
          onMouseLeave={e => { if (!active) (e.currentTarget.style.background = 'transparent'); }}
        >
          <Icon size={17} color={active ? '#7F77DD' : '#B4B2A9'} />
          {label}
        </div>
      </Link>
    );
  }

  return (
    <div style={{
      width: '220px', flexShrink: 0, background: 'white',
      borderRight: '1px solid #EDE9FE', display: 'flex',
      flexDirection: 'column', height: '100%',
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 18px', borderBottom: '1px solid #EDE9FE',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '10px',
          background: '#7F77DD', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <BookOpen size={18} color="white" strokeWidth={2} />
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#26215C' }}>EduQuest</div>
          <div style={{ fontSize: '11px', color: '#B4B2A9' }}>UTBK Prep</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        {NAV.map(item => <NavItem key={item.path} {...item} />)}
        <div style={{ height: '1px', background: '#EDE9FE', margin: '10px 4px' }} />
        {BOTTOM_NAV.map(item => <NavItem key={item.path} {...item} />)}
      </nav>

      {/* User + logout */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid #EDE9FE' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%', background: '#EEEDFE',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: '700', color: '#7F77DD', flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '12px', fontWeight: '600', color: '#26215C',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {userProfile?.name || 'User'}
            </div>
            <div style={{ fontSize: '11px', color: '#B4B2A9' }}>
              Level {userProfile?.level ?? 1}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '8px', borderRadius: '8px',
            border: '1px solid #EDE9FE', background: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            fontSize: '12px', color: '#888780', cursor: 'pointer',
            fontFamily: 'Plus Jakarta Sans, sans-serif', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#FFF0EE'; e.currentTarget.style.color = '#D85A30'; e.currentTarget.style.borderColor = '#F0997B'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#888780'; e.currentTarget.style.borderColor = '#EDE9FE'; }}
        >
          <LogOut size={13} /> Keluar
        </button>
      </div>
    </div>
  );
}