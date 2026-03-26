import { useNavigate } from 'react-router-dom';

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
          
          <div className="relative z-10 w-full max-w-sm aspect-square">
            <div className="w-full h-full flex items-center justify-center">
              <div className="relative">
                <div className="w-48 h-64 bg-gradient-to-t from-surface-container-high to-surface-container-lowest rounded-3xl overflow-hidden border border-outline-variant/20 flex items-center justify-center relative">
                  <span className="material-symbols-outlined text-8xl text-primary/40" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                  
                  <div className="absolute top-8 -right-4 w-16 h-16 bg-tertiary-container/30 rounded-xl rotate-12 flex items-center justify-center blur-[1px]">
                    <span className="material-symbols-outlined text-tertiary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
                  </div>
                  <div className="absolute -top-4 -left-6 w-12 h-12 bg-primary-container/20 rounded-full flex items-center justify-center blur-[1px]">
                    <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  </div>
                  <div className="absolute bottom-12 -left-8 w-20 h-20 bg-secondary-container/20 rounded-2xl -rotate-12 flex items-center justify-center blur-[1px]">
                    <span className="material-symbols-outlined text-secondary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                  </div>
                </div>
              </div>
            </div>
            <img 
              alt="Student surrounded by glowing books and digital stars" 
              className="absolute inset-0 w-full h-full object-contain mix-blend-screen opacity-80" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyvwBeEMgf-8AQ_p3b4p0XaKfOG4JV57rLvUxqs59b86skLpbY1YC34iVrZtE6TARcIOC0B_CqZC_y99_QsOoaXMn5a-Z8otg-iSeVLCzCNJfi8qh7FpYa44KeoEoyAYHUe4okBfEti5uRjZtj47hwTG91jNNFzDrH_vyS3N7tdcnNP58Li16xhcwghsfcXeFZDfCDMvZJn3NTPQv1sXnImWdVNG6T3XouqcAkVw2OydoBNkr0tRDjsH4YKrIQn6FW2rpr1yAOcvId"
            />
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
