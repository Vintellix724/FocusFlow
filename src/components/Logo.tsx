import React from 'react';
import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
}

export default function Logo({ size = 'md', animated = false }: LogoProps) {
  const sizeClasses = {
    sm: 'w-10 h-10 rounded-xl',
    md: 'w-16 h-16 rounded-2xl',
    lg: 'w-20 h-20 rounded-[1.25rem]',
    xl: 'w-24 h-24 rounded-[1.5rem]',
  };

  const containerProps = animated ? {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { type: 'spring' as const, damping: 15, stiffness: 150, delay: 0.2 }
  } : {};

  return (
    <div className="relative flex flex-col items-center">
      {animated ? (
        <motion.div {...containerProps} className="relative">
          {/* Outer Glow */}
          <div className="absolute inset-0 bg-primary/40 blur-2xl rounded-full scale-[1.6]"></div>
          
          {/* Main Logo Box */}
          <div className={`${sizeClasses[size]} relative bg-gradient-to-br from-primary via-[#4A72FF] to-tertiary flex items-center justify-center shadow-[0_10px_40px_rgba(80,143,248,0.5)] border border-white/20 overflow-hidden`}>
            
            {/* Glass Reflection */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/40"></div>
            
            {/* Inner Shape / Icon */}
            <div className="relative flex items-center justify-center w-full h-full">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[60%] h-[60%] drop-shadow-lg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#paint0_linear)" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="paint0_linear" x1="12" y1="2" x2="12" y2="12" gradientUnits="userSpaceOnUse">
                    <stop stopColor="white" stopOpacity="0.9"/>
                    <stop offset="1" stopColor="white" stopOpacity="0.2"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="relative">
          {/* Outer Glow */}
          <div className="absolute inset-0 bg-primary/40 blur-2xl rounded-full scale-[1.6]"></div>
          
          {/* Main Logo Box */}
          <div className={`${sizeClasses[size]} relative bg-gradient-to-br from-primary via-[#4A72FF] to-tertiary flex items-center justify-center shadow-[0_10px_40px_rgba(80,143,248,0.5)] border border-white/20 overflow-hidden`}>
            
            {/* Glass Reflection */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/40"></div>
            
            {/* Inner Shape / Icon */}
            <div className="relative flex items-center justify-center w-full h-full">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[60%] h-[60%] drop-shadow-lg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#paint0_linear)" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="paint0_linear" x1="12" y1="2" x2="12" y2="12" gradientUnits="userSpaceOnUse">
                    <stop stopColor="white" stopOpacity="0.9"/>
                    <stop offset="1" stopColor="white" stopOpacity="0.2"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
