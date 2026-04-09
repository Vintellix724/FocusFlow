import React, { useState } from 'react';
import { clsx } from 'clsx';
import { useStore } from '../context/StoreContext';

export default function Subjects() {
  const { user, subjects, addSubject, deleteSubject, topics, addTopic, deleteTopic, toggleTopicStatus, showToast } = useStore();
  const [activeTab, setActiveTab] = useState<string>('all');
  
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState('primary');
  const [newSubjectTarget, setNewSubjectTarget] = useState(2); // in hours
  
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicSubject, setNewTopicSubject] = useState(subjects[0]?.id || '');
  const [newTopicTarget, setNewTopicTarget] = useState(1); // in hours

  const [subjectToDelete, setSubjectToDelete] = useState<{id: string, name: string} | null>(null);

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    const currentTotalSubjectMinutes = subjects.reduce((acc, sub) => acc + (sub.targetMinutes || 0), 0);
    const userTargetMinutes = (user?.targetHours || 6) * 60;
    const newSubjectMinutes = newSubjectTarget * 60;

    if (currentTotalSubjectMinutes + newSubjectMinutes > userTargetMinutes) {
      showToast(`Cannot exceed your daily goal of ${user?.targetHours || 6} hours. You have ${(userTargetMinutes - currentTotalSubjectMinutes) / 60} hours left to allocate.`, 'error');
      return;
    }

    addSubject({
      name: newSubjectName,
      color: newSubjectColor,
      targetMinutes: newSubjectMinutes
    });
    setNewSubjectName('');
    setNewSubjectTarget(2);
    setShowAddSubject(false);
    showToast(`Subject "${newSubjectName}" added`, 'success');
  };

  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim() || !newTopicSubject) return;
    addTopic({
      title: newTopicTitle,
      subjectId: newTopicSubject,
      targetMinutes: newTopicTarget * 60
    });
    setNewTopicTitle('');
    setNewTopicTarget(2);
    setShowAddTopic(false);
    showToast(`Topic "${newTopicTitle}" added`, 'success');
  };

  const handleDeleteSubject = (id: string, name: string) => {
    setSubjectToDelete({ id, name });
  };

  const confirmDeleteSubject = () => {
    if (subjectToDelete) {
      deleteSubject(subjectToDelete.id);
      showToast(`${subjectToDelete.name} deleted`, 'info');
      if (activeTab === subjectToDelete.id) setActiveTab('all');
      setSubjectToDelete(null);
    }
  };

  const getSubjectStats = (subjectId: string) => {
    const subjectTopics = topics.filter(t => t.subjectId === subjectId);
    const totalTopics = subjectTopics.length;
    const completedTopics = subjectTopics.filter(t => t.status === 'Completed').length;
    
    const subject = subjects.find(s => s.id === subjectId);
    
    // Calculate time spent: use subject.timeSpent if available, otherwise fallback to sum of topics
    // If subject.timeSpent exists, it might be higher than topics sum if they studied without a topic
    // But if we just added this feature, we should ensure it's at least the sum of topics
    const topicsTimeSpent = subjectTopics.reduce((acc, t) => acc + t.timeSpent, 0);
    const timeSpent = Math.max(subject?.timeSpent || 0, topicsTimeSpent);
    
    const targetMinutes = subject?.targetMinutes || 1;
    const progress = Math.min(100, Math.round((timeSpent / targetMinutes) * 100));
    
    return { totalTopics, completedTopics, timeSpent, progress, targetMinutes };
  };

  const formatTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen pb-32">
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl pl-16 pr-6 py-4 border-b border-outline-variant/10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="font-syne font-bold text-2xl text-on-surface">Subjects</h1>
        </div>
        
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          <button
            onClick={() => setActiveTab('all')}
            className={clsx(
              "px-4 py-2 rounded-full font-label text-xs uppercase tracking-widest whitespace-nowrap transition-all",
              activeTab === 'all' 
                ? "bg-primary text-on-primary shadow-[0_0_15px_rgba(172,199,255,0.3)]" 
                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
            )}
          >
            All
          </button>
          {subjects.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "px-4 py-2 rounded-full font-label text-xs uppercase tracking-widest whitespace-nowrap transition-all",
                activeTab === tab.id 
                  ? `bg-${tab.color} text-on-${tab.color} shadow-[0_0_15px_rgba(var(--color-${tab.color}),0.3)]` 
                  : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
              )}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </header>

      <main className="p-6 space-y-6">
        <div className="flex gap-3 mb-6">
          <button 
            onClick={() => setShowAddSubject(true)}
            className="flex-1 bg-surface-container-high border border-outline-variant/20 py-3 rounded-xl flex items-center justify-center gap-2 text-primary font-bold hover:bg-surface-container-highest transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Add Subject
          </button>
          <button 
            onClick={() => {
              if (subjects.length === 0) {
                showToast("Please add a subject first", "error");
                setShowAddSubject(true);
              } else {
                setNewTopicSubject(activeTab !== 'all' ? activeTab : subjects[0].id);
                setShowAddTopic(true);
              }
            }}
            className="flex-1 bg-primary text-on-primary py-3 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined">post_add</span>
            Add Topic
          </button>
        </div>

        <div className="grid gap-4">
          {subjects.filter(s => activeTab === 'all' || s.id === activeTab).map((subject) => {
            const stats = getSubjectStats(subject.id);
            return (
              <div key={subject.id} className="bg-surface-container-high rounded-2xl p-5 border border-outline-variant/10 relative overflow-hidden group hover:border-outline-variant/30 transition-colors">
                <div className={clsx(
                  "absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full -z-10 opacity-20 group-hover:opacity-40 transition-opacity",
                  `bg-${subject.color}`
                )}></div>
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      `bg-${subject.color}/10 text-${subject.color}`
                    )}>
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {subject.name.toLowerCase().includes('phys') ? 'science' : subject.name.toLowerCase().includes('chem') ? 'experiment' : subject.name.toLowerCase().includes('math') ? 'calculate' : 'book'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-syne font-bold text-lg">{subject.name}</h3>
                        {stats.progress >= 100 && (
                          <span className="bg-tertiary/20 text-tertiary text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-bold">
                            Completed
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                        {stats.completedTopics} / {stats.totalTopics} Topics
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteSubject(subject.id, subject.name)}
                    className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center hover:bg-error/20 hover:text-error transition-colors"
                  >
                    <span className="material-symbols-outlined text-on-surface-variant text-sm hover:text-error">delete</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center font-mono text-[10px] uppercase text-on-surface-variant">
                    <span>{formatTime(stats.timeSpent)} / {formatTime(stats.targetMinutes)}</span>
                    <span className={clsx(
                      "font-bold",
                      `text-${subject.color}`
                    )}>{stats.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container-lowest rounded-full overflow-hidden">
                    <div 
                      className={clsx(
                        "h-full rounded-full transition-all duration-1000",
                        `bg-${subject.color}`
                      )} 
                      style={{ width: `${stats.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
          {subjects.length === 0 && (
            <div className="text-center py-8 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-50">menu_book</span>
              <p>No subjects yet. Add one to get started!</p>
            </div>
          )}
        </div>

        <section className="mt-8">
          <h2 className="font-label text-sm uppercase tracking-widest text-on-surface-variant mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">format_list_bulleted</span>
            Topics & Chapters
          </h2>
          <div className="space-y-3">
            {topics.filter(t => activeTab === 'all' || t.subjectId === activeTab).map((topic) => {
              const subject = subjects.find(s => s.id === topic.subjectId);
              if (!subject) return null;
              
              return (
                <div key={topic.id} className="bg-surface-container-low p-4 rounded-xl flex items-center justify-between border border-outline-variant/10 hover:bg-surface-container-high transition-colors">
                  <div className="flex items-center gap-3 flex-grow">
                    <button 
                      onClick={() => toggleTopicStatus(topic.id)}
                      className={clsx(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0",
                        topic.status === 'Completed' ? `bg-${subject.color} border-${subject.color}` : "border-outline-variant/50 hover:border-outline"
                      )}
                    >
                      {topic.status === 'Completed' && <span className={clsx("material-symbols-outlined text-[14px] font-bold", `text-on-${subject.color}`)}>check</span>}
                    </button>
                    <div className="flex-grow">
                      <h4 className={clsx("font-syne font-bold text-sm transition-all", topic.status === 'Completed' && "line-through text-on-surface-variant")}>{topic.title}</h4>
                      <p className="font-mono text-[10px] text-on-surface-variant uppercase">
                        {subject.name} • {formatTime(topic.timeSpent)} / {formatTime(topic.targetMinutes)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={clsx(
                      "font-label text-[10px] uppercase px-2 py-1 rounded-md border hidden sm:inline-block",
                      topic.status === 'Completed' ? 'bg-tertiary/10 text-tertiary border-tertiary/20' : 
                      topic.status === 'In Progress' ? 'bg-primary/10 text-primary border-primary/20' : 
                      'bg-surface-container-highest text-on-surface-variant border-outline-variant/20'
                    )}>
                      {topic.status}
                    </span>
                    <button 
                      onClick={() => deleteTopic(topic.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-error/10 hover:text-error transition-colors text-on-surface-variant"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
            {topics.filter(t => activeTab === 'all' || t.subjectId === activeTab).length === 0 && (
              <div className="text-center py-8 text-on-surface-variant bg-surface-container-low rounded-xl border border-outline-variant/10">
                <p>No topics found. Add a chapter or subtopic!</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Add Subject Modal */}
      {showAddSubject && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowAddSubject(false)}></div>
          <div 
            className="bg-surface-container-high w-full max-w-md rounded-3xl p-6 border border-outline-variant/20 shadow-2xl relative z-10"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-syne font-bold text-xl text-on-surface">Add New Subject</h2>
              <button onClick={() => setShowAddSubject(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddSubject} className="space-y-4">
              <div>
                <label className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2">Subject Name</label>
                <input 
                  type="text" 
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2">Theme Color</label>
                <div className="flex gap-3">
                  {['primary', 'secondary', 'tertiary', 'error'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewSubjectColor(color)}
                      className={clsx(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                        `bg-${color}`,
                        newSubjectColor === color ? "ring-2 ring-offset-2 ring-offset-surface-container-high ring-on-surface" : "opacity-70 hover:opacity-100"
                      )}
                    >
                      {newSubjectColor === color && <span className="material-symbols-outlined text-on-primary text-sm">check</span>}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2">Target Time (Hours)</label>
                <input 
                  type="number" 
                  min="1"
                  value={newSubjectTarget}
                  onChange={(e) => setNewSubjectTarget(parseInt(e.target.value) || 1)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>
              <button type="submit" className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl mt-4 hover:bg-primary/90 transition-colors">
                Add Subject
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Topic Modal */}
      {showAddTopic && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm" onClick={() => setShowAddTopic(false)}></div>
          <div 
            className="bg-surface-container-high w-full max-w-md rounded-3xl p-6 border border-outline-variant/20 shadow-2xl relative z-10"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-syne font-bold text-xl text-on-surface">Add New Topic/Chapter</h2>
              <button onClick={() => setShowAddTopic(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddTopic} className="space-y-4">
              <div>
                <label className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2">Topic Title</label>
                <input 
                  type="text" 
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  placeholder="e.g. Thermodynamics"
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2">Subject</label>
                <select 
                  value={newTopicSubject}
                  onChange={(e) => setNewTopicSubject(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors appearance-none"
                  required
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2">Target Time (Hours)</label>
                <input 
                  type="number" 
                  min="1"
                  value={newTopicTarget}
                  onChange={(e) => setNewTopicTarget(parseInt(e.target.value) || 1)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>
              <button type="submit" className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl mt-4 hover:bg-primary/90 transition-colors">
                Add Topic
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Subject Confirmation Modal */}
      {subjectToDelete && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setSubjectToDelete(null)}></div>
          <div 
            className="bg-surface-container-high w-full max-w-sm rounded-3xl p-6 border border-outline-variant/20 shadow-2xl text-center relative z-10"
          >
            <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">warning</span>
            </div>
            <h2 className="font-syne font-bold text-xl text-on-surface mb-2">Delete {subjectToDelete.name}?</h2>
            <p className="text-on-surface-variant text-sm mb-6">
              Are you sure you want to delete this subject? All associated topics and progress will be permanently lost.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setSubjectToDelete(null)}
                className="flex-1 bg-surface-container-highest text-on-surface-variant font-bold py-3 rounded-xl hover:bg-surface-container-highest/80 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteSubject}
                className="flex-1 bg-error text-on-error font-bold py-3 rounded-xl hover:bg-error/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
