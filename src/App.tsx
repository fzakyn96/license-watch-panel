import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts';
import { AppLayout, AppRoutes } from '@/components';

const queryClient = new QueryClient();

const App: React.FC = () => {
  const isDev = import.meta.env.VITE_ISDEV === "true";
  const baseName = isDev ? "/lisa" : "/lisa/";
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        basename={baseName}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AuthProvider>
          <AppLayout>
            <AppRoutes />
          </AppLayout>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
