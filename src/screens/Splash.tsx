import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '../context/StoreContext';
import Logo from '../components/Logo';

export default function Splash() {
  const navigate = useNavigate();
  const { user, isAuthReady } = useStore();
  const [timePassed, setTimePassed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimePassed(true);
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (timePassed && isAuthReady) {
      if (user) {
        navigate('/home');
      } else {
        navigate('/welcome');
      }
    }
  }, [timePassed, isAuthReady, user, navigate]);

  return (
    <div className="bg-[#080C14] text-on-background font-body h-screen w-full flex flex-col items-center justify-center overflow-hidden relative">
      <div className="absolute inset-0 bg-splash-glow pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-8">
          <Logo size="lg" animated={true} />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center"
        >
          <h1 className="font-syne font-bold text-[32px] text-[#EFF3FB] tracking-tight leading-none mb-2">
            FocusFlow
          </h1>
          <p className="font-body text-[14px] text-[#8A97B0] font-medium tracking-wide">
            Focus. Track. Conquer.
          </p>
        </motion.div>
      </div>

      <div className="absolute bottom-20 w-full max-w-[240px] px-4 flex flex-col items-center">
        <div className="w-full h-[2px] bg-surface-container-highest rounded-full overflow-hidden">
          <div className="loading-pulse h-full bg-primary-container shadow-[0_0_10px_rgba(80,143,248,0.8)] rounded-full mx-auto"></div>
        </div>
        <div className="mt-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8A97B0]/40">
            Initializing Environment
          </span>
        </div>
      </div>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-12 left-12 w-24 h-[1px] bg-gradient-to-r from-primary/20 to-transparent"></div>
        <div className="absolute top-12 left-12 h-24 w-[1px] bg-gradient-to-b from-primary/20 to-transparent"></div>
        <div className="absolute bottom-12 right-12 w-24 h-[1px] bg-gradient-to-l from-primary/10 to-transparent"></div>
        <div className="absolute bottom-12 right-12 h-24 w-[1px] bg-gradient-to-t from-primary/10 to-transparent"></div>
      </div>
    </div>
  );
}
