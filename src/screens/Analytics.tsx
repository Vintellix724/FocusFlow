import React, { useState, useMemo, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { useStore } from '../context/StoreContext';
import { updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

type Timeframe = 'daily' | 'weekly' | 'monthly' | 'total';

// Custom Animated Number Component
const AnimatedNumber = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = displayValue;
    const end = value;
    if (start === end) return;
    
    const duration = 800;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      const current = start + (end - start) * easeProgress;
      setDisplayValue(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(end);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value]);

  return <span>{displayValue.toFixed(1)}</span>;
};

export default function Analytics() {
  const { user, setUser, showToast, currentStreak, focusHistory, tasks, subjects } = useStore();
  const [timeframe, setTimeframe] = useState<Timeframe>('daily');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { photoURL: base64String });
        }
        if (user) {
          setUser({ ...user, photoURL: base64String });
          showToast("Profile picture updated!", "success");
        }
      } catch (error) {
        showToast("Failed to update profile picture", "error");
      }
    };
    reader.readAsDataURL(file);
  };

  // --- AGGREGATION LAYER ---
  const aggregatedData = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    let graphData: any[] = [];
    let totalHours = 0;
    let previousPeriodHours = 0;
    let activeDays = 0;
    let startDateStr = '';

    // Calculate Graph Data & Totals based on Timeframe
    if (timeframe === 'daily') {
      // Last 7 Days
      const d = new Date(today);
      d.setDate(d.getDate() - 7);
      startDateStr = d.toISOString().split('T')[0];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const mins = focusHistory[dateStr] || 0;
        if (mins > 0) activeDays++;
        const hours = mins / 60;
        totalHours += hours;
        graphData.push({
          name: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()],
          hours: Number(hours.toFixed(1)),
          date: dateStr
        });
      }

      // Previous 7 days for trend
      for (let i = 13; i >= 7; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        previousPeriodHours += (focusHistory[dateStr] || 0) / 60;
      }

    } else if (timeframe === 'weekly') {
      // Last 4 Weeks
      const d = new Date(today);
      d.setDate(d.getDate() - 28);
      startDateStr = d.toISOString().split('T')[0];

      for (let i = 3; i >= 0; i--) {
        let weekMins = 0;
        for (let j = 0; j < 7; j++) {
          const d = new Date(today);
          d.setDate(d.getDate() - (i * 7 + j));
          const dateStr = d.toISOString().split('T')[0];
          const mins = focusHistory[dateStr] || 0;
          if (mins > 0) activeDays++;
          weekMins += mins;
        }
        const hours = weekMins / 60;
        totalHours += hours;
        graphData.push({
          name: `W${4-i}`,
          hours: Number(hours.toFixed(1))
        });
      }

      // Previous 4 weeks for trend
      for (let i = 7; i >= 4; i--) {
        for (let j = 0; j < 7; j++) {
          const d = new Date(today);
          d.setDate(d.getDate() - (i * 7 + j));
          const dateStr = d.toISOString().split('T')[0];
          previousPeriodHours += (focusHistory[dateStr] || 0) / 60;
        }
      }

    } else if (timeframe === 'monthly') {
      // Last 6 Months
      const d = new Date(today);
      d.setMonth(d.getMonth() - 6);
      startDateStr = d.toISOString().split('T')[0];

      for (let i = 5; i >= 0; i--) {
        const d = new Date(today);
        d.setMonth(d.getMonth() - i);
        const monthPrefix = d.toISOString().slice(0, 7);
        let monthMins = 0;
        Object.keys(focusHistory).forEach(date => {
          if (date.startsWith(monthPrefix)) {
            monthMins += focusHistory[date];
            if (focusHistory[date] > 0) activeDays++;
          }
        });
        const hours = monthMins / 60;
        totalHours += hours;
        graphData.push({
          name: d.toLocaleString('default', { month: 'short' }),
          hours: Number(hours.toFixed(1))
        });
      }

      // Previous 6 months for trend
      for (let i = 11; i >= 6; i--) {
        const d = new Date(today);
        d.setMonth(d.getMonth() - i);
        const monthPrefix = d.toISOString().slice(0, 7);
        Object.keys(focusHistory).forEach(date => {
          if (date.startsWith(monthPrefix)) {
            previousPeriodHours += focusHistory[date] / 60;
          }
        });
      }

    } else {
      // Total (Cumulative)
      startDateStr = '2000-01-01';
      const sortedDates = Object.keys(focusHistory).sort();
      let cumulativeMins = 0;
      
      if (sortedDates.length === 0) {
        graphData.push({ name: 'Today', hours: 0 });
      } else {
        graphData = sortedDates.map(date => {
          cumulativeMins += focusHistory[date];
          if (focusHistory[date] > 0) activeDays++;
          return {
            name: date.slice(5), // MM-DD
            hours: Number((cumulativeMins / 60).toFixed(1))
          };
        });
      }
      totalHours = cumulativeMins / 60;
      previousPeriodHours = 0; // No trend for total
    }

    // Calculate Trend Percentage
    let trendPercent = 0;
    if (previousPeriodHours > 0) {
      trendPercent = ((totalHours - previousPeriodHours) / previousPeriodHours) * 100;
    } else if (totalHours > 0) {
      trendPercent = 100;
    }

    // Subject Breakdown
    const subjectMap: Record<string, { timeSpent: number, targetMinutes: number }> = {};
    let totalSubjectMins = 0;
    
    subjects.forEach(s => {
      subjectMap[s.name] = {
        timeSpent: s.timeSpent || 0,
        targetMinutes: s.targetMinutes || 0
      };
      totalSubjectMins += s.timeSpent || 0;
    });

    const COLORS = ['#7c3aed', '#db2777', '#0284c7', '#ea580c', '#16a34a', '#9333ea'];
    const subjectsList = Object.entries(subjectMap)
      .filter(([_, data]) => data.timeSpent > 0 || data.targetMinutes > 0)
      .map(([subject, data], index) => {
        const hours = Number((data.timeSpent / 60).toFixed(1));
        const targetHours = Number((data.targetMinutes / 60).toFixed(1));
        const percentage = totalSubjectMins > 0 ? Math.round((data.timeSpent / totalSubjectMins) * 100) : 0;
        return {
          name: subject,
          value: hours,
          targetValue: targetHours,
          percentage,
          color: COLORS[index % COLORS.length]
        };
      }).sort((a, b) => b.value - a.value);

    // Local Insights Generation
    let insight = "Keep up the good work! Start tracking your sessions to see insights.";
    let insightIcon = "lightbulb";
    let insightColor = "text-tertiary";

    if (subjectsList.length > 0) {
      const topSubject = subjectsList[0];
      if (timeframe === 'daily' && trendPercent > 20) {
        insight = `🔥 Amazing! You've studied ${trendPercent.toFixed(0)}% more this week compared to last week.`;
        insightIcon = "trending_up";
        insightColor = "text-primary";
      } else if (topSubject.percentage > 50) {
        insight = `📚 You're heavily focused on ${topSubject.name} (${topSubject.percentage}% of your time). Don't forget other subjects!`;
        insightIcon = "pie_chart";
        insightColor = "text-secondary";
      } else if (timeframe === 'weekly' && activeDays < 3) {
        insight = `⚠️ Consistency is key! Try to study a little bit every day rather than cramming.`;
        insightIcon = "warning";
        insightColor = "text-error";
      } else {
        insight = `✨ ${topSubject.name} is your strongest subject right now with ${topSubject.value} hours.`;
        insightIcon = "stars";
        insightColor = "text-tertiary";
      }
    }

    // --- ADVANCED ANALYTICS ---
    // 1. Heatmap Data (Last 90 Days)
    const heatmapData = Array.from({ length: 90 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (89 - i));
      const dateStr = d.toISOString().split('T')[0];
      return {
        date: dateStr,
        count: focusHistory[dateStr] || 0
      };
    });

    // 2. Task Completion Rate
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 3. Most Productive Day
    const dayStats = [0,0,0,0,0,0,0];
    const dayCounts = [0,0,0,0,0,0,0];
    Object.entries(focusHistory).forEach(([dateStr, mins]) => {
      const d = new Date(dateStr);
      const day = d.getDay();
      dayStats[day] += mins;
      dayCounts[day] += 1;
    });
    const dayAverages = dayStats.map((total, i) => dayCounts[i] > 0 ? total / dayCounts[i] : 0);
    const maxAvg = Math.max(...dayAverages);
    const bestDayIndex = dayAverages.indexOf(maxAvg);
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const bestDay = maxAvg > 0 ? daysOfWeek[bestDayIndex] : 'N/A';

    // 4. Radar Chart Data
    const radarData = Object.entries(subjectMap).map(([subject, data]) => ({
      subject: subject.length > 10 ? subject.substring(0, 10) + '...' : subject,
      hours: Number((data.timeSpent / 60).toFixed(1)),
      fullMark: Math.max(Number((data.targetMinutes / 60).toFixed(1)), Number((data.timeSpent / 60).toFixed(1)), 1)
    }));

    return {
      graphData,
      totalHours,
      activeDays,
      trendPercent,
      subjectsList,
      insight,
      insightIcon,
      insightColor,
      heatmapData,
      completionRate,
      bestDay,
      radarData
    };
  }, [timeframe, focusHistory, tasks, subjects]);

  // --- UI STATE ---
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [editHours, setEditHours] = useState(user?.targetHours?.toString() || '6');
  const [isEditingMinMins, setIsEditingMinMins] = useState(false);
  const [editMinMins, setEditMinMins] = useState(user?.minimumDailyMinutes?.toString() || '0');

  const handleSaveName = () => {
    if (user && editName.trim()) {
      setUser({ ...user, name: editName.trim() });
      setIsEditingName(false);
      showToast("Name updated!", "success");
    }
  };

  const handleSaveHours = () => {
    const hours = parseFloat(editHours);
    if (user && !isNaN(hours) && hours > 0 && hours <= 24) {
      setUser({ ...user, targetHours: hours });
      setIsEditingHours(false);
      showToast("Target hours updated!", "success");
    } else {
      showToast("Please enter a valid number between 1 and 24", "error");
    }
  };

  const handleSaveMinMins = () => {
    const mins = parseInt(editMinMins);
    if (user && !isNaN(mins) && mins >= 0) {
      setUser({ ...user, minimumDailyMinutes: mins });
      setIsEditingMinMins(false);
      showToast("Minimum streak minutes updated!", "success");
    } else {
      showToast("Please enter a valid number of minutes", "error");
    }
  };

  const toggleNotifications = async () => {
    if (!user) return;
    
    if (!user.notificationsEnabled) {
      if ('Notification' in window) {
        try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            setUser({ ...user, notificationsEnabled: true });
            showToast("Notifications enabled!", "success");
          } else {
            // In iframe preview, permissions might be blocked. Simulate it.
            setUser({ ...user, notificationsEnabled: true });
            showToast("Notifications enabled (Simulated in preview)", "success");
          }
        } catch (error) {
          setUser({ ...user, notificationsEnabled: true });
          showToast("Notifications enabled (Simulated in preview)", "success");
        }
      } else {
        setUser({ ...user, notificationsEnabled: true });
        showToast("Notifications enabled (Simulated)", "success");
      }
    } else {
      setUser({ ...user, notificationsEnabled: false });
      showToast("Notifications disabled", "info");
    }
  };

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface-container-highest/90 backdrop-blur-md border border-outline-variant/20 p-3 rounded-xl shadow-xl">
          <p className="font-label text-xs uppercase tracking-wider text-on-surface-variant mb-1">{label}</p>
          <p className="font-mono font-bold text-primary text-lg">
            {payload[0].value} <span className="text-xs font-normal text-on-surface">hrs</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen pb-32">
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl pl-16 pr-6 py-4 border-b border-outline-variant/10 flex justify-between items-center">
        <h1 className="font-syne font-bold text-2xl text-on-surface">Analytics</h1>
      </header>

      <main className="p-6 max-w-5xl mx-auto space-y-6">
        
        {/* Profile & Quick Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 bg-surface-container-high rounded-3xl p-6 border border-outline-variant/10 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 blur-2xl rounded-full"></div>
            
            <div className="relative group mb-4">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/30">
                <img 
                  alt="User Profile" 
                  className="w-full h-full object-cover" 
                  src={user?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + (user?.name || 'Student')}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-primary text-on-primary font-bold text-xl">${(user?.name || 'S').charAt(0).toUpperCase()}</div>`;
                  }}
                />
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-7 h-7 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              >
                <span className="material-symbols-outlined text-[14px]">edit</span>
              </button>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            </div>

            {isEditingName ? (
              <div className="flex items-center gap-2 mb-1">
                <input 
                  type="text" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-surface-container-highest border border-outline-variant/30 rounded px-2 py-1 text-on-surface font-syne font-bold text-lg w-full max-w-[150px] outline-none focus:border-primary text-center"
                  autoFocus
                  onBlur={handleSaveName}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                />
              </div>
            ) : (
              <h2 className="font-syne font-bold text-xl text-on-surface flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingName(true)}>
                {user?.name || 'Student'}
                <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant">edit</span>
              </h2>
            )}
            
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <div className="inline-flex items-center gap-1.5 bg-tertiary/10 text-tertiary px-3 py-1 rounded-full border border-tertiary/20">
                <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
                <span className="font-label text-[10px] uppercase tracking-wider font-bold">{currentStreak} Day Streak</span>
              </div>
              
              {isEditingHours ? (
                <div className="flex items-center gap-1 bg-surface-container-highest px-3 py-1 rounded-full border border-primary/20">
                  <span className="text-[10px] font-label uppercase tracking-wider text-primary">🎯</span>
                  <input 
                    type="number" 
                    value={editHours} 
                    onChange={(e) => setEditHours(e.target.value)}
                    className="bg-transparent border-b border-primary/50 w-8 text-center text-[10px] font-label text-primary outline-none"
                    autoFocus
                    onBlur={handleSaveHours}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveHours()}
                  />
                  <span className="text-[10px] font-label uppercase tracking-wider text-primary">h / day</span>
                </div>
              ) : (
                <span 
                  onClick={() => setIsEditingHours(true)}
                  className="bg-surface-container-highest text-[10px] px-3 py-1 rounded-full font-label uppercase tracking-wider text-primary border border-primary/20 flex items-center gap-1 cursor-pointer hover:bg-primary/10 transition-colors"
                >
                  🎯 {user?.targetHours || 6}h / day
                  <span className="material-symbols-outlined text-[12px] opacity-50">edit</span>
                </span>
              )}

              {isEditingMinMins ? (
                <div className="flex items-center gap-1 bg-surface-container-highest px-3 py-1 rounded-full border border-secondary/20">
                  <span className="text-[10px] font-label uppercase tracking-wider text-secondary">⏳ Min</span>
                  <input 
                    type="number" 
                    value={editMinMins} 
                    onChange={(e) => setEditMinMins(e.target.value)}
                    className="bg-transparent border-b border-secondary/50 w-8 text-center text-[10px] font-label text-secondary outline-none"
                    autoFocus
                    onBlur={handleSaveMinMins}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveMinMins()}
                  />
                  <span className="text-[10px] font-label uppercase tracking-wider text-secondary">m / day</span>
                </div>
              ) : (
                <span 
                  onClick={() => setIsEditingMinMins(true)}
                  className="bg-surface-container-highest text-[10px] px-3 py-1 rounded-full font-label uppercase tracking-wider text-secondary border border-secondary/20 flex items-center gap-1 cursor-pointer hover:bg-secondary/10 transition-colors"
                  title="Minimum minutes required to maintain streak"
                >
                  ⏳ Min {user?.minimumDailyMinutes || 0}m / day
                  <span className="material-symbols-outlined text-[12px] opacity-50">edit</span>
                </span>
              )}

              <button
                onClick={toggleNotifications}
                className={`bg-surface-container-highest text-[10px] px-3 py-1 rounded-full font-label uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors ${user?.notificationsEnabled ? 'text-primary border border-primary/20 hover:bg-primary/10' : 'text-on-surface-variant border border-outline-variant/20 hover:bg-surface-container-highest'}`}
              >
                <span className="material-symbols-outlined text-[12px]">
                  {user?.notificationsEnabled ? 'notifications_active' : 'notifications_off'}
                </span>
                {user?.notificationsEnabled ? 'Notifs On' : 'Notifs Off'}
              </button>
            </div>
          </div>

          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div className="bg-surface-container-high rounded-3xl p-6 border border-outline-variant/10 shadow-sm flex flex-col justify-center relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/10 blur-xl rounded-full"></div>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary">timer</span>
                <h3 className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Total Time</h3>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-mono font-bold text-5xl text-on-surface tracking-tighter">
                  <AnimatedNumber value={aggregatedData.totalHours} />
                </span>
                <span className="font-mono text-sm text-on-surface-variant">hrs</span>
              </div>
              {timeframe !== 'total' && (
                <p className={clsx("font-mono text-xs mt-3 flex items-center gap-1", aggregatedData.trendPercent >= 0 ? "text-primary" : "text-error")}>
                  <span className="material-symbols-outlined text-[14px]">
                    {aggregatedData.trendPercent >= 0 ? 'trending_up' : 'trending_down'}
                  </span>
                  {Math.abs(aggregatedData.trendPercent).toFixed(0)}% vs last period
                </p>
              )}
            </div>

            <div className="bg-surface-container-high rounded-3xl p-6 border border-outline-variant/10 shadow-sm flex flex-col justify-center relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-secondary/10 blur-xl rounded-full"></div>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-secondary">calendar_month</span>
                <h3 className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Active Days</h3>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-mono font-bold text-5xl text-on-surface tracking-tighter">
                  <AnimatedNumber value={aggregatedData.activeDays} />
                </span>
                <span className="font-mono text-sm text-on-surface-variant">days</span>
              </div>
              <p className="font-mono text-xs text-on-surface-variant mt-3">
                In selected timeframe
              </p>
            </div>
          </div>
        </section>

        {/* Local Insights Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          key={aggregatedData.insight}
          className="bg-surface-container-highest/50 border border-outline-variant/20 rounded-2xl p-4 flex items-start sm:items-center gap-3 relative overflow-hidden"
        >
          <div className={clsx("p-2 rounded-full bg-surface-container-lowest shadow-sm", aggregatedData.insightColor)}>
            <span className="material-symbols-outlined text-[20px]">{aggregatedData.insightIcon}</span>
          </div>
          <p className="font-body text-sm text-on-surface-variant leading-relaxed">
            <strong className="text-on-surface font-syne">Insight: </strong>
            {aggregatedData.insight}
          </p>
        </motion.div>

        {/* The Stage (Graph Area) */}
        <section className="bg-surface-container-high rounded-3xl p-6 border border-outline-variant/10 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h2 className="font-syne font-bold text-xl text-on-surface">Study Trends</h2>
            
            {/* Time Range Toggle */}
            <div className="flex bg-surface-container-highest rounded-full p-1 border border-outline-variant/20 w-full sm:w-auto overflow-x-auto no-scrollbar">
              {(['daily', 'weekly', 'monthly', 'total'] as Timeframe[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={clsx(
                    "flex-1 sm:flex-none px-2 sm:px-4 py-1.5 rounded-full font-label text-[10px] sm:text-[11px] uppercase tracking-wider sm:tracking-widest transition-all relative whitespace-nowrap",
                    timeframe === t ? "text-on-primary" : "text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  {timeframe === t && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary rounded-full shadow-sm"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">{t}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-[300px] w-full relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={timeframe}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full h-full absolute inset-0"
              >
                <ResponsiveContainer width="100%" height="100%">
                  {(timeframe === 'daily' || timeframe === 'total') ? (
                    <LineChart data={aggregatedData.graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#94a3b8" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        dy={10}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(val) => `${val}h`}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Line 
                        type="monotone" 
                        dataKey="hours" 
                        stroke="#7c3aed" 
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#7c3aed', strokeWidth: 2, stroke: '#0f172a' }}
                        activeDot={{ r: 6, fill: '#a855f7', stroke: '#fff', strokeWidth: 2 }}
                        animationDuration={1500}
                        animationEasing="ease-out"
                      />
                    </LineChart>
                  ) : (
                    <BarChart data={aggregatedData.graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#94a3b8" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        dy={10}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(val) => `${val}h`}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b', opacity: 0.4 }} />
                      <Bar 
                        dataKey="hours" 
                        fill="#7c3aed" 
                        radius={[4, 4, 0, 0]}
                        animationDuration={1500}
                        animationEasing="ease-out"
                      >
                        {aggregatedData.graphData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.hours > 0 ? '#7c3aed' : '#334155'} />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* Subject Breakdown */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-surface-container-high rounded-3xl p-6 border border-outline-variant/10 shadow-sm flex flex-col items-center justify-center">
            <h3 className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-4 self-start">Distribution</h3>
            {aggregatedData.subjectsList.length > 0 ? (
              <div className="w-full h-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={aggregatedData.subjectsList}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                      animationDuration={1500}
                      animationEasing="ease-out"
                    >
                      {aggregatedData.subjectsList.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                      itemStyle={{ color: '#f8fafc', fontFamily: 'JetBrains Mono' }}
                      formatter={(value: number) => [`${value} hrs`, 'Time']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-mono font-bold text-2xl text-on-surface">
                    {aggregatedData.subjectsList.length}
                  </span>
                  <span className="font-label text-[10px] uppercase text-on-surface-variant">Subjects</span>
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <p className="text-sm text-on-surface-variant">No subject data available.</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 bg-surface-container-high rounded-3xl p-6 border border-outline-variant/10 shadow-sm">
            <h3 className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-6">Subject Breakdown</h3>
            <div className="space-y-5">
              {aggregatedData.subjectsList.length > 0 ? aggregatedData.subjectsList.map((item, i) => (
                <motion.div 
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="font-syne font-bold text-sm">{item.name}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono font-bold text-sm">{item.value.toFixed(1)}h / {item.targetValue.toFixed(1)}h</span>
                      <span className="font-mono text-xs text-on-surface-variant w-10 text-right">{item.percentage}%</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-surface-container-lowest rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      transition={{ duration: 1, delay: 0.2 + (i * 0.1), ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                </motion.div>
              )) : (
                <p className="text-sm text-on-surface-variant text-center py-8">Complete some tasks to see your breakdown.</p>
              )}
            </div>
          </div>
        </section>

        {/* --- ADVANCED ANALYTICS SECTIONS --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Advanced Insights Cards */}
          <div className="space-y-6">
            <div className="bg-surface-container-high rounded-3xl p-6 border border-outline-variant/10 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-3xl">task_alt</span>
              </div>
              <div>
                <h3 className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-1">Task Completion Rate</h3>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono font-bold text-3xl text-on-surface">{aggregatedData.completionRate}</span>
                  <span className="font-mono text-sm text-on-surface-variant">%</span>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-high rounded-3xl p-6 border border-outline-variant/10 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-tertiary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-tertiary text-3xl">event_available</span>
              </div>
              <div>
                <h3 className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-1">Most Productive Day</h3>
                <div className="flex items-baseline gap-1">
                  <span className="font-syne font-bold text-2xl text-on-surface">{aggregatedData.bestDay}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="bg-surface-container-high rounded-3xl p-6 border border-outline-variant/10 shadow-sm flex flex-col items-center justify-center">
            <h3 className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2 self-start">Subject Mastery (Hours)</h3>
            {aggregatedData.radarData.length >= 3 ? (
              <div className="w-full h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={aggregatedData.radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                    <Radar name="Hours" dataKey="hours" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.5} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                      itemStyle={{ color: '#f8fafc', fontFamily: 'JetBrains Mono' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-center px-4">
                <p className="text-sm text-on-surface-variant">Add at least 3 subjects with tracked time to see your mastery radar.</p>
              </div>
            )}
          </div>
        </section>

        {/* 90-Day Activity Heatmap */}
        <section className="bg-surface-container-high rounded-3xl p-6 border border-outline-variant/10 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-on-surface-variant">grid_on</span>
            <h3 className="font-label text-xs uppercase tracking-widest text-on-surface-variant">90-Day Activity Map</h3>
          </div>
          <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
            {aggregatedData.heatmapData.map((day, i) => {
              // Determine color intensity based on minutes
              let bgColor = "bg-surface-container-highest";
              if (day.count > 0 && day.count <= 30) bgColor = "bg-primary/30";
              else if (day.count > 30 && day.count <= 60) bgColor = "bg-primary/50";
              else if (day.count > 60 && day.count <= 120) bgColor = "bg-primary/70";
              else if (day.count > 120) bgColor = "bg-primary";

              return (
                <div 
                  key={i} 
                  className={clsx("w-3 h-3 sm:w-4 sm:h-4 rounded-sm transition-colors cursor-pointer hover:ring-2 hover:ring-on-surface/50", bgColor)}
                  title={`${day.date}: ${Math.round(day.count)} mins`}
                />
              );
            })}
          </div>
          <div className="flex items-center justify-end gap-2 mt-4 text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-surface-container-highest"></div>
              <div className="w-3 h-3 rounded-sm bg-primary/30"></div>
              <div className="w-3 h-3 rounded-sm bg-primary/50"></div>
              <div className="w-3 h-3 rounded-sm bg-primary/70"></div>
              <div className="w-3 h-3 rounded-sm bg-primary"></div>
            </div>
            <span>More</span>
          </div>
        </section>

      </main>
    </div>
  );
}
