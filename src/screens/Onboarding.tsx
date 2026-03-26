import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, setUser, showToast, isAuthReady } = useStore();
  
  const [name, setName] = useState(user?.name || '');
  const [dream, setDream] = useState(user?.dream !== 'Crack the exam' ? user?.dream || '' : '');
  const [examDate, setExamDate] = useState(user?.examDate || '');
  const [examName, setExamName] = useState('JEE Mains');
  const [hours, setHours] = useState(user?.targetHours || 4);

  // Update state when user loads
  useEffect(() => {
    if (user) {
      if (!name) setName(user.name || '');
      if (!dream && user.dream !== 'Crack the exam') setDream(user.dream || '');
      if (!examDate) setExamDate(user.examDate || '');
      if (hours === 4 && user.targetHours) setHours(user.targetHours);
    }
  }, [user]);

  const handleNext = () => {
    if (!name.trim()) {
      showToast("Please enter your name", "error");
      return;
    }
    
    if (user) {
      setUser({
        ...user,
        name,
        dream: dream || 'Achieve Greatness',
        examDate: examDate || new Date().toISOString().split('T')[0],
        targetHours: hours
      });
      navigate('/home');
    } else if (isAuthReady) {
      // If auth is ready but no user, they shouldn't be here
      navigate('/login');
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="loading-pulse w-12 h-12 bg-primary rounded-full"></div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen flex flex-col px-6 pt-12 pb-8 bg-surface text-on-surface font-body overflow-x-hidden">
      <div className="fixed top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -z-10 rounded-full"></div>
      <div className="fixed bottom-0 left-0 w-80 h-80 bg-tertiary/5 blur-[120px] -z-10 rounded-full"></div>

      <header className="mb-10 space-y-1">
        <h1 className="font-display font-extrabold text-[26px] leading-tight text-on-surface tracking-tight">
          Apne baare mein batao 👋
        </h1>
        <p className="font-body text-[13px] text-outline">
          Sirf ek baar setup karo
        </p>
      </header>

      <div className="flex gap-2 mb-10 h-1">
        <div className="h-full w-full rounded-full bg-primary-container"></div>
        <div className="h-full w-full rounded-full bg-primary-container"></div>
        <div className="h-full w-full rounded-full bg-surface-container-highest"></div>
      </div>

      <section className="flex-grow space-y-8">
        <div className="relative group">
          <label className="block font-mono text-[11px] uppercase tracking-widest text-tertiary-fixed mb-2 ml-1">Tera naam kya hai?</label>
          <div className="relative">
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Kumar" 
              className="w-full bg-surface-container-low border-none rounded-xl px-4 py-4 text-on-surface placeholder:text-outline/40 focus:ring-2 focus:ring-primary/50 transition-all outline-none"
            />
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline/30">person</span>
          </div>
        </div>

        <div className="relative group bg-surface-container-high rounded-2xl p-5 border border-outline-variant/10 shadow-xl overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none">
            <span className="material-symbols-outlined text-8xl">lightbulb</span>
          </div>
          <label className="block font-mono text-[11px] uppercase tracking-widest text-tertiary-fixed mb-3">Tera bada sapna kya hai? 💭</label>
          <textarea 
            rows={2} 
            value={dream}
            onChange={(e) => setDream(e.target.value)}
            placeholder="e.g. Cracking IIT Bombay or becoming a Space Scientist" 
            className="w-full bg-surface-container-lowest border-none rounded-lg px-4 py-3 text-on-surface placeholder:text-outline/40 focus:ring-1 focus:ring-tertiary/30 transition-all resize-none italic outline-none"
          ></textarea>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block font-mono text-[11px] uppercase tracking-widest text-outline ml-1">Exam ki date? 📅</label>
            <input 
              type="date" 
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-xl px-4 py-4 text-on-surface focus:ring-2 focus:ring-primary/50 transition-all [color-scheme:dark] outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="block font-mono text-[11px] uppercase tracking-widest text-outline ml-1">Exam ka naam? 🎯</label>
            <select 
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-xl px-4 py-4 text-on-surface focus:ring-2 focus:ring-primary/50 transition-all appearance-none outline-none"
            >
              <option>JEE Mains</option>
              <option>JEE Advanced</option>
              <option>NEET</option>
              <option>CUET</option>
              <option>Board Exams</option>
            </select>
          </div>
        </div>

        <div className="space-y-6 pt-2">
          <div className="flex justify-between items-end">
            <label className="block font-mono text-[11px] uppercase tracking-widest text-tertiary-fixed ml-1">Roz kitna padhna hai? ⏱️</label>
            <span className="font-mono text-xl font-bold text-tertiary-fixed-dim">
              {hours.toString().padStart(2, '0')}<span className="text-xs font-normal ml-1">HRS/DAY</span>
            </span>
          </div>
          <div className="relative px-2">
            <input 
              type="range" 
              min="1" 
              max="12" 
              value={hours}
              onChange={(e) => setHours(parseInt(e.target.value))}
              className="w-full h-1.5 bg-surface-container-highest rounded-full appearance-none cursor-pointer accent-tertiary shadow-inner"
              style={{
                background: `linear-gradient(to right, var(--color-tertiary) ${(hours - 1) * 100 / 11}%, var(--color-surface-container-highest) ${(hours - 1) * 100 / 11}%)`
              }}
            />
            <div className="flex justify-between mt-4 text-[10px] font-mono text-outline/50 px-1">
              <span>1H</span>
              <span>4H</span>
              <span>8H</span>
              <span>12H</span>
            </div>
          </div>
          <div className="bg-surface-container-low rounded-xl p-3 flex items-center gap-3 border-l-4 border-tertiary">
            <span className="material-symbols-outlined text-tertiary">info</span>
            <p className="text-[12px] text-on-surface-variant leading-relaxed">
              Consistency is key. {hours} hours/day leads to <span className="text-tertiary-fixed-dim font-bold">{hours * 7} hours</span> of focus this week!
            </p>
          </div>
        </div>
      </section>

      <footer className="mt-12">
        <button 
          onClick={handleNext}
          className="group w-full bg-gradient-to-br from-primary to-primary-container text-on-primary-container font-headline font-bold py-5 rounded-2xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(80,143,248,0.3)] active:scale-95 transition-all"
        >
          Next
          <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </button>
        <p className="text-center mt-6 text-[11px] font-mono text-outline/40 uppercase tracking-[0.2em]">
          Secure & Private • FocusFlow Cloud
        </p>
      </footer>
    </main>
  );
}
