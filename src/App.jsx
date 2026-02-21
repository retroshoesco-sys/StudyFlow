import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, MessageSquare, StickyNote, Gamepad2, X, Search, LogOut, User, Lock, ChevronRight, ExternalLink, Music, Info, Shield, FileText, Youtube, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import gamesData from './data/games.json';

const API_BASE = '/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubject, setFeedbackSubject] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [timer, setTimer] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState({ id: null, title: '', content: '' });
  const [stats, setStats] = useState({ streak: 0, daily_goal_count: 0 });
  const [ytUrl, setYtUrl] = useState('');
  const [currentYtId, setCurrentYtId] = useState('');
  const [isGameLoading, setIsGameLoading] = useState(true);
  const [gameProgress, setGameProgress] = useState([]);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [isCloaked, setIsCloaked] = useState(false);
  const lastGameRef = React.useRef(null);

  // Deledao Protection: Panic Key (\)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '\\') {
        window.location.href = 'https://classroom.google.com';
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Deledao Protection: Tab Cloaking
  useEffect(() => {
    if (isCloaked) {
      document.title = 'Google Classroom';
      const link = document.querySelector("link[rel~='icon']");
      if (link) {
        link.href = 'https://ssl.gstatic.com/classroom/favicon.png';
      }
    } else {
      document.title = 'StudyFlow';
      const link = document.querySelector("link[rel~='icon']");
      if (link) {
        link.href = '/favicon.ico';
      }
    }
  }, [isCloaked]);

  // Deledao Protection: About:Blank Cloaking
  const openAboutBlank = () => {
    const win = window.open();
    if (!win) return;
    const url = window.location.href;
    const iframe = win.document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.src = url;
    win.document.body.style.margin = '0';
    win.document.body.style.height = '100vh';
    win.document.body.appendChild(iframe);
    window.location.replace('https://google.com');
  };

  // Reset loading state when game changes
  useEffect(() => {
    if (selectedGame) {
      setIsGameLoading(true);
      setGameStartTime(Date.now());
      lastGameRef.current = selectedGame;
    } else if (gameStartTime && lastGameRef.current) {
      // Game closed, save progress
      const playTimeSeconds = Math.floor((Date.now() - gameStartTime) / 1000);
      if (playTimeSeconds > 5) { // Only save if played for more than 5 seconds
        saveGameProgress(lastGameRef.current.id, lastGameRef.current.title, playTimeSeconds);
      }
      setGameStartTime(null);
      lastGameRef.current = null;
    }
  }, [selectedGame]);

  // Load user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setStats({ streak: parsedUser.streak || 0, daily_goal_count: parsedUser.daily_goal_count || 0 });
      fetchNotes(token);
      fetchGameProgress(token);
    }
  }, []);

  // Secret code logic
  useEffect(() => {
    if (feedbackText.toLowerCase().includes('ayansatishmadethis')) {
      setActiveTab('games');
      setFeedbackText('');
    }
  }, [feedbackText]);

  // Timer logic
  useEffect(() => {
    let interval;
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerRunning(false);
      if (user) handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  const fetchNotes = async (token) => {
    try {
      const res = await fetch(`${API_BASE}/notes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (e) {
      console.error('Failed to fetch notes');
    }
  };

  const fetchGameProgress = async (token) => {
    try {
      const res = await fetch(`${API_BASE}/game-progress`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGameProgress(data);
      }
    } catch (e) {
      console.error('Failed to fetch game progress');
    }
  };

  const saveGameProgress = async (gameId, gameTitle, playTime, score = 'N/A') => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`${API_BASE}/game-progress`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          game_id: gameId,
          game_title: gameTitle,
          score: score,
          play_time: playTime
        })
      });
      fetchGameProgress(token);
    } catch (e) {
      console.error('Failed to save game progress');
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setStats({ streak: data.user.streak, daily_goal_count: data.user.daily_goal_count });
        fetchNotes(data.token);
      } else {
        setAuthError(data.error || 'Authentication failed');
      }
    } catch (e) {
      setAuthError('Network error. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setNotes([]);
    setActiveTab('dashboard');
  };

  const saveNote = async () => {
    if (!user) return;
    const token = localStorage.getItem('token');
    const method = currentNote.id ? 'PUT' : 'POST';
    const url = currentNote.id ? `${API_BASE}/notes/${currentNote.id}` : `${API_BASE}/notes`;
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: currentNote.title, content: currentNote.content })
      });
      if (res.ok) {
        fetchNotes(token);
        if (!currentNote.id) {
          const data = await res.json();
          setCurrentNote(prev => ({ ...prev, id: data.id }));
        }
      }
    } catch (e) {
      console.error('Failed to save note');
    }
  };

  const handleSessionComplete = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/stats/complete-session`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Failed to update stats');
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackText || !feedbackSubject) return;
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subject: feedbackSubject, message: feedbackText })
      });
      if (res.ok) {
        setFeedbackSent(true);
        setFeedbackText('');
        setFeedbackSubject('');
        setTimeout(() => setFeedbackSent(false), 5000);
      }
    } catch (e) {
      alert('Failed to send feedback');
    }
  };

  const handleYoutubeSubmit = (e) => {
    e.preventDefault();
    const match = ytUrl.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (match) {
      setCurrentYtId(match[1]);
      setYtUrl('');
    } else {
      alert('Invalid YouTube URL');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderAuth = () => (
    <div className="max-w-md mx-auto mt-20">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-zinc-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="text-white w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold">{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="text-zinc-500 text-sm mt-2">Join StudyFlow to sync your progress privately.</p>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          {authError && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold border border-red-100"
            >
              {authError}
            </motion.div>
          )}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Username</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-3 rounded-xl border border-zinc-100 outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all"
              value={authForm.username}
              onChange={e => setAuthForm({ ...authForm, username: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Password</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-3 rounded-xl border border-zinc-100 outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all"
              value={authForm.password}
              onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
            />
          </div>
          <button type="submit" className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10">
            {authMode === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <button 
            onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
            className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            {authMode === 'login' ? "Don't have an account? Register" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (!user) return renderAuth();

    switch (activeTab) {
      case 'dashboard':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-zinc-100 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-zinc-900/5" />
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-[0.2em] mb-6">Deep Work Session</h2>
              <div className="text-9xl font-light tracking-tighter text-zinc-900 mb-10 font-mono">
                {formatTime(timer)}
              </div>
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="px-10 py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-zinc-900/20"
                >
                  {isTimerRunning ? 'Pause Session' : 'Start Focus'}
                </button>
                <button 
                  onClick={() => { setTimer(25 * 60); setIsTimerRunning(false); }}
                  className="px-10 py-4 border border-zinc-200 text-zinc-600 rounded-2xl font-bold hover:bg-zinc-50 transition-all"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
                  <Clock className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Daily Goal</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{stats.daily_goal_count}</span>
                  <span className="text-zinc-400 text-sm">/ 4 sessions</span>
                </div>
                <div className="mt-4 h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500" 
                    style={{ width: `${Math.min((stats.daily_goal_count / 4) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-6">
                  <User className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Current Streak</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{stats.streak}</span>
                  <span className="text-zinc-400 text-sm">days</span>
                </div>
                <p className="text-xs text-zinc-400 mt-4">Keep it up, {user.username}!</p>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                  <StickyNote className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Saved Notes</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{notes.length}</span>
                  <span className="text-zinc-400 text-sm">entries</span>
                </div>
                <button onClick={() => setActiveTab('notes')} className="text-xs text-blue-600 font-bold mt-4 flex items-center gap-1 hover:underline">
                  View all <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {gameProgress.length > 0 && (
              <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-zinc-100">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold">Cognitive Module Progress</h3>
                  <button onClick={() => setActiveTab('games')} className="text-sm font-bold text-zinc-400 hover:text-zinc-900 transition-colors">Launch Modules</button>
                </div>
                <div className="space-y-4">
                  {gameProgress.map((p) => (
                    <div key={p.game_id} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <Gamepad2 className="w-5 h-5 text-zinc-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">{p.game_title}</h4>
                          <p className="text-[10px] text-zinc-400 uppercase tracking-widest">
                            Total Playtime: {Math.floor(p.play_time / 60)}m {p.play_time % 60}s
                            {p.score !== 'N/A' && ` • Best: ${p.score}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-zinc-900">Active</p>
                        <p className="text-[10px] text-zinc-400">Last played: {new Date(p.updated_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        );
      case 'notes':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 h-[700px]"
          >
            <div className="md:col-span-1 bg-white rounded-3xl border border-zinc-100 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-zinc-50 flex justify-between items-center">
                <h3 className="font-bold text-sm text-zinc-400 uppercase tracking-wider">My Notes</h3>
                <button 
                  onClick={() => setCurrentNote({ id: null, title: '', content: '' })}
                  className="p-1 hover:bg-zinc-100 rounded-lg transition-colors"
                >
                  <Search className="w-4 h-4 rotate-45" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {notes.map(note => (
                  <button 
                    key={note.id}
                    onClick={() => setCurrentNote(note)}
                    className={`w-full text-left p-4 rounded-2xl transition-all ${currentNote.id === note.id ? 'bg-zinc-900 text-white shadow-lg' : 'hover:bg-zinc-50'}`}
                  >
                    <h4 className="font-bold truncate">{note.title || 'Untitled Note'}</h4>
                    <p className={`text-xs mt-1 truncate ${currentNote.id === note.id ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      {note.content || 'No content...'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-3 bg-white p-10 rounded-[2.5rem] shadow-sm border border-zinc-100 flex flex-col">
              <input 
                type="text" 
                placeholder="Note Title..." 
                className="text-3xl font-bold mb-6 outline-none border-none placeholder:text-zinc-200"
                value={currentNote.title}
                onChange={e => setCurrentNote({ ...currentNote, title: e.target.value })}
                onBlur={saveNote}
              />
              <textarea 
                className="flex-1 resize-none outline-none text-zinc-700 leading-relaxed text-lg placeholder:text-zinc-200"
                placeholder="Start typing your study notes here..."
                value={currentNote.content}
                onChange={e => setCurrentNote({ ...currentNote, content: e.target.value })}
                onBlur={saveNote}
              />
              <div className="mt-4 pt-4 border-t border-zinc-50 flex justify-between items-center text-xs text-zinc-400">
                <span>Auto-saving enabled</span>
                <span>{currentNote.content.length} characters</span>
              </div>
            </div>
          </motion.div>
        );
      case 'resources':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto space-y-12"
          >
            <div className="text-center">
              <h2 className="text-4xl font-bold mb-4">Academic Resources</h2>
              <p className="text-zinc-500">Curated links to help you excel in your studies.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ResourceSection 
                title="Research & Libraries"
                links={[
                  { name: 'Google Scholar', url: 'https://scholar.google.com', desc: 'Search across a wide range of academic literature.' },
                  { name: 'JSTOR', url: 'https://www.jstor.org', desc: 'Digital library for scholars, researchers, and students.' },
                  { name: 'Project Gutenberg', url: 'https://www.gutenberg.org', desc: 'Over 70,000 free eBooks.' },
                  { name: 'Internet Archive', url: 'https://archive.org', desc: 'Universal access to all knowledge.' }
                ]}
              />
              <ResourceSection 
                title="Learning Platforms"
                links={[
                  { name: 'Khan Academy', url: 'https://www.khanacademy.org', desc: 'Free online courses, lessons & practice.' },
                  { name: 'Coursera', url: 'https://www.coursera.org', desc: 'Learn without limits from world-class universities.' },
                  { name: 'edX', url: 'https://www.edx.org', desc: 'Accelerate your future with 4000+ courses.' },
                  { name: 'MIT OpenCourseWare', url: 'https://ocw.mit.edu', desc: 'Free lecture notes, exams, and videos from MIT.' }
                ]}
              />
              <ResourceSection 
                title="Writing & Citation"
                links={[
                  { name: 'Purdue OWL', url: 'https://owl.purdue.edu', desc: 'The Online Writing Lab at Purdue University.' },
                  { name: 'Zotero', url: 'https://www.zotero.org', desc: 'Your personal research assistant.' },
                  { name: 'Grammarly', url: 'https://www.grammarly.com', desc: 'AI-powered writing assistant.' },
                  { name: 'Citation Machine', url: 'https://www.citationmachine.net', desc: 'Generate citations in various formats.' }
                ]}
              />
              <ResourceSection 
                title="Productivity Tools"
                links={[
                  { name: 'Notion', url: 'https://www.notion.so', desc: 'The all-in-one workspace for your notes.' },
                  { name: 'Forest', url: 'https://www.forestapp.cc', desc: 'Stay focused, be present.' },
                  { name: 'Anki', url: 'https://apps.ankiweb.net', desc: 'Powerful, intelligent flashcards.' },
                  { name: 'WolframAlpha', url: 'https://www.wolframalpha.com', desc: 'Computational intelligence engine.' }
                ]}
              />
            </div>
          </motion.div>
        );
      case 'feedback':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-zinc-100">
              <h2 className="text-3xl font-bold mb-2">Help us improve</h2>
              <p className="text-zinc-500 mb-8">Your feedback helps us build a better study environment for everyone.</p>
              
              {feedbackSent ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-50 border border-emerald-100 p-8 rounded-3xl text-center"
                >
                  <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="text-white w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-emerald-900">Feedback Sent!</h3>
                  <p className="text-emerald-600 mt-2">Thank you for your message. We'll review it shortly.</p>
                  <button 
                    onClick={() => setFeedbackSent(false)}
                    className="mt-6 text-sm font-bold text-emerald-700 hover:underline"
                  >
                    Send another message
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Subject</label>
                    <input 
                      type="text" 
                      required
                      value={feedbackSubject}
                      onChange={(e) => setFeedbackSubject(e.target.value)}
                      className="w-full px-6 py-4 rounded-2xl border border-zinc-100 outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all" 
                      placeholder="e.g., Feature Request" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Message</label>
                    <textarea 
                      required
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      className="w-full h-48 px-6 py-4 rounded-2xl border border-zinc-100 outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all resize-none" 
                      placeholder="Tell us what's on your mind..."
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-5 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/20"
                  >
                    Submit Feedback
                  </button>
                  <div className="text-center">
                    <p className="text-xs text-zinc-400">Or email us directly at:</p>
                    <a href="mailto:retroshoesco@gmail.com" className="text-xs font-bold text-zinc-900 hover:underline">retroshoesco@gmail.com</a>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        );
      case 'games':
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-6xl mx-auto"
          >
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-4xl font-bold text-zinc-900">Cognitive Modules</h2>
                <p className="text-zinc-500 mt-2">Supplementary interactive exercises for mental stimulation.</p>
              </div>
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="p-3 hover:bg-white rounded-2xl border border-transparent hover:border-zinc-100 transition-all"
              >
                <X className="w-8 h-8 text-zinc-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {gamesData.map((game, index) => (
                <motion.div 
                  key={game.id}
                  whileHover={{ y: -8 }}
                  className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-zinc-100 cursor-pointer group"
                  onClick={() => setSelectedGame(game)}
                >
                  <div className="aspect-[16/10] relative overflow-hidden bg-zinc-100">
                    <img 
                      src={game.thumbnail} 
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.target.onerror = null;
                        // Use a more reliable proxy for thumbnails
                        const originalUrl = game.thumbnail;
                        e.target.src = `https://wsrv.nl/?url=${encodeURIComponent(originalUrl)}&w=400&h=250&fit=cover`;
                      }}
                    />
                    <div className="absolute inset-0 bg-zinc-900/0 group-hover:bg-zinc-900/40 transition-all duration-500 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center scale-0 group-hover:scale-100 transition-transform duration-500 shadow-2xl">
                        <Search className="w-6 h-6 text-zinc-900" />
                      </div>
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-zinc-100 text-[10px] font-bold text-zinc-500 rounded-md uppercase tracking-widest">Module {index + 1}</span>
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900">{game.title}</h3>
                    <p className="text-sm text-zinc-400 mt-2">Interactive Study Aid</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );
      case 'music':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-zinc-100">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                  <Music className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">Study Music</h2>
                  <p className="text-zinc-500">Focus-enhancing background audio.</p>
                </div>
              </div>

              <form onSubmit={handleYoutubeSubmit} className="mb-12">
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">YouTube Audio Link</label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300" />
                    <input 
                      type="text" 
                      placeholder="Paste YouTube URL here..." 
                      className="w-full pl-12 pr-6 py-4 rounded-2xl border border-zinc-100 outline-none focus:ring-4 focus:ring-indigo-900/5 transition-all"
                      value={ytUrl}
                      onChange={e => setYtUrl(e.target.value)}
                    />
                  </div>
                  <button className="px-8 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all">
                    Play
                  </button>
                </div>
              </form>

              {currentYtId && (
                <div className="bg-zinc-900 rounded-3xl overflow-hidden aspect-video relative group">
                  <iframe 
                    src={`https://www.youtube.com/embed/${currentYtId}?autoplay=1&loop=1&playlist=${currentYtId}`}
                    className="w-full h-full border-none"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <p className="text-white font-bold text-sm">Background Audio Active</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                <button 
                  onClick={() => setCurrentYtId('jfKfPfyJRdk')}
                  className="p-6 bg-zinc-50 rounded-2xl text-left hover:bg-zinc-100 transition-all border border-transparent hover:border-zinc-200"
                >
                  <h4 className="font-bold">Lofi Girl - Radio</h4>
                  <p className="text-xs text-zinc-400 mt-1">Beats to relax/study to</p>
                </button>
                <button 
                  onClick={() => setCurrentYtId('5qap5aO4i9A')}
                  className="p-6 bg-zinc-50 rounded-2xl text-left hover:bg-zinc-100 transition-all border border-transparent hover:border-zinc-200"
                >
                  <h4 className="font-bold">Lofi Hip Hop Radio</h4>
                  <p className="text-xs text-zinc-400 mt-1">Beats to sleep/chill to</p>
                </button>
              </div>
            </div>
          </motion.div>
        );
      case 'credits':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-zinc-100 text-center">
              <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <Info className="text-white w-10 h-10" />
              </div>
              <h2 className="text-4xl font-black mb-4 tracking-tighter">Project Credits</h2>
              <p className="text-red-500 font-bold mb-4 font-tamil">"நீ ஒரு முட்டாள்"</p>
              <p className="text-zinc-500 mb-12">Every single person who put work into this project.</p>
              
              <div className="space-y-6">
                {[
                  'Lead Developer', 'Product Designer', 'Backend Engineer', 
                  'UI/UX Specialist', 'Database Architect', 'Security Analyst',
                  'Quality Assurance', 'Project Manager', 'Documentation'
                ].map(role => (
                  <div key={role} className="flex items-center justify-between p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <span className="font-bold text-zinc-400 uppercase tracking-widest text-xs">{role}</span>
                    <span className="font-black text-zinc-900 font-tamil">என் பெயரை வெளியிட முடியாது</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );
      case 'privacy':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white p-16 rounded-[3rem] shadow-sm border border-zinc-100">
              <div className="flex items-center gap-4 mb-12">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-emerald-600" />
                </div>
                <h2 className="text-4xl font-black tracking-tighter">Privacy Policy</h2>
              </div>
              <div className="prose prose-zinc max-w-none space-y-8 text-zinc-600 leading-relaxed">
                <section>
                  <h3 className="text-xl font-bold text-zinc-900 mb-4">1. Data Collection</h3>
                  <p>We collect minimal data required to provide our services. This includes your username, encrypted password, and study statistics (streaks, goal counts). We do not sell your data to third parties.</p>
                </section>
                <section>
                  <h3 className="text-xl font-bold text-zinc-900 mb-4">2. Local Storage</h3>
                  <p>We use browser local storage to keep you logged in and maintain your session preferences. This data remains on your device.</p>
                </section>
                <section>
                  <h3 className="text-xl font-bold text-zinc-900 mb-4">3. Security</h3>
                  <p>Your passwords are encrypted using industry-standard hashing algorithms (bcrypt). Your study notes are stored privately in our secure database and are only accessible to you.</p>
                </section>
                <section>
                  <h3 className="text-xl font-bold text-zinc-900 mb-4">4. Third-Party Links</h3>
                  <p>Our resources page contains links to external websites. We are not responsible for the privacy practices or content of these external sites.</p>
                </section>
              </div>
            </div>
          </motion.div>
        );
      case 'terms':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white p-16 rounded-[3rem] shadow-sm border border-zinc-100">
              <div className="flex items-center gap-4 mb-12">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-4xl font-black tracking-tighter">Terms of Service</h2>
              </div>
              <div className="prose prose-zinc max-w-none space-y-8 text-zinc-600 leading-relaxed">
                <section>
                  <h3 className="text-xl font-bold text-zinc-900 mb-4">1. Acceptance of Terms</h3>
                  <p>By accessing StudyFlow, you agree to be bound by these terms. If you do not agree, please do not use the application.</p>
                </section>
                <section>
                  <h3 className="text-xl font-bold text-zinc-900 mb-4">2. User Accounts</h3>
                  <p>You are responsible for maintaining the confidentiality of your account credentials. Any activity under your account is your responsibility.</p>
                </section>
                <section>
                  <h3 className="text-xl font-bold text-zinc-900 mb-4">3. Prohibited Use</h3>
                  <p>You may not use StudyFlow for any illegal activities or to distribute malicious software. We reserve the right to terminate accounts that violate these terms.</p>
                </section>
                <section>
                  <h3 className="text-xl font-bold text-zinc-900 mb-4">4. Disclaimer</h3>
                  <p>StudyFlow is provided "as is" without warranties of any kind. We are not liable for any data loss or productivity issues resulting from the use of this tool.</p>
                </section>
              </div>
            </div>
          </motion.div>
        );
      case 'support':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white p-16 rounded-[3rem] shadow-sm border border-zinc-100 text-center">
              <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <Mail className="text-white w-10 h-10" />
              </div>
              <h2 className="text-4xl font-black mb-4 tracking-tighter">Get Support</h2>
              <p className="text-zinc-500 mb-12">Need help with StudyFlow? Our team is here to assist you.</p>
              
              <div className="bg-zinc-50 p-8 rounded-3xl border border-zinc-100">
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2">Email Us At</p>
                <a 
                  href="mailto:retroshoesco@gmail.com" 
                  className="text-2xl font-black text-zinc-900 hover:text-zinc-600 transition-colors"
                >
                  retroshoesco@gmail.com
                </a>
              </div>
              
              <button 
                onClick={() => setActiveTab('feedback')}
                className="mt-8 text-sm font-bold text-zinc-400 hover:text-zinc-900 transition-colors"
              >
                Or submit a feedback form &rarr;
              </button>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F8] text-zinc-900 font-sans selection:bg-zinc-200">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-zinc-100 z-40">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex flex-col cursor-pointer group" onClick={() => setActiveTab('dashboard')}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center group-hover:rotate-6 transition-transform">
                <span className="text-white font-black text-xl">S</span>
              </div>
              <span className="font-black tracking-tighter text-2xl">StudyFlow</span>
            </div>
            <span className="text-[10px] font-bold text-zinc-400 ml-13 -mt-1 font-tamil">made by அநாமதேய</span>
          </div>
          
          <div className="flex items-center gap-2">
            {user && (
              <>
                <button 
                  onClick={() => setIsCloaked(!isCloaked)}
                  className={`p-3 rounded-2xl border transition-all ${isCloaked ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-zinc-50 border-zinc-100 text-zinc-400'}`}
                  title="Toggle Tab Cloak"
                >
                  <Shield className="w-5 h-5" />
                </button>
                <button 
                  onClick={openAboutBlank}
                  className="p-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-zinc-400 hover:text-zinc-900 transition-all"
                  title="Open in About:Blank"
                >
                  <ExternalLink className="w-5 h-5" />
                </button>
                <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Clock className="w-5 h-5" />} label="Dashboard" />
                <NavButton active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} icon={<StickyNote className="w-5 h-5" />} label="Notes" />
                <NavButton active={activeTab === 'music'} onClick={() => setActiveTab('music')} icon={<Music className="w-5 h-5" />} label="Music" />
                <NavButton active={activeTab === 'resources'} onClick={() => setActiveTab('resources')} icon={<BookOpen className="w-5 h-5" />} label="Resources" />
                <NavButton active={activeTab === 'feedback'} onClick={() => setActiveTab('feedback')} icon={<MessageSquare className="w-5 h-5" />} label="Feedback" />
                <div className="h-8 w-px bg-zinc-100 mx-2" />
                <div className="flex items-center gap-3 pl-2">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-zinc-900">{user.username}</p>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{stats.streak} Day Streak</p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-36 pb-24 px-8">
        {renderContent()}
      </main>

      {/* Game Modal */}
      <AnimatePresence>
        {selectedGame && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12 bg-zinc-900/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-7xl h-full rounded-[3rem] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-zinc-900" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-zinc-900">{selectedGame.title}</h3>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Interactive Learning Session</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => {
                      const score = prompt("Enter your high score or level reached:");
                      if (score) saveGameProgress(selectedGame.id, selectedGame.title, 0, score);
                    }}
                    className="px-6 py-3 bg-zinc-100 text-zinc-900 rounded-2xl text-xs font-bold hover:bg-zinc-200 transition-all flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    Log Achievement
                  </button>
                  <button 
                    onClick={() => setSelectedGame(null)}
                    className="w-12 h-12 hover:bg-zinc-50 rounded-2xl flex items-center justify-center transition-all"
                  >
                    <X className="w-8 h-8 text-zinc-400" />
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-zinc-950 relative">
                {/* Loading Iframe */}
                <iframe 
                  src="/loading.html" 
                  className="absolute inset-0 w-full h-full border-none z-10 transition-opacity duration-500"
                  style={{ display: isGameLoading ? 'block' : 'none' }}
                  title="Loading"
                />
                
                {/* Game Iframe */}
                <iframe 
                  src={selectedGame.url} 
                  className="w-full h-full border-none"
                  title={selectedGame.title}
                  onLoad={() => setIsGameLoading(false)}
                  allow="fullscreen; autoplay; encrypted-media; pointer-lock"
                  allowFullScreen
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="py-12 text-center border-t border-zinc-100 bg-white">
        <p className="text-zinc-400 text-sm font-medium">&copy; 2026 StudyFlow Productivity Suite. All rights reserved.</p>
        <div className="flex justify-center gap-6 mt-4 text-xs font-bold text-zinc-300 uppercase tracking-widest">
          <button onClick={() => setActiveTab('privacy')} className="hover:text-zinc-900 transition-colors">Privacy</button>
          <button onClick={() => setActiveTab('terms')} className="hover:text-zinc-900 transition-colors">Terms</button>
          <button onClick={() => setActiveTab('support')} className="hover:text-zinc-900 transition-colors">Support</button>
          <button onClick={() => setActiveTab('credits')} className="hover:text-zinc-900 transition-colors">Credits</button>
        </div>
      </footer>
    </div>
  );
}

function ResourceSection({ title, links }) {
  return (
    <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm">
      <h3 className="text-sm font-black text-zinc-400 uppercase tracking-[0.2em] mb-8">{title}</h3>
      <div className="space-y-6">
        {links.map(link => (
          <a 
            key={link.name} 
            href={link.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group block"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-lg group-hover:text-zinc-600 transition-colors flex items-center gap-2">
                  {link.name}
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
                </h4>
                <p className="text-sm text-zinc-400 mt-1">{link.desc}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-all">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      className={`
        flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all
        ${active 
          ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-900/20' 
          : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50'
        }
      `}
    >
      {icon}
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}
