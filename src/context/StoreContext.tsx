import React, { createContext, useContext, useState, useEffect } from 'react';
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

  // Data states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [focusHistory, setFocusHistory] = useState<Record<string, number>>({});
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [focusTimeToday, setFocusTimeToday] = useState<number>(0);

  const [youtubeChannels, setYoutubeChannels] = useState<YouTubeChannel[]>([]);
  const [telegramChannels, setTelegramChannels] = useState<TelegramChannel[]>([]);
  const [studyApps, setStudyApps] = useState<StudyApp[]>([]);

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
        setTasks([]);
        setSubjects([]);
        setTopics([]);
        setFocusHistory({});
        setJournalEntries([]);
        setFocusTimeToday(0);
      }
      setIsAuthReady(true);
    });
    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Data Listeners
  useEffect(() => {
    if (!isAuthReady || !firebaseUser) return;

    const uid = firebaseUser.uid;

    // Listen to Tasks
    const tasksUnsub = onSnapshot(collection(db, `users/${uid}/tasks`), (snapshot) => {
      const loadedTasks: Task[] = [];
      snapshot.forEach(doc => loadedTasks.push({ id: doc.id, ...doc.data() } as Task));
      setTasks(loadedTasks);
    }, (error) => {
      console.error("Error fetching tasks:", error);
    });

    // Listen to Subjects
    const subjectsUnsub = onSnapshot(collection(db, `users/${uid}/subjects`), (snapshot) => {
      const loadedSubjects: Subject[] = [];
      snapshot.forEach(doc => loadedSubjects.push({ id: doc.id, ...doc.data() } as Subject));
      setSubjects(loadedSubjects);
    }, (error) => {
      console.error("Error fetching subjects:", error);
    });

    // Listen to Topics
    const topicsUnsub = onSnapshot(collection(db, `users/${uid}/topics`), (snapshot) => {
      const loadedTopics: Topic[] = [];
      snapshot.forEach(doc => loadedTopics.push({ id: doc.id, ...doc.data() } as Topic));
      setTopics(loadedTopics);
    }, (error) => {
      console.error("Error fetching topics:", error);
    });

    // Listen to Focus History
    const historyUnsub = onSnapshot(collection(db, `users/${uid}/focusHistory`), (snapshot) => {
      const loadedHistory: Record<string, number> = {};
      let todayMins = 0;
      const todayStr = new Date().toISOString().split('T')[0];

      snapshot.forEach(doc => {
        const data = doc.data();
        loadedHistory[data.date] = data.minutes;
        if (data.date === todayStr) {
          todayMins = data.minutes;
        }
      });
      setFocusHistory(loadedHistory);
      setFocusTimeToday(todayMins);
    }, (error) => {
      console.error("Error fetching focus history:", error);
    });

    // Listen to Journal
    const journalUnsub = onSnapshot(collection(db, `users/${uid}/journal`), (snapshot) => {
      const loadedJournal: JournalEntry[] = [];
      snapshot.forEach(doc => loadedJournal.push({ id: doc.id, ...doc.data() } as JournalEntry));
      setJournalEntries(loadedJournal.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, (error) => {
      console.error("Error fetching journal:", error);
    });

    // Listen to YouTube Channels
    const youtubeUnsub = onSnapshot(collection(db, `users/${uid}/youtube_channels`), (snapshot) => {
      const loadedChannels: YouTubeChannel[] = [];
      snapshot.forEach(doc => loadedChannels.push({ id: doc.id, ...doc.data() } as YouTubeChannel));
      setYoutubeChannels(loadedChannels.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (error) => {
      console.error("Error fetching youtube channels:", error);
    });

    // Listen to Telegram Channels
    const telegramUnsub = onSnapshot(collection(db, `users/${uid}/telegram_channels`), (snapshot) => {
      const loadedChannels: TelegramChannel[] = [];
      snapshot.forEach(doc => loadedChannels.push({ id: doc.id, ...doc.data() } as TelegramChannel));
      setTelegramChannels(loadedChannels.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (error) => {
      console.error("Error fetching telegram channels:", error);
    });

    // Listen to Study Apps
    const studyAppsUnsub = onSnapshot(collection(db, `users/${uid}/study_apps`), (snapshot) => {
      const loadedApps: StudyApp[] = [];
      snapshot.forEach(doc => loadedApps.push({ id: doc.id, ...doc.data() } as StudyApp));
      setStudyApps(loadedApps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (error) => {
      console.error("Error fetching study apps:", error);
    });

    return () => {
      tasksUnsub();
      subjectsUnsub();
      topicsUnsub();
      historyUnsub();
      journalUnsub();
      youtubeUnsub();
      telegramUnsub();
      studyAppsUnsub();
    };
  }, [isAuthReady, firebaseUser]);

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
    if (!firebaseUser) return;
    const taskData = { ...task, userId: firebaseUser.uid };
    await addDoc(collection(db, `users/${firebaseUser.uid}/tasks`), taskData);
  };

  const toggleTask = async (id: string) => {
    if (!firebaseUser) return;
    const task = tasks.find(t => t.id === id);
    if (task) {
      if (!task.completed) {
        updateUserCoins(2);
        showToast("Task completed! +2 Coins", "success");
      }
      const taskRef = doc(db, `users/${firebaseUser.uid}/tasks`, id);
      await updateDoc(taskRef, { completed: !task.completed });
    }
  };

  const deleteTask = async (id: string) => {
    if (!firebaseUser) return;
    await deleteDoc(doc(db, `users/${firebaseUser.uid}/tasks`, id));
  };

  const editTask = async (id: string, updatedTask: Partial<Task>) => {
    if (!firebaseUser) return;
    const taskRef = doc(db, `users/${firebaseUser.uid}/tasks`, id);
    await updateDoc(taskRef, updatedTask);
  };

  const addSubject = async (subject: Omit<Subject, 'id'>) => {
    if (!firebaseUser) return;
    const subjectData = { ...subject, userId: firebaseUser.uid, createdAt: new Date().toISOString() };
    await addDoc(collection(db, `users/${firebaseUser.uid}/subjects`), subjectData);
  };

  const deleteSubject = async (id: string) => {
    if (!firebaseUser) return;
    
    // Delete subject
    await deleteDoc(doc(db, `users/${firebaseUser.uid}/subjects`, id));
    
    // Delete associated topics
    const topicsToDelete = topics.filter(t => t.subjectId === id);
    const batch = writeBatch(db);
    topicsToDelete.forEach(t => {
      const topicRef = doc(db, `users/${firebaseUser.uid}/topics`, t.id);
      batch.delete(topicRef);
    });
    await batch.commit();
  };

  const addSubjectTime = async (id: string, mins: number) => {
    if (!firebaseUser) return;
    const subject = subjects.find(s => s.id === id);
    if (subject) {
      const subjectRef = doc(db, `users/${firebaseUser.uid}/subjects`, id);
      await updateDoc(subjectRef, { timeSpent: (subject.timeSpent || 0) + mins });
    }
  };

  const addTopic = async (topic: Omit<Topic, 'id' | 'timeSpent' | 'status' | 'lastUpdated'>) => {
    if (!firebaseUser) return;
    const topicData = {
      ...topic,
      userId: firebaseUser.uid,
      status: 'Pending',
      timeSpent: 0,
      lastUpdated: new Date().toISOString()
    };
    await addDoc(collection(db, `users/${firebaseUser.uid}/topics`), topicData);
  };

  const deleteTopic = async (id: string) => {
    if (!firebaseUser) return;
    await deleteDoc(doc(db, `users/${firebaseUser.uid}/topics`, id));
  };

  const toggleTopicStatus = async (id: string) => {
    if (!firebaseUser) return;
    const topic = topics.find(t => t.id === id);
    if (topic) {
      if (topic.status !== 'Completed') {
        updateUserCoins(5);
        showToast("Topic completed! +5 Coins", "success");
      }
      const newStatus = topic.status === 'Completed' ? 'In Progress' : 'Completed';
      const topicRef = doc(db, `users/${firebaseUser.uid}/topics`, id);
      await updateDoc(topicRef, { 
        status: newStatus, 
        timeSpent: newStatus === 'Completed' ? Math.max(topic.timeSpent, topic.targetMinutes) : topic.timeSpent 
      });
    }
  };

  const addTopicTime = async (id: string, mins: number) => {
    if (!firebaseUser) return;
    const topic = topics.find(t => t.id === id);
    if (topic) {
      const newTime = topic.timeSpent + mins;
      const isCompleted = newTime >= topic.targetMinutes;
      if (isCompleted && topic.status !== 'Completed') {
        updateUserCoins(5);
        showToast("Topic auto-completed! +5 Coins", "success");
      }
      const topicRef = doc(db, `users/${firebaseUser.uid}/topics`, id);
      await updateDoc(topicRef, {
        timeSpent: newTime,
        status: isCompleted ? 'Completed' : 'In Progress',
        lastUpdated: new Date().toISOString()
      });
    }
  };

  const addFocusTime = async (mins: number) => {
    if (!firebaseUser) return;
    const today = new Date().toISOString().split('T')[0];
    const currentMins = focusHistory[today] || 0;
    const newMins = currentMins + mins;
    
    // Update local state immediately for snappy UI
    setFocusTimeToday(newMins);
    setFocusHistory(prev => ({ ...prev, [today]: newMins }));

    // Update Firestore using setDoc with merge (works perfectly offline without needing getDoc)
    const historyRef = doc(db, `users/${firebaseUser.uid}/focusHistory`, today);
    try {
      await setDoc(historyRef, { userId: firebaseUser.uid, date: today, minutes: newMins }, { merge: true });
    } catch (error) {
      console.error("Error updating focus history:", error);
    }

    // Update total focus minutes on user document
    if (user) {
      const newTotal = (user.totalFocusMinutes || 0) + mins;
      setUser({ ...user, totalFocusMinutes: newTotal });
      try {
        await updateDoc(doc(db, 'users', firebaseUser.uid), { totalFocusMinutes: newTotal });
      } catch (error) {
        console.error("Error updating total focus minutes:", error);
      }
    }
  };

  const addJournalEntry = async (entry: Omit<JournalEntry, 'id' | 'date'>) => {
    if (!firebaseUser) return;
    const entryData = {
      ...entry,
      userId: firebaseUser.uid,
      date: new Date().toISOString()
    };
    await addDoc(collection(db, `users/${firebaseUser.uid}/journal`), entryData);
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
    if (!firebaseUser) return;
    try {
      await addDoc(collection(db, `users/${firebaseUser.uid}/youtube_channels`), {
        ...channel,
        userId: firebaseUser.uid,
        createdAt: new Date().toISOString()
      });
      showToast("YouTube Channel added!", "success");
    } catch (error) {
      console.error("Error adding YouTube channel:", error);
      showToast("Failed to add YouTube channel.", "error");
    }
  };

  const deleteYouTubeChannel = async (id: string) => {
    if (!firebaseUser) return;
    try {
      await deleteDoc(doc(db, `users/${firebaseUser.uid}/youtube_channels`, id));
      showToast("YouTube Channel deleted.", "info");
    } catch (error) {
      console.error("Error deleting YouTube channel:", error);
      showToast("Failed to delete YouTube channel.", "error");
    }
  };

  const addTelegramChannel = async (channel: Omit<TelegramChannel, 'id' | 'createdAt'>) => {
    if (!firebaseUser) return;
    try {
      await addDoc(collection(db, `users/${firebaseUser.uid}/telegram_channels`), {
        ...channel,
        userId: firebaseUser.uid,
        createdAt: new Date().toISOString()
      });
      showToast("Telegram Channel added!", "success");
    } catch (error) {
      console.error("Error adding Telegram channel:", error);
      showToast("Failed to add Telegram channel.", "error");
    }
  };

  const deleteTelegramChannel = async (id: string) => {
    if (!firebaseUser) return;
    try {
      await deleteDoc(doc(db, `users/${firebaseUser.uid}/telegram_channels`, id));
      showToast("Telegram Channel deleted.", "info");
    } catch (error) {
      console.error("Error deleting Telegram channel:", error);
      showToast("Failed to delete Telegram channel.", "error");
    }
  };

  const addStudyApp = async (app: Omit<StudyApp, 'id' | 'createdAt'>) => {
    if (!firebaseUser) return;
    try {
      await addDoc(collection(db, `users/${firebaseUser.uid}/study_apps`), {
        ...app,
        userId: firebaseUser.uid,
        createdAt: new Date().toISOString()
      });
      showToast("Study App added!", "success");
    } catch (error) {
      console.error("Error adding Study App:", error);
      showToast("Failed to add Study App.", "error");
    }
  };

  const deleteStudyApp = async (id: string) => {
    if (!firebaseUser) return;
    try {
      await deleteDoc(doc(db, `users/${firebaseUser.uid}/study_apps`, id));
      showToast("Study App deleted.", "info");
    } catch (error) {
      console.error("Error deleting Study App:", error);
      showToast("Failed to delete Study App.", "error");
    }
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
