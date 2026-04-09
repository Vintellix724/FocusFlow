import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen flex flex-col overflow-hidden">
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-6 h-20">
        <div className="flex gap-2 items-center">
          <div className="h-1.5 w-8 rounded-full bg-primary shadow-[0_0_10px_rgba(172,199,255,0.5)]"></div>
          <div className="h-1.5 w-2 rounded-full bg-surface-container-highest"></div>
          <div className="h-1.5 w-2 rounded-full bg-surface-container-highest"></div>
        </div>
        <button 
          onClick={() => navigate('/login')}
          className="font-label text-sm uppercase tracking-widest text-outline hover:text-on-surface transition-colors font-medium"
        >
          Skip
        </button>
      </header>

      <main className="flex-1 flex flex-col pt-20">
        <div className="flex-1 relative flex items-center justify-center px-8 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-primary/10 blur-[100px] rounded-full"></div>
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-tertiary/10 blur-[80px] rounded-full"></div>
          
          <div className="relative z-10 w-full max-w-sm aspect-square flex items-center justify-center">
            <Logo size="xl" animated={true} />
          </div>
        </div>

        <section className="w-full glass-card rounded-t-[2.5rem] p-8 pb-12 neon-glow-primary relative">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1 bg-outline-variant/30 rounded-full"></div>
          <div className="max-w-md mx-auto space-y-6 text-center">
            <h1 className="font-syne text-4xl sm:text-5xl whitespace-nowrap leading-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-tertiary to-secondary font-black drop-shadow-sm pb-2 w-full">
              Welcome ✨
            </h1>
            <p className="font-body text-base sm:text-lg leading-relaxed text-on-surface-variant">
              Your journey to better focus starts here.
            </p>
            
            <div className="pt-6">
              <button 
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-br from-primary to-primary-container h-16 rounded-xl flex items-center justify-center gap-3 shadow-[0_8px_24px_rgba(80,143,248,0.3)] hover:shadow-[0_8px_32px_rgba(80,143,248,0.4)] active:scale-[0.98] transition-all group"
              >
                <span className="font-headline font-bold text-on-primary-container text-lg">Get Started</span>
                <span className="material-symbols-outlined text-on-primary-container group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </div>
            
            <div className="flex items-center justify-center gap-2 pt-2">
              <span className="h-1.5 w-1.5 rounded-full bg-tertiary shadow-[0_0_8px_#38dfab]"></span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-outline">System Ready: Initializing Flow</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
