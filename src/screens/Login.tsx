import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { signInWithGoogle } from '../firebase';
import { useStore } from '../context/StoreContext';

export default function Login() {
  const navigate = useNavigate();
  const { showToast } = useStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { isNewUser } = await signInWithGoogle();
      showToast('Successfully signed in!', 'success');
      if (isNewUser) {
        navigate('/onboarding');
      } else {
        navigate('/home');
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to sign in', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="font-body text-on-surface antialiased flex flex-col min-h-screen bg-[#080C14] overflow-hidden relative">
      <div className="mesh-gradient"></div>

      <main className="flex-grow flex flex-col items-center justify-center px-6 relative z-10">
        <div className="mb-12 flex flex-col items-center">
          <div className="w-[60px] h-[60px] bg-gradient-to-br from-primary to-primary-container rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(80,143,248,0.4)] transition-transform duration-300 active:scale-95">
            <span className="material-symbols-outlined text-on-primary-container text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
          </div>
          <span className="mt-4 font-headline font-bold text-2xl tracking-tight bg-gradient-to-br from-blue-300 to-blue-600 bg-clip-text text-transparent">FocusFlow</span>
        </div>

        <div className="text-center mb-10">
          <h1 className="font-syne text-[32px] font-extrabold text-on-surface leading-tight mb-2">
            Wapas aao! 👋
          </h1>
          <p className="font-body text-[15px] text-tertiary-fixed-dim font-medium tracking-wide">
            Teri streak abhi bhi zinda hai 🔥
          </p>
        </div>

        <div className="w-full max-w-sm">
          <div className="bg-surface-container-high/60 backdrop-blur-xl rounded-[2rem] p-8 shadow-[0_20px_40px_rgba(0,0,0,0.4)] border border-outline-variant/10">
            <button 
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-on-surface text-surface py-4 px-6 rounded-xl font-bold transition-all duration-200 hover:bg-surface-bright hover:shadow-[0_0_20px_rgba(223,226,238,0.2)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="currentColor"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="currentColor"></path>
                </svg>
              )}
              <span className="font-headline tracking-tight">{isLoading ? 'Signing in...' : 'Continue with Google'}</span>
            </button>

            <div className="flex items-center my-8">
              <div className="flex-grow h-[1px] bg-outline-variant/20"></div>
              <span className="px-4 font-mono text-[10px] uppercase tracking-[0.2em] text-outline">Performance Auth</span>
              <div className="flex-grow h-[1px] bg-outline-variant/20"></div>
            </div>

            <button 
              onClick={() => navigate('/home')}
              className="w-full bg-surface-container-low text-on-surface-variant py-4 px-6 rounded-xl font-medium border border-outline-variant/20 hover:border-primary/40 hover:bg-surface-container-highest transition-all duration-200"
            >
              <span className="font-body text-sm">Use Phone Number</span>
            </button>
          </div>
        </div>

        <div className="mt-12">
          <button onClick={handleGoogleSignIn} className="group flex items-center gap-2 text-outline hover:text-primary transition-colors duration-200">
            <span className="font-body text-sm">First time?</span>
            <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform duration-200">arrow_right_alt</span>
            <span className="font-headline font-bold text-sm">Create Account</span>
          </button>
        </div>
      </main>

      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed -bottom-24 -right-24 w-[300px] h-[300px] bg-tertiary/10 rounded-full blur-[80px] pointer-events-none"></div>
    </div>
  );
}
