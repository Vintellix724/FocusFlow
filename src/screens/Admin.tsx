import React, { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { signInWithEmail } from '../firebase';

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
  const { showToast, firebaseUser } = useStore();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<Record<string, UserStats>>({});
  const [loading, setLoading] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  useEffect(() => {
    // We don't auto-authenticate anymore. We force them to enter the password.
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isAdminAuthenticated) return;

    const fetchUsersAndStats = async () => {
      setLoading(true);
      try {
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersList: any[] = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersList);

        const stats: Record<string, UserStats> = {};
        
        for (const u of usersList) {
          stats[u.id] = {
            totalFocusHours: Number(((u.totalFocusMinutes || 0) / 60).toFixed(1)),
            tasksCompleted: 0,
            currentStreak: 0
          };
        }
        
        setUserStats(stats);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'users');
        showToast('Failed to load users', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchUsersAndStats();
  }, [isAdminAuthenticated, showToast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email !== 'abcdmt2p2@gmail.com' || password !== '8826869580') {
      showToast('Invalid admin credentials', 'error');
      return;
    }

    setIsLoggingIn(true);
    try {
      // If user is already logged in with Google with the admin email, just let them in
      if (firebaseUser && firebaseUser.email === 'abcdmt2p2@gmail.com') {
        setIsAdminAuthenticated(true);
        showToast('Admin login successful', 'success');
        setIsLoggingIn(false);
        return;
      }
      
      // Otherwise, try to sign in with email/password
      await signInWithEmail(email, password);
      setIsAdminAuthenticated(true);
      showToast('Admin login successful', 'success');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        showToast('Account linked to Google. Please login with Google on the main screen first.', 'error');
      } else if (error.code === 'auth/operation-not-allowed') {
        showToast('Please enable Email/Password authentication in Firebase Console', 'error');
      } else {
        showToast('Failed to login as admin', 'error');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

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

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-surface-container-high rounded-3xl p-8 shadow-xl border border-outline-variant/20">
          <div className="text-center mb-8">
            <span className="material-symbols-outlined text-5xl text-primary mb-4">admin_panel_settings</span>
            <h1 className="font-syne font-bold text-2xl text-on-surface">Admin Login</h1>
            <p className="font-body text-on-surface-variant mt-2">Enter your credentials to access the admin panel.</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block font-label text-xs uppercase tracking-wider text-on-surface-variant mb-2">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface border border-outline-variant/20 rounded-xl px-4 py-3 font-body text-on-surface focus:outline-none focus:border-primary transition-colors"
                required
              />
            </div>
            <div>
              <label className="block font-label text-xs uppercase tracking-wider text-on-surface-variant mb-2">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface border border-outline-variant/20 rounded-xl px-4 py-3 font-body text-on-surface focus:outline-none focus:border-primary transition-colors"
                required
              />
            </div>
            <button 
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoggingIn ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : 'Login'}
            </button>
          </form>
          
          <button 
            onClick={() => navigate('/home')}
            className="w-full mt-4 text-primary font-medium py-2 hover:underline"
          >
            Back to App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen pb-32">
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl px-6 py-4 border-b border-outline-variant/10 flex justify-between items-center">
        <h1 className="font-syne font-bold text-2xl text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
          Admin Panel
        </h1>
        <button 
          onClick={() => navigate('/home')}
          className="bg-surface-container hover:bg-surface-container-highest text-on-surface px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to App
        </button>
      </header>

      <main className="p-6 max-w-6xl mx-auto mt-6">
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
