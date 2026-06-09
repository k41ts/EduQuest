import type { ReactNode } from 'react';
import { useState } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

const ADMIN_NAV = [
  { path: '/admin', label: 'Dashboard' },
  { path: '/admin/questions', label: 'Questions' },
  { path: '/admin/questions/new', label: 'Generate' },
  { path: '/admin/stats', label: 'Statistics' },
];

function AdminTopbar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { userProfile } = useAuth();

  return (
    <div style={{
      height: 64,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 18px',
      background: 'rgba(255,255,255,0.84)',
      borderBottom: '1px solid rgba(127,119,221,0.12)',
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onToggle} style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          border: '1px solid #E7E3F6',
          background: 'white',
          cursor: 'pointer',
          display: 'grid',
          placeItems: 'center',
        }}>
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
        <div>
          <div style={{ fontSize: 13, color: '#726F86', fontWeight: 700 }}>Admin Console</div>
          <div style={{ fontSize: 16, color: '#1F2240', fontWeight: 800 }}>EduQuest</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          padding: '8px 12px',
          borderRadius: 999,
          background: '#F3E8FF',
          color: '#6D28D9',
          fontSize: 12,
          fontWeight: 800,
        }}>
          {userProfile?.role === 'admin' ? 'ADMIN' : 'USER'}
        </div>
      </div>
    </div>
  );
}

function AdminSidebar({ collapsed, onLogout }: { collapsed: boolean; onLogout: () => void }) {
  const location = useLocation();

  return (
    <aside style={{
      width: collapsed ? 76 : 228,
      flexShrink: 0,
      background: 'linear-gradient(180deg, #FFFFFF 0%, #FBFAFF 100%)',
      borderRight: '1px solid rgba(127,119,221,0.12)',
      transition: 'width .18s ease',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{ padding: collapsed ? '14px 10px' : '14px 14px', borderBottom: '1px solid rgba(127,119,221,0.10)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #7F77DD, #5F55D4)',
            color: 'white',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 900,
            fontSize: 13,
            flexShrink: 0,
          }}>EQ</div>
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#1F2240', lineHeight: 1.05 }}>EduQuest</div>
              <div style={{ fontSize: 11, color: '#726F86', lineHeight: 1.05, marginTop: 2 }}>Admin Workspace</div>
            </div>
          )}
        </div>
      </div>

      <nav style={{ padding: '8px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: 4, flex: 1, alignItems: 'stretch' }}>
        <div style={{ padding: '4px 10px 2px', fontSize: 10, fontWeight: 800, color: '#8B87A6', letterSpacing: '0.08em' }}>
          ADMIN
        </div>
        {ADMIN_NAV.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
              <div style={{
                height: 40,
                borderRadius: 11,
                padding: collapsed ? '0 10px' : '0 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: active ? 'linear-gradient(135deg, #F3E8FF, #EEF2FF)' : 'transparent',
                border: active ? '1px solid rgba(127,119,221,0.18)' : '1px solid transparent',
                color: active ? '#2D1E7A' : '#6B6880',
                fontSize: 12,
                fontWeight: active ? 800 : 600,
                boxShadow: active ? '0 8px 18px rgba(127,119,221,0.08)' : 'none',
              }}>
                <div style={{
                  width: 9,
                  height: 9,
                  borderRadius: 999,
                  background: active ? '#7F77DD' : '#D6D3E7',
                  flexShrink: 0,
                }} />
                {!collapsed && <span>{item.label}</span>}
              </div>
            </Link>
          );
        })}

      </nav>

      <div style={{ padding: 10, borderTop: '1px solid rgba(127,119,221,0.10)' }}>
        {!collapsed && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: '#726F86', marginBottom: 2 }}>Signed in as</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#1F2240' }}>Admin</div>
          </div>
        )}
        <button onClick={onLogout} style={{
          width: '100%',
          height: 38,
          borderRadius: 10,
          border: '1px solid #E7E3F6',
          background: 'white',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: 12,
          color: '#5F55D4',
        }}>
          {collapsed ? '↩' : 'Keluar'}
        </button>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  async function handleLogout() {
    await signOut(auth);
    window.location.href = '/login';
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      display: 'flex',
      background: '#F4F1FF',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
    }}>
      <AdminSidebar collapsed={collapsed} onLogout={handleLogout} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <AdminTopbar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
        <main style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
