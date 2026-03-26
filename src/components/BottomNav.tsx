import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';

export default function BottomNav() {
  const navItems = [
    { path: '/home', icon: 'home', label: 'Home' },
    { path: '/timer', icon: 'timer', label: 'Timer' },
    { path: '/subjects', icon: 'menu_book', label: 'Subjects' },
    { path: '/analytics', icon: 'person', label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-50 bg-slate-950/90 backdrop-blur-2xl flex justify-around items-center px-4 pb-6 pt-3 rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.4)] border-t border-slate-800/50 overflow-x-auto">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            clsx(
              'flex flex-col items-center justify-center transition-all active:translate-y-0.5 duration-150 min-w-[60px]',
              isActive
                ? 'text-blue-400 bg-blue-500/10 rounded-xl px-2 py-1 shadow-[0_0_15px_rgba(79,142,247,0.2)]'
                : 'text-slate-500 grayscale hover:text-blue-300'
            )
          }
        >
          <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>
            {item.icon}
          </span>
          <span className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest mt-1">
            {item.label}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}
