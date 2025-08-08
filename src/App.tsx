import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { EditLicense } from "./pages/EditLicense";
import { getAuth, isAuthenticated, logout as authLogout } from "@/lib/auth";

const queryClient = new QueryClient();

interface ProtectedRouteProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
}

const ProtectedRoute = ({ children, isAuthenticated }: ProtectedRouteProps) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => isAuthenticated());

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    authLogout();
    setIsLoggedIn(false);
  };

  // Auto-logout saat token kadaluarsa
  useEffect(() => {
    let timer: number | undefined;

    if (isLoggedIn) {
      const { expiresAt } = getAuth();
      const ms = expiresAt - Date.now();
      if (ms > 0) {
        timer = window.setTimeout(() => {
          handleLogout();
        }, ms);
      } else if (ms <= 0) {
        handleLogout();
      }
    }

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [isLoggedIn]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={!isLoggedIn ? <Login onLogin={handleLogin} /> : <Navigate to="/" replace />} />
            <Route
              path="/"
              element={
                <ProtectedRoute isAuthenticated={isLoggedIn}>
                  <Dashboard onLogout={handleLogout} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit/:uuid"
              element={
                <ProtectedRoute isAuthenticated={isLoggedIn}>
                  <EditLicense />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
