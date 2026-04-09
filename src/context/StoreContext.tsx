import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, onSnapshot, query, where, addDoc, deleteDoc, writeBatch } from 'firebase/firestore';

export type Subject = {
  id: string;
  name: string;
  color: string;
  targetMinutes: number;
  timeSpent?: number; // Added optional timeSpent for backward compatibility
};

export type Topic = {
  id: string;
  subjectId: string;
  title: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  timeSpent: number;
  targetMinutes: number;
  lastUpdated: string;
};

export type Task = {
  id: string;
  title: string;
  subject: string;
  duration: number; // in minutes
  time: string;
  completed: boolean;
  date: string; // YYYY-MM-DD
  type: 'study' | 'practice' | 'test';
  color: string;
  priority?: 'q1' | 'q2' | 'q3' | 'q4';
};

export type StudySlot = {
  id: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  subjectId: string;
};

export type User = {
  uid?: string;
  name: string;
  email?: string;
  photoURL?: string;
  inspirationImage?: string;
  totalFocusMinutes?: number;
  dream: string;
  examDate: string;
  targetHours: number;
  role?: 'user' | 'admin';
  focusCoins?: number;
  minimumDailyMinutes?: number;
  notificationsEnabled?: boolean;
  studySlots?: StudySlot[];
  treesGrown?: number;
};

export type JournalEntry = {
  id: string;
  text: string;
  mood: string;
  date: string;
};

export type YouTubeChannel = {
  id: string;
  name: string;
  url: string;
  createdAt: string;
};

export type TelegramChannel = {
  id: string;
  name: string;
  url: string;
  createdAt: string;
};

export type StudyApp = {
  id: string;
  name: string;
  url: string;
  icon?: string;
  createdAt: string;
};

export type ToastMessage = {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
};

type StoreContextType = {
  user: User | null;
  setUser: (user: User) => void;
  firebaseUser: FirebaseUser | null;
  isAuthReady: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  tasks: Task[];
  addTask: (task: Omit<Task, 'id'>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  editTask: (id: string, updatedTask: Partial<Task>) => void;
  subjects: Subject[];
  addSubject: (subject: Omit<Subject, 'id'>) => void;
  deleteSubject: (id: string) => void;
  addSubjectTime: (id: string, mins: number) => void;
  topics: Topic[];
  addTopic: (topic: Omit<Topic, 'id' | 'timeSpent' | 'status' | 'lastUpdated'>) => void;
  deleteTopic: (id: string) => void;
  toggleTopicStatus: (id: string) => void;
  addTopicTime: (id: string, mins: number) => void;
  focusTimeToday: number;
  focusHistory: Record<string, number>;
  currentStreak: number;
  bestStreak: number;
  addFocusTime: (mins: number) => void;
  journalEntries: JournalEntry[];
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'date'>) => void;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
  updateUserCoins: (amount: number) => void;
  addTreeGrown: () => void;
  isOffline: boolean;

  youtubeChannels: YouTubeChannel[];
  addYouTubeChannel: (channel: Omit<YouTubeChannel, 'id' | 'createdAt'>) => void;
  deleteYouTubeChannel: (id: string) => void;

  telegramChannels: TelegramChannel[];
  addTelegramChannel: (channel: Omit<TelegramChannel, 'id' | 'createdAt'>) => void;
  deleteTelegramChannel: (id: string) => void;

  studyApps: StudyApp[];
  addStudyApp: (app: Omit<StudyApp, 'id' | 'createdAt'>) => void;
  deleteStudyApp: (id: string) => void;

  // Global Timer State
  timerState: {
    mode: 'pomodoro' | 'stopwatch';
    focusDuration: number;
    breakDuration: number;
    timeLeft: number;
    initialTime: number;
    isRunning: boolean;
    sessionType: 'focus' | 'break';
    selectedSubjectId: string;
    selectedTopicId: string;
    selectedTaskId: string;
    treeState: 'growing' | 'withered';
    treesGrownSession: number;
    targetEndTime: number | null; // For background accuracy
  };
  setTimerState: React.Dispatch<React.SetStateAction<StoreContextType['timerState']>>;
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [user, setUserState] = useState<User | null>(() => {
    const saved = localStorage.getItem('focusflow_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('focusflow_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('focusflow_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Global Timer State
  const [timerState, setTimerState] = useState<StoreContextType['timerState']>({
    mode: 'pomodoro',
    focusDuration: 25,
    breakDuration: 5,
    timeLeft: 25 * 60,
    initialTime: 25 * 60,
    isRunning: false,
    sessionType: 'focus',
    selectedSubjectId: '',
    selectedTopicId: '',
    selectedTaskId: '',
    treeState: 'growing',
    treesGrownSession: 0,
    targetEndTime: null,
  });

  // Data states (Local Storage)
  const [tasks, setTasks] = useState<Task[]>(() => JSON.parse(localStorage.getItem('focusflow_tasks') || '[]'));
  const [subjects, setSubjects] = useState<Subject[]>(() => JSON.parse(localStorage.getItem('focusflow_subjects') || '[]'));
  const [topics, setTopics] = useState<Topic[]>(() => JSON.parse(localStorage.getItem('focusflow_topics') || '[]'));
  const [focusHistory, setFocusHistory] = useState<Record<string, number>>(() => JSON.parse(localStorage.getItem('focusflow_history') || '{}'));
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => JSON.parse(localStorage.getItem('focusflow_journal') || '[]'));
  const [focusTimeToday, setFocusTimeToday] = useState<number>(() => {
    const history = JSON.parse(localStorage.getItem('focusflow_history') || '{}');
    const todayStr = new Date().toISOString().split('T')[0];
    return history[todayStr] || 0;
  });

  const [youtubeChannels, setYoutubeChannels] = useState<YouTubeChannel[]>(() => JSON.parse(localStorage.getItem('focusflow_youtube') || '[]'));
  const [telegramChannels, setTelegramChannels] = useState<TelegramChannel[]>(() => JSON.parse(localStorage.getItem('focusflow_telegram') || '[]'));
  const [studyApps, setStudyApps] = useState<StudyApp[]>(() => JSON.parse(localStorage.getItem('focusflow_studyapps') || '[]'));

  const secondsAccumulator = useRef(0);

  // Global Timer Logic
  useEffect(() => {
    let animationFrameId: number;
    let lastTick = Date.now();

    const tick = () => {
      if (!timerState.isRunning || !timerState.targetEndTime) return;

      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((timerState.targetEndTime - now) / 1000));

      if (remaining !== timerState.timeLeft) {
        setTimerState(prev => ({ ...prev, timeLeft: remaining }));

        // Accumulate focus time
        if (timerState.sessionType === 'focus') {
          const deltaSeconds = Math.floor((now - lastTick) / 1000);
          if (deltaSeconds > 0) {
            secondsAccumulator.current += deltaSeconds;
            lastTick = now;

            if (secondsAccumulator.current >= 60) {
              const minutesToAdd = Math.floor(secondsAccumulator.current / 60);
              secondsAccumulator.current %= 60;
              
              addFocusTime(minutesToAdd);
              if (timerState.selectedSubjectId) addSubjectTime(timerState.selectedSubjectId, minutesToAdd);
              if (timerState.selectedTopicId) addTopicTime(timerState.selectedTopicId, minutesToAdd);
              updateUserCoins(minutesToAdd * 2); // Award 2 coins per minute studied
            }
          }
        }
      }

      if (remaining <= 0) {
        // Timer Finished
        setTimerState(prev => ({ ...prev, isRunning: false, targetEndTime: null }));
        
        if (timerState.sessionType === 'focus') {
          const taskName = timerState.selectedTaskId ? tasks.find(t => t.id === timerState.selectedTaskId)?.title : null;
          showToast(`Session complete! ${taskName ? `Worked on: ${taskName}. ` : ''}Tree Grown! 🌳`, "success");
          
          if (timerState.treeState === 'growing') {
            setTimerState(prev => ({ ...prev, treesGrownSession: prev.treesGrownSession + 1 }));
            addTreeGrown();
          }
          
          setTimerState(prev => ({
            ...prev,
            sessionType: 'break',
            timeLeft: prev.breakDuration * 60,
            initialTime: prev.breakDuration * 60
          }));
        } else {
          showToast("Break over! Time to focus.", "info");
          setTimerState(prev => ({
            ...prev,
            sessionType: 'focus',
            treeState: 'growing',
            timeLeft: prev.focusDuration * 60,
            initialTime: prev.focusDuration * 60
          }));
        }
      } else {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    if (timerState.isRunning) {
      animationFrameId = requestAnimationFrame(tick);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [timerState.isRunning, timerState.targetEndTime, timerState.timeLeft, timerState.sessionType, timerState.selectedSubjectId, timerState.selectedTopicId, timerState.selectedTaskId, timerState.treeState, tasks]);

  // Sync with live_students collection globally
  useEffect(() => {
    if (!user || !firebaseUser) return;
    
    const liveRef = doc(db, 'live_students', firebaseUser.uid);
    
    if (timerState.isRunning && timerState.sessionType === 'focus') {
      const subjectName = subjects.find(s => s.id === timerState.selectedSubjectId)?.name || 'General';
      const topicName = topics.find(t => t.id === timerState.selectedTopicId)?.title || 'Studying';
      
      setDoc(liveRef, {
        userId: firebaseUser.uid,
        name: user.name || 'Student',
        avatar: user.name ? user.name.charAt(0).toUpperCase() : 'S',
        subject: subjectName,
        topic: topicName,
        status: 'focusing',
        startTime: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }).catch(console.error);
    } else {
      deleteDoc(liveRef).catch(console.error);
    }

    // Cleanup on unmount (e.g. user logs out or closes app)
    return () => {
      deleteDoc(liveRef).catch(console.error);
    };
  }, [timerState.isRunning, timerState.sessionType, user, firebaseUser, timerState.selectedSubjectId, timerState.selectedTopicId, subjects, topics]);

  // Save to Local Storage
  useEffect(() => localStorage.setItem('focusflow_tasks', JSON.stringify(tasks)), [tasks]);
  useEffect(() => localStorage.setItem('focusflow_subjects', JSON.stringify(subjects)), [subjects]);
  useEffect(() => localStorage.setItem('focusflow_topics', JSON.stringify(topics)), [topics]);
  useEffect(() => localStorage.setItem('focusflow_history', JSON.stringify(focusHistory)), [focusHistory]);
  useEffect(() => localStorage.setItem('focusflow_journal', JSON.stringify(journalEntries)), [journalEntries]);
  useEffect(() => localStorage.setItem('focusflow_youtube', JSON.stringify(youtubeChannels)), [youtubeChannels]);
  useEffect(() => localStorage.setItem('focusflow_telegram', JSON.stringify(telegramChannels)), [telegramChannels]);
  useEffect(() => localStorage.setItem('focusflow_studyapps', JSON.stringify(studyApps)), [studyApps]);

  // Auth Listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      showToast("Back online! Syncing data...", "success");
    };
    const handleOffline = () => {
      setIsOffline(true);
      showToast("You are offline. Zen Mode activated 📴", "info");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        // Fetch user from Firestore
        const userRef = doc(db, 'users', fUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            setUserState(userSnap.data() as User);
          } else {
            // Create new user in Firestore
            const newUser: User = {
              uid: fUser.uid,
              name: fUser.displayName || 'Student',
              email: fUser.email || '',
              photoURL: fUser.photoURL || '',
              dream: 'Crack the exam',
              examDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
              targetHours: 6,
              role: 'user',
              focusCoins: 0
            };
            await setDoc(userRef, newUser);
            setUserState(newUser);
          }
        } catch (error) {
          console.error("Error fetching user data, might be offline", error);
          // If offline and no cache, we can't do much, but we shouldn't crash
        }
      } else {
        setUserState(null);
        // Do not clear local data, allow offline/local usage
      }
      setIsAuthReady(true);
    });
    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);



  // Sync subject timeSpent with topics timeSpent for backward compatibility
  useEffect(() => {
    let changed = false;
    const syncedSubjects = subjects.map(s => {
      const topicsTime = topics.filter(t => t.subjectId === s.id).reduce((acc, t) => acc + t.timeSpent, 0);
      if ((s.timeSpent || 0) < topicsTime) {
        changed = true;
        return { ...s, timeSpent: topicsTime };
      }
      return s;
    });
    if (changed) {
      setSubjects(syncedSubjects);
    }
  }, [topics]);

  const getStreak = () => {
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    
    const sortedDates = Object.keys(focusHistory).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    if (sortedDates.length === 0) return { currentStreak: 0, bestStreak: 0 };

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const minMins = user?.minimumDailyMinutes || 0;

    // Calculate current streak
    let checkDate = new Date();
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const hasMetGoal = focusHistory[dateStr] && focusHistory[dateStr] > 0 && focusHistory[dateStr] >= minMins;
      if (hasMetGoal) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (dateStr === today) {
        // If today has no focus time, check yesterday
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate best streak
    const allDatesAsc = Object.keys(focusHistory).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    let prevDate: Date | null = null;
    
    for (const dateStr of allDatesAsc) {
      const hasMetGoal = focusHistory[dateStr] && focusHistory[dateStr] > 0 && focusHistory[dateStr] >= minMins;
      if (hasMetGoal) {
        const currDate = new Date(dateStr);
        if (!prevDate) {
          tempStreak = 1;
        } else {
          const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));
          if (diffDays === 1) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
        }
        bestStreak = Math.max(bestStreak, tempStreak);
        prevDate = currDate;
      }
    }

    return { currentStreak, bestStreak };
  };

  const { currentStreak, bestStreak } = getStreak();

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    if (user) localStorage.setItem('focusflow_user', JSON.stringify(user));
  }, [user]);

  const setUser = async (newUser: User) => {
    setUserState(newUser);
    if (firebaseUser) {
      const userRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userRef, { ...newUser });
    }
  };

  const addTask = async (task: Omit<Task, 'id'>) => {
    const newTask = { ...task, id: Math.random().toString(36).substr(2, 9) };
    setTasks(prev => [...prev, newTask as Task]);
  };

  const toggleTask = async (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        if (!t.completed) {
          showToast("Task completed!", "success");
        }
        return { ...t, completed: !t.completed };
      }
      return t;
    }));
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const editTask = async (id: string, updatedTask: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updatedTask } : t));
  };

  const addSubject = async (subject: Omit<Subject, 'id'>) => {
    const newSubject = { ...subject, id: Math.random().toString(36).substr(2, 9) };
    setSubjects(prev => [...prev, newSubject as Subject]);
  };

  const deleteSubject = async (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    setTopics(prev => prev.filter(t => t.subjectId !== id));
  };

  const addSubjectTime = async (id: string, mins: number) => {
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, timeSpent: (s.timeSpent || 0) + mins } : s));
  };

  const addTopic = async (topic: Omit<Topic, 'id' | 'timeSpent' | 'status' | 'lastUpdated'>) => {
    const newTopic = {
      ...topic,
      id: Math.random().toString(36).substr(2, 9),
      status: 'Pending' as const,
      timeSpent: 0,
      lastUpdated: new Date().toISOString()
    };
    setTopics(prev => [...prev, newTopic as Topic]);
  };

  const deleteTopic = async (id: string) => {
    setTopics(prev => prev.filter(t => t.id !== id));
  };

  const toggleTopicStatus = async (id: string) => {
    setTopics(prev => prev.map(t => {
      if (t.id === id) {
        if (t.status !== 'Completed') {
          showToast("Topic completed!", "success");
        }
        const newStatus = t.status === 'Completed' ? 'In Progress' : 'Completed';
        return { 
          ...t, 
          status: newStatus, 
          timeSpent: newStatus === 'Completed' ? Math.max(t.timeSpent, t.targetMinutes) : t.timeSpent 
        };
      }
      return t;
    }));
  };

  const addTopicTime = async (id: string, mins: number) => {
    setTopics(prev => prev.map(t => {
      if (t.id === id) {
        const newTime = t.timeSpent + mins;
        const isCompleted = newTime >= t.targetMinutes;
        if (isCompleted && t.status !== 'Completed') {
          showToast("Topic auto-completed!", "success");
        }
        return {
          ...t,
          timeSpent: newTime,
          status: isCompleted ? 'Completed' : 'In Progress',
          lastUpdated: new Date().toISOString()
        };
      }
      return t;
    }));
  };

  const addFocusTime = async (mins: number) => {
    const today = new Date().toISOString().split('T')[0];
    setFocusHistory(prev => {
      const currentMins = prev[today] || 0;
      const newMins = currentMins + mins;
      setFocusTimeToday(newMins);
      return { ...prev, [today]: newMins };
    });

    // Update total focus minutes on user document (Firebase)
    if (user) {
      const newTotal = (user.totalFocusMinutes || 0) + mins;
      setUser({ ...user, totalFocusMinutes: newTotal });
      if (firebaseUser) {
        try {
          await updateDoc(doc(db, 'users', firebaseUser.uid), { totalFocusMinutes: newTotal });
        } catch (error) {
          console.error("Error updating total focus minutes:", error);
        }
      }
    }
  };

  const addJournalEntry = async (entry: Omit<JournalEntry, 'id' | 'date'>) => {
    const newEntry = {
      ...entry,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString()
    };
    setJournalEntries(prev => [newEntry as JournalEntry, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const updateUserCoins = (amount: number) => {
    setUserState(prev => {
      if (!prev) return prev;
      const newCoins = Math.max(0, (prev.focusCoins || 0) + amount);
      const updatedUser = { ...prev, focusCoins: newCoins };
      
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        updateDoc(userRef, { focusCoins: newCoins }).catch(err => console.error("Error updating coins in Firestore", err));
      }
      return updatedUser;
    });
  };

  const addTreeGrown = () => {
    setUserState(prev => {
      if (!prev) return prev;
      const newTrees = (prev.treesGrown || 0) + 1;
      const updatedUser = { ...prev, treesGrown: newTrees };
      
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        updateDoc(userRef, { treesGrown: newTrees }).catch(err => console.error("Error updating trees in Firestore", err));
      }
      return updatedUser;
    });
  };

  const addYouTubeChannel = async (channel: Omit<YouTubeChannel, 'id' | 'createdAt'>) => {
    const newChannel = {
      ...channel,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    setYoutubeChannels(prev => [newChannel as YouTubeChannel, ...prev]);
    showToast("YouTube Channel added!", "success");
  };

  const deleteYouTubeChannel = async (id: string) => {
    setYoutubeChannels(prev => prev.filter(c => c.id !== id));
    showToast("YouTube Channel deleted.", "info");
  };

  const addTelegramChannel = async (channel: Omit<TelegramChannel, 'id' | 'createdAt'>) => {
    const newChannel = {
      ...channel,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    setTelegramChannels(prev => [newChannel as TelegramChannel, ...prev]);
    showToast("Telegram Channel added!", "success");
  };

  const deleteTelegramChannel = async (id: string) => {
    setTelegramChannels(prev => prev.filter(c => c.id !== id));
    showToast("Telegram Channel deleted.", "info");
  };

  const addStudyApp = async (app: Omit<StudyApp, 'id' | 'createdAt'>) => {
    const newApp = {
      ...app,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    setStudyApps(prev => [newApp as StudyApp, ...prev]);
    showToast("Study App added!", "success");
  };

  const deleteStudyApp = async (id: string) => {
    setStudyApps(prev => prev.filter(a => a.id !== id));
    showToast("Study App deleted.", "info");
  };

  return (
    <StoreContext.Provider value={{
      user, setUser, firebaseUser, isAuthReady, theme, toggleTheme, tasks, addTask, toggleTask, deleteTask, editTask,
      subjects, addSubject, deleteSubject, addSubjectTime, topics, addTopic, deleteTopic, toggleTopicStatus, addTopicTime,
      focusTimeToday, focusHistory, currentStreak, bestStreak, addFocusTime, journalEntries, addJournalEntry,
      toasts, showToast, removeToast, updateUserCoins, addTreeGrown, isOffline,
      youtubeChannels, addYouTubeChannel, deleteYouTubeChannel,
      telegramChannels, addTelegramChannel, deleteTelegramChannel,
      studyApps, addStudyApp, deleteStudyApp,
      timerState, setTimerState
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
