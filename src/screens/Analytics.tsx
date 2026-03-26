import React, { useState, useRef } from 'react';
import { clsx } from 'clsx';
import { useStore } from '../context/StoreContext';
import { updateProfile } from 'firebase/auth';
import { auth } from '../firebase';

export default function Analytics() {
  const { user, setUser, showToast, currentStreak, bestStreak, focusHistory, tasks, subjects } = useStore();
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('week');
  const [showDataLabels, setShowDataLabels] = useState(false);
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

  const getDynamicData = () => {
    const today = new Date();
    let totalFocus = 0;
    let activeDays = 0;
    const distribution: { day: string, hours: number, color: string }[] = [];
    const subjectMap: Record<string, number> = {};
    subjects.forEach(s => {
      subjectMap[s.name] = 0;
    });

    if (timeframe === 'week') {
      const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const mins = focusHistory[dateStr] || 0;
        if (mins > 0) activeDays++;
        const hours = Number((mins / 60).toFixed(1));
        totalFocus += hours;
        distribution.push({
          day: days[d.getDay()],
          hours,
          color: hours > 4 ? 'tertiary' : hours > 2 ? 'primary' : 'secondary'
        });
      }
    } else if (timeframe === 'month') {
      for (let i = 3; i >= 0; i--) {
        let weekHours = 0;
        for (let j = 0; j < 7; j++) {
          const d = new Date(today);
          d.setDate(d.getDate() - (i * 7 + j));
          const dateStr = d.toISOString().split('T')[0];
          const mins = focusHistory[dateStr] || 0;
          if (mins > 0) activeDays++;
          weekHours += mins / 60;
        }
        totalFocus += weekHours;
        distribution.push({
          day: `W${4-i}`,
          hours: Number(weekHours.toFixed(1)),
          color: weekHours > 20 ? 'tertiary' : weekHours > 10 ? 'primary' : 'secondary'
        });
      }
    } else if (timeframe === 'year') {
      for (let i = 3; i >= 0; i--) {
        let quarterHours = 0;
        for (let j = 0; j < 90; j++) {
          const d = new Date(today);
          d.setDate(d.getDate() - (i * 90 + j));
          const dateStr = d.toISOString().split('T')[0];
          const mins = focusHistory[dateStr] || 0;
          if (mins > 0) activeDays++;
          quarterHours += mins / 60;
        }
        totalFocus += quarterHours;
        distribution.push({
          day: `Q${4-i}`,
          hours: Number(quarterHours.toFixed(1)),
          color: quarterHours > 100 ? 'tertiary' : quarterHours > 50 ? 'primary' : 'secondary'
        });
      }
    }

    // Calculate subject breakdown from tasks
    let totalTaskMins = 0;
    tasks.forEach(t => {
      if (t.completed) {
        subjectMap[t.subject] = (subjectMap[t.subject] || 0) + t.duration;
        totalTaskMins += t.duration;
      }
    });

    const subjectsList = Object.entries(subjectMap).map(([subject, mins], index) => {
      const hours = Number((mins / 60).toFixed(1));
      const percentage = totalTaskMins > 0 ? Math.round((mins / totalTaskMins) * 100) : 0;
      const colors = ['primary', 'secondary', 'tertiary', 'error'];
      return {
        subject,
        hours,
        percentage,
        color: colors[index % colors.length]
      };
    }).sort((a, b) => b.hours - a.hours);

    return {
      totalFocus: Number(totalFocus.toFixed(1)),
      activeDays,
      trend: timeframe === 'week' ? '+12%' : timeframe === 'month' ? '+5%' : '+22%', // Dummy trend
      distribution,
      subjects: subjectsList
    };
  };

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

  const currentData = getDynamicData();
  const maxHours = Math.max(...currentData.distribution.map(d => d.hours), 1);

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen pb-32">
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl pl-16 pr-6 py-4 border-b border-outline-variant/10 flex justify-between items-center">
        <h1 className="font-syne font-bold text-2xl text-on-surface">Profile & Analytics</h1>
      </header>

      <main className="p-6 space-y-6">
        {/* Profile Section */}
        <section className="bg-surface-container-high rounded-2xl p-6 border border-outline-variant/10 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/30">
              <img 
                alt="User Profile Avatar" 
                className="w-full h-full object-cover" 
                src={user?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + (user?.name || 'Student')}
                referrerPolicy="no-referrer"
              />
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
          <div className="flex-1 w-full text-center sm:text-left">
            {isEditingName ? (
              <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                <input 
                  type="text" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-surface-container-highest border border-outline-variant/30 rounded px-2 py-1 text-on-surface font-syne font-bold text-xl w-full max-w-[200px] outline-none focus:border-primary"
                  autoFocus
                  onBlur={handleSaveName}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                />
                <button onClick={handleSaveName} className="text-primary"><span className="material-symbols-outlined text-sm">check</span></button>
              </div>
            ) : (
              <h2 className="font-syne font-bold text-xl text-on-surface flex items-center justify-center sm:justify-start gap-2 group cursor-pointer" onClick={() => setIsEditingName(true)}>
                {user?.name || 'Student'}
                <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant">edit</span>
              </h2>
            )}
            
            <p className="font-body text-sm text-on-surface-variant mb-3">{user?.email || 'No email provided'}</p>
            
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              <span className="bg-surface-container-highest text-[10px] px-3 py-1 rounded-full font-label uppercase tracking-wider text-tertiary border border-tertiary/20 flex items-center gap-1">
                🔥 {currentStreak} day streak
              </span>
              
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
                  <button onClick={handleSaveHours} className="text-primary ml-1"><span className="material-symbols-outlined text-[12px]">check</span></button>
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
                  <button onClick={handleSaveMinMins} className="text-secondary ml-1"><span className="material-symbols-outlined text-[12px]">check</span></button>
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
        </section>

        <div className="flex bg-surface-container-high rounded-full p-1 border border-outline-variant/20 mx-auto w-fit">
          {['week', 'month', 'year'].map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t as any)}
              className={clsx(
                "px-6 py-2 rounded-full font-label text-[12px] uppercase tracking-widest transition-all",
                timeframe === t ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <section className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-high rounded-2xl p-5 border border-outline-variant/10 shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-primary/10 blur-xl rounded-full"></div>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-lg">timer</span>
              <h3 className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Total Focus</h3>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono font-bold text-3xl text-on-surface">{currentData.totalFocus}</span>
              <span className="font-mono text-xs text-on-surface-variant">hrs</span>
            </div>
            <p className="font-mono text-[10px] text-tertiary mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">trending_up</span>
              {currentData.trend} vs last {timeframe}
            </p>
          </div>

          <div className="bg-surface-container-high rounded-2xl p-5 border border-outline-variant/10 shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-tertiary/10 blur-xl rounded-full"></div>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-tertiary text-lg">local_fire_department</span>
              <h3 className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Active Days</h3>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono font-bold text-3xl text-on-surface">{currentData.activeDays}</span>
              <span className="font-mono text-xs text-on-surface-variant">days</span>
            </div>
            <p className="font-mono text-[10px] text-on-surface-variant mt-2">
              In this {timeframe}
            </p>
          </div>
        </section>

        <section className="bg-surface-container-high rounded-2xl p-6 border border-outline-variant/10 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-label text-sm uppercase tracking-widest text-on-surface-variant">Focus Distribution</h2>
            <button 
              className={clsx(
                "transition-colors",
                showDataLabels ? "text-primary" : "text-on-surface-variant hover:text-primary-container"
              )} 
              onClick={() => setShowDataLabels(!showDataLabels)}
              title="Toggle Data Labels"
            >
              <span className="material-symbols-outlined text-sm">{showDataLabels ? 'visibility' : 'visibility_off'}</span>
            </button>
          </div>
          
          <div className="flex items-end justify-between h-40 gap-2 mb-4">
            {currentData.distribution.map((data, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                <div className="w-full bg-surface-container-lowest rounded-t-md relative flex items-end justify-center h-full overflow-hidden">
                  <div 
                    className={clsx(
                      "w-full rounded-t-md transition-all duration-500 group-hover:opacity-80",
                      data.color === 'primary' ? 'bg-primary' : data.color === 'tertiary' ? 'bg-tertiary' : 'bg-secondary'
                    )} 
                    style={{ height: `${(data.hours / maxHours) * 100}%` }}
                  ></div>
                  <div className={clsx(
                    "absolute bottom-1 transition-opacity font-mono text-[8px] font-bold text-surface-container-lowest mix-blend-difference",
                    showDataLabels ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}>
                    {data.hours}h
                  </div>
                </div>
                <span className="font-mono text-[10px] uppercase text-on-surface-variant">{data.day}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-surface-container-high rounded-2xl p-6 border border-outline-variant/10 shadow-sm mb-6">
          <h2 className="font-label text-sm uppercase tracking-widest text-on-surface-variant mb-6">Subject Breakdown</h2>
          <div className="space-y-4">
            {currentData.subjects.length > 0 ? currentData.subjects.map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={clsx(
                      "w-2 h-2 rounded-full",
                      item.color === 'primary' ? 'bg-primary' : item.color === 'secondary' ? 'bg-secondary' : item.color === 'tertiary' ? 'bg-tertiary' : 'bg-error'
                    )}></div>
                    <span className="font-syne font-bold text-sm">{item.subject}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono font-bold text-sm">{item.hours}h</span>
                    <span className="font-mono text-[10px] text-on-surface-variant">({item.percentage}%)</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-surface-container-lowest rounded-full overflow-hidden">
                  <div 
                    className={clsx(
                      "h-full rounded-full transition-all duration-500",
                      item.color === 'primary' ? 'bg-primary' : item.color === 'secondary' ? 'bg-secondary' : item.color === 'tertiary' ? 'bg-tertiary' : 'bg-error'
                    )} 
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            )) : (
              <p className="text-sm text-on-surface-variant text-center py-4">No subjects added yet.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
