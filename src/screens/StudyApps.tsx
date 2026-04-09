import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { motion } from 'motion/react';

export default function StudyApps() {
  const { studyApps, addStudyApp, deleteStudyApp, theme, toggleTheme } = useStore();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [icon, setIcon] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    
    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    addStudyApp({ name: name.trim(), url: finalUrl, icon: icon.trim() });
    setName('');
    setUrl('');
    setIcon('');
  };

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* Header */}
      <header className="bg-surface-container-highest pt-12 pb-6 px-6 rounded-b-[2rem] shadow-sm relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="font-syne font-bold text-3xl text-on-surface">Study Apps</h1>
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-on-surface shadow-sm"
          >
            <span className="material-symbols-outlined">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>
        <p className="font-body text-on-surface-variant">Quick access to your study tools and websites.</p>
      </header>

      <div className="px-6 mt-6 max-w-2xl mx-auto">
        {/* Add Form */}
        <form onSubmit={handleAdd} className="bg-surface-container p-4 rounded-2xl mb-8 shadow-sm border border-outline-variant/20">
          <h2 className="font-syne font-bold text-lg text-on-surface mb-4">Add App/Website</h2>
          <div className="space-y-4">
            <div>
              <label className="block font-label text-xs uppercase tracking-wider text-on-surface-variant mb-1">App Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Notion, Quizlet"
                className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 font-body text-on-surface focus:outline-none focus:border-primary transition-colors"
                required
              />
            </div>
            <div>
              <label className="block font-label text-xs uppercase tracking-wider text-on-surface-variant mb-1">Website URL</label>
              <input 
                type="text" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 font-body text-on-surface focus:outline-none focus:border-primary transition-colors"
                required
              />
            </div>
            <div>
              <label className="block font-label text-xs uppercase tracking-wider text-on-surface-variant mb-1">Icon/Category (Optional)</label>
              <input 
                type="text" 
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="e.g., 📚 or Productivity"
                className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 font-body text-on-surface focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-primary text-on-primary font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">add</span>
              Add App
            </button>
          </div>
        </form>

        {/* App List */}
        <div className="space-y-4">
          {studyApps.length === 0 ? (
            <div className="text-center py-12 bg-surface-container rounded-2xl border border-outline-variant/20 border-dashed">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/50 mb-2">apps</span>
              <p className="font-body text-on-surface-variant">No apps added yet.</p>
            </div>
          ) : (
            studyApps.map((app) => (
              <motion.div 
                key={app.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface-container p-4 rounded-2xl flex items-center justify-between gap-4 shadow-sm border border-outline-variant/20"
              >
                {app.icon && (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl shrink-0">
                    {app.icon}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-syne font-bold text-on-surface truncate">{app.name}</h3>
                  <p className="font-body text-sm text-on-surface-variant truncate">{app.url}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a 
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                    title="Open App"
                  >
                    <span className="material-symbols-outlined">open_in_new</span>
                  </a>
                  <button 
                    onClick={() => deleteStudyApp(app.id)}
                    className="w-10 h-10 rounded-full bg-error/10 text-error flex items-center justify-center hover:bg-error/20 transition-colors"
                    title="Delete App"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
