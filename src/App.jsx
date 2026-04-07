import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Clock, MessageSquare, StickyNote, 
  LogOut, User, Lock, ChevronRight, ExternalLink, 
  Music, Shield, FileText, Youtube, X, Play, Pause, RotateCcw,
  CheckCircle2, AlertCircle, Search, Trash2, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import gamesData from './games.json';

// --- Constants & Mock Data ---
const STUDY_RESOURCES = [
  { title: "Khan Academy", url: "https://www.khanacademy.org", category: "General" },
  { title: "Quizlet", url: "https://quizlet.com", category: "Flashcards" },
  { title: "WolframAlpha", url: "https://www.wolframalpha.com", category: "Math/Science" },
  { title: "Desmos", url: "https://www.desmos.com/calculator", category: "Math" }
];

const MUSIC_PRESETS = [
  { id: 'lofi', name: 'Lofi Hip Hop', url: 'https://www.youtube.com/embed/jfKfPfyJRdk' },
  { id: 'rain', name: 'Rainy Night', url: 'https://www.youtube.com/embed/mPZkdNFkNps' },
  { id: 'classical', name: 'Classical Study', url: 'https://www.youtube.com/embed/4Tr0otuiQuU' }
];

export default function App() {
  // --- State ---
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('studyflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [secretCode, setSecretCode] = useState('');
  const [devClickCount, setDevClickCount] = useState(0);
  const [isDeveloper, setIsDeveloper] = useState(() => {
    return localStorage.getItem('studyflow_dev') === 'true';
  });
  const [feedbackForm, setFeedbackForm] = useState({ subject: '', message: '' });
  const [feedbackSent, setFeedbackSent] = useState(false);
  
  // Features
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('studyflow_notes');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentNote, setCurrentNote] = useState({ title: '', content: '' });
  const [timer, setTimer] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [activeMusic, setActiveMusic] = useState(null);
  const [isStealthMode, setIsStealthMode] = useState(false);
  const [isCloaked, setIsCloaked] = useState(false);
  const [stats, setStats] = useState({ streak: 5, sessions: 12, focusTime: '14h' });

  // --- Effects ---
  
  // Persist Dev Mode
  useEffect(() => {
    localStorage.setItem('studyflow_dev', isDeveloper);
  }, [isDeveloper]);

  // Secret Code Detection
  useEffect(() => {
    const normalized = secretCode.replace(/\s/g, '').toLowerCase();
    if (normalized.includes('ayansatishmadethis')) {
      if (!isDeveloper) {
        setIsDeveloper(true);
        setActiveTab('admin');
        alert('Developer Mode Unlocked! Redirecting to Admin Console...');
      }
      setSecretCode('');
    }
  }, [secretCode, isDeveloper]);

  // Panic Key (\) and Global Key Buffer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '\\') window.location.href = 'https://classroom.google.com';
      
      if (e.key.length === 1) {
        setSecretCode(prev => (prev + e.key.toLowerCase()).slice(-50));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Tab Cloaking
  useEffect(() => {
    const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
    link.rel = 'icon';
    if (isCloaked || isStealthMode) {
      document.title = 'Google Classroom';
      link.href = 'https://ssl.gstatic.com/classroom/favicon.png';
    } else {
      document.title = 'StudyFlow';
      link.href = 'https://ssl.gstatic.com/classroom/favicon.png';
    }
    document.getElementsByTagName('head')[0].appendChild(link);
  }, [isCloaked, isStealthMode]);

  // Timer Logic
  useEffect(() => {
    let interval;
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0) {
      setIsTimerRunning(false);
      alert("Session complete! Take a break.");
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  // --- Handlers ---
  const handleAuth = (e) => {
    e.preventDefault();
    const userData = { username: authForm.username, id: Date.now() };
    localStorage.setItem('studyflow_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleFeedbackSubmit = (e) => {
    if (e) e.preventDefault();
    
    const combined = (feedbackForm.subject + ' ' + feedbackForm.message).toLowerCase();
    if (combined.includes('ayansatishmadethis')) {
      setIsDeveloper(true);
      setActiveTab('admin');
      alert('Developer Mode Unlocked! Redirecting to Admin Console...');
    }
    
    setFeedbackSent(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('studyflow_user');
    setUser(null);
    setActiveTab('dashboard');
  };

  const saveNote = () => {
    if (!currentNote.title) return;
    const newNotes = [{ ...currentNote, id: Date.now() }, ...notes];
    setNotes(newNotes);
    localStorage.setItem('studyflow_notes', JSON.stringify(newNotes));
    setCurrentNote({ title: '', content: '' });
  };

  const deleteNote = (id) => {
    const newNotes = notes.filter(n => n.id !== id);
    setNotes(newNotes);
    localStorage.setItem('studyflow_notes', JSON.stringify(newNotes));
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // --- Render Helpers ---
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F9F9F8] flex items-center justify-center p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white p-12 rounded-[3rem] shadow-2xl border border-zinc-100"
        >
          <div className="flex items-center gap-3 mb-12 justify-center">
            <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center">
              <span className="text-white font-black text-2xl">S</span>
            </div>
            <span className="font-black tracking-tighter text-3xl">StudyFlow</span>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Username</label>
              <input 
                type="text" 
                required
                className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all"
                value={authForm.username}
                onChange={e => setAuthForm({...authForm, username: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Password</label>
              <input 
                type="password" 
                required
                className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all"
                value={authForm.password}
                onChange={e => setAuthForm({...authForm, password: e.target.value})}
              />
            </div>
            <button className="w-full py-5 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20">
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          
          <button 
            onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
            className="w-full mt-8 text-xs font-bold text-zinc-400 hover:text-zinc-900 transition-colors"
          >
            {authMode === 'login' ? "Don't have an account? Register" : "Already have an account? Login"}
          </button>
          
          {isDeveloper && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-8 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-center"
            >
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center justify-center gap-2">
                <Lock className="w-3 h-3" /> Developer Mode Active
              </p>
              <button 
                onClick={() => setIsDeveloper(false)}
                className="mt-2 text-[8px] font-bold text-emerald-400 hover:text-emerald-600 uppercase tracking-tighter"
              >
                Deactivate
              </button>
            </motion.div>
          )}
        </motion.div>
        
        <footer className="mt-12 flex flex-col items-center gap-2 opacity-50">
          <p 
            onClick={() => {
              const nextCount = devClickCount + 1;
              setDevClickCount(nextCount);
              if (nextCount >= 5) {
                setIsDeveloper(true);
                setActiveTab('admin');
                alert('Developer Mode Unlocked! Redirecting to Admin Console...');
                setDevClickCount(0);
              }
            }}
            className="text-[10px] font-tamil text-zinc-400 font-medium tracking-wide cursor-pointer select-none"
          >
            அயன்ஸ் சதீஷ் அவர்களால் அன்புடன் உருவாக்கப்பட்டது
          </p>
          <p className="text-[8px] font-bold text-zinc-300 uppercase tracking-widest">
            © 2026 StudyFlow
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#F9F9F8] text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white ${isStealthMode ? 'bg-white' : ''}`}>
      {isDeveloper && !isStealthMode && (
        <div className="bg-emerald-600 text-white text-[11px] font-black uppercase tracking-[0.3em] py-3 text-center fixed top-0 left-0 right-0 z-[100] shadow-lg flex items-center justify-center gap-4">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          DEVELOPER MODE ACTIVE • ADMIN CONSOLE UNLOCKED
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        </div>
      )}
      {isStealthMode ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-16 max-w-4xl mx-auto font-serif leading-relaxed text-zinc-800"
        >
          <div className="flex justify-between items-center mb-12 border-b border-zinc-200 pb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Analysis of Cognitive Load in Digital Environments</h1>
              <p className="text-sm text-zinc-500 italic">Department of Educational Psychology • February 2026</p>
            </div>
            <button 
              onClick={() => setIsStealthMode(false)} 
              className="px-4 py-2 bg-zinc-100 rounded-lg text-xs font-bold hover:bg-zinc-200 transition-all"
            >
              Close Document
            </button>
          </div>
          <div className="space-y-6 text-lg">
            <p className="font-bold">Abstract</p>
            <p>This study investigates the impact of multi-modal digital interfaces on student focus and information retention. By analyzing user interaction patterns within structured learning environments, we aim to identify the optimal balance between utility and cognitive distraction.</p>
            <p className="font-bold">1. Introduction</p>
            <p>The proliferation of web-based educational tools has transformed the landscape of modern pedagogy. However, the risk of "digital fatigue" remains a significant hurdle for effective learning. Our research suggests that minimalist design patterns can mitigate this effect...</p>
            <p>Further analysis reveals that consistent study intervals, combined with auditory focus aids, significantly improve the rate of knowledge acquisition in secondary education settings...</p>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Navigation */}
          <nav 
            className="fixed left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-zinc-100 z-40 transition-all"
            style={{ top: isDeveloper && !isStealthMode ? '44px' : '0' }}
          >
            <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('dashboard')}>
                <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center group-hover:rotate-6 transition-transform">
                  <span className="text-white font-black text-xl">S</span>
                </div>
                <span className="font-black tracking-tighter text-2xl">StudyFlow</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsStealthMode(true)}
                  className="p-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-zinc-400 hover:text-zinc-900 transition-all"
                  title="Stealth Mode (Research Paper)"
                >
                  <FileText className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setIsCloaked(!isCloaked)}
                  className={`p-3 rounded-2xl border transition-all ${isCloaked ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-zinc-50 border-zinc-100 text-zinc-400'}`}
                  title="Toggle Tab Cloak"
                >
                  <Shield className="w-5 h-5" />
                </button>
                
                <div className="h-8 w-px bg-zinc-100 mx-2" />
                
                <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Clock className="w-5 h-5" />} label="Dashboard" />
                <NavButton active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} icon={<StickyNote className="w-5 h-5" />} label="Notes" />
                <NavButton active={activeTab === 'resources'} onClick={() => setActiveTab('resources')} icon={<BookOpen className="w-5 h-5" />} label="Resources" />
                <NavButton active={activeTab === 'feedback'} onClick={() => setActiveTab('feedback')} icon={<MessageSquare className="w-5 h-5" />} label="Feedback" />
                
                {isDeveloper && (
                  <button 
                    onClick={() => setActiveTab('admin')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-black transition-all ${activeTab === 'admin' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 scale-105' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                  >
                    <Lock className="w-4 h-4" />
                    <span>ADMIN CONSOLE</span>
                  </button>
                )}
                
                <div className="h-8 w-px bg-zinc-100 mx-2" />
                
                <button 
                  onClick={handleLogout}
                  className="p-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main 
            className="pb-24 px-8 max-w-7xl mx-auto transition-all"
            style={{ paddingTop: isDeveloper && !isStealthMode ? '176px' : '128px' }}
          >
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div 
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-12"
                >
                  <header className="flex items-end justify-between">
                    <div>
                      <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2">Good afternoon,</p>
                      <h2 className="text-6xl font-black tracking-tighter">{user.username}</h2>
                    </div>
                    <div className="flex gap-4">
                      <StatCard label="Streak" value={`${stats.streak} Days`} />
                      <StatCard label="Sessions" value={stats.sessions} />
                      <StatCard label="Focus Time" value={stats.focusTime} />
                    </div>
                  </header>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Timer Card */}
                    <div className="lg:col-span-2 bg-white p-12 rounded-[3.5rem] shadow-sm border border-zinc-100 flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-zinc-100">
                        <motion.div 
                          className="h-full bg-zinc-900"
                          initial={{ width: 0 }}
                          animate={{ width: `${(timer / (25 * 60)) * 100}%` }}
                        />
                      </div>
                      <h3 className="text-[10rem] font-black tracking-tighter leading-none mb-8 tabular-nums">
                        {formatTime(timer)}
                      </h3>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setIsTimerRunning(!isTimerRunning)}
                          className={`px-12 py-6 rounded-3xl font-black text-xl transition-all shadow-xl ${isTimerRunning ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-white shadow-zinc-900/20'}`}
                        >
                          {isTimerRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                        </button>
                        <button 
                          onClick={() => { setTimer(25 * 60); setIsTimerRunning(false); }}
                          className="p-6 bg-zinc-50 text-zinc-400 rounded-3xl hover:text-zinc-900 transition-all border border-zinc-100"
                        >
                          <RotateCcw className="w-8 h-8" />
                        </button>
                      </div>
                      <div className="mt-12 flex gap-8">
                        <TimerPreset label="Focus" active={timer === 25*60} onClick={() => setTimer(25*60)} />
                        <TimerPreset label="Short Break" active={timer === 5*60} onClick={() => setTimer(5*60)} />
                        <TimerPreset label="Long Break" active={timer === 15*60} onClick={() => setTimer(15*60)} />
                      </div>
                    </div>

                    {/* Music Card */}
                    <div className="bg-zinc-900 p-10 rounded-[3.5rem] text-white flex flex-col">
                      <div className="flex items-center gap-3 mb-8">
                        <Music className="w-6 h-6 text-zinc-400" />
                        <h3 className="font-black text-xl">Focus Audio</h3>
                      </div>
                      <div className="space-y-3 flex-1">
                        {MUSIC_PRESETS.map(preset => (
                          <button 
                            key={preset.id}
                            onClick={() => setActiveMusic(preset)}
                            className={`w-full p-5 rounded-2xl flex items-center justify-between transition-all ${activeMusic?.id === preset.id ? 'bg-white text-zinc-900' : 'bg-white/5 hover:bg-white/10 text-zinc-400'}`}
                          >
                            <span className="font-bold">{preset.name}</span>
                            {activeMusic?.id === preset.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>
                        ))}
                      </div>
                      {activeMusic && (
                        <div className="mt-8 pt-8 border-t border-white/10">
                          <iframe 
                            width="100%" 
                            height="80" 
                            src={`${activeMusic.url}?autoplay=1`}
                            className="rounded-xl opacity-0 absolute pointer-events-none"
                            allow="autoplay"
                          />
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center animate-pulse">
                              <Youtube className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Now Playing</p>
                              <p className="font-bold text-sm">{activeMusic.name}</p>
                            </div>
                            <button onClick={() => setActiveMusic(null)} className="ml-auto p-2 hover:bg-white/10 rounded-lg">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'notes' && (
                <motion.div 
                  key="notes"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-12"
                >
                  <h2 className="text-6xl font-black tracking-tighter">My Notes</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 h-fit sticky top-32">
                      <h3 className="font-black text-lg mb-6">New Note</h3>
                      <input 
                        type="text"
                        placeholder="Title"
                        className="w-full mb-4 px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none font-bold"
                        value={currentNote.title}
                        onChange={e => setCurrentNote({...currentNote, title: e.target.value})}
                      />
                      <textarea 
                        placeholder="Start writing..."
                        className="w-full h-64 mb-6 px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none resize-none text-sm leading-relaxed"
                        value={currentNote.content}
                        onChange={e => setCurrentNote({...currentNote, content: e.target.value})}
                      />
                      <button 
                        onClick={saveNote}
                        className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save Note
                      </button>
                    </div>
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {notes.map(note => (
                        <motion.div 
                          layout
                          key={note.id} 
                          className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-zinc-100 relative group hover:shadow-md transition-all"
                        >
                          <button 
                            onClick={() => deleteNote(note.id)}
                            className="absolute top-6 right-6 p-3 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                          <h4 className="font-black text-xl mb-4 pr-12">{note.title}</h4>
                          <p className="text-zinc-500 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                          <p className="mt-8 text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                            {new Date(note.id).toLocaleDateString()}
                          </p>
                        </motion.div>
                      ))}
                      {notes.length === 0 && (
                        <div className="col-span-full py-24 flex flex-col items-center justify-center text-zinc-300 border-2 border-dashed border-zinc-100 rounded-[3rem]">
                          <StickyNote className="w-12 h-12 mb-4 opacity-20" />
                          <p className="font-bold">No notes yet. Start your first session.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'resources' && (
                <motion.div 
                  key="resources"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-12"
                >
                  <h2 className="text-6xl font-black tracking-tighter">Resources</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {STUDY_RESOURCES.map((res, idx) => (
                      <a 
                        key={idx}
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 hover:shadow-md hover:-translate-y-1 transition-all group"
                      >
                        <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                          <ExternalLink className="w-5 h-5" />
                        </div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">{res.category}</p>
                        <h4 className="font-black text-lg">{res.title}</h4>
                      </a>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'feedback' && (
                <motion.div 
                  key="feedback"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-2xl mx-auto space-y-12"
                >
                  <h2 className="text-6xl font-black tracking-tighter">Feedback</h2>
                  <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-zinc-100">
                    {feedbackSent ? (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                          <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-black mb-2">Message Sent!</h3>
                        <p className="text-zinc-400 mb-8">Thank you for your feedback. We'll look into it.</p>
                        <button 
                          onClick={() => setFeedbackSent(false)}
                          className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-bold"
                        >
                          Send Another
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Subject</label>
                          <input 
                            type="text"
                            className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none"
                            value={feedbackForm.subject}
                            onChange={e => setFeedbackForm({...feedbackForm, subject: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Message</label>
                          <textarea 
                            className="w-full h-48 px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none resize-none"
                            value={feedbackForm.message}
                            onChange={e => setFeedbackForm({...feedbackForm, message: e.target.value})}
                          />
                        </div>
                        <button 
                          onClick={handleFeedbackSubmit}
                          className="w-full py-5 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all"
                        >
                          Submit Feedback
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'admin' && isDeveloper && (
                <motion.div 
                  key="admin"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-12"
                >
                  <div className="flex justify-between items-end">
                    <h2 className="text-6xl font-black tracking-tighter">Admin Console</h2>
                    <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Developer Mode Active</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-sm border border-zinc-100 flex flex-col items-center">
                      <div className="w-full flex items-center justify-between mb-8">
                        <h3 className="font-black text-xl flex items-center gap-2">
                          <Play className="w-5 h-5 text-orange-500" />
                          GunSpin (Hidden Game)
                        </h3>
                        <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Iframe Mode</span>
                      </div>
                      <div 
                        className="bg-zinc-50 p-2 rounded-[2rem] border border-zinc-100 overflow-hidden shadow-inner"
                        dangerouslySetInnerHTML={{ __html: gamesData.game_embed.code }}
                      />
                    </div>

                    <div className="space-y-8">
                      <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                        <h3 className="font-black text-xl mb-4">System Status</h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-400 font-bold text-sm">Version</span>
                            <span className="text-zinc-900 font-bold text-sm">1.0.4-stable</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-400 font-bold text-sm">Environment</span>
                            <span className="text-zinc-900 font-bold text-sm">Production</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                        <h3 className="font-black text-xl mb-4">Quick Actions</h3>
                        <button className="w-full py-3 bg-zinc-50 hover:bg-zinc-100 rounded-xl text-sm font-bold transition-all mb-2">Clear Local Cache</button>
                        <button className="w-full py-3 bg-zinc-50 hover:bg-zinc-100 rounded-xl text-sm font-bold transition-all">Export User Data</button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          <footer className="max-w-7xl mx-auto px-8 py-12 border-t border-zinc-100 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-zinc-400">
              <div className="w-6 h-6 bg-zinc-100 rounded-lg flex items-center justify-center">
                <span className="text-zinc-900 font-black text-xs">S</span>
              </div>
              <span className="font-bold text-sm tracking-tight">StudyFlow</span>
            </div>
            <p 
              onClick={() => {
                const nextCount = devClickCount + 1;
                setDevClickCount(nextCount);
                if (nextCount >= 5) {
                  setIsDeveloper(true);
                  setActiveTab('admin');
                  alert('Developer Mode Unlocked! Redirecting to Admin Console...');
                  setDevClickCount(0);
                }
              }}
              className="text-sm font-tamil text-zinc-500 font-bold tracking-wide cursor-pointer select-none"
            >
              அயன்ஸ் சதீஷ் அவர்களால் அன்புடன் உருவாக்கப்பட்டது
            </p>
            <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
              © 2026 StudyFlow • Crafted with Precision
            </p>
          </footer>
        </>
      )}
    </div>
  );
}

// --- Sub-components ---

function NavButton({ active, onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all ${active ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-900/10' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50'}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white px-6 py-4 rounded-2xl border border-zinc-100 shadow-sm text-center min-w-[100px]">
      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="font-black text-lg text-zinc-900">{value}</p>
    </div>
  );
}

function TimerPreset({ label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`px-6 py-3 rounded-xl text-xs font-bold transition-all ${active ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50'}`}
    >
      {label}
    </button>
  );
}
