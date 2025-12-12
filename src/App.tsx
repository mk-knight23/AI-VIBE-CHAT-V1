import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PWAInstaller, useServiceWorker } from "@/components/PWAInstaller";
import { AccessibilityProvider, SkipToContent } from "@/components/AccessibilityProvider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import { analytics } from "@/lib/analytics";
import { security } from "@/lib/security";

// Initialize React Query client with optimized configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Refetch on window focus
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * PWA Update Notification Component
 *
 * Handles the display and logic for Progressive Web App update notifications.
 * When a new service worker is available, prompts the user to update.
 */
function PWAUpdateNotification() {
  const { updateAvailable, updateServiceWorker } = useServiceWorker();

  useEffect(() => {
    if (updateAvailable) {
      // Track PWA update availability
      analytics.trackPWAEvent('update_available');
      
      // Show update notification with user confirmation
      const shouldUpdate = window.confirm(
        'A new version of CHUTES AI Chat is available. Would you like to update now?'
      );
      
      if (shouldUpdate) {
        // Track user acceptance of update
        analytics.trackPWAEvent('update_accepted');
        updateServiceWorker();
      } else {
        // Track user dismissal of update
        analytics.trackPWAEvent('update_dismissed');
      }
    }
  }, [updateAvailable, updateServiceWorker]);

  // This component doesn't render anything visible
  return null;
}

/**
 * Main Application Component
 *
 * The root component that sets up the entire application structure including:
 * - React Query for data management
 * - Tooltip provider for UI tooltips
 * - Accessibility provider for screen reader support
 * - Browser routing
 * - PWA functionality
 * - Toast notifications
 */
const App = () => {
  const { isSupported } = useServiceWorker();

  // Track app load
  useEffect(() => {
    analytics.trackEvent({
      name: 'app_loaded',
      category: 'engagement',
      label: 'main_app'
    });
  }, []);

  // Initialize security features
  useEffect(() => {
    // Set up Content Security Policy
    const csp = security.generateCSP();
    if (csp) {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = csp;
      document.head.appendChild(meta);
    }

    // Clean up security resources periodically
    const cleanupInterval = setInterval(() => {
      security.cleanup();
    }, 60000); // Every minute

    return () => clearInterval(cleanupInterval);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AccessibilityProvider>
          {/* Skip to content link for accessibility */}
          <SkipToContent />
          
          {/* Toast notification systems */}
          <Toaster />
          <Sonner />
          
          {/* Main application routing */}
          <BrowserRouter>
            <Routes>
              {/* Main chat interface */}
              <Route path="/" element={<Index />} />
              
              {/* Catch-all route for 404 pages */}
              {/* Note: Add all custom routes above this catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          
          {/* Progressive Web App components */}
          {isSupported && (
            <>
              <PWAInstaller />
              <PWAUpdateNotification />
            </>
          )}
        </AccessibilityProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
