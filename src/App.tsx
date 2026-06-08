import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Quest from './pages/Quest';
import QuestResults from './pages/QuestResults';
import Seed from './pages/seed';
import Mock from './pages/Mock';
import MockSession from './pages/MockSession';
import MockResults from './pages/MockResults';

// NEW PAGES
import Leaderboard from './pages/Leaderboard';
import Statistics from './pages/Stats';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import AdminQuestions from './pages/AdminQuestions';
import AdminQuestionCreate from './pages/AdminQuestionCreate';
import AdminStats from './pages/AdminStats';
import DevSeedAdmin from './pages/DevSeedAdmin';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  return currentUser ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { currentUser, userProfile } = useAuth();
  const isAdmin = currentUser?.email === 'admin@eduquest.com' || userProfile?.email === 'admin@eduquest.com' || userProfile?.role === 'admin';
  if (!currentUser) return <Navigate to="/login" replace />;
  return isAdmin ? <>{children}</> : <Navigate to="/dashboard" replace />;
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

          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          <Route
            path="/seed"
            element={
              <ProtectedRoute>
                <Seed />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/quest"
            element={
              <ProtectedRoute>
                <Quest />
              </ProtectedRoute>
            }
          />

          <Route
            path="/quest/results"
            element={
              <ProtectedRoute>
                <QuestResults />
              </ProtectedRoute>
            }
          />

          <Route
            path="/mock"
            element={
              <ProtectedRoute>
                <Mock />
              </ProtectedRoute>
            }
          />

          <Route
            path="/mock/session"
            element={
              <ProtectedRoute>
                <MockSession />
              </ProtectedRoute>
            }
          />

          <Route
            path="/mock/results"
            element={
              <ProtectedRoute>
                <MockResults />
              </ProtectedRoute>
            }
          />

          {/* NEW ROUTES */}
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/stats"
            element={
              <ProtectedRoute>
                <Statistics />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />

          <Route path="/admin/questions" element={
            <AdminRoute>
              <AdminQuestions />
            </AdminRoute>
          } />

          <Route path="/admin/questions/new" element={
            <AdminRoute>
              <AdminQuestionCreate />
            </AdminRoute>
          } />

          <Route path="/admin/stats" element={
            <AdminRoute>
              <AdminStats />
            </AdminRoute>
          } />

          {import.meta.env.DEV && (
            <Route path="/dev/seed-admin" element={<DevSeedAdmin />} />
          )}

          <Route path="*" element={<AppRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;