import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Splash from './screens/Splash';
import Welcome from './screens/Welcome';
import Onboarding from './screens/Onboarding';
import Login from './screens/Login';
import Home from './screens/Home';
import Timer from './screens/Timer';
import Subjects from './screens/Subjects';
import Planner from './screens/Planner';
import Analytics from './screens/Analytics';
import Journal from './screens/Journal';
import Admin from './screens/Admin';
import Leaderboard from './screens/Leaderboard';
import LiveStudyRoom from './screens/LiveStudyRoom';
import About from './screens/About';
import YouTubeChannels from './screens/YouTubeChannels';
import TelegramChannels from './screens/TelegramChannels';
import StudyApps from './screens/StudyApps';
import Layout from './components/Layout';
import { StoreProvider, useStore } from './context/StoreContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthReady, firebaseUser } = useStore();
  const location = useLocation();

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
      </div>
    );
  }

  if (!firebaseUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/home" element={<Home />} />
            <Route path="/timer" element={<Timer />} />
            <Route path="/subjects" element={<Subjects />} />
            <Route path="/planner" element={<Planner />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/live-study-room" element={<LiveStudyRoom />} />
            <Route path="/about" element={<About />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/youtube-channels" element={<YouTubeChannels />} />
            <Route path="/telegram-channels" element={<TelegramChannels />} />
            <Route path="/study-apps" element={<StudyApps />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  );
}
