import Database from 'better-sqlite3';
import { User, SubscriptionTier } from '../types';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const db = new Database('forex-analyzer.db');

// Initialisation des tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    subscription TEXT DEFAULT 'free',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_login TEXT
  );

  CREATE TABLE IF NOT EXISTS analyses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    model TEXT NOT NULL,
    cost REAL NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS analysis_limits (
    user_id TEXT PRIMARY KEY,
    count INTEGER DEFAULT 0,
    last_reset TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Requêtes préparées
const queries = {
  createUser: db.prepare(`
    INSERT INTO users (id, email, username, password, role, subscription)
    VALUES (?, ?, ?, ?, ?, ?)
  `),

  getUserByEmail: db.prepare(`
    SELECT * FROM users WHERE email = ?
  `),

  getUserById: db.prepare(`
    SELECT * FROM users WHERE id = ?
  `),

  updateLastLogin: db.prepare(`
    UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?
  `),

  createAnalysis: db.prepare(`
    INSERT INTO analyses (id, user_id, content, model, cost)
    VALUES (?, ?, ?, ?, ?)
  `),

  getAnalysesByUser: db.prepare(`
    SELECT * FROM analyses WHERE user_id = ? ORDER BY created_at DESC
  `),

  getDailyAnalysisCount: db.prepare(`
    SELECT COUNT(*) as count FROM analyses 
    WHERE user_id = ? AND date(created_at) = date('now')
  `),

  updateAnalysisLimit: db.prepare(`
    INSERT OR REPLACE INTO analysis_limits (user_id, count, last_reset)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `),

  getAnalysisLimit: db.prepare(`
    SELECT * FROM analysis_limits WHERE user_id = ?
  `),

  // Requêtes admin
  getAllUsers: db.prepare(`
    SELECT * FROM users ORDER BY created_at DESC
  `),

  getStats: db.prepare(`
    SELECT 
      COUNT(DISTINCT u.id) as total_users,
      COUNT(DISTINCT CASE WHEN u.last_login > datetime('now', '-7 days') THEN u.id END) as active_users,
      COUNT(a.id) as total_analyses,
      COALESCE(SUM(a.cost), 0) as total_costs,
      COUNT(CASE WHEN u.subscription = 'free' THEN 1 END) as free_users,
      COUNT(CASE WHEN u.subscription = 'basic' THEN 1 END) as basic_users,
      COUNT(CASE WHEN u.subscription = 'premium' THEN 1 END) as premium_users,
      COUNT(CASE WHEN u.subscription = 'enterprise' THEN 1 END) as enterprise_users
    FROM users u
    LEFT JOIN analyses a ON u.id = a.user_id
  `),

  deleteUser: db.prepare(`
    DELETE FROM users WHERE id = ?
  `)
};

export const dbService = {
  // Authentification
  async createUser(email: string, username: string, password: string, role: string = 'user'): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();
    
    queries.createUser.run(id, email, username, hashedPassword, role, 'free');
    return queries.getUserById.get(id);
  },

  async authenticateUser(email: string, password: string): Promise<User | null> {
    const user = queries.getUserByEmail.get(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;

    queries.updateLastLogin.run(user.id);
    return user;
  },

  // Analyses
  saveAnalysis(userId: string, content: string, model: string, cost: number) {
    const id = uuidv4();
    return queries.createAnalysis.run(id, userId, content, model, cost);
  },

  getUserAnalyses(userId: string) {
    return queries.getAnalysesByUser.all(userId);
  },

  checkAnalysisLimit(userId: string): boolean {
    const user = queries.getUserById.get(userId);
    if (!user) return false;

    // Les utilisateurs premium n'ont pas de limite
    if (user.subscription !== 'free') return true;

    const limit = queries.getAnalysisLimit.get(userId);
    const today = new Date().toDateString();

    if (!limit || limit.last_reset !== today) {
      queries.updateAnalysisLimit.run(userId, 1);
      return true;
    }

    if (limit.count >= 5) return false;

    queries.updateAnalysisLimit.run(userId, limit.count + 1);
    return true;
  },

  // Admin
  getStats() {
    const stats = queries.getStats.get();
    return {
      totalUsers: stats.total_users,
      activeUsers: stats.active_users,
      totalAnalyses: stats.total_analyses,
      totalCosts: Number(stats.total_costs.toFixed(2)),
      subscriptionStats: {
        free: stats.free_users,
        basic: stats.basic_users,
        premium: stats.premium_users,
        enterprise: stats.enterprise_users
      }
    };
  },

  getAllUsers() {
    return queries.getAllUsers.all();
  },

  deleteUser(userId: string) {
    return queries.deleteUser.run(userId);
  }
};

// Créer un utilisateur admin par défaut si aucun n'existe
const adminExists = queries.getUserByEmail.get('admin@dilm-trading.fr');
if (!adminExists) {
  dbService.createUser('admin@dilm-trading.fr', 'admin', 'admin123', 'admin')
    .catch(console.error);
}