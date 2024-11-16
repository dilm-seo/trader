import { dbService } from './database';
import { useAuthStore } from '../stores/authStore';

export const adminService = {
  getStats() {
    const user = useAuthStore.getState().user;
    if (!user || user.role !== 'admin') {
      throw new Error('Accès non autorisé');
    }

    return dbService.getStats();
  },

  getAllUsers() {
    const user = useAuthStore.getState().user;
    if (!user || user.role !== 'admin') {
      throw new Error('Accès non autorisé');
    }

    return dbService.getAllUsers();
  },

  deleteUser(userId: string) {
    const user = useAuthStore.getState().user;
    if (!user || user.role !== 'admin') {
      throw new Error('Accès non autorisé');
    }

    return dbService.deleteUser(userId);
  }
};