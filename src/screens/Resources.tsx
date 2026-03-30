import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Resources() {
  const { 
    youtubeChannels, addYouTubeChannel, deleteYouTubeChannel,
    telegramChannels, addTelegramChannel, deleteTelegramChannel,
    studyApps, addStudyApp, deleteStudyApp,
    theme 
  } = useStore();

  const [activeTab, setActiveTab] = useState<'youtube' | 'telegram' | 'apps'>('youtube');
  const [isAdding, setIsAdding] = useState(false);
  
  // Form states
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [icon, setIcon] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    if (activeTab === 'youtube') {
      addYouTubeChannel({ name, url });
    } else if (activeTab === 'telegram') {
      addTelegramChannel({ name, url });
    } else if (activeTab === 'apps') {
      addStudyApp({ name, url, icon });
    }

    setName('');
    setUrl('');
    setIcon('');
    setIsAdding(false);
  };

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* Header */}
      <div className="bg-primary text-white pt-12 pb-6 px-6 rounded-b-3xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-8 -mb-8 blur-xl"></div>
        
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Study Resources</h1>
            <p className="text-primary-foreground/80 text-sm mt-1">Manage your study links</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 mt-6">
        <div className="flex bg-surface-variant rounded-xl p-1 shadow-inner">
          <button 
            onClick={() => setActiveTab('youtube')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'youtube' ? 'bg-surface text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined text-red-500 text-lg">play_circle</span>
            YouTube
          </button>
          <button 
            onClick={() => setActiveTab('telegram')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'telegram' ? 'bg-surface text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined text-blue-500 text-lg">send</span>
            Telegram
          </button>
          <button 
            onClick={() => setActiveTab('apps')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'apps' ? 'bg-surface text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined text-green-500 text-lg">apps</span>
            Apps
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-on-surface">
            {activeTab === 'youtube' && 'YouTube Channels'}
            {activeTab === 'telegram' && 'Telegram Channels'}
            {activeTab === 'apps' && 'Study Apps'}
          </h2>
          <button 
            onClick={() => setIsAdding(true)}
            className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add</span>
          </button>
        </div>

        <div className="space-y-3">
          {activeTab === 'youtube' && youtubeChannels.length === 0 && (
            <div className="text-center py-8 text-on-surface-variant">No YouTube channels added yet.</div>
          )}
          {activeTab === 'telegram' && telegramChannels.length === 0 && (
            <div className="text-center py-8 text-on-surface-variant">No Telegram channels added yet.</div>
          )}
          {activeTab === 'apps' && studyApps.length === 0 && (
            <div className="text-center py-8 text-on-surface-variant">No Study Apps added yet.</div>
          )}

          {activeTab === 'youtube' && youtubeChannels.map(channel => (
            <div key={channel.id} className="bg-surface-variant rounded-2xl p-4 flex items-center justify-between shadow-sm border border-outline/10">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-red-500">play_circle</span>
                </div>
                <div className="truncate">
                  <h3 className="font-semibold text-on-surface truncate">{channel.name}</h3>
                  <p className="text-xs text-on-surface-variant truncate">{channel.url}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <a 
                  href={channel.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
                <button 
                  onClick={() => deleteYouTubeChannel(channel.id)}
                  className="w-8 h-8 rounded-full bg-error/10 text-error flex items-center justify-center hover:bg-error/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          ))}

          {activeTab === 'telegram' && telegramChannels.map(channel => (
            <div key={channel.id} className="bg-surface-variant rounded-2xl p-4 flex items-center justify-between shadow-sm border border-outline/10">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-blue-500">send</span>
                </div>
                <div className="truncate">
                  <h3 className="font-semibold text-on-surface truncate">{channel.name}</h3>
                  <p className="text-xs text-on-surface-variant truncate">{channel.url}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <a 
                  href={channel.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
                <button 
                  onClick={() => deleteTelegramChannel(channel.id)}
                  className="w-8 h-8 rounded-full bg-error/10 text-error flex items-center justify-center hover:bg-error/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          ))}

          {activeTab === 'apps' && studyApps.map(app => (
            <div key={app.id} className="bg-surface-variant rounded-2xl p-4 flex items-center justify-between shadow-sm border border-outline/10">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 text-xl">
                  {app.icon || '📱'}
                </div>
                <div className="truncate">
                  <h3 className="font-semibold text-on-surface truncate">{app.name}</h3>
                  <p className="text-xs text-on-surface-variant truncate">{app.url}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <a 
                  href={app.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
                <button 
                  onClick={() => deleteStudyApp(app.id)}
                  className="w-8 h-8 rounded-full bg-error/10 text-error flex items-center justify-center hover:bg-error/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface w-full max-w-sm rounded-3xl p-6 shadow-xl"
            >
              <h2 className="text-xl font-bold text-on-surface mb-4">
                Add {activeTab === 'youtube' ? 'YouTube Channel' : activeTab === 'telegram' ? 'Telegram Channel' : 'Study App'}
              </h2>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1">Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-surface-variant border-none rounded-xl p-3 text-on-surface focus:ring-2 focus:ring-primary outline-none"
                    placeholder="e.g. Codecademy"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1">URL / Link</label>
                  <input 
                    type="url" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full bg-surface-variant border-none rounded-xl p-3 text-on-surface focus:ring-2 focus:ring-primary outline-none"
                    placeholder="https://..."
                    required
                  />
                </div>
                {activeTab === 'apps' && (
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant mb-1">Icon (Emoji)</label>
                    <input 
                      type="text" 
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      className="w-full bg-surface-variant border-none rounded-xl p-3 text-on-surface focus:ring-2 focus:ring-primary outline-none"
                      placeholder="e.g. 📚"
                      maxLength={2}
                    />
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-3 rounded-xl font-medium text-on-surface-variant bg-surface-variant hover:bg-outline/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 rounded-xl font-medium text-white bg-primary hover:bg-primary/90 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
