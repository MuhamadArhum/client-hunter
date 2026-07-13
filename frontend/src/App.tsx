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
const Kanban        = lazy(() => import('@/pages/Kanban'));
const Sequences     = lazy(() => import('@/pages/Sequences'));
const Chat          = lazy(() => import('@/pages/Chat'));
const Login          = lazy(() => import('@/pages/auth/Login'));
const SignUp         = lazy(() => import('@/pages/auth/SignUp'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const ResetPassword  = lazy(() => import('@/pages/auth/ResetPassword'));
const NotFound       = lazy(() => import('@/pages/NotFound'));
const ProposalPublic = lazy(() => import('@/pages/ProposalPublic'));
const LoginPreview   = lazy(() => import('@/pages/auth/LoginPreview'));
const LoginV1        = lazy(() => import('@/pages/auth/LoginV1'));
const LoginV2        = lazy(() => import('@/pages/auth/LoginV2'));
const LoginV3        = lazy(() => import('@/pages/auth/LoginV3'));
const LoginV4        = lazy(() => import('@/pages/auth/LoginV4'));
const LoginV5        = lazy(() => import('@/pages/auth/LoginV5'));

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
            <Route path="/kanban" element={<Kanban />} />
            <Route path="/sequences" element={<Sequences />} />
            <Route path="/chat" element={<Chat />} />
          </Route>
        </Route>

        {/* Guest routes */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Route>

        {/* Public proposal route — no auth required */}
        <Route path="/proposal/:token" element={<ProposalPublic />} />

        {/* Login design previews — no auth required */}
        <Route path="/login-preview" element={<LoginPreview />} />
        <Route path="/login-v1" element={<LoginV1 />} />
        <Route path="/login-v2" element={<LoginV2 />} />
        <Route path="/login-v3" element={<LoginV3 />} />
        <Route path="/login-v4" element={<LoginV4 />} />
        <Route path="/login-v5" element={<LoginV5 />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
