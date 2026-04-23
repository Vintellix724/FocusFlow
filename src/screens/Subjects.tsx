import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { useStore } from '../context/StoreContext';

export default function Subjects() {
  const { user, subjects, addSubject, deleteSubject, topics, addTopic, deleteTopic, toggleTopicStatus, reviewTopic, addSubTopic, deleteSubTopic, reviewSubTopic, showToast } = useStore();
  const [activeTab, setActiveTab] = useState<string>('all');
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isCalendarMinimized, setIsCalendarMinimized] = useState(true);

  const formatDateLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const selectedDateStr = formatDateLocal(selectedDate);
  const filteredTopics = topics.filter(t => !t.date || t.date === selectedDateStr);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const jumpToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonth(today);
  };

  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState('primary');
  const [newSubjectTarget, setNewSubjectTarget] = useState(2); // in hours
  
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicSubject, setNewTopicSubject] = useState(subjects[0]?.id || '');
  const [newTopicTarget, setNewTopicTarget] = useState(1); // in hours

  const [showAddSubTopic, setShowAddSubTopic] = useState(false);
  const [newSubTopicTitle, setNewSubTopicTitle] = useState('');
  const [newSubTopicParentId, setNewSubTopicParentId] = useState('');

  const [newSubTopicTarget, setNewSubTopicTarget] = useState(0); // in minutes, optional

  const [subjectToDelete, setSubjectToDelete] = useState<{id: string, name: string} | null>(null);
  const [topicToReview, setTopicToReview] = useState<{id: string, title: string, isSubTopic?: boolean, parentId?: string} | null>(null);

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

  const handleTopicClick = (topic: any, isSubTopic = false, parentId?: string) => {
    if (topic.status === 'Completed') {
      // If already completed, just toggle back to in-progress
      if (isSubTopic && parentId) {
        showToast("Sub-topic already completed", "info");
      } else {
        toggleTopicStatus(topic.id);
      }
    } else {
      // If completing it, prompt for review rating
      setTopicToReview({ id: topic.id, title: topic.title, isSubTopic, parentId });
    }
  };

  const handleReviewSubmit = (rating: 'Hard' | 'Good' | 'Easy') => {
    if (topicToReview) {
      if (topicToReview.isSubTopic && topicToReview.parentId) {
        reviewSubTopic(topicToReview.parentId, topicToReview.id, rating);
      } else {
        reviewTopic(topicToReview.id, rating);
      }
      setTopicToReview(null);
    }
  };

  const handleAddSubTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubTopicTitle.trim() || !newSubTopicParentId) return;
    addSubTopic(newSubTopicParentId, newSubTopicTitle, newSubTopicTarget > 0 ? newSubTopicTarget : undefined);
    setNewSubTopicTitle('');
    setNewSubTopicTarget(0);
    setShowAddSubTopic(false);
    showToast(`Sub-topic added`, 'success');
  };

  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim() || !newTopicSubject) return;
    addTopic({
      title: newTopicTitle,
      subjectId: newTopicSubject,
      targetMinutes: newTopicTarget * 60,
      date: selectedDateStr
    });
    setNewTopicTitle('');
    setNewTopicTarget(2);
    setShowAddTopic(false);
    showToast(`Topic "${newTopicTitle}" added for ${selectedDate.toLocaleDateString()}`, 'success');
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
    const dailyTopics = filteredTopics.filter(t => t.subjectId === subjectId);
    const totalTopics = dailyTopics.length;
    const completedTopics = dailyTopics.filter(t => t.status === 'Completed').length;
    
    const subject = subjects.find(s => s.id === subjectId);
    
    // Calculate global time spent for the top-level subject progress
    const allSubjectTopics = topics.filter(t => t.subjectId === subjectId);
    const allTopicsTimeSpent = allSubjectTopics.reduce((acc, t) => acc + t.timeSpent, 0);
    const timeSpent = Math.max(subject?.timeSpent || 0, allTopicsTimeSpent);
    
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
        
        {/* Date Selector Strip (Calendarized) */}
        <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/10 shadow-sm transition-all duration-300 mb-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <button onClick={handlePrevMonth} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant text-sm pointer-events-none">chevron_left</span>
              </button>
              <span className="font-syne text-sm font-bold text-on-surface w-28 text-center border px-2 py-1 rounded bg-surface-container-highest/50 border-outline-variant/10">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button onClick={handleNextMonth} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant text-sm pointer-events-none">chevron_right</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={jumpToToday}
                className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-label text-xs uppercase tracking-widest hover:bg-primary/20 transition-colors"
              >
                Today
              </button>
              <button 
                onClick={() => setIsCalendarMinimized(!isCalendarMinimized)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors text-on-surface-variant"
              >
                <span className="material-symbols-outlined pointer-events-none">
                  {isCalendarMinimized ? 'expand_more' : 'expand_less'}
                </span>
              </button>
            </div>
          </div>

          {!isCalendarMinimized && (
            <>
              <div className="grid grid-cols-7 gap-1 mb-2 mt-4">
                {days.map(day => (
                  <div key={day} className="text-center font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                    {day.charAt(0)}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-8"></div>
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
                  const isSelected = date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear();
                  const isToday = date.getDate() === new Date().getDate() && date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear();

                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedDate(date);
                        setIsCalendarMinimized(true);
                      }}
                      className={clsx(
                        "relative flex flex-col items-center justify-center h-8 rounded-lg transition-all",
                        isSelected 
                          ? "bg-primary text-on-primary shadow-sm font-bold" 
                          : "hover:bg-surface-container-highest text-on-surface-variant",
                        isToday && !isSelected ? "border border-tertiary text-tertiary font-bold bg-tertiary/5" : ""
                      )}
                    >
                      <span className="font-mono text-xs pointer-events-none">{i + 1}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {isCalendarMinimized && (
             <div className="mt-4 text-center text-sm font-syne font-bold text-primary flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                <span>{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
             </div>
          )}
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
            className="w-full bg-primary text-on-primary py-3 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Add New Subject
          </button>
        </div>

        <div className="grid gap-6">
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

                {/* Topics Hierarchy */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-label text-xs uppercase tracking-widest text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">account_tree</span>
                      Topics & Chapters
                    </h4>
                    <button 
                      onClick={() => {
                        setNewTopicSubject(subject.id);
                        setShowAddTopic(true);
                      }}
                      className={clsx(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md transition-colors",
                        `bg-${subject.color}/10 text-${subject.color} hover:bg-${subject.color}/20`
                      )}
                    >
                      + Add Topic
                    </button>
                  </div>

                  {filteredTopics.filter(t => t.subjectId === subject.id).map((topic) => (
                    <div key={topic.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 overflow-hidden">
                      <div className="p-3 flex items-center justify-between hover:bg-surface-container-low transition-colors">
                        <div className="flex items-center gap-3 flex-grow">
                          <button 
                            onClick={() => handleTopicClick(topic)}
                            disabled={topic.subTopics && topic.subTopics.length > 0}
                            className={clsx(
                              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0",
                              topic.status === 'Completed' ? `bg-${subject.color} border-${subject.color}` : "border-outline-variant/50 hover:border-outline",
                              topic.subTopics && topic.subTopics.length > 0 && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {topic.status === 'Completed' && <span className={clsx("material-symbols-outlined text-[14px] font-bold", `text-on-${subject.color}`)}>check</span>}
                          </button>
                          <div className="flex-grow">
                            <h4 className={clsx("font-syne font-bold text-sm transition-all", topic.status === 'Completed' && "line-through text-on-surface-variant")}>{topic.title}</h4>
                            <p className="font-mono text-[10px] text-on-surface-variant uppercase">
                              {formatTime(topic.timeSpent)} / {formatTime(topic.targetMinutes)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {topic.nextReviewDate && new Date(topic.nextReviewDate) <= new Date() && (!topic.subTopics || topic.subTopics.length === 0) && (
                            <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-error/10 text-error border border-error/20 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">refresh</span>
                              Review
                            </span>
                          )}
                          <span className={clsx(
                            "font-label text-[10px] uppercase px-2 py-1 rounded-md border hidden sm:inline-block",
                            topic.status === 'Completed' ? 'bg-tertiary/10 text-tertiary border-tertiary/20' : 
                            topic.status === 'In Progress' ? 'bg-primary/10 text-primary border-primary/20' : 
                            'bg-surface-container-highest text-on-surface-variant border-outline-variant/20'
                          )}>
                            {topic.status}
                          </span>
                          <button 
                            onClick={() => {
                              setNewSubTopicParentId(topic.id);
                              setShowAddSubTopic(true);
                            }}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Add Sub-topic"
                          >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                          </button>
                          <button 
                            onClick={() => deleteTopic(topic.id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-error/10 hover:text-error transition-colors text-on-surface-variant"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </div>
                      
                      {/* Subtopics List */}
                      {topic.subTopics && topic.subTopics.length > 0 && (
                        <div className="bg-surface-container-high border-t border-outline-variant/10 p-3 pl-12 space-y-2">
                          {topic.subTopics.map(subTopic => (
                            <div key={subTopic.id} className="flex items-center justify-between group">
                              <div className="flex items-center gap-3">
                                <button 
                                  onClick={() => handleTopicClick(subTopic, true, topic.id)}
                                  className={clsx(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0",
                                    subTopic.status === 'Completed' ? `bg-${subject.color} border-${subject.color}` : "border-outline-variant/50 hover:border-outline"
                                  )}
                                >
                                  {subTopic.status === 'Completed' && <span className={clsx("material-symbols-outlined text-[12px] font-bold", `text-on-${subject.color}`)}>check</span>}
                                </button>
                                <div className="flex items-center flex-wrap gap-2">
                                  <span className={clsx("font-syne text-sm", subTopic.status === 'Completed' && "line-through text-on-surface-variant")}>
                                    {subTopic.title}
                                  </span>
                                  {subTopic.targetMinutes ? (
                                    <span className="font-mono text-[10px] text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded-md border border-outline-variant/10">
                                      {formatTime(subTopic.timeSpent || 0)} / {formatTime(subTopic.targetMinutes)}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {subTopic.nextReviewDate && new Date(subTopic.nextReviewDate) <= new Date() && (
                                  <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-error/10 text-error border border-error/20 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[10px]">refresh</span>
                                    Review
                                  </span>
                                )}
                                <button 
                                  onClick={() => deleteSubTopic(topic.id, subTopic.id)}
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                                  title="Delete Sub-topic"
                                >
                                  <span className="material-symbols-outlined text-[14px]">close</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {filteredTopics.filter(t => t.subjectId === subject.id).length === 0 && (
                    <div className="text-center py-4 text-on-surface-variant text-sm border border-dashed border-outline-variant/20 rounded-xl">
                      No topics added yet.
                    </div>
                  )}
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

      {/* Review Topic Modal */}
      {topicToReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm" onClick={() => setTopicToReview(null)}></div>
          <div className="bg-surface-container-high rounded-3xl p-6 w-full max-w-sm border border-outline-variant/20 shadow-2xl relative z-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-syne font-bold text-xl text-on-surface">Rate Difficulty</h3>
              <button onClick={() => setTopicToReview(null)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-sm text-on-surface-variant mb-6">
              How well did you understand <strong>{topicToReview.title}</strong>? This helps us schedule your next review.
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => handleReviewSubmit('Hard')}
                className="w-full py-4 rounded-xl font-bold text-error bg-error/10 hover:bg-error/20 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">sentiment_dissatisfied</span>
                Hard (Review Tomorrow)
              </button>
              <button 
                onClick={() => handleReviewSubmit('Good')}
                className="w-full py-4 rounded-xl font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">sentiment_satisfied</span>
                Good (Review in a few days)
              </button>
              <button 
                onClick={() => handleReviewSubmit('Easy')}
                className="w-full py-4 rounded-xl font-bold text-success bg-success/10 hover:bg-success/20 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">sentiment_very_satisfied</span>
                Easy (Review next week)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Sub-topic Modal */}
      {showAddSubTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm" onClick={() => setShowAddSubTopic(false)}></div>
          <div className="bg-surface-container-high rounded-3xl p-6 w-full max-w-md border border-outline-variant/20 shadow-2xl relative z-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-syne font-bold text-xl text-on-surface">Add Sub-topic</h3>
              <button onClick={() => setShowAddSubTopic(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddSubTopic} className="space-y-4">
              <div>
                <label className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2">Sub-topic Title</label>
                <input 
                  type="text" 
                  value={newSubTopicTitle}
                  onChange={(e) => setNewSubTopicTitle(e.target.value)}
                  className="w-full bg-surface-container-highest border-none rounded-xl p-4 text-on-surface font-syne focus:ring-2 focus:ring-primary outline-none"
                  placeholder="e.g. Newton's First Law"
                  autoFocus
                />
              </div>
              <div>
                <label className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2">Target Time (Minutes) - Optional</label>
                <input 
                  type="number" 
                  min="0"
                  value={newSubTopicTarget || ''}
                  onChange={(e) => setNewSubTopicTarget(parseInt(e.target.value) || 0)}
                  className="w-full bg-surface-container-highest border-none rounded-xl p-4 text-on-surface font-syne focus:ring-2 focus:ring-primary outline-none"
                  placeholder="e.g. 30"
                />
              </div>
              <button 
                type="submit"
                disabled={!newSubTopicTitle.trim()}
                className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Sub-topic
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
