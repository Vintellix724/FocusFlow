import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export default function BottomNav() {
  const navItems = [
    { path: '/home', icon: 'home', label: 'Home' },
    { path: '/timer', icon: 'timer', label: 'Timer' },
    { path: '/subjects', icon: 'menu_book', label: 'Subjects' },
    { path: '/analytics', icon: 'person', label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-6 w-full z-50 flex justify-center px-4 pointer-events-none">
      <nav className="bg-surface-container-high/80 backdrop-blur-2xl flex justify-around items-center px-2 py-2 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-white/10 pointer-events-auto w-full max-w-sm">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center transition-all duration-300 w-16 h-14 rounded-2xl relative group',
                isActive
                  ? 'text-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div 
                    layoutId="bottom-nav-indicator"
                    className="absolute inset-0 bg-primary/10 rounded-2xl -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span 
                  className={clsx(
                    "material-symbols-outlined transition-all duration-300",
                    isActive ? "text-2xl -translate-y-1" : "text-xl group-hover:scale-110"
                  )} 
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                <span 
                  className={clsx(
                    "font-label text-[10px] uppercase tracking-widest absolute bottom-2 transition-all duration-300",
                    isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                  )}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
