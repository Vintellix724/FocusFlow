import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export default function Home() {
  const navigate = useNavigate();
  const { user, setUser, tasks, focusTimeToday, focusHistory, toggleTask, showToast, currentStreak, bestStreak, subjects, topics, updateUserCoins, theme, toggleTheme, setTimerState, toggleFreezeDay } = useStore();
  
  const isTodayFrozen = user?.frozenDates?.includes(new Date().toISOString().split('T')[0]);
  
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [editExamDate, setEditExamDate] = useState(user?.examDate || '');
  const [editMockDate, setEditMockDate] = useState(user?.nextMockTestDate || '');
  const inspirationInputRef = useRef<HTMLInputElement>(null);

  const [currentTime, setCurrentTime] = useState(new Date().getTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().getTime());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const calculateTimeLeft = (targetDateStr: string | undefined) => {
    if (!targetDateStr) return null;
    const target = new Date(targetDateStr).getTime();
    const diff = target - currentTime;
    
    if (diff <= 0) return { months: '00', days: '00', hours: '00', isPast: true };
    
    const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44));
    const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 30.44)) / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return { 
      months: months.toString().padStart(2, '0'), 
      days: days.toString().padStart(2, '0'), 
      hours: hours.toString().padStart(2, '0'), 
      isPast: false 
    };
  };

  const examTimeLeft = calculateTimeLeft(user?.examDate);
  const mockTimeLeft = calculateTimeLeft(user?.nextMockTestDate);

  const handleSaveDates = () => {
    if (user) {
      setUser({ ...user, examDate: editExamDate, nextMockTestDate: editMockDate });
      showToast("Target dates updated successfully!", "success");
      setShowDateModal(false);
    }
  };

  const handleInspirationUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) { // 1MB limit
      showToast("Image size should be less than 1MB", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string;
        if (user) {
          setUser({ ...user, inspirationImage: base64String });
          showToast("Inspiration image updated!", "success");
        }
      } catch (error) {
        showToast("Failed to update inspiration image", "error");
      }
    };
    reader.readAsDataURL(file);
  };

  const today = new Date().toISOString().split('T')[0];
  const todaysTasks = tasks.filter(t => t.date === today);
  const completedTasks = todaysTasks.filter(t => t.completed);
  const uncompletedTasks = todaysTasks.filter(t => !t.completed);
  const mostImportantTask = uncompletedTasks.find(t => t.isMostImportant) || uncompletedTasks
    .sort((a, b) => {
      const pA = a.priority || 'q4';
      const pB = b.priority || 'q4';
      return pA.localeCompare(pB);
    })[0];
  
  const dueRevisions = React.useMemo(() => {
    const due: { id: string, title: string, subjectId: string, interval: number, isSubTopic: boolean }[] = [];
    topics.forEach(t => {
      if (!t.subTopics || t.subTopics.length === 0) {
        if (t.nextReviewDate && new Date(t.nextReviewDate) <= new Date()) {
          due.push({ id: t.id, title: t.title, subjectId: t.subjectId, interval: t.interval || 0, isSubTopic: false });
        }
      } else {
        t.subTopics.forEach(st => {
          if (st.nextReviewDate && new Date(st.nextReviewDate) <= new Date()) {
            due.push({ id: st.id, title: `${t.title} - ${st.title}`, subjectId: t.subjectId, interval: st.interval || 0, isSubTopic: true });
          }
        });
      }
    });
    return due;
  }, [topics]);

  const [isEditingHours, setIsEditingHours] = useState(false);
  const [editHoursValue, setEditHoursValue] = useState('');

  const handleSaveHours = async () => {
    const newHours = parseFloat(editHoursValue);
    if (!isNaN(newHours) && newHours > 0 && newHours <= 24) {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, { targetHours: newHours });
          setUser({ ...user, targetHours: newHours });
          showToast('Daily target updated', 'success');
        } catch (error) {
          console.error("Error updating target hours:", error);
          showToast('Failed to update target', 'error');
        }
      }
    } else {
      showToast('Please enter a valid number between 0.1 and 24', 'error');
    }
    setIsEditingHours(false);
  };

  const targetHours = user?.targetHours || 6;
  const focusTimeHours = focusTimeToday / 60;
  const focusProgress = Math.min((focusTimeHours / targetHours) * 100, 100);

  // Calculate days to exam
  const examDate = user?.examDate ? new Date(user.examDate) : new Date();
  const daysToExam = Math.max(0, Math.ceil((examDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24)));

  // Calculate weekly focus time
  const getWeeklyFocusHours = () => {
    let totalMins = 0;
    const d = new Date();
    for (let i = 0; i < 7; i++) {
      const dateStr = d.toISOString().split('T')[0];
      totalMins += focusHistory[dateStr] || 0;
      d.setDate(d.getDate() - 1);
    }
    return totalMins / 60;
  };

  const weeklyFocusHours = getWeeklyFocusHours();
  const weeklyGoal = (user?.targetHours || 6) * 7;
  const weeklyProgress = Math.min((weeklyFocusHours / weeklyGoal) * 100, 100);
  const daysLeftInWeek = 7 - new Date().getDay();

  // Calculate yesterday's focus time
  const getYesterdayFocusHours = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const dateStr = d.toISOString().split('T')[0];
    return (focusHistory[dateStr] || 0) / 60;
  };
  const yesterdayFocusHours = getYesterdayFocusHours();

  // Calculate monthly XP (1 min = 2 XP)
  const getMonthlyXP = () => {
    let totalMins = 0;
    const d = new Date();
    const month = d.getMonth();
    while (d.getMonth() === month) {
      const dateStr = d.toISOString().split('T')[0];
      totalMins += focusHistory[dateStr] || 0;
      d.setDate(d.getDate() - 1);
    }
    return totalMins * 2; // 1 min = 2 XP
  };
  const monthlyXP = getMonthlyXP();
  const level = Math.floor(monthlyXP / 2000) + 1;
  const xpForNextLevel = level * 2000;
  const currentLevelXP = monthlyXP % 2000;

  // Generate streak grid data (last 14 days)
  const getStreakGrid = () => {
    const grid = [];
    const d = new Date();
    d.setDate(d.getDate() - 13); // Start 14 days ago
    const minMins = user?.minimumDailyMinutes || 0;
    
    for (let i = 0; i < 14; i++) {
      const dateStr = d.toISOString().split('T')[0];
      const mins = focusHistory[dateStr] || 0;
      const isFrozen = user?.frozenDates?.includes(dateStr);
      
      let opacity = 0;
      if (mins > 0 && mins >= minMins) {
        opacity = Math.min(0.2 + (mins / (minMins || 120)) * 0.8, 1); // Max opacity at minMins or 2 hours
      } else if (mins > 0) {
        opacity = 0.1; // Partial completion
      } else if (isFrozen) {
        opacity = 0.5; // Frozen day
      }
      grid.push({ date: dateStr, opacity, isFrozen });
      d.setDate(d.getDate() + 1);
    }
    return grid;
  };
  const streakGrid = getStreakGrid();

  // Calculate today's subject progress
  const getTodaySubjectProgress = () => {
    if (subjects.length === 0) {
      return [
        { name: 'ADD', progress: 0, color: 'bg-surface-container-highest' },
        { name: 'SUB', progress: 0, color: 'bg-surface-container-highest' },
        { name: 'JECTS', progress: 0, color: 'bg-surface-container-highest' }
      ];
    }

    return subjects.slice(0, 3).map(subject => {
      const subjectTopics = topics.filter(t => t.subjectId === subject.id);
      const timeSpent = subjectTopics.reduce((acc, t) => acc + t.timeSpent, 0);
      const targetMinutes = subject.targetMinutes || 1;
      const progress = Math.min(100, Math.round((timeSpent / targetMinutes) * 100));
      
      return {
        name: subject.name.substring(0, 3).toUpperCase(),
        progress,
        color: subject.color
      };
    });
  };
  const todaySubjectProgress = getTodaySubjectProgress();

  const [greeting, setGreeting] = useState(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const hour = new Date().getHours();
      if (hour < 12) setGreeting('Good Morning');
      else if (hour < 18) setGreeting('Good Afternoon');
      else setGreeting('Good Evening');
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-surface text-on-surface font-body selection:bg-primary/30 min-h-screen pb-32">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl flex justify-between items-center pl-16 pr-6 py-4 shadow-[0_0_20px_rgba(79,142,247,0.15)]">
        <div className="flex flex-col flex-1 min-w-0 mr-2">
          <h1 className="font-syne font-bold text-lg text-on-surface truncate">{greeting}, {user?.name?.split(' ')[0] || 'Student'} 👋</h1>
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="bg-surface-container-highest text-[10px] px-2 py-0.5 rounded-full font-label uppercase tracking-wider text-primary border border-primary/20 whitespace-nowrap">🎯 {daysToExam} days to Exam</span>
            <span className="bg-surface-container-highest text-[10px] px-2 py-0.5 rounded-full font-label uppercase tracking-wider text-tertiary border border-tertiary/20 whitespace-nowrap">🔥 {currentStreak} day streak</span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-800/50 transition-colors active:scale-95 duration-200 shrink-0"
            title="Toggle Theme"
          >
            <span className="material-symbols-outlined text-on-surface-variant">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          <button 
            onClick={() => showToast("No new notifications", "info")}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-highest/50 transition-colors active:scale-95 duration-200 shrink-0"
          >
            <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
          </button>
          <div 
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/30 cursor-pointer shrink-0"
            onClick={() => navigate('/analytics')}
          >
            <img 
              alt="User Profile Avatar" 
              className="w-full h-full object-cover" 
              src={user?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + (user?.name || 'Student')}
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-primary text-on-primary font-bold text-xl">${(user?.name || 'S').charAt(0).toUpperCase()}</div>`;
              }}
            />
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6 max-w-2xl mx-auto pb-32">
        <section className="relative rounded-3xl bg-surface-container-high/60 backdrop-blur-xl overflow-hidden shadow-xl shadow-on-bg/5 border border-outline-variant/50">
          {user?.inspirationImage ? (
            <div className="relative w-full group flex justify-center items-center min-h-[200px]">
              <img src={user.inspirationImage} alt="Inspiration" className="w-full h-auto max-h-[60vh] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6">
                <button 
                  onClick={() => inspirationInputRef.current?.click()}
                  className="self-end bg-on-surface/10 hover:bg-on-surface/20 backdrop-blur-md text-on-surface px-4 py-2 rounded-full font-label uppercase tracking-wider text-xs border border-outline-variant/20 transition-all"
                >
                  Change Inspiration
                </button>
              </div>
            </div>
          ) : (
            <div 
              onClick={() => inspirationInputRef.current?.click()}
              className="h-48 flex flex-col items-center justify-center cursor-pointer hover:bg-surface-container-highest/50 transition-all border-2 border-dashed border-outline-variant/30 hover:border-primary/50 m-4 rounded-2xl text-center px-4"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-2xl text-primary">add_photo_alternate</span>
              </div>
              <p className="font-syne font-bold text-on-surface">Add Your Inspiration</p>
              <p className="text-xs text-on-surface-variant mt-1">What drives you? Upload an image.</p>
            </div>
          )}
          <input 
            type="file" 
            ref={inspirationInputRef} 
            onChange={handleInspirationUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </section>

        <section className="bg-gradient-to-br from-surface-container-high to-surface-container-low rounded-3xl p-6 flex items-center justify-between gap-6 shadow-xl shadow-on-bg/5 border border-outline-variant/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div className="flex-1 space-y-4 relative z-10">
            <div>
              <h3 className="font-label text-on-surface-variant text-sm font-medium mb-1">Today's Focus</h3>
              <div className="flex items-baseline gap-2">
                <span className="font-mono font-bold text-4xl text-tertiary">{focusTimeHours.toFixed(1)}</span>
                {isEditingHours ? (
                  <div className="flex items-center gap-2" style={{ height: '64px', paddingLeft: '0px' }}>
                    <span className="font-mono text-on-surface-variant text-xl">/</span>
                    <input
                      type="number"
                      value={editHoursValue}
                      onChange={(e) => setEditHoursValue(e.target.value)}
                      className="w-16 bg-surface-container-highest text-on-surface font-mono text-xl rounded px-2 py-1 border border-outline-variant/30 focus:border-primary focus:outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveHours();
                        if (e.key === 'Escape') setIsEditingHours(false);
                      }}
                    />
                    <span className="font-mono text-on-surface-variant text-xl">hrs</span>
                    <button onClick={handleSaveHours} className="text-primary hover:text-primary-container">
                      <span className="material-symbols-outlined text-sm">check</span>
                    </button>
                    <button onClick={() => setIsEditingHours(false)} className="text-error hover:text-error-container">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group cursor-pointer" onClick={() => {
                    setEditHoursValue(targetHours.toString());
                    setIsEditingHours(true);
                  }} style={{ height: '64px', paddingLeft: '0px' }}>
                    <span className="font-mono text-on-surface-variant text-xl">/ {targetHours} hrs</span>
                    <span className="material-symbols-outlined text-xs text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div className="w-full h-2 bg-on-surface/10 rounded-full overflow-hidden backdrop-blur-sm border border-outline-variant/20">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${focusProgress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-primary to-tertiary rounded-full shadow-[0_0_15px_rgba(56,223,171,0.6)]" 
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {todaySubjectProgress.map((sub, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="h-1 bg-on-surface/10 rounded-full overflow-hidden border border-outline-variant/20">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${sub.progress}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className={`h-full ${sub.color} shadow-[0_0_8px_currentColor]`} 
                      />
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-on-surface-variant/80">{sub.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90 drop-shadow-lg">
              <circle className="text-on-surface/10" cx="64" cy="64" fill="transparent" r="54" stroke="currentColor" strokeWidth="6"></circle>
              <motion.circle 
                className="text-tertiary" 
                cx="64" cy="64" fill="transparent" r="54" 
                stroke="url(#gradient)" 
                strokeDasharray="339.29" 
                initial={{ strokeDashoffset: 339.29 }}
                animate={{ strokeDashoffset: 339.29 - (339.29 * focusProgress) / 100 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                strokeLinecap="round" strokeWidth="6"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--color-primary)" />
                  <stop offset="100%" stopColor="var(--color-tertiary)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="font-syne font-bold text-3xl text-on-surface">{Math.round(focusProgress)}<span className="text-lg text-on-surface-variant">%</span></span>
              <span className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant mt-1">Complete</span>
            </div>
            <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full -z-10"></div>
          </div>
        </section>

        {/* Advanced Countdown Widget */}
        <section className="bg-gradient-to-br from-surface-container-high to-surface-container-low rounded-3xl p-6 shadow-xl shadow-on-bg/5 border border-outline-variant/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="font-label text-xs uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">hourglass_top</span>
              Target Countdowns
            </h3>
            <button 
              onClick={() => setShowDateModal(true)}
              className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-highest transition-colors text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            {/* Exam Countdown */}
            <div className="bg-surface-container p-5 rounded-2xl border border-outline-variant/20 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary">school</span>
                <span className="font-syne font-bold text-sm text-on-surface">Final Exam</span>
              </div>
              {examTimeLeft ? (
                examTimeLeft.isPast ? (
                  <div className="text-center py-4 text-primary font-bold font-syne">Exam Date Reached!</div>
                ) : (
                  <div className="flex gap-3 justify-center">
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 bg-surface rounded-xl flex items-center justify-center font-mono font-bold text-2xl text-on-surface shadow-inner border border-outline-variant/10">
                        {examTimeLeft.months}
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-on-surface-variant mt-1 font-medium">Months</span>
                    </div>
                    <div className="text-2xl font-bold text-outline-variant/50 self-center mb-4">:</div>
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 bg-surface rounded-xl flex items-center justify-center font-mono font-bold text-2xl text-on-surface shadow-inner border border-outline-variant/10">
                        {examTimeLeft.days}
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-on-surface-variant mt-1 font-medium">Days</span>
                    </div>
                    <div className="text-2xl font-bold text-outline-variant/50 self-center mb-4">:</div>
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 bg-surface rounded-xl flex items-center justify-center font-mono font-bold text-2xl text-on-surface shadow-inner border border-outline-variant/10">
                        {examTimeLeft.hours}
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-on-surface-variant mt-1 font-medium">Hours</span>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center py-4 text-on-surface-variant text-sm border border-dashed border-outline-variant/30 rounded-xl">
                  No exam date set
                </div>
              )}
            </div>

            {/* Mock Test Countdown */}
            <div className="bg-surface-container p-5 rounded-2xl border border-outline-variant/20 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-tertiary">quiz</span>
                <span className="font-syne font-bold text-sm text-on-surface">Next Mock Test</span>
              </div>
              {mockTimeLeft ? (
                mockTimeLeft.isPast ? (
                  <div className="text-center py-4 text-tertiary font-bold font-syne">Mock Test Day!</div>
                ) : (
                  <div className="flex gap-3 justify-center">
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 bg-surface rounded-xl flex items-center justify-center font-mono font-bold text-2xl text-on-surface shadow-inner border border-outline-variant/10">
                        {mockTimeLeft.months}
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-on-surface-variant mt-1 font-medium">Months</span>
                    </div>
                    <div className="text-2xl font-bold text-outline-variant/50 self-center mb-4">:</div>
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 bg-surface rounded-xl flex items-center justify-center font-mono font-bold text-2xl text-on-surface shadow-inner border border-outline-variant/10">
                        {mockTimeLeft.days}
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-on-surface-variant mt-1 font-medium">Days</span>
                    </div>
                    <div className="text-2xl font-bold text-outline-variant/50 self-center mb-4">:</div>
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 bg-surface rounded-xl flex items-center justify-center font-mono font-bold text-2xl text-on-surface shadow-inner border border-outline-variant/10">
                        {mockTimeLeft.hours}
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-on-surface-variant mt-1 font-medium">Hours</span>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center py-4 text-on-surface-variant text-sm border border-dashed border-outline-variant/30 rounded-xl">
                  No mock test scheduled
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-surface-container-high to-surface-container-low rounded-3xl p-6 space-y-5 shadow-xl shadow-on-bg/5 border border-outline-variant/50 relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-error/5 rounded-full blur-3xl group-hover:bg-error/10 transition-colors duration-500"></div>
            <div className="flex justify-between items-start relative z-10">
              <h3 className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Streak Engine</h3>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="font-label text-[9px] uppercase tracking-widest text-secondary">Leaves</span>
                  <span className="font-mono font-bold text-xs text-on-surface">{user?.freezeDaysAvailable !== undefined ? user.freezeDaysAvailable : 3} Left</span>
                </div>
                <button 
                  onClick={toggleFreezeDay}
                  className={clsx(
                    "w-10 h-10 rounded-full flex items-center justify-center border transition-colors",
                    isTodayFrozen
                      ? "bg-secondary text-on-secondary border-secondary hover:bg-secondary/90 shadow-[0_0_15px_rgba(var(--color-secondary),0.4)]"
                      : "bg-secondary/10 hover:bg-secondary/20 border-secondary/20 text-secondary"
                  )}
                  title={isTodayFrozen ? "Cancel leave" : "Take a day off without breaking your streak"}
                >
                  <span className="material-symbols-outlined text-[18px]">ac_unit</span>
                </button>
                <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center border border-error/20">
                  <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                </div>
              </div>
            </div>
            <div className="relative z-10">
              <div className="font-syne font-bold text-4xl text-on-surface flex items-baseline gap-2">
                {currentStreak} <span className="text-lg text-on-surface-variant font-medium">days</span>
              </div>
              <div className="font-mono text-[10px] text-on-surface-variant uppercase mt-2 tracking-wider">Personal Best: <span className="text-on-surface">{bestStreak} days</span></div>
            </div>
            <div className="grid grid-cols-7 gap-1.5 relative z-10 pt-2">
              {streakGrid.map((day, i) => (
                <motion.div 
                  key={i} 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: day.opacity > 0 ? day.opacity : 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`aspect-square rounded-md ${
                    day.opacity === 0 
                      ? 'bg-on-surface/10 border border-outline-variant/20' 
                      : day.isFrozen 
                        ? 'bg-gradient-to-br from-secondary to-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]'
                        : 'bg-gradient-to-br from-error to-orange-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                  }`}
                  title={day.isFrozen ? "Leave Taken (Streak Saved)" : undefined}
                />
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-surface-container-high to-surface-container-low rounded-3xl p-6 flex flex-col items-center justify-between text-center relative overflow-hidden shadow-xl shadow-on-bg/5 border border-outline-variant/50 group">
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-tertiary/5 rounded-full blur-3xl group-hover:bg-tertiary/10 transition-colors duration-500"></div>
            <div className="absolute top-6 left-6 font-label text-[10px] uppercase tracking-widest text-on-surface-variant text-left z-10">
              Virtual Forest<br/><span className="text-tertiary font-bold text-xs mt-1 block">{user?.treesGrown || 0} Trees Grown</span>
            </div>
            <div className="mt-8 relative w-32 h-32 flex items-end justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                {/* Ground */}
                <ellipse cx="50" cy="90" rx="40" ry="10" fill="#3f3f46" opacity="0.5" />
                
                {/* Trees based on count */}
                {Array.from({ length: Math.min(user?.treesGrown || 0, 5) }).map((_, i) => (
                  <motion.g 
                    key={i}
                    initial={{ scale: 0, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.2, type: 'spring' }}
                    style={{ transformOrigin: "50px 90px" }}
                    transform={`translate(${(i - 2) * 15}, ${Math.abs(i - 2) * 5}) scale(${0.6 + Math.random() * 0.4})`}
                  >
                    {/* Trunk */}
                    <path d="M48 90 L52 90 L52 60 L48 60 Z" fill="#795548" />
                    {/* Canopy */}
                    <circle cx="50" cy="50" r="20" fill="#4CAF50" />
                    <circle cx="40" cy="60" r="15" fill="#81C784" />
                    <circle cx="60" cy="60" r="15" fill="#388E3C" />
                  </motion.g>
                ))}
                
                {/* Empty state if no trees */}
                {(user?.treesGrown || 0) === 0 && (
                  <motion.text 
                    x="50" y="50" 
                    textAnchor="middle" 
                    fill="#a1a1aa" 
                    fontSize="10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    Plant a seed in Timer
                  </motion.text>
                )}
              </svg>
            </div>
            <div className="w-full mt-4 z-10">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="material-symbols-outlined text-[14px] text-tertiary">park</span>
                <span className="font-mono text-xs text-on-surface">Grow your forest by focusing!</span>
              </div>
              <button 
                onClick={() => navigate('/timer')}
                className="mt-2 w-full bg-primary/10 text-primary py-2 rounded-xl font-bold text-sm hover:bg-primary/20 transition-colors"
              >
                Start Focusing
              </button>
            </div>
          </div>
        </div>

        <section className="bg-gradient-to-br from-surface-container-high to-surface-container-low rounded-3xl overflow-hidden shadow-xl shadow-on-bg/5 border border-outline-variant/50 relative group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-tertiary to-primary opacity-50"></div>
          <div className="bg-primary/5 px-6 py-3 border-b border-outline-variant/30 flex items-center gap-2 backdrop-blur-sm">
            <span className="material-symbols-outlined text-primary text-sm">stars</span>
            <span className="font-label text-[10px] uppercase tracking-widest text-primary font-bold">Aaj ka Most Important Task</span>
          </div>
          <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            {mostImportantTask ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-syne font-bold text-2xl text-on-surface tracking-tight">{mostImportantTask.title}</h4>
                    {mostImportantTask.isMostImportant && (
                      <span className="material-symbols-outlined text-primary text-[20px]" title="Pinned as Most Important" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-${mostImportantTask.color}/10 text-${mostImportantTask.color} border border-${mostImportantTask.color}/20`}>
                      {mostImportantTask.subject}
                    </span>
                    <span className="font-mono text-xs text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      Due Today, {mostImportantTask.time}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3 shrink-0">
                  <button 
                    onClick={() => {
                      setTimerState(prev => ({
                        ...prev,
                        selectedTaskId: mostImportantTask.id,
                        selectedSubjectId: '',
                        selectedTopicId: '',
                        selectedSubTopicId: '',
                        mode: 'pomodoro',
                        timeLeft: (mostImportantTask.duration || 25) * 60,
                        initialTime: (mostImportantTask.duration || 25) * 60,
                        focusDuration: mostImportantTask.duration || 25
                      }));
                      navigate('/timer');
                    }}
                    className="bg-surface-container-highest text-on-surface px-6 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all border border-outline-variant/30 hover:bg-surface-container-highest/80"
                  >
                    <span className="material-symbols-outlined text-[20px]">timer</span>
                    <span className="hidden sm:inline">Start</span>
                  </button>
                  <button 
                    onClick={() => toggleTask(mostImportantTask.id)}
                    className="bg-gradient-to-r from-tertiary to-emerald-500 text-on-tertiary px-6 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_0_20px_rgba(56,223,171,0.3)] hover:shadow-[0_0_30px_rgba(56,223,171,0.5)]"
                  >
                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    <span className="hidden sm:inline">Mark Done</span>
                  </button>
                </div>
              </>
            ) : todaysTasks.length === 0 ? (
              <div className="flex-1 text-center py-8">
                <div className="w-16 h-16 bg-surface-container-highest rounded-full flex items-center justify-center mx-auto mb-4 border border-outline-variant/30">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant">event_note</span>
                </div>
                <h4 className="font-syne font-bold text-xl text-on-surface">No tasks scheduled for today</h4>
                <p className="font-label text-sm text-on-surface-variant mt-2">Add some tasks in the Planner to get started.</p>
              </div>
            ) : (
              <div className="flex-1 text-center py-8">
                <div className="w-16 h-16 bg-tertiary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-tertiary/20">
                  <span className="material-symbols-outlined text-3xl text-tertiary">celebration</span>
                </div>
                <h4 className="font-syne font-bold text-xl text-on-surface">All tasks completed for today! 🎉</h4>
                <p className="font-label text-sm text-on-surface-variant mt-2">Take a break or add more tasks in the Planner.</p>
              </div>
            )}
          </div>
        </section>

        {dueRevisions.length > 0 && (
          <section className="bg-gradient-to-br from-error/10 to-surface-container-low rounded-3xl p-6 shadow-xl shadow-on-bg/5 border border-error/20">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-error">refresh</span>
              <h3 className="font-syne font-bold text-xl text-on-surface">Due for Review</h3>
              <span className="bg-error text-on-error text-xs font-bold px-2 py-0.5 rounded-full">{dueRevisions.length}</span>
            </div>
            <div className="space-y-3">
              {dueRevisions.slice(0, 3).map(topic => {
                const subject = subjects.find(s => s.id === topic.subjectId);
                return (
                  <div key={topic.id} className="bg-surface-container p-4 rounded-2xl flex items-center justify-between border border-outline-variant/10">
                    <div>
                      <h4 className="font-syne font-bold text-sm text-on-surface">{topic.title}</h4>
                      <p className="font-mono text-[10px] text-on-surface-variant uppercase mt-1">
                        {subject?.name} • Interval: {topic.interval || 0} days
                      </p>
                    </div>
                    <button 
                      onClick={() => navigate('/subjects')}
                      className="w-8 h-8 rounded-full bg-error/10 text-error flex items-center justify-center hover:bg-error/20 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  </div>
                );
              })}
              {dueRevisions.length > 3 && (
                <button 
                  onClick={() => navigate('/subjects')}
                  className="w-full text-center text-sm font-bold text-error mt-2 hover:underline"
                >
                  +{dueRevisions.length - 3} more topics
                </button>
              )}
            </div>
          </section>
        )}

        <section className="bg-gradient-to-br from-surface-container-high to-surface-container-low rounded-3xl p-6 space-y-6 shadow-xl shadow-on-bg/5 border border-outline-variant/50">
          <div className="flex items-center justify-between">
            <h3 className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Velocity Check</h3>
            <span className="material-symbols-outlined text-on-surface-variant text-sm">speed</span>
          </div>
          <div className="flex items-end gap-6 h-32">
            <div className="flex-1 space-y-3 flex flex-col justify-end h-full">
              <div className="flex justify-between items-center px-1">
                <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Yesterday</span>
                <span className="font-mono text-xs font-bold text-on-surface-variant">{yesterdayFocusHours.toFixed(1)}h</span>
              </div>
              <div className="h-full bg-on-surface/10 rounded-xl relative border border-outline-variant/20 overflow-hidden">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.min((yesterdayFocusHours / Math.max(yesterdayFocusHours, focusTimeHours, 1)) * 100, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="absolute bottom-0 w-full bg-outline-variant/30 rounded-xl" 
                />
              </div>
            </div>
            <div className="flex-1 space-y-3 flex flex-col justify-end h-full">
              <div className="flex justify-between items-center px-1">
                <span className="font-mono text-[10px] text-primary uppercase tracking-wider font-bold">Today</span>
                <span className="font-mono text-xs font-bold text-primary">{focusTimeHours.toFixed(1)}h</span>
              </div>
              <div className="h-full bg-on-surface/10 rounded-xl relative border border-outline-variant/20 overflow-hidden">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.min((focusTimeHours / Math.max(yesterdayFocusHours, focusTimeHours, 1)) * 100, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                  className="absolute bottom-0 w-full bg-gradient-to-t from-primary to-blue-400 rounded-xl shadow-[0_0_15px_rgba(79,142,247,0.5)]" 
                />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Neural Shortcuts</h3>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setShowSpinWheel(true)}
              className="bg-surface-container-high p-4 rounded-xl flex flex-col items-center gap-3 hover:bg-surface-container-highest transition-colors active:translate-y-0.5 duration-150 border border-outline-variant/10"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">casino</span>
              </div>
              <span className="font-label text-xs font-medium">Spin Wheel</span>
            </button>
            <button 
              onClick={() => {
                // Navigate to timer with 10 min preset
                navigate('/timer', { state: { preset: 10 } });
              }}
              className="bg-surface-container-high p-4 rounded-xl flex flex-col items-center gap-3 hover:bg-surface-container-highest transition-colors active:translate-y-0.5 duration-150 border border-outline-variant/10"
            >
              <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-tertiary">bolt</span>
              </div>
              <span className="font-label text-xs font-medium">Quick 10 Min</span>
            </button>
            <button 
              onClick={() => navigate('/journal')}
              className="bg-surface-container-high p-4 rounded-xl flex flex-col items-center gap-3 hover:bg-surface-container-highest transition-colors active:translate-y-0.5 duration-150 border border-outline-variant/10"
            >
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary">edit_note</span>
              </div>
              <span className="font-label text-xs font-medium">Journal</span>
            </button>
          </div>
        </section>

        <section className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-6 flex gap-4 items-center">
          <div className="w-14 h-14 bg-surface-container-highest rounded-full flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-3xl">emoji_events</span>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="font-syne font-bold text-sm">Study {weeklyGoal} hours this week</h4>
              <span className="font-mono text-[10px] text-tertiary font-bold">+{weeklyGoal * 120} XP</span>
            </div>
            <div className="w-full h-1.5 bg-surface-container-lowest rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${weeklyProgress}%` }}></div>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-label text-[10px] text-on-surface-variant">{weeklyFocusHours.toFixed(1)} / {weeklyGoal} hrs</span>
              <span className="font-label text-[10px] text-primary">{daysLeftInWeek} days left</span>
            </div>
          </div>
        </section>
      </main>

      {/* Date Edit Modal */}
      <AnimatePresence>
        {showDateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDateModal(false)}></div>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface w-full max-w-sm rounded-3xl p-6 shadow-xl relative z-10 flex flex-col"
            >
              <h2 className="font-syne font-bold text-2xl text-on-surface mb-6">Set Target Dates</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block font-label text-xs uppercase tracking-wider text-on-surface-variant mb-1">Final Exam Date</label>
                  <input 
                    type="date" 
                    value={editExamDate}
                    onChange={(e) => setEditExamDate(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-4 py-3 font-body text-on-surface focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-label text-xs uppercase tracking-wider text-on-surface-variant mb-1">Next Mock Test Date</label>
                  <input 
                    type="date" 
                    value={editMockDate}
                    onChange={(e) => setEditMockDate(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-4 py-3 font-body text-on-surface focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDateModal(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-on-surface-variant bg-surface-container hover:bg-surface-container-highest transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveDates}
                  className="flex-1 py-3 rounded-xl font-bold text-on-primary bg-primary hover:bg-primary/90 transition-colors"
                >
                  Save Dates
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Spin Wheel Modal */}
      {showSpinWheel && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/80 backdrop-blur-sm"
          onClick={() => setShowSpinWheel(false)}
        >
          <div 
            className="bg-surface-container-high rounded-3xl p-6 w-full max-w-sm border border-outline-variant/20 shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-tertiary/5 pointer-events-none"></div>
            <div className="flex justify-between items-center mb-8 relative z-10">
               <h3 className="font-syne font-bold text-2xl bg-gradient-to-r from-primary to-tertiary bg-clip-text text-transparent">Reward Wheel</h3>
               <button onClick={() => setShowSpinWheel(false)} className="text-on-surface-variant hover:text-on-surface bg-surface-container-highest w-8 h-8 rounded-full flex items-center justify-center">
                 <span className="material-symbols-outlined text-sm">close</span>
               </button>
            </div>
            
            <div className="relative w-64 h-64 mx-auto mb-8">
              {/* Pointer */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 drop-shadow-lg">
                <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 40L0 16C0 7.16344 7.16344 0 16 0C24.8366 0 32 7.16344 32 16L16 40Z" fill="var(--color-tertiary)"/>
                  <circle cx="16" cy="16" r="6" fill="var(--color-on-tertiary)"/>
                </svg>
              </div>
              
              {/* Wheel */}
              <div className="w-full h-full rounded-full border-[12px] border-surface-container-highest shadow-[0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden bg-surface-container-low">
                <div 
                  id="spin-wheel-inner"
                  className="w-full h-full rounded-full relative transition-transform duration-[4000ms] ease-[cubic-bezier(0.15,0.85,0.15,1)]"
                  style={{ transform: 'rotate(0deg)' }}
                >
                  {/* Wheel Segments */}
                  <div className="absolute inset-0" style={{ clipPath: 'polygon(50% 50%, 50% 0, 100% 0, 100% 50%)', backgroundColor: 'var(--color-primary)', opacity: 0.8 }}></div>
                  <div className="absolute inset-0" style={{ clipPath: 'polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)', backgroundColor: 'var(--color-secondary)', opacity: 0.8 }}></div>
                  <div className="absolute inset-0" style={{ clipPath: 'polygon(50% 50%, 50% 100%, 0 100%, 0 50%)', backgroundColor: 'var(--color-tertiary)', opacity: 0.8 }}></div>
                  <div className="absolute inset-0" style={{ clipPath: 'polygon(50% 50%, 0 50%, 0 0, 50% 0)', backgroundColor: 'var(--color-error)', opacity: 0.8 }}></div>
                  
                  {/* Segment Lines */}
                  <div className="absolute w-1 h-full left-1/2 -translate-x-1/2 bg-surface-container-highest/50"></div>
                  <div className="absolute w-full h-1 top-1/2 -translate-y-1/2 bg-surface-container-highest/50"></div>
                  
                  {/* Labels */}
                  <div className="absolute inset-0 flex items-center justify-center font-syne font-bold text-on-primary text-sm drop-shadow-md">
                    <span className="absolute top-8 right-10 rotate-45">50 XP</span>
                    <span className="absolute bottom-8 right-10 rotate-[135deg]">100 XP</span>
                    <span className="absolute bottom-8 left-10 rotate-[225deg]">10 Coins</span>
                    <span className="absolute top-8 left-10 rotate-[315deg]">Badge</span>
                  </div>
                </div>
                
                {/* Center Hub */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-surface-container-highest rounded-full border-4 border-surface shadow-inner flex items-center justify-center z-20">
                  <div className="w-4 h-4 bg-surface-container-lowest rounded-full"></div>
                </div>
              </div>
            </div>
            
            <div className="text-center mb-6">
              <p className="font-mono text-sm text-on-surface-variant">Cost to spin: <span className="text-tertiary font-bold">10 Coins</span></p>
              <p className="font-mono text-xs text-on-surface-variant mt-1">Your balance: <span className="font-bold">{user?.focusCoins || 0} Coins</span></p>
            </div>

            <button 
              className="w-full bg-gradient-to-r from-primary to-tertiary text-on-primary py-4 rounded-xl font-bold text-lg active:scale-95 transition-transform shadow-[0_4px_20px_rgba(79,142,247,0.4)] relative z-10"
              onClick={() => {
                const wheel = document.getElementById('spin-wheel-inner');
                if (wheel) {
                  // Ensure we don't spin if already spinning
                  if (wheel.style.transitionDuration === '0ms') return;
                  
                  if ((user?.focusCoins || 0) < 10) {
                    showToast("Not enough Focus Coins!", "error");
                    return;
                  }
                  
                  // Deduct coins
                  updateUserCoins(-10);
                  
                  // Reset transition to allow multiple spins
                  wheel.style.transitionDuration = '4000ms';
                  
                  // Calculate random spin
                  const currentRotation = parseInt(wheel.getAttribute('data-rotation') || '0');
                  const randomDegree = Math.floor(Math.random() * 360) + 1800; // Spin at least 5 times
                  const newRotation = currentRotation + randomDegree;
                  
                  wheel.style.transform = `rotate(${newRotation}deg)`;
                  wheel.setAttribute('data-rotation', newRotation.toString());
                  
                  setTimeout(() => {
                    const rewards = ['50 XP', '100 XP', '10 Focus Coins', 'Profile Badge'];
                    // Calculate which segment won based on rotation
                    const normalizedRotation = newRotation % 360;
                    let rewardIndex = 0;
                    if (normalizedRotation >= 0 && normalizedRotation < 90) rewardIndex = 3; // Top Left (Badge)
                    else if (normalizedRotation >= 90 && normalizedRotation < 180) rewardIndex = 2; // Bottom Left (10 Coins)
                    else if (normalizedRotation >= 180 && normalizedRotation < 270) rewardIndex = 1; // Bottom Right (100 XP)
                    else rewardIndex = 0; // Top Right (50 XP)
                    
                    if (rewardIndex === 2) {
                      updateUserCoins(10);
                    }
                    
                    showToast(`🎉 You won ${rewards[rewardIndex]}!`, "success");
                    
                    // Reset transition for next spin
                    setTimeout(() => {
                      setShowSpinWheel(false);
                    }, 1500);
                  }, 4000);
                }
              }}
            >
              Spin Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
