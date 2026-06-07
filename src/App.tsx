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
import Mock from './pages/mock';
import MockSession from './pages/MockSession';
import MockResults from './pages/MockResults';

// NEW PAGES
import Leaderboard from './pages/Leaderboard';
import Statistics from './pages/Stats';
import Profile from './pages/Profile';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  return currentUser ? <>{children}</> : <Navigate to="/login" replace />;
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

          <Route path="*" element={<AppRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;