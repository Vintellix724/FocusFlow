import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../context/StoreContext';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';

interface LiveStudent {
  id: string;
  userId: string;
  name: string;
  subject: string;
  topic: string;
  status: string;
  avatar: string;
  startTime: string;
}

export default function LiveStudyRoom() {
  const { user } = useStore();
  const navigate = useNavigate();
  const [students, setStudents] = useState<LiveStudent[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const q = query(collection(db, 'live_students'), where('status', '==', 'focusing'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveData: LiveStudent[] = [];
      snapshot.forEach((doc) => {
        liveData.push({ id: doc.id, ...doc.data() } as LiveStudent);
      });
      setStudents(liveData);
    }, (error) => {
      console.error("LiveStudyRoom Error: ", error);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (startTime: string) => {
    if (!startTime) return "00:00";
    const start = new Date(startTime).getTime();
    const diff = Math.max(0, Math.floor((now - start) / 1000));
    const m = Math.floor(diff / 60).toString().padStart(2, '0');
    const s = (diff % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen pb-24">
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl pl-16 pr-6 py-4 border-b border-outline-variant/10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-syne font-bold text-2xl text-on-surface">Live Study Room</h1>
            <p className="text-on-surface-variant text-sm flex items-center gap-1 mt-1">
              <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
              {students.length} studying now
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">groups</span>
          </div>
        </div>
      </header>

      <main className="p-6">
        {students.length === 0 ? (
          <div className="text-center py-12 bg-surface-container-low rounded-2xl border border-outline-variant/10 border-dashed">
            <span className="material-symbols-outlined text-4xl text-outline-variant mb-2">group_off</span>
            <p className="font-body text-sm text-on-surface-variant">No one is studying right now.</p>
            <p className="font-body text-sm text-on-surface-variant mt-1">Be the first to start a focus session!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student, index) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/20 flex items-center gap-4"
              >
                <div className="relative">
                  <div className={clsx(
                    "w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white",
                    student.status === 'focusing' ? "bg-primary" : "bg-surface-variant text-on-surface-variant"
                  )}>
                    {student.avatar}
                  </div>
                  {student.status === 'focusing' && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-error border-2 border-surface-container-low animate-pulse"></span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-on-surface truncate flex items-center gap-2">
                    {student.name}
                    {student.userId === user?.uid && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-sm uppercase tracking-wider">You</span>}
                  </h3>
                  <p className="text-xs text-on-surface-variant truncate">
                    {student.subject} • {student.topic}
                  </p>
                </div>
                
                <div className="text-right flex-shrink-0">
                  <div className={clsx(
                    "text-lg font-mono font-bold tracking-wider",
                    student.status === 'focusing' ? "text-primary" : "text-on-surface-variant"
                  )}>
                    {formatTime(student.startTime)}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider font-label text-error flex items-center justify-end gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
                    LIVE
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        {/* Current User Status */}
        <div className="mt-8 bg-primary/5 rounded-2xl p-6 border border-primary/20 text-center">
          <h2 className="font-syne font-bold text-lg mb-2">Join the Room</h2>
          <p className="text-on-surface-variant text-sm mb-4">
            Start a focus session in the Timer to appear in the Live Study Room and inspire others!
          </p>
          <button 
            onClick={() => navigate('/timer')}
            className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            Start Focusing
          </button>
        </div>
      </main>
    </div>
  );
}
