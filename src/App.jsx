import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, MessageSquare, StickyNote, Gamepad2, X, Search, LogOut, User, Lock, ChevronRight, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import gamesData from './data/games.json';

const API_BASE = '/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [timer, setTimer] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState({ id: null, title: '', content: '' });
  const [stats, setStats] = useState({ streak: 0, daily_goal_count: 0 });

  // Load user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setStats({ streak: parsedUser.streak || 0, daily_goal_count: parsedUser.daily_goal_count || 0 });
      fetchNotes(token);
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

  const handleAuth = async (e) => {
    e.preventDefault();
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
        alert(data.error);
      }
    } catch (e) {
      alert('Auth failed');
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
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Subject</label>
                  <input type="text" className="w-full px-6 py-4 rounded-2xl border border-zinc-100 outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all" placeholder="e.g., Feature Request" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Message</label>
                  <textarea 
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className="w-full h-48 px-6 py-4 rounded-2xl border border-zinc-100 outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all resize-none" 
                    placeholder="Tell us what's on your mind..."
                  />
                </div>
                <button className="w-full py-5 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/20">
                  Submit Feedback
                </button>
              </div>
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
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F8] text-zinc-900 font-sans selection:bg-zinc-200">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-zinc-100 z-40">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center group-hover:rotate-6 transition-transform">
              <span className="text-white font-black text-xl">S</span>
            </div>
            <span className="font-black tracking-tighter text-2xl">StudyFlow</span>
          </div>
          
          <div className="flex items-center gap-2">
            {user && (
              <>
                <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Clock className="w-5 h-5" />} label="Dashboard" />
                <NavButton active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} icon={<StickyNote className="w-5 h-5" />} label="Notes" />
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
                <button 
                  onClick={() => setSelectedGame(null)}
                  className="w-12 h-12 hover:bg-zinc-50 rounded-2xl flex items-center justify-center transition-all"
                >
                  <X className="w-8 h-8 text-zinc-400" />
                </button>
              </div>
              <div className="flex-1 bg-zinc-950 relative">
                <iframe 
                  src={selectedGame.url} 
                  className="w-full h-full border-none"
                  title={selectedGame.title}
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
          <a href="#" className="hover:text-zinc-900 transition-colors">Privacy</a>
          <a href="#" className="hover:text-zinc-900 transition-colors">Terms</a>
          <a href="#" className="hover:text-zinc-900 transition-colors">Support</a>
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
