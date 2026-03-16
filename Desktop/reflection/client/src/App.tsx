import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Browse from './pages/Browse';
import Profile from './pages/Profile';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background dark:bg-dark-bg"><div className="animate-pulse text-text-muted dark:text-gray-400">Loading...</div></div>;
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background dark:bg-dark-bg"><div className="animate-pulse text-text-muted dark:text-gray-400">Loading...</div></div>;
  if (!user) return <Navigate to="/" replace />;
  if (!user.onboardingComplete) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout><Login /></Layout>} />
      <Route path="/onboarding" element={<RequireAuth><Layout><Onboarding /></Layout></RequireAuth>} />
      <Route path="/browse" element={<OnboardingGate><Layout><Browse /></Layout></OnboardingGate>} />
      <Route path="/profile/:id" element={<OnboardingGate><Layout><Profile /></Layout></OnboardingGate>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
