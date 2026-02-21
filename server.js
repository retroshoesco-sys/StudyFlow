import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database('studyflow.db');
const JWT_SECRET = 'studyflow-secret-key-123';

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    streak INTEGER DEFAULT 0,
    last_active DATE,
    daily_goal_count INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    content TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    subject TEXT,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS game_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    game_id TEXT,
    game_title TEXT,
    score TEXT,
    play_time INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    UNIQUE(user_id, game_id)
  );
`);

async function startServer() {
  const app = express();
  app.use(express.json());

  // Auth Routes
  app.post('/api/auth/register', (req, res) => {
    const { username, password } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const info = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hashedPassword);
      const token = jwt.sign({ id: info.lastInsertRowid, username }, JWT_SECRET);
      res.json({ token, user: { id: info.lastInsertRowid, username, streak: 0, daily_goal_count: 0 } });
    } catch (e) {
      res.status(400).json({ error: 'Username already exists' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ id: user.id, username }, JWT_SECRET);
      res.json({ token, user: { id: user.id, username, streak: user.streak, daily_goal_count: user.daily_goal_count } });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  // Middleware to verify token
  const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch (e) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  // Notes Routes
  app.get('/api/notes', authenticate, (req, res) => {
    const notes = db.prepare('SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC').all(req.user.id);
    res.json(notes);
  });

  app.post('/api/notes', authenticate, (req, res) => {
    const { title, content } = req.body;
    const info = db.prepare('INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)').run(req.user.id, title, content);
    res.json({ id: info.lastInsertRowid, title, content });
  });

  app.put('/api/notes/:id', authenticate, (req, res) => {
    const { title, content } = req.body;
    db.prepare('UPDATE notes SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?')
      .run(title, content, req.params.id, req.user.id);
    res.json({ success: true });
  });

  // Stats Routes
  app.post('/api/stats/complete-session', authenticate, (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    
    let newStreak = user.streak;
    let newGoalCount = user.daily_goal_count + 1;

    // Simple streak logic: if last_active was yesterday, increment. If today, stay. Else reset.
    if (user.last_active) {
      const lastActive = new Date(user.last_active);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastActive.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
        newStreak += 1;
      } else if (lastActive.toISOString().split('T')[0] !== today) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    db.prepare('UPDATE users SET streak = ?, daily_goal_count = ?, last_active = ? WHERE id = ?')
      .run(newStreak, newGoalCount, today, req.user.id);
    
    res.json({ streak: newStreak, daily_goal_count: newGoalCount });
  });

  // Feedback Route
  app.post('/api/feedback', authenticate, (req, res) => {
    const { subject, message } = req.body;
    db.prepare('INSERT INTO feedback (user_id, subject, message) VALUES (?, ?, ?)')
      .run(req.user.id, subject, message);
    console.log(`Feedback received for retroshoesco@gmail.com: [${subject}] ${message}`);
    res.json({ success: true });
  });

  // Game Progress Routes
  app.get('/api/game-progress', authenticate, (req, res) => {
    const progress = db.prepare('SELECT * FROM game_progress WHERE user_id = ?').all(req.user.id);
    res.json(progress);
  });

  app.post('/api/game-progress', authenticate, (req, res) => {
    const { game_id, game_title, score, play_time } = req.body;
    db.prepare(`
      INSERT INTO game_progress (user_id, game_id, game_title, score, play_time, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, game_id) DO UPDATE SET
        score = excluded.score,
        play_time = game_progress.play_time + excluded.play_time,
        updated_at = CURRENT_TIMESTAMP
    `).run(req.user.id, game_id, game_title, score, play_time);
    res.json({ success: true });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
  }

  app.listen(3000, '0.0.0.0', () => {
    console.log('Server running on http://localhost:3000');
  });
}

startServer();
