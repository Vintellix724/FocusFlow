import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import Layout from './components/Layout';
import { StoreProvider } from './context/StoreContext';

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/login" element={<Login />} />
          
          <Route element={<Layout />}>
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
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  );
}
