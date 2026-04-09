import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../context/StoreContext';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

const TreeAnimation = ({ progress, state }: { progress: number, state: 'growing' | 'withered' }) => {
  // progress is 0 to 100
  const scale = 0.5 + (progress / 100) * 0.5; // 0.5 to 1.0
  const isWithered = state === 'withered';
  
  return (
    <div className="relative w-48 h-48 mx-auto flex items-end justify-center overflow-hidden">
      <motion.svg 
        viewBox="0 0 200 200" 
        className="w-full h-full origin-bottom"
        animate={{ scale }}
        transition={{ type: 'spring', stiffness: 50, damping: 20 }}
      >
        {/* Trunk */}
        <motion.path
          d="M90,200 Q95,150 100,100 Q105,150 110,200 Z"
          fill={isWithered ? "#5D4037" : "#795548"}
          animate={{ fill: isWithered ? "#5D4037" : "#795548" }}
        />
        
        {/* Branches & Leaves */}
        <AnimatePresence>
          <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              filter: isWithered ? "grayscale(100%) brightness(0.7)" : "grayscale(0%) brightness(1)"
            }}
            transition={{ duration: 1 }}
            className="origin-center"
            style={{ transformOrigin: '100px 100px' }}
          >
            {/* Main Canopy */}
            <circle cx="100" cy="80" r="50" fill={isWithered ? "#8D6E63" : "#4CAF50"} />
            <circle cx="70" cy="100" r="35" fill={isWithered ? "#795548" : "#81C784"} />
            <circle cx="130" cy="100" r="35" fill={isWithered ? "#795548" : "#388E3C"} />
            <circle cx="100" cy="40" r="30" fill={isWithered ? "#A1887F" : "#A5D6A7"} />
          </motion.g>
        </AnimatePresence>

        {/* Falling Leaves if Withered */}
        {isWithered && (
          <>
            <motion.path
              d="M80,100 Q70,120 80,140"
              stroke="#8D6E63" strokeWidth="2" fill="none"
              initial={{ pathLength: 0, opacity: 1, y: 0 }}
              animate={{ pathLength: 1, opacity: 0, y: 50 }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.path
              d="M120,90 Q130,110 120,130"
              stroke="#795548" strokeWidth="2" fill="none"
              initial={{ pathLength: 0, opacity: 1, y: 0 }}
              animate={{ pathLength: 1, opacity: 0, y: 60 }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
            />
          </>
        )}
      </motion.svg>
      
      {/* Ground */}
      <div className="absolute bottom-0 w-32 h-4 bg-surface-container-highest rounded-[100%] blur-[2px] -z-10"></div>
    </div>
  );
};

export default function Timer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    user, addFocusTime, showToast, subjects, topics, tasks, 
    addTopicTime, addSubjectTime, updateUserCoins, addTreeGrown,
    timerState, setTimerState, theme, toggleTheme
  } = useStore();
  
  const {
    mode, focusDuration, breakDuration, timeLeft, initialTime,
    isRunning, sessionType, selectedSubjectId, selectedTopicId,
    selectedTaskId, treeState, treesGrownSession, targetEndTime
  } = timerState;

  // Sync location state preset on mount if not running
  useEffect(() => {
    if (location.state?.preset && !isRunning) {
      const presetSeconds = location.state.preset * 60;
      setTimerState(prev => ({
        ...prev,
        focusDuration: location.state.preset,
        timeLeft: presetSeconds,
        initialTime: presetSeconds
      }));
    }
  }, [location.state, isRunning, setTimerState]);
  
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [showLinkPrompt, setShowLinkPrompt] = useState(false);
  
  const [showSettings, setShowSettings] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showSoundDropdown, setShowSoundDropdown] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const sounds = [
    { id: 'binaural', name: 'Binaural Beats', desc: 'Deep Focus 40Hz', icon: 'music_note', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3' },
    { id: 'rain', name: 'Heavy Rain', desc: 'Nature Sounds', icon: 'water_drop', url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3' },
    { id: 'forest', name: 'Forest Birds', desc: 'Nature Sounds', icon: 'park', url: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_e19611f75b.mp3' },
    { id: 'lofi', name: 'Lo-Fi Beats', desc: 'Chill Study', icon: 'headphones', url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3' },
    { id: 'white_noise', name: 'White Noise', desc: 'Block Distractions', icon: 'waves', url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_78d5236263.mp3' }
  ];
  const [selectedSound, setSelectedSound] = useState(sounds[0]);

  // Audio Playback Logic
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(selectedSound.url);
      audioRef.current.loop = true;
    } else if (audioRef.current.src !== selectedSound.url) {
      audioRef.current.src = selectedSound.url;
    }

    if (isPlayingAudio && isRunning) {
      audioRef.current.play().catch(err => {
        console.error("Audio playback failed:", err);
        setIsPlayingAudio(false);
      });
    } else {
      audioRef.current.pause();
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [isPlayingAudio, selectedSound, isRunning]);

  const secondsAccumulator = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const progress = initialTime > 0 ? ((initialTime - timeLeft) / initialTime) * 100 : 0;

  // PiP Canvas Drawing
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Clear
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, 400, 400);
    
    // Draw circle
    ctx.beginPath();
    ctx.arc(200, 200, 180, 0, 2 * Math.PI);
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 10;
    ctx.stroke();
    
    // Draw progress
    ctx.beginPath();
    ctx.arc(200, 200, 180, -Math.PI / 2, (-Math.PI / 2) + (2 * Math.PI * (1 - progress / 100)));
    ctx.strokeStyle = sessionType === 'focus' ? '#4CAF50' : '#2196F3';
    ctx.lineWidth = 10;
    ctx.stroke();

    // Draw time
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 80px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(formatTime(timeLeft), 200, 200);
    
    // Draw status
    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText(sessionType === 'focus' ? 'FOCUS' : 'BREAK', 200, 280);
  }, [timeLeft, sessionType, progress]);

  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current && canvasRef.current) {
        if (!videoRef.current.srcObject) {
          const stream = canvasRef.current.captureStream(30);
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        await videoRef.current.requestPictureInPicture();
      }
    } catch (error) {
      console.error("PiP failed", error);
      showToast("Picture-in-Picture is not supported on this device/browser.", "error");
    }
  };

  // Visibility API for Tree Withering
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRunning && sessionType === 'focus') {
        setTimerState(prev => ({ ...prev, treeState: 'withered' }));
        showToast("You left the app! Your tree withered.", "error");
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRunning, sessionType, showToast, setTimerState]);

  // Update selected topic when subject changes
  useEffect(() => {
    const subjectTopics = topics.filter(t => t.subjectId === selectedSubjectId);
    if (subjectTopics.length > 0 && !subjectTopics.find(t => t.id === selectedTopicId)) {
      setTimerState(prev => ({ ...prev, selectedTopicId: subjectTopics[0].id }));
    } else if (subjectTopics.length === 0) {
      setTimerState(prev => ({ ...prev, selectedTopicId: '' }));
    }
  }, [selectedSubjectId, topics, selectedTopicId, setTimerState]);

  const toggleTimer = () => {
    if (!isRunning && !selectedSubjectId && !selectedTopicId && !selectedTaskId) {
      setShowLinkPrompt(true);
    } else {
      setTimerState(prev => {
        const newIsRunning = !prev.isRunning;
        return {
          ...prev,
          isRunning: newIsRunning,
          targetEndTime: newIsRunning ? Date.now() + prev.timeLeft * 1000 : null
        };
      });
    }
  };
  
  const resetTimer = () => {
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      targetEndTime: null,
      timeLeft: prev.initialTime
    }));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSaveSettings = () => {
    setShowSettings(false);
    if (!isRunning) {
      if (sessionType === 'focus') {
        setTimerState(prev => ({
          ...prev,
          timeLeft: prev.focusDuration * 60,
          initialTime: prev.focusDuration * 60
        }));
      } else {
        setTimerState(prev => ({
          ...prev,
          timeLeft: prev.breakDuration * 60,
          initialTime: prev.breakDuration * 60
        }));
      }
    }
  };

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
      
      <header className="flex justify-between items-center pl-6 pr-16 py-4 relative z-10">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
        </button>
        <div className="flex bg-surface-container-high rounded-full p-1 border border-outline-variant/20">
          <button 
            onClick={() => setTimerState(prev => ({ ...prev, mode: 'pomodoro' }))}
            className={clsx(
              "px-4 py-1.5 rounded-full font-label text-xs uppercase tracking-widest transition-all",
              mode === 'pomodoro' ? "bg-primary text-on-primary shadow-md" : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            Pomodoro
          </button>
          <button 
            onClick={() => setTimerState(prev => ({ ...prev, mode: 'stopwatch' }))}
            className={clsx(
              "px-4 py-1.5 rounded-full font-label text-xs uppercase tracking-widest transition-all",
              mode === 'stopwatch' ? "bg-primary text-on-primary shadow-md" : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            Stopwatch
          </button>
        </div>
        <div className="flex gap-2">
          <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-mono text-sm font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">park</span>
            {treesGrownSession}
          </div>
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors"
            title="Toggle Theme"
          >
            <span className="material-symbols-outlined text-on-surface-variant">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          <button 
            onClick={togglePiP}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors"
            title="Picture-in-Picture"
          >
            <span className="material-symbols-outlined text-on-surface-variant">picture_in_picture_alt</span>
          </button>
          <button 
            onClick={() => setShowSettings(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">settings</span>
          </button>
        </div>
      </header>

      <canvas ref={canvasRef} width="400" height="400" className="hidden" />
      <video ref={videoRef} className="hidden" muted playsInline />

      <main className="flex-grow flex flex-col items-center justify-center px-6 py-8 relative z-10">
        {/* Tree Animation */}
        {mode === 'pomodoro' && sessionType === 'focus' && (
          <div className="mb-8 relative">
            <TreeAnimation progress={progress} state={treeState} />
            {treeState === 'withered' && (
              <p className="absolute -bottom-6 left-0 right-0 text-center text-error text-xs font-label uppercase tracking-widest animate-pulse">
                Tree withered! Stay focused!
              </p>
            )}
          </div>
        )}
        <div className="mb-12 flex flex-col items-center gap-3 relative w-full max-w-xs z-20">
          <div className="relative w-full mb-2">
            <div 
              onClick={() => { setShowTaskDropdown(!showTaskDropdown); setShowSubjectDropdown(false); setShowTopicDropdown(false); }}
              className="bg-surface-container-high px-4 py-3 rounded-xl flex items-center justify-between border border-outline-variant/20 cursor-pointer hover:bg-surface-container-highest transition-colors w-full shadow-sm"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="material-symbols-outlined text-primary text-sm">task_alt</span>
                <span className="font-label text-sm font-medium truncate">
                  {tasks.find(t => t.id === selectedTaskId)?.title || 'Link to a Task (Optional)'}
                </span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-sm flex-shrink-0">expand_more</span>
            </div>
            
            {showTaskDropdown && (
              <div className="absolute top-full mt-2 w-full bg-surface-container-high rounded-xl border border-outline-variant/20 shadow-xl overflow-hidden z-30 max-h-48 overflow-y-auto">
                <button
                  onClick={() => {
                    setTimerState(prev => ({ ...prev, selectedTaskId: '' }));
                    setShowTaskDropdown(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-surface-container-highest transition-colors font-label text-sm text-on-surface-variant italic"
                >
                  Clear Task Selection
                </button>
                {tasks.filter(t => !t.completed).map(task => (
                  <button
                    key={task.id}
                    onClick={() => {
                      setTimerState(prev => {
                        const newState = { ...prev, selectedTaskId: task.id };
                        const subject = subjects.find(s => s.name === task.subject);
                        if (subject) newState.selectedSubjectId = subject.id;
                        if (task.duration && !prev.isRunning) {
                          newState.focusDuration = task.duration;
                          newState.timeLeft = task.duration * 60;
                          newState.initialTime = task.duration * 60;
                        }
                        return newState;
                      });
                      setShowTaskDropdown(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-surface-container-highest transition-colors font-label text-sm truncate border-t border-outline-variant/10"
                  >
                    {task.title}
                  </button>
                ))}
                {tasks.filter(t => !t.completed).length === 0 && <div className="px-4 py-3 text-sm text-on-surface-variant border-t border-outline-variant/10">No pending tasks</div>}
              </div>
            )}
          </div>

          <div className="flex gap-2 w-full">
            <div className="relative flex-1">
              <div 
                onClick={() => { setShowSubjectDropdown(!showSubjectDropdown); setShowTopicDropdown(false); setShowTaskDropdown(false); }}
                className="bg-surface-container-high px-4 py-2 rounded-xl flex items-center justify-between border border-outline-variant/20 cursor-pointer hover:bg-surface-container-highest transition-colors w-full"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className={clsx("w-2 h-2 rounded-full flex-shrink-0", `bg-${subjects.find(s => s.id === selectedSubjectId)?.color || 'primary'}`)}></span>
                  <span className="font-label text-sm font-medium truncate">{subjects.find(s => s.id === selectedSubjectId)?.name || 'Select Subject'}</span>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-sm flex-shrink-0">expand_more</span>
              </div>
              
              {showSubjectDropdown && (
                <div className="absolute top-full mt-2 w-full bg-surface-container-high rounded-xl border border-outline-variant/20 shadow-xl overflow-hidden z-20 max-h-48 overflow-y-auto">
                  {subjects.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => {
                        setTimerState(prev => ({ ...prev, selectedSubjectId: sub.id }));
                        setShowSubjectDropdown(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-surface-container-highest transition-colors font-label text-sm truncate"
                    >
                      {sub.name}
                    </button>
                  ))}
                  {subjects.length === 0 && <div className="px-4 py-3 text-sm text-on-surface-variant">No subjects added</div>}
                </div>
              )}
            </div>

            <div className="relative flex-1">
              <div 
                onClick={() => { setShowTopicDropdown(!showTopicDropdown); setShowSubjectDropdown(false); setShowTaskDropdown(false); }}
                className="bg-surface-container-high px-4 py-2 rounded-xl flex items-center justify-between border border-outline-variant/20 cursor-pointer hover:bg-surface-container-highest transition-colors w-full"
              >
                <span className="font-label text-sm font-medium truncate">{topics.find(t => t.id === selectedTopicId)?.title || 'Select Topic'}</span>
                <span className="material-symbols-outlined text-on-surface-variant text-sm flex-shrink-0">expand_more</span>
              </div>
              
              {showTopicDropdown && (
                <div className="absolute top-full mt-2 w-full bg-surface-container-high rounded-xl border border-outline-variant/20 shadow-xl overflow-hidden z-20 max-h-48 overflow-y-auto">
                  {topics.filter(t => t.subjectId === selectedSubjectId).map(topic => (
                    <button
                      key={topic.id}
                      onClick={() => {
                        setTimerState(prev => ({ ...prev, selectedTopicId: topic.id }));
                        setShowTopicDropdown(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-surface-container-highest transition-colors font-label text-sm truncate"
                    >
                      {topic.title}
                    </button>
                  ))}
                  {topics.filter(t => t.subjectId === selectedSubjectId).length === 0 && <div className="px-4 py-3 text-sm text-on-surface-variant">No topics found</div>}
                </div>
              )}
            </div>
          </div>

          <span className="font-mono text-xs uppercase tracking-[0.2em] text-on-surface-variant mt-2">
            {sessionType === 'focus' ? 'Deep Work Session' : 'Rest & Recover'}
          </span>
        </div>

        <div className="relative w-72 h-72 flex items-center justify-center mb-16">
          <svg className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-[0_0_15px_rgba(172,199,255,0.2)]">
            <circle 
              cx="144" cy="144" r="136" 
              fill="transparent" 
              stroke="var(--color-surface-container-highest)" 
              strokeWidth="4"
            />
            <circle 
              cx="144" cy="144" r="136" 
              fill="transparent" 
              stroke={sessionType === 'focus' ? "var(--color-primary)" : "var(--color-tertiary)"} 
              strokeWidth="12" 
              strokeLinecap="round"
              strokeDasharray="854.5" 
              strokeDashoffset={854.5 - (854.5 * progress) / 100}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-7xl font-bold tracking-tighter text-on-surface drop-shadow-lg">
              {formatTime(timeLeft)}
            </span>
            <span className="font-label text-sm uppercase tracking-widest text-on-surface-variant mt-2">
              {sessionType === 'focus' ? 'Focus' : 'Break'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6 mb-16">
          <button 
            onClick={resetTimer}
            className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-all active:scale-95 border border-outline-variant/20"
          >
            <span className="material-symbols-outlined text-2xl">replay</span>
          </button>
          
          <button 
            onClick={toggleTimer}
            className={clsx(
              "w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95",
              isRunning 
                ? "bg-surface-container-highest text-on-surface border-2 border-primary/50" 
                : "bg-primary text-on-primary neon-glow-primary"
            )}
          >
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isRunning ? 'pause' : 'play_arrow'}
            </span>
          </button>
          
          <button 
            onClick={() => {
              const newType = sessionType === 'focus' ? 'break' : 'focus';
              const newTime = newType === 'focus' ? focusDuration * 60 : breakDuration * 60;
              setTimerState(prev => ({
                ...prev,
                sessionType: newType,
                timeLeft: newTime,
                initialTime: newTime,
                isRunning: false,
                targetEndTime: null
              }));
            }}
            className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-all active:scale-95 border border-outline-variant/20"
          >
            <span className="material-symbols-outlined text-2xl">skip_next</span>
          </button>
        </div>
      </main>
      
      <div className="p-6 pb-24 relative z-10">
        <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/10 flex items-center justify-between relative">
          <div 
            className="flex items-center gap-3 cursor-pointer flex-1"
            onClick={() => setShowSoundDropdown(!showSoundDropdown)}
          >
            <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-tertiary">{selectedSound.icon}</span>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h4 className="font-label text-sm font-medium">{selectedSound.name}</h4>
                <span className="material-symbols-outlined text-[14px] text-on-surface-variant">expand_more</span>
              </div>
              <p className="font-mono text-[10px] text-on-surface-variant uppercase">{selectedSound.desc}</p>
            </div>
          </div>
          
          {showSoundDropdown && (
            <div className="absolute bottom-full left-0 mb-2 w-full bg-surface-container-high rounded-xl border border-outline-variant/20 shadow-xl overflow-hidden z-20">
              {sounds.map(sound => (
                <button
                  key={sound.id}
                  onClick={() => {
                    setSelectedSound(sound);
                    setShowSoundDropdown(false);
                    setIsPlayingAudio(true);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-surface-container-highest transition-colors flex items-center gap-3"
                >
                  <span className="material-symbols-outlined text-tertiary text-sm">{sound.icon}</span>
                  <div>
                    <div className="font-label text-sm">{sound.name}</div>
                    <div className="font-mono text-[10px] text-on-surface-variant uppercase">{sound.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <button 
            onClick={() => setIsPlayingAudio(!isPlayingAudio)}
            className={clsx(
              "w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0",
              isPlayingAudio ? "bg-tertiary text-on-tertiary" : "bg-surface-container-highest text-on-surface"
            )}
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isPlayingAudio ? 'pause' : 'play_arrow'}
            </span>
          </button>
        </div>
      </div>

      {/* Link Prompt Modal */}
      {showLinkPrompt && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/80 backdrop-blur-sm"
          onClick={() => setShowLinkPrompt(false)}
        >
          <div 
            className="bg-surface-container-high rounded-3xl p-6 w-full max-w-sm border border-outline-variant/20 shadow-2xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-syne font-bold text-xl">Link Session?</h3>
              <button onClick={() => { setShowLinkPrompt(false); setTimerState(prev => ({ ...prev, isRunning: true, targetEndTime: Date.now() + prev.timeLeft * 1000 })); }} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-sm text-on-surface-variant mb-4">
              Select a task or subject to link, or start an unlinked session.
            </p>
            
            <div className="flex-1 overflow-y-auto mb-4 space-y-4 no-scrollbar">
              {/* Tasks Section */}
              <div>
                <h4 className="font-label text-xs uppercase tracking-wider text-on-surface-variant mb-2">Tasks</h4>
                <div className="space-y-2">
                  {tasks.filter(t => !t.completed).map(task => (
                    <button
                      key={task.id}
                      onClick={() => {
                        setTimerState(prev => {
                          const newState = { ...prev, selectedTaskId: task.id };
                          const subject = subjects.find(s => s.name === task.subject);
                          if (subject) newState.selectedSubjectId = subject.id;
                          if (task.duration) {
                            newState.focusDuration = task.duration;
                            newState.timeLeft = task.duration * 60;
                            newState.initialTime = task.duration * 60;
                          }
                          newState.isRunning = true;
                          newState.targetEndTime = Date.now() + (task.duration ? task.duration * 60 : prev.timeLeft) * 1000;
                          return newState;
                        });
                        setShowLinkPrompt(false);
                      }}
                      className="w-full text-left p-3 rounded-xl bg-surface-container-highest hover:bg-surface-container-highest/80 transition-colors border border-outline-variant/10 flex flex-col gap-1"
                    >
                      <span className="font-label text-sm font-medium truncate">{task.title}</span>
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                        <span className="truncate">{task.subject}</span>
                        <span>•</span>
                        <span>{task.duration} mins</span>
                      </div>
                    </button>
                  ))}
                  {tasks.filter(t => !t.completed).length === 0 && (
                    <div className="text-center p-4 text-on-surface-variant text-sm bg-surface-container-highest rounded-xl">No pending tasks available.</div>
                  )}
                </div>
              </div>

              {/* Subjects Section */}
              <div>
                <h4 className="font-label text-xs uppercase tracking-wider text-on-surface-variant mb-2">Subjects</h4>
                <div className="space-y-2">
                  {subjects.map(subject => (
                    <button
                      key={subject.id}
                      onClick={() => {
                        setTimerState(prev => ({
                          ...prev,
                          selectedSubjectId: subject.id,
                          isRunning: true,
                          targetEndTime: Date.now() + prev.timeLeft * 1000
                        }));
                        setShowLinkPrompt(false);
                      }}
                      className="w-full text-left p-3 rounded-xl bg-surface-container-highest hover:bg-surface-container-highest/80 transition-colors border border-outline-variant/10 flex items-center gap-2"
                    >
                      <span className={clsx("w-3 h-3 rounded-full", `bg-${subject.color}`)}></span>
                      <span className="font-label text-sm font-medium truncate">{subject.name}</span>
                    </button>
                  ))}
                  {subjects.length === 0 && (
                    <div className="text-center p-4 text-on-surface-variant text-sm bg-surface-container-highest rounded-xl">No subjects available.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-auto pt-2 border-t border-outline-variant/10">
              <button 
                onClick={() => {
                  setShowLinkPrompt(false);
                  setTimerState(prev => ({ ...prev, isRunning: true, targetEndTime: Date.now() + prev.timeLeft * 1000 }));
                }}
                className="w-full bg-surface-container-highest text-on-surface py-3 rounded-xl font-bold hover:bg-surface-container-highest/80 transition-colors"
              >
                Start Anyway (Unlinked)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/80 backdrop-blur-sm"
          onClick={() => setShowSettings(false)}
        >
          <div 
            className="bg-surface-container-high rounded-3xl p-6 w-full max-w-sm border border-outline-variant/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-syne font-bold text-xl">Timer Settings</h3>
              <button onClick={() => setShowSettings(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2">Focus Duration (mins)</label>
                <input 
                  type="number" 
                  value={focusDuration}
                  onChange={(e) => setTimerState(prev => ({ ...prev, focusDuration: parseInt(e.target.value) || 25 }))}
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2">Break Duration (mins)</label>
                <input 
                  type="number" 
                  value={breakDuration}
                  onChange={(e) => setTimerState(prev => ({ ...prev, breakDuration: parseInt(e.target.value) || 5 }))}
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              
              <button 
                onClick={handleSaveSettings}
                className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold mt-4 hover:bg-primary/90 transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
