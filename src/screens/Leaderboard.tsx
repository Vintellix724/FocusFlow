import React, { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

export default function Leaderboard() {
  const { user, showToast } = useStore();
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const q = query(usersCollection, orderBy('totalFocusMinutes', 'desc'), limit(50));
        const usersSnapshot = await getDocs(q);
        const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLeaders(usersList);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        showToast('Failed to load leaderboard', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaders();
  }, [showToast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen pb-32">
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl pl-16 pr-6 py-4 border-b border-outline-variant/10">
        <h1 className="font-syne font-bold text-2xl text-on-surface">Leaderboard</h1>
      </header>

      <main className="p-6 max-w-2xl mx-auto space-y-4">
        <div className="bg-surface-container-high rounded-2xl p-6 border border-outline-variant/10 shadow-lg mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-syne font-bold text-xl">Top Students</h2>
            <div className="flex items-center gap-2 text-tertiary">
              <span className="material-symbols-outlined">military_tech</span>
              <span className="font-label text-sm uppercase tracking-widest">Rankings</span>
            </div>
          </div>
          
          <div className="space-y-3">
            {leaders.map((leader, index) => (
              <div 
                key={leader.id} 
                className={`flex items-center justify-between p-4 rounded-xl border ${
                  leader.id === user?.uid 
                    ? 'bg-primary/10 border-primary/30' 
                    : 'bg-surface-container-lowest border-outline-variant/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-syne font-bold ${
                    index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                    index === 1 ? 'bg-gray-400/20 text-gray-400' :
                    index === 2 ? 'bg-amber-700/20 text-amber-700' :
                    'bg-surface-container-highest text-on-surface-variant'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex items-center gap-3">
                    {leader.photoURL ? (
                      <img src={leader.photoURL} alt={leader.name} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-lg">
                        {leader.name?.charAt(0) || 'S'}
                      </div>
                    )}
                    <div>
                      <h3 className="font-syne font-bold text-on-surface">{leader.name || 'Student'}</h3>
                      {leader.id === user?.uid && <span className="text-[10px] font-label uppercase tracking-widest text-primary">You</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-lg text-tertiary">{(leader.totalFocusMinutes || 0) * 2}</div>
                  <div className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">XP</div>
                </div>
              </div>
            ))}
            
            {leaders.length === 0 && (
              <div className="text-center py-8 text-on-surface-variant">
                No students found on the leaderboard yet.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
