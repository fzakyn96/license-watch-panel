import { useEffect, useState, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setCookie } from "@/lib/cookies";
import { AUTH_TOKEN_KEY, AUTH_NAME_KEY, AUTH_GROUP_KEY, AUTH_EXPIRES_AT_KEY } from "@/lib/auth";
import { useRef } from "react";
import { getAuth, isAuthenticated, logout as authLogout } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryParams } from "@/hooks/use-query-params";
import Footer from "@/components/footer";
import { useNavigate } from "react-router-dom";

// Lazy load page components for code splitting
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const EditLicense = lazy(() => import("./pages/EditLicense").then(module => ({ default: module.EditLicense })));
const AddLicense = lazy(() => import("./pages/AddLicense").then(module => ({ default: module.AddLicense })));
const LicensePrices = lazy(() => import("./pages/LicensePrices"));
const NotFound = lazy(() => import("./pages/NotFound"));


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
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Component wrapper untuk menangkap query params
const AppContent = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => isAuthenticated());
  const [iframeLoginFailed, setIframeLoginFailed] = useState(false);
  const { toast } = useToast();
  const location = useLocation();
  
  // Capture query parameters saat app pertama dijalankan
  const { getUuid, getAllParams, hasUuid } = useQueryParams();
  const navigate = useNavigate();

  // Auto redirect to base directory on app start
  useEffect(() => {
    if (location.pathname === '/' && !isLoggedIn) {
      // If user is on root path and not logged in, redirect to login
      navigate({ pathname: "/login", search: location.search }, { replace: true });
    }
  }, [location.pathname, location.search, navigate, isLoggedIn]);

  // Log semua query parameters yang terdeteksi
  useEffect(() => {
    const allParams = getAllParams();
    if (Object.keys(allParams).length > 0) {
      console.log("🔍 Query parameters terdeteksi saat app start:", allParams);
      
      // Contoh handling parameter spesifik
      if (hasUuid()) {
        console.log("📋 UUID parameter ditemukan:", getUuid());
      }
    }
  }, []);


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
    try {
      // Cek apakah ada UUID dari query parameter
      const queryUuid = getUuid();
      let uuid = queryUuid;

      if (!queryUuid) {
        // Jika tidak ada UUID dari query, buat baru seperti sebelumnya
        toast({
          title: "Tidak ditemukan UUID",
          description: "UUID Iframe harus terdaftar",
          variant: "destructive",
        })
      } else {
        console.log("🔗 Menggunakan UUID dari query parameter:", queryUuid);
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

      const data = (await loginRes.json()) as any;

      // Check if redirect and cookie_session are available
      if (data.redirect && data.cookie_session) {
        // Inject cookie from cookie_session
        const cookieEntries = data.cookie_session.split(';');
        cookieEntries.forEach((entry: string) => {
          const [name, value] = entry.trim().split('=');
          if (name && value) {
            setCookie(name, value, {
              path: "/",
              sameSite: "None",
              secure: true,
            });
          }
        });

        // Store token in session storage
        if (data.token) {
          sessionStorage.setItem('auth_token', data.token);
        }

        // Redirect to the specified page
        window.location.href = data.redirect;
        return;
      }

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

      onLogin();
    } catch (error) {
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
    if (actualAuthStatus !== isLoggedIn) {
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

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }>
          <Routes>
            <Route path='/login' element={!isLoggedIn ? <Login onLogin={handleLogin} /> : <Navigate to="/" replace />} />
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
            {/* <Route path="/lisa" element={<Navigate to="/login" replace />} /> */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
      <Footer />
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          basename={import.meta.env.VITE_BASE_NAME}
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
