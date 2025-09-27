import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import 'react-toastify/dist/ReactToastify.css';
import App from './App.jsx';
import { AuthProvider } from './components/core/Auth.jsx';
import { SiteProvider } from './context/SiteContext.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Retry once on failure
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// Wrapper component to ensure proper context initialization
const AppWrapper = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SiteProvider>
        <AuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </SiteProvider>
    </QueryClientProvider>
  );
};

createRoot(document.getElementById('root')).render(<AppWrapper />);
