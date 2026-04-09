import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../context/StoreContext';
import { clsx } from 'clsx';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export default function GlobalHeaderMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, showToast, theme, toggleTheme } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Hide the hamburger menu on screens that have their own back button or shouldn't show it
  const hideMenu = ['/timer', '/journal', '/about'].includes(location.pathname);

  const menuItems = [
    { path: '/planner', icon: 'event_note', label: 'Planner' },
    { path: '/live-study-room', icon: 'groups', label: 'Live Study Room' },
    { path: '/leaderboard', icon: 'leaderboard', label: 'Leaderboard' },
    { path: '/mock-tests', icon: 'quiz', label: 'Mock Test Add' },
    { path: '/youtube-channels', icon: 'smart_display', label: 'YouTube Channels' },
    { path: '/telegram-channels', icon: 'forum', label: 'Telegram Channels' },
    { path: '/study-apps', icon: 'apps', label: 'Study Apps' },
    { path: '/about', icon: 'info', label: 'About App' },
  ];

  if (user?.role === 'admin' || user?.email === 'abcdmt2p2@gmail.com') {
    menuItems.push({ path: '/admin', icon: 'admin_panel_settings', label: 'Admin Panel' });
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showToast("Logged out successfully", "success");
      navigate('/login');
    } catch (error) {
      showToast("Error logging out", "error");
    }
  };

  if (hideMenu) {
    return null;
  }

  return (
    <>
      <div className="fixed top-4 left-4 z-[100] flex items-center gap-2">
        <button
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 rounded-full bg-surface-container-high/60 backdrop-blur-xl border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex items-center justify-center hover:bg-surface-container-highest/80 transition-all active:scale-95 group"
        >
          <span className="material-symbols-outlined text-on-surface group-hover:text-primary transition-colors">menu</span>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[101]"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-[100dvh] w-72 bg-gradient-to-br from-surface-container-high to-surface-container-low shadow-[20px_0_40px_rgba(0,0,0,0.5)] z-[102] flex flex-col border-r border-white/5"
            >
              <div className="p-6 flex justify-between items-center border-b border-white/5 shrink-0 bg-surface-container-highest/30 backdrop-blur-md">
                <h2 className="font-syne font-bold text-xl text-on-surface tracking-tight">Menu</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
                >
                  <span className="material-symbols-outlined text-on-surface-variant">close</span>
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto py-6 px-4 flex flex-col gap-2 pb-24 custom-scrollbar">
                {menuItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-label tracking-wide group relative overflow-hidden',
                        isActive
                          ? 'bg-primary/10 text-primary font-bold border border-primary/20 shadow-[0_0_15px_rgba(79,142,247,0.1)]'
                          : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface border border-transparent hover:border-white/5'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"></div>
                        )}
                        <span className={clsx("material-symbols-outlined transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
                        {item.label}
                      </>
                    )}
                  </NavLink>
                ))}
                
                <div className="mt-4 pt-4 border-t border-white/5">
                  <button
                    onClick={toggleTheme}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-label tracking-wide text-on-surface-variant hover:bg-white/5 hover:text-on-surface border border-transparent hover:border-white/5 group"
                  >
                    <span className="material-symbols-outlined group-hover:scale-110 transition-transform duration-300">
                      {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                    </span>
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-label tracking-wide text-error hover:bg-error/10 border border-transparent hover:border-error/20 group mt-2"
                  >
                    <span className="material-symbols-outlined group-hover:scale-110 transition-transform duration-300">logout</span>
                    Logout
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
