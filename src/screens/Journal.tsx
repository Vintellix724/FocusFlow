import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useStore } from '../context/StoreContext';

export default function Journal() {
  const navigate = useNavigate();
  const { addJournalEntry, showToast, theme, toggleTheme } = useStore();
  const [entry, setEntry] = useState('');
  const [mood, setMood] = useState<'great' | 'good' | 'okay' | 'bad' | null>(null);

  const moods = [
    { id: 'great', icon: 'sentiment_very_satisfied', label: 'Great', color: 'tertiary' },
    { id: 'good', icon: 'sentiment_satisfied', label: 'Good', color: 'primary' },
    { id: 'okay', icon: 'sentiment_neutral', label: 'Okay', color: 'secondary' },
    { id: 'bad', icon: 'sentiment_dissatisfied', label: 'Bad', color: 'error' },
  ];

  const handleSave = () => {
    if (entry.trim() && mood) {
      addJournalEntry({
        text: entry,
        mood: mood
      });
      showToast("Journal entry saved!", "success");
      navigate(-1);
    }
  };

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen flex flex-col pb-32">
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
          </button>
          <h1 className="font-syne font-bold text-2xl text-on-surface">Daily Reflection</h1>
        </div>
        <button 
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors"
          title="Toggle Theme"
        >
          <span className="material-symbols-outlined text-on-surface-variant">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
      </header>

      <main className="flex-grow p-6 space-y-8">
        <section>
          <h2 className="font-label text-sm uppercase tracking-widest text-on-surface-variant mb-4">How are you feeling today?</h2>
          <div className="flex justify-between gap-2">
            {moods.map((m) => (
              <button
                key={m.id}
                onClick={() => setMood(m.id as any)}
                className={clsx(
                  "flex-1 flex flex-col items-center justify-center py-4 rounded-2xl border transition-all duration-200",
                  mood === m.id 
                    ? `bg-${m.color}/10 border-${m.color}/50 shadow-[0_4px_20px_rgba(var(--color-${m.color}),0.2)]` 
                    : "bg-surface-container-high border-outline-variant/10 hover:bg-surface-container-highest"
                )}
              >
                <span className={clsx(
                  "material-symbols-outlined text-3xl mb-2 transition-transform",
                  mood === m.id ? `text-${m.color} scale-110` : "text-on-surface-variant"
                )} style={{ fontVariationSettings: "'FILL' 1" }}>
                  {m.icon}
                </span>
                <span className={clsx(
                  "font-label text-[10px] uppercase tracking-widest",
                  mood === m.id ? `text-${m.color} font-bold` : "text-on-surface-variant"
                )}>{m.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="flex-grow flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-label text-sm uppercase tracking-widest text-on-surface-variant">What's on your mind?</h2>
            <span className="font-mono text-[10px] text-on-surface-variant">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
          <div className="flex-grow relative bg-surface-container-low rounded-3xl border border-outline-variant/10 overflow-hidden shadow-inner flex flex-col min-h-[300px]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-tertiary opacity-30"></div>
            <textarea
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              placeholder="Write down your thoughts, struggles, or wins for the day..."
              className="flex-grow w-full bg-transparent resize-none p-6 text-on-surface placeholder:text-outline/40 focus:outline-none font-body text-[15px] leading-relaxed"
            ></textarea>
            
            <div className="p-4 border-t border-outline-variant/10 flex justify-between items-center bg-surface-container-highest/50 backdrop-blur-md">
              <div className="flex gap-2">
                <button 
                  onClick={() => showToast("Image upload coming soon!", "info")}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-[20px]">image</span>
                </button>
                <button 
                  onClick={() => showToast("Voice recording coming soon!", "info")}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-[20px]">mic</span>
                </button>
              </div>
              <span className="font-mono text-[10px] text-outline/50">{entry.length} chars</span>
            </div>
          </div>
        </section>

        <section className="bg-primary-container/10 border border-primary/20 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 blur-2xl rounded-full"></div>
          <div className="flex items-start gap-4 relative z-10">
            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>tips_and_updates</span>
            <div>
              <h3 className="font-syne font-bold text-sm text-on-surface mb-1">Prompt of the Day</h3>
              <p className="font-body text-sm text-on-surface-variant italic">"What was the most challenging concept you encountered today, and how did you overcome it?"</p>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-24 left-0 w-full px-6 z-40">
        <button 
          onClick={handleSave}
          disabled={!entry.trim() || !mood}
          className={clsx(
            "w-full py-4 rounded-2xl font-headline font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-lg",
            entry.trim() && mood 
              ? "bg-gradient-to-r from-primary to-primary-container text-on-primary-container hover:shadow-[0_8px_30px_rgba(80,143,248,0.4)] active:scale-[0.98]" 
              : "bg-surface-container-highest text-outline/50 cursor-not-allowed"
          )}
        >
          Save Entry
          <span className="material-symbols-outlined text-[20px]">save</span>
        </button>
      </div>
    </div>
  );
}
