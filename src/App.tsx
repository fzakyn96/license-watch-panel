import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setCookie } from "@/lib/cookies";
import { AUTH_TOKEN_KEY, AUTH_NAME_KEY, AUTH_GROUP_KEY, AUTH_EXPIRES_AT_KEY } from "@/lib/auth";
import { useRef } from "react";
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

type IframeLoginResponse = {
  data: string;
};

const ProtectedRoute = ({ children, isAuthenticated }: ProtectedRouteProps) => {
  console.log("ProtectedRoute - isAuthenticated:", isAuthenticated);
  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  console.log("Authenticated, rendering children");
  return <>{children}</>;
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => isAuthenticated());
  const [iframeLoginFailed, setIframeLoginFailed] = useState(false);
  const { toast } = useToast();


  const handleLogin = () => {
    console.log("handleLogin called - setting isLoggedIn to true");
    console.log("Current isLoggedIn before update:", isLoggedIn);
    console.log("isAuthenticated() check:", isAuthenticated());
    setIsLoggedIn(true);
    console.log("setIsLoggedIn(true) called");
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
    try {
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

      const data = (await loginRes.json()) as IframeLoginResponse;
      console.log("Iframe login success:", data.data);

      const expiresAt = Date.now() + 3600 * 1000; // epoch ms

      // Simpan token dari iframe login response
      setCookie(AUTH_TOKEN_KEY, data.data, {
        expires: new Date(expiresAt), path: "/",
        sameSite: "None",
        secure: true,
      });
      setCookie(AUTH_EXPIRES_AT_KEY, String(expiresAt), {
        expires: new Date(expiresAt), path: "/",
        sameSite: "None",
        secure: true,
      });

      toast({
        title: "Login berhasil",
        description: `Selamat datang`,
        variant: "success",
      });

      console.log("About to call onLogin callback");
      onLogin();
      console.log("onLogin callback completed");
    } catch (error) {
      console.error("Iframe login error:", error);
      setIframeLoginFailed(true); // Prevent retry loop
      toast({
        title: "Login gagal",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat login iframe",
        variant: "destructive",
      });
    }
  }

  // Sync state with actual authentication status
  useEffect(() => {
    const actualAuthStatus = isAuthenticated();
    console.log("Auth sync check - isLoggedIn:", isLoggedIn, "actual auth:", actualAuthStatus);
    if (actualAuthStatus !== isLoggedIn) {
      console.log("Syncing isLoggedIn state with actual auth status:", actualAuthStatus);
      setIsLoggedIn(actualAuthStatus);
    }
  }, [isLoggedIn]);

  // Auto-logout saat token kadaluarsa
  const attemptedRef = useRef(false);
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

    if (isInIframe() && !isLoggedIn && !attemptedRef.current && !iframeLoginFailed) {
      attemptedRef.current = true;
      void loginIframe({ onLogin: handleLogin });
    }

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [isLoggedIn, iframeLoginFailed]);

  console.log("App render - isLoggedIn:", isLoggedIn, "isInIframe:", isInIframe());

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
