import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setCookie } from "@/lib/cookies";
import { AUTH_TOKEN_KEY, AUTH_NAME_KEY, AUTH_GROUP_KEY, AUTH_EXPIRES_AT_KEY } from "@/lib/auth";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { EditLicense } from "./pages/EditLicense";
import { AddLicense } from "./pages/AddLicense";
import LicensePrices from "./pages/LicensePrices";
import { getAuth, isAuthenticated, logout as authLogout } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";


const queryClient = new QueryClient();

interface LoginFormProps {
  onLogin: () => void;
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
}

type LoginResponse = {
  data: string;
};

const ProtectedRoute = ({ children, isAuthenticated }: ProtectedRouteProps) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => isAuthenticated());
  const { toast } = useToast();


  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    authLogout();
    setIsLoggedIn(false);
  };

  const isInIframe = () => {
    try {
      return window.self !== window.top;
    } catch (e) {
      console.log(e);
    }
  };

  const loginIframe = async ({ onLogin }: LoginFormProps) => {
    const createRes = await fetch(`${import.meta.env.VITE_BASE_URL}/iframe-client/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        "site_name": "https://google.com",
        "is_revoked": false,
        // "redirect": "https://digio.pgn.co.id/digio" //jika diisi dari button
      })
    });

    if (!createRes.ok) {
      throw new Error("Gagal membuat iframe client");
    }

    const createData = await createRes.json();
    const uuid = createData.data.uuid;

    if (!uuid) {
      throw new Error("UUID tidak ditemukan dalam response");
    }

    // Iframe login flow: Step 2 - Login with UUID
    const loginRes = await fetch(`${import.meta.env.VITE_BASE_URL}/auth/iframeLogin?uuid=${uuid}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!loginRes.ok) {
      const text = await loginRes.text();
      throw new Error(text || "Iframe login gagal");
    }

    const data = (await loginRes.json()) as LoginResponse;
    console.log(data.data);

    const expiresAt = Date.now() + 3600 * 1000; // epoch ms

    // Simpan semua nilai response ke cookie
    setCookie(AUTH_TOKEN_KEY, data.data, { expires: new Date(expiresAt), path: "/" });
    // setCookie(AUTH_NAME_KEY, data.name, { expires: new Date(expiresAt), path: "/" });
    // setCookie(AUTH_GROUP_KEY, data.group, { expires: new Date(expiresAt), path: "/" });
    // setCookie(AUTH_EXPIRES_AT_KEY, String(expiresAt), { expires: new Date(expiresAt), path: "/" });

    toast({
      title: "Login berhasil",
      description: `Selamat datang,`,
      variant: "success",
    });

    onLogin();
  }

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

    if (isInIframe()) {
      loginIframe({ onLogin: handleLogin });
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
            <Route path="/add" element={
              <ProtectedRoute isAuthenticated={isLoggedIn}>
                <AddLicense />
              </ProtectedRoute>
            } />
            <Route path="/prices" element={
              <ProtectedRoute isAuthenticated={isLoggedIn}>
                <LicensePrices onLogout={handleLogout} />
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
