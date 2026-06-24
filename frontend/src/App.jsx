import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import Sidebar from './components/Layout/Sidebar';
import Navbar from './components/Layout/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/LeadsPage';
import LeadDetailPage from './pages/LeadDetailPage';
import ProposalsPage from './pages/ProposalsPage';
import OutreachPage from './pages/OutreachPage';
import AnalyticsPage from './pages/AnalyticsPage';

const AdminLayout = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.remove('loading');
  }, [location.pathname]);

  return (
    <>
      <Navbar />
      <Sidebar />
      <div className="app-content content">
        <div className="content-wrapper">
          <div className="content-wrapper-before"></div>
          <div className="content-body">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

const App = () => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <div className="spinner-border text-info" role="status">
        <span className="sr-only">Loading...</span>
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
