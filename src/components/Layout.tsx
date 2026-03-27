import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import GlobalHeaderMenu from './GlobalHeaderMenu';
import { useStore } from '../context/StoreContext';
import { clsx } from 'clsx';
import { AnimatePresence, motion } from 'motion/react';
import React, { Component, ErrorInfo, ReactNode, useEffect, useRef } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class MyErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      try {
        if (this.state.error?.message) {
          const parsedError = JSON.parse(this.state.error.message);
          if (parsedError.error) {
            errorMessage = parsedError.error;
          }
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-surface p-6 text-center">
          <span className="material-symbols-outlined text-6xl text-error mb-4">error</span>
          <h1 className="font-syne font-bold text-2xl text-on-surface mb-2">Oops! Something went wrong.</h1>
          <p className="font-body text-on-surface-variant mb-6 max-w-md">
            {errorMessage}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

const NotificationManager = () => {
  const { user, subjects, focusHistory } = useStore();
  const notifiedSlots = useRef<Set<string>>(new Set());
  const notifiedStreak = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.notificationsEnabled || !('Notification' in window)) return;

    const checkNotifications = () => {
      if (Notification.permission !== 'granted') return;

      const now = new Date();
      const currentHour = now.getHours().toString().padStart(2, '0');
      const currentMinute = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${currentHour}:${currentMinute}`;
      const todayStr = now.toISOString().split('T')[0];

      // Check Streak Minimum Hours
      const minMins = user.minimumDailyMinutes || 0;
      if (minMins > 0) {
        const todayMins = focusHistory[todayStr] || 0;
        if (todayMins >= minMins && notifiedStreak.current !== todayStr) {
          new Notification("🔥 Streak Maintained!", {
            body: `Awesome! You've completed your minimum ${minMins} minutes of study today. Your streak is safe!`,
            icon: '/vite.svg'
          });
          notifiedStreak.current = todayStr;
        }
      }

      // Check Study Slots
      if (user.studySlots && user.studySlots.length > 0) {
        user.studySlots.forEach(slot => {
          if (slot.startTime === currentTime) {
            const slotKey = `${todayStr}-${slot.id}`;
            if (!notifiedSlots.current.has(slotKey)) {
              const subject = subjects.find(s => s.id === slot.subjectId);
              const subjectName = subject ? subject.name : 'Study';
              
              new Notification(`📚 Time to study: ${subjectName}`, {
                body: `Your study slot for ${subjectName} has started (${slot.startTime} - ${slot.endTime}). Let's focus!`,
                icon: '/vite.svg'
              });
              
              notifiedSlots.current.add(slotKey);
            }
          }
        });
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkNotifications, 30000);
    checkNotifications(); // Check immediately on mount

    return () => clearInterval(interval);
  }, [user, subjects, focusHistory]);

  return null;
};

export default function Layout() {
  const { toasts, removeToast, isOffline } = useStore();

  return (
    <MyErrorBoundary>
      <NotificationManager />
      <GlobalHeaderMenu />
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow">
          <Outlet />
        </div>
        <BottomNav />

        {/* Offline Indicator */}
        <AnimatePresence>
          {isOffline && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[90] bg-surface-container-highest/90 backdrop-blur-md border border-outline-variant/30 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 pointer-events-none"
            >
              <span className="material-symbols-outlined text-tertiary text-sm">wifi_off</span>
              <span className="font-label text-xs uppercase tracking-wider text-on-surface-variant">Zen Mode (Offline)</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast Container */}
        <div className="fixed top-20 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4">
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                className={clsx(
                  "pointer-events-auto px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 max-w-sm w-full border backdrop-blur-md",
                  toast.type === 'success' ? "bg-tertiary-container/90 text-on-tertiary-container border-tertiary/20" :
                  toast.type === 'error' ? "bg-error-container/90 text-on-error-container border-error/20" :
                  "bg-surface-container-highest/90 text-on-surface border-outline-variant/20"
                )}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
                </span>
                <p className="font-body text-sm flex-1">{toast.message}</p>
                <button 
                  onClick={() => removeToast(toast.id)}
                  className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </MyErrorBoundary>
  );
}
