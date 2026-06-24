import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import Sidebar from './components/Layout/Sidebar';
import AdminNavbar from './components/Layout/AdminNavbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/LeadsPage';
import LeadDetailPage from './pages/LeadDetailPage';
import ProposalsPage from './pages/ProposalsPage';
import OutreachPage from './pages/OutreachPage';
import AnalyticsPage from './pages/AnalyticsPage';

const AdminLayout = ({ children }) => (
  <>
    <Sidebar />
    <div className="relative md:ml-64 bg-blueGray-100 min-h-screen">
      {/* Dark header band — navbar sits on top of this */}
      <div className="relative bg-indigo-900 pt-16 pb-32">
        <AdminNavbar />
      </div>
      {/* Content pulled up to overlap with dark band */}
      <div className="px-4 md:px-10 mx-auto w-full -mt-24 pb-8">
        {children}
      </div>
    </div>
  </>
);

const App = () => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-blueGray-100">
      <div className="text-center">
        <div className="text-3xl font-bold text-blueGray-700 mb-2"><span className="text-violet-500">Abyte</span>Hunt</div>
        <p className="text-blueGray-400 text-sm">Loading...</p>
      </div>
    </div>
  );

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><AdminLayout><DashboardPage /></AdminLayout></ProtectedRoute>} />
      <Route path="/leads" element={<ProtectedRoute><AdminLayout><LeadsPage /></AdminLayout></ProtectedRoute>} />
      <Route path="/leads/:id" element={<ProtectedRoute><AdminLayout><LeadDetailPage /></AdminLayout></ProtectedRoute>} />
      <Route path="/proposals" element={<ProtectedRoute><AdminLayout><ProposalsPage /></AdminLayout></ProtectedRoute>} />
      <Route path="/outreach" element={<ProtectedRoute><AdminLayout><OutreachPage /></AdminLayout></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AdminLayout><AnalyticsPage /></AdminLayout></ProtectedRoute>} />
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
