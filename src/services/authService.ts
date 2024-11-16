import { dbService } from './database';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authService = {
  async login(email: string, password: string) {
    const user = await dbService.authenticateUser(email, password);
    if (!user) throw new Error('Identifiants invalides');

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return { user, token };
  },

  async register(email: string, username: string, password: string) {
    const user = await dbService.createUser(email, username, password);
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return { user, token };
  },

  verifyToken(token: string) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch {
      return null;
    }
  }
};