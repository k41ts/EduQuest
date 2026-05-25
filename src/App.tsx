import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  return currentUser ? <>{children}</> : <Navigate to="/login" replace />;
}

function SectionPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <ProtectedRoute>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#EEEDFE',
        padding: '24px',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      }}>
        <div style={{
          maxWidth: '480px',
          width: '100%',
          background: 'white',
          borderRadius: '20px',
          padding: '28px',
          border: '1px solid #EDE9FE',
          boxShadow: '0 16px 40px rgba(38, 33, 92, 0.08)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#26215C', marginBottom: '8px' }}>
            {title}
          </div>
          <div style={{ fontSize: '14px', color: '#888780', lineHeight: 1.6 }}>
            {description}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function AppRedirect() {
  const { currentUser } = useAuth();
  return <Navigate to={currentUser ? '/dashboard' : '/login'} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/quest" element={<SectionPlaceholder title="Daily Quest" description="Halaman ini sedang disiapkan." />} />
          <Route path="/mock" element={<SectionPlaceholder title="Mock Test" description="Halaman ini sedang disiapkan." />} />
          <Route path="/leaderboard" element={<SectionPlaceholder title="Leaderboard" description="Halaman ini sedang disiapkan." />} />
          <Route path="/stats" element={<SectionPlaceholder title="Statistik" description="Halaman ini sedang disiapkan." />} />
          <Route path="/profile" element={<SectionPlaceholder title="Profil" description="Halaman ini sedang disiapkan." />} />
          <Route path="/settings" element={<SectionPlaceholder title="Pengaturan" description="Halaman ini sedang disiapkan." />} />
          <Route path="*" element={<AppRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;