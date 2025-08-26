import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts';
import { ProtectedRoute } from './ProtectedRoute';

// Lazy load page components for code splitting
const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const EditLicense = lazy(() => import("@/pages/EditLicense").then(module => ({ default: module.EditLicense })));
const AddLicense = lazy(() => import("@/pages/AddLicense").then(module => ({ default: module.AddLicense })));
const LicensePrices = lazy(() => import("@/pages/LicensePrices"));
const NotFound = lazy(() => import("@/pages/NotFound"));

export const AppRoutes: React.FC = () => {
  const { isAuthenticated, login, logout } = useAuth();

  return (
    <Routes>
      <Route 
        path='/login' 
        element={!isAuthenticated ? <Login onLogin={login} /> : <Navigate to="/" replace />} 
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard onLogout={logout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/edit/:uuid"
        element={
          <ProtectedRoute>
            <EditLicense />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/add" 
        element={
          <ProtectedRoute>
            <AddLicense />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/prices" 
        element={
          <ProtectedRoute>
            <LicensePrices onLogout={logout} />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};