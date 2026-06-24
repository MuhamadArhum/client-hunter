import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-blueGray-100">
      <div className="text-blueGray-500 text-lg font-semibold">Loading...</div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
