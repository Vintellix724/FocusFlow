import React, { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface UserStats {
  totalFocusHours: number;
  tasksCompleted: number;
  currentStreak: number;
}

export default function Admin() {
  const { user, firebaseUser, showToast } = useStore();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<Record<string, UserStats>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/home');
      showToast('Unauthorized access', 'error');
      return;
    }

    const fetchUsersAndStats = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersList);

        const stats: Record<string, UserStats> = {};
        
        for (const u of usersList) {
          let totalFocusHours = 0;
          let tasksCompleted = 0;
          let currentStreak = 0;

          try {
            // Fetch focus history
            const historySnapshot = await getDocs(collection(db, `users/${u.id}/focusHistory`));
            const history: Record<string, number> = {};
            historySnapshot.forEach(doc => {
              const data = doc.data();
              history[data.date] = data.minutes;
              totalFocusHours += (data.minutes || 0) / 60;
            });

            // Calculate streak
            const sortedDates = Object.keys(history).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
            if (sortedDates.length > 0) {
              const today = new Date().toISOString().split('T')[0];
              let checkDate = new Date();
              while (true) {
                const dateStr = checkDate.toISOString().split('T')[0];
                if (history[dateStr] && history[dateStr] > 0) {
                  currentStreak++;
                  checkDate.setDate(checkDate.getDate() - 1);
                } else if (dateStr === today) {
                  checkDate.setDate(checkDate.getDate() - 1);
                } else {
                  break;
                }
              }
            }

            // Fetch tasks
            const tasksSnapshot = await getDocs(collection(db, `users/${u.id}/tasks`));
            tasksSnapshot.forEach(doc => {
              if (doc.data().completed) {
                tasksCompleted++;
              }
            });

            stats[u.id] = {
              totalFocusHours: Number(totalFocusHours.toFixed(1)),
              tasksCompleted,
              currentStreak
            };
          } catch (err) {
            console.error(`Error fetching stats for user ${u.id}:`, err);
            stats[u.id] = { totalFocusHours: 0, tasksCompleted: 0, currentStreak: 0 };
          }
        }
        
        setUserStats(stats);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'users');
        showToast('Failed to load users', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'admin') {
      fetchUsersAndStats();
    }
  }, [user, navigate, showToast]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role: newRole });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      showToast('User role updated successfully', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
      showToast('Failed to update user role', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen pb-32">
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl pl-16 pr-6 py-4 border-b border-outline-variant/10">
        <h1 className="font-syne font-bold text-2xl text-on-surface">Admin Panel</h1>
      </header>

      <main className="p-6 max-w-6xl mx-auto">
        <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/10 shadow-lg mb-8">
          <h2 className="font-syne font-bold text-xl mb-4">User Management</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="py-3 px-4 font-label text-sm text-on-surface-variant">Name</th>
                  <th className="py-3 px-4 font-label text-sm text-on-surface-variant">Email</th>
                  <th className="py-3 px-4 font-label text-sm text-on-surface-variant">Role</th>
                  <th className="py-3 px-4 font-label text-sm text-on-surface-variant">Focus Time</th>
                  <th className="py-3 px-4 font-label text-sm text-on-surface-variant">Tasks Done</th>
                  <th className="py-3 px-4 font-label text-sm text-on-surface-variant">Streak</th>
                  <th className="py-3 px-4 font-label text-sm text-on-surface-variant">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const stats = userStats[u.id] || { totalFocusHours: 0, tasksCompleted: 0, currentStreak: 0 };
                  return (
                    <tr key={u.id} className="border-b border-outline-variant/10 hover:bg-surface-container-highest/50 transition-colors">
                      <td className="py-3 px-4 flex items-center gap-3">
                        {u.photoURL ? (
                          <img src={u.photoURL} alt={u.name} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                            {u.name?.charAt(0) || 'U'}
                          </div>
                        )}
                        <span className="font-medium">{u.name || 'Unknown User'}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-on-surface-variant">{u.email || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-tertiary/20 text-tertiary' : 'bg-secondary/20 text-secondary'}`}>
                          {u.role || 'user'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-sm text-primary">{stats.totalFocusHours}h</td>
                      <td className="py-3 px-4 font-mono text-sm text-secondary">{stats.tasksCompleted}</td>
                      <td className="py-3 px-4 font-mono text-sm text-tertiary">🔥 {stats.currentStreak}</td>
                      <td className="py-3 px-4">
                        <select
                          value={u.role || 'user'}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="bg-surface-container-highest border border-outline-variant/20 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary transition-colors"
                          disabled={u.id === firebaseUser?.uid} // Prevent changing own role
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
