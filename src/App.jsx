import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, MessageSquare, StickyNote, Gamepad2, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import gamesData from './data/games.json';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [timer, setTimer] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

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
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-100 text-center">
              <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-widest mb-4">Focus Timer</h2>
              <div className="text-8xl font-light tracking-tighter text-zinc-900 mb-8 font-mono">
                {formatTime(timer)}
              </div>
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="px-8 py-3 bg-zinc-900 text-white rounded-full font-medium hover:bg-zinc-800 transition-colors"
                >
                  {isTimerRunning ? 'Pause' : 'Start Focus'}
                </button>
                <button 
                  onClick={() => { setTimer(25 * 60); setIsTimerRunning(false); }}
                  className="px-8 py-3 border border-zinc-200 text-zinc-600 rounded-full font-medium hover:bg-zinc-50 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-zinc-400" />
                  Daily Goal
                </h3>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  Complete at least 4 focus sessions today to maintain your streak. You've completed 0 so far.
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <StickyNote className="w-5 h-5 text-zinc-400" />
                  Quick Tip
                </h3>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  The Pomodoro Technique suggests taking a 5-minute break every 25 minutes of work.
                </p>
              </div>
            </div>
          </motion.div>
        );
      case 'notes':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto h-[600px] flex flex-col"
          >
            <div className="bg-white flex-1 p-8 rounded-2xl shadow-sm border border-zinc-100 flex flex-col">
              <input 
                type="text" 
                placeholder="Note Title..." 
                className="text-2xl font-semibold mb-4 outline-none border-b border-zinc-100 pb-2"
              />
              <textarea 
                className="flex-1 resize-none outline-none text-zinc-700 leading-relaxed"
                placeholder="Start typing your study notes here..."
              />
            </div>
          </motion.div>
        );
      case 'resources':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {['Academic Journals', 'Online Libraries', 'Research Tools', 'Citation Guides', 'Study Communities', 'Video Lectures'].map((item) => (
              <div key={item} className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 hover:border-zinc-300 transition-colors cursor-pointer group">
                <div className="w-10 h-10 bg-zinc-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-zinc-100 transition-colors">
                  <Search className="w-5 h-5 text-zinc-400" />
                </div>
                <h4 className="font-medium text-zinc-900">{item}</h4>
                <p className="text-xs text-zinc-500 mt-1">Access curated educational links.</p>
              </div>
            ))}
          </motion.div>
        );
      case 'feedback':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-100">
              <h2 className="text-2xl font-semibold mb-2">Help us improve</h2>
              <p className="text-zinc-500 mb-6">Your feedback helps us build a better study environment for everyone.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Subject</label>
                  <input type="text" className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-100 transition-all" placeholder="e.g., Feature Request" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Message</label>
                  <textarea 
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className="w-full h-32 px-4 py-2 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-100 transition-all resize-none" 
                    placeholder="Tell us what's on your mind..."
                  />
                </div>
                <button className="w-full py-3 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 transition-colors">
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
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-zinc-900">Cognitive Modules</h2>
                <p className="text-zinc-500">Supplementary interactive exercises for mental stimulation.</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors"
                  title="Close"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {gamesData.map((game, index) => (
                <motion.div 
                  key={game.id}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-zinc-100 cursor-pointer group"
                  onClick={() => setSelectedGame(game)}
                >
                  <div className="aspect-video relative overflow-hidden bg-zinc-100">
                    <img 
                      src={game.thumbnail} 
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Search className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-zinc-900">Module {index + 1}: {game.title}</h3>
                    <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider">Interactive Study Aid</p>
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
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-zinc-100 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="font-semibold tracking-tight text-lg">StudyFlow</span>
          </div>
          
          <div className="flex items-center gap-1">
            <NavButton 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')}
              icon={<Clock className="w-4 h-4" />}
              label="Dashboard"
            />
            <NavButton 
              active={activeTab === 'notes'} 
              onClick={() => setActiveTab('notes')}
              icon={<StickyNote className="w-4 h-4" />}
              label="Notes"
            />
            <NavButton 
              active={activeTab === 'resources'} 
              onClick={() => setActiveTab('resources')}
              icon={<BookOpen className="w-4 h-4" />}
              label="Resources"
            />
            <NavButton 
              active={activeTab === 'feedback'} 
              onClick={() => setActiveTab('feedback')}
              icon={<MessageSquare className="w-4 h-4" />}
              label="Feedback"
            />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-32 pb-20 px-6">
        {renderContent()}
      </main>

      {/* Game Modal */}
      <AnimatePresence>
        {selectedGame && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-6xl h-full rounded-3xl overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-zinc-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900">{selectedGame.title}</h3>
                    <p className="text-xs text-zinc-500">Interactive Learning Session</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedGame(null)}
                  className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 bg-zinc-900 relative">
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

    <footer className="py-10 text-center text-zinc-400 text-sm">
        <p>&copy; 2026 StudyFlow Productivity Suite. All rights reserved.</p>
      </footer>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
        ${active 
          ? 'bg-zinc-900 text-white shadow-md' 
          : 'text-zinc-500 hover:bg-zinc-100'
        }
      `}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}
