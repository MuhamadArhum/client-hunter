import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/layout/MainLayout';

const Dashboard   = lazy(() => import('@/pages/Dashboard'));
const Leads       = lazy(() => import('@/pages/Leads'));
const LeadDetail  = lazy(() => import('@/pages/LeadDetail'));
const Proposals   = lazy(() => import('@/pages/Proposals'));
const Outreach    = lazy(() => import('@/pages/Outreach'));
const Analytics   = lazy(() => import('@/pages/Analytics'));
const Profile     = lazy(() => import('@/pages/Profile'));
const SettingsPage = lazy(() => import('@/pages/Settings'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const Login       = lazy(() => import('@/pages/auth/Login'));
const SignUp      = lazy(() => import('@/pages/auth/SignUp'));
const NotFound    = lazy(() => import('@/pages/NotFound'));

function Splash() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

function PrivateRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Splash />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function GuestRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Splash />;
  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
}

export default function App() {
  return (
    <Suspense fallback={<Splash />}>
      <Routes>
        {/* Private routes */}
        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/leads/:id" element={<LeadDetail />} />
            <Route path="/proposals" element={<Proposals />} />
            <Route path="/outreach" element={<Outreach />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/notifications" element={<Notifications />} />
          </Route>
        </Route>

        {/* Guest routes */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/sign-up" element={<SignUp />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
