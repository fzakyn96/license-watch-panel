import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { getAuth, isAuthenticated, logout as authLogout } from "@/lib/auth";

const queryClient = new QueryClient();

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
        {isLoggedIn ? (
          <Dashboard onLogout={handleLogout} />
        ) : (
          <Login onLogin={handleLogin} />
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
