import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../context/StoreContext';
import { clsx } from 'clsx';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export default function GlobalHeaderMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, showToast } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Hide the hamburger menu on screens that have their own back button or shouldn't show it
  const hideMenu = ['/timer', '/journal', '/about'].includes(location.pathname);

  const menuItems = [
    { path: '/planner', icon: 'event_note', label: 'Planner' },
    { path: '/live-study-room', icon: 'groups', label: 'Live Study Room' },
    { path: '/leaderboard', icon: 'leaderboard', label: 'Leaderboard' },
    { path: '/about', icon: 'info', label: 'About App' },
  ];

  if (user?.role === 'admin') {
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

  if (hideMenu) return null;

  return (
    <>
      <div className="fixed top-4 left-4 z-[100]">
        <button
          onClick={() => setIsOpen(true)}
          className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant/20 shadow-lg flex items-center justify-center hover:bg-surface-container-highest transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface">menu</span>
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
              className="fixed top-0 left-0 bottom-0 w-64 bg-surface-container-low shadow-2xl z-[102] flex flex-col"
            >
              <div className="p-6 flex justify-between items-center border-b border-outline-variant/10 shrink-0">
                <h2 className="font-syne font-bold text-lg text-on-surface">Menu</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors"
                >
                  <span className="material-symbols-outlined text-on-surface-variant">close</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
                {menuItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-label tracking-wide',
                        isActive
                          ? 'bg-primary/10 text-primary font-bold'
                          : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
                      )
                    }
                  >
                    <span className="material-symbols-outlined">{item.icon}</span>
                    {item.label}
                  </NavLink>
                ))}
                
                <div className="mt-4 pt-4 border-t border-outline-variant/10">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-label tracking-wide text-error hover:bg-error/10"
                  >
                    <span className="material-symbols-outlined">logout</span>
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
