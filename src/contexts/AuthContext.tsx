import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { setCookie } from '@/lib/cookies';
import { 
  AUTH_TOKEN_KEY, 
  AUTH_EXPIRES_AT_KEY,
  isAuthenticated as checkIsAuthenticated,
  logout as authLogout,
  getAuth
} from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useQueryParams } from '@/hooks/use-query-params';
import { logQueryParams, hasValidUuid } from '@/utils/query-params';
import { BASE_URL } from '@/lib/config';

interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface IframeLoginResponse {
  data: string;
  token: string;
  redirect: string;
  cookie_session: string;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => checkIsAuthenticated());
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { getUuid, getAllParams } = useQueryParams();
  const attemptedRef = useRef(false);
  const [iframeLoginFailed, setIframeLoginFailed] = useState(false);

  // Log query parameters on mount
  useEffect(() => {
    const allParams = getAllParams();
    logQueryParams(allParams);
  }, [getAllParams]);

  const isInIframe = () => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return false;
    }
  };

  const performLogin = async (uuid: string) => {
    try {
      setIsLoading(true);
      
      const loginRes = await fetch(`${BASE_URL}/auth/iframeLogin?uuid=${uuid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!loginRes.ok) {
        const text = await loginRes.text();
        throw new Error(text || "Login gagal");
      }

      const data = (await loginRes.json()) as IframeLoginResponse;

      if (data.redirect) {
        window.location.href = data.redirect;
        return;
      }

      const expiresAt = Date.now() + 3600 * 1000;

      setCookie(AUTH_TOKEN_KEY, data.data, {
        expires: new Date(expiresAt), 
        path: "/",
        sameSite: "None",
        secure: true,
      });

      setCookie(AUTH_EXPIRES_AT_KEY, String(expiresAt), {
        expires: new Date(expiresAt), 
        path: "/",
        sameSite: "None",
        secure: true,
      });

      toast({
        title: "Login berhasil",
        description: "Selamat datang",
        variant: "success",
      });

      setIsAuthenticated(true);
    } catch (error) {
      setIframeLoginFailed(true);
      toast({
        title: "Login gagal",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const login = () => {
    setIsAuthenticated(true);
  };

  const logout = () => {
    authLogout();
    setIsAuthenticated(false);
  };

  // Auto redirect to login on app start
  useEffect(() => {
    if (location.pathname === '/' && !isAuthenticated) {
      navigate({ pathname: "/login", search: location.search }, { replace: true });
    }
  }, [location.pathname, location.search, navigate, isAuthenticated]);

  // Sync state with actual authentication status
  useEffect(() => {
    const actualAuthStatus = checkIsAuthenticated();
    if (actualAuthStatus !== isAuthenticated) {
      setIsAuthenticated(actualAuthStatus);
    }
  }, [isAuthenticated]);

  // Auto-logout when token expires & Auto-login for iframe/uuid
  useEffect(() => {
    let timer: number | undefined;

    // Set up auto-logout timer
    if (isAuthenticated) {
      const { expiresAt } = getAuth();
      const ms = expiresAt - Date.now();
      if (ms > 0) {
        timer = window.setTimeout(() => {
          logout();
        }, ms);
      } else if (ms <= 0) {
        logout();
      }
    }

    // Auto-login for iframe or UUID
    const queryUuid = getUuid();
    if (!isAuthenticated && !attemptedRef.current && !iframeLoginFailed) {
      if (hasValidUuid(queryUuid)) {
        attemptedRef.current = true;
        performLogin(queryUuid!);
      } else if (!queryUuid) {
        // Only show error if user is trying to access protected routes with params
        const hasParams = Object.keys(getAllParams()).length > 0;
        if (hasParams) {
          toast({
            title: "Tidak ditemukan UUID",
            description: "UUID harus terdaftar",
            variant: "destructive",
          });
        }
      }
    }

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [isAuthenticated, iframeLoginFailed, getUuid]);

  const value: AuthContextType = {
    isAuthenticated,
    login,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};