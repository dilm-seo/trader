import create from 'zustand';
import axios from 'axios';
import { AdminStats, User } from '../types';
import { useAuthStore } from './authStore';

interface AdminState {
  stats: AdminStats | null;
  users: User[];
  isLoading: boolean;
  error: string | null;
  fetchStats: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  updateUser: (userId: string, data: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  exportData: () => Promise<Blob>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useAdminStore = create<AdminState>((set, get) => ({
  stats: null,
  users: [],
  isLoading: false,
  error: null,

  fetchStats: async () => {
    const token = useAuthStore.getState().token;
    if (!token) throw new Error('Non authentifié');

    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ stats: response.data, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de chargement';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  fetchUsers: async () => {
    const token = useAuthStore.getState().token;
    if (!token) throw new Error('Non authentifié');

    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ users: response.data, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de chargement';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateUser: async (userId: string, data: Partial<User>) => {
    const token = useAuthStore.getState().token;
    if (!token) throw new Error('Non authentifié');

    set({ isLoading: true, error: null });
    try {
      await axios.put(
        `${API_URL}/admin/users/${userId}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Mettre à jour la liste des utilisateurs
      const users = get().users.map(user =>
        user.id === userId ? { ...user, ...data } : user
      );
      set({ users, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de mise à jour';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteUser: async (userId: string) => {
    const token = useAuthStore.getState().token;
    if (!token) throw new Error('Non authentifié');

    set({ isLoading: true, error: null });
    try {
      await axios.delete(`${API_URL}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Mettre à jour la liste des utilisateurs
      const users = get().users.filter(user => user.id !== userId);
      set({ users, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de suppression';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  exportData: async () => {
    const token = useAuthStore.getState().token;
    if (!token) throw new Error('Non authentifié');

    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/admin/export`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur d\'exportation';
      set({ error: message, isLoading: false });
      throw error;
    }
  }
}));