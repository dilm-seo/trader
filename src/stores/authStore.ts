import create from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { User, UserSettings } from '../types';

interface AuthState {
  user: User | null;
  settings: UserSettings;
  isLoading: boolean;
  error: string | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, username: string, password: string) => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      settings: {
        theme: 'dark',
        language: 'fr',
        emailNotifications: true,
        analysisFormat: 'html'
      },
      isLoading: false,
      error: null,
      token: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${API_URL}/auth/login`, {
            email,
            password
          });

          const { user, token } = response.data;
          set({ user, token, isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Erreur de connexion';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({ user: null, token: null, error: null });
      },

      register: async (email: string, username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${API_URL}/auth/register`, {
            email,
            username,
            password
          });

          const { user, token } = response.data;
          set({ user, token, isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Erreur d\'inscription';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      updateSettings: async (newSettings: Partial<UserSettings>) => {
        const { token } = get();
        if (!token) throw new Error('Non authentifié');

        set({ isLoading: true, error: null });
        try {
          const response = await axios.put(
            `${API_URL}/user/settings`,
            newSettings,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );

          set(state => ({
            settings: { ...state.settings, ...response.data },
            isLoading: false
          }));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Erreur de mise à jour';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      updateProfile: async (data: Partial<User>) => {
        const { token } = get();
        if (!token) throw new Error('Non authentifié');

        set({ isLoading: true, error: null });
        try {
          const response = await axios.put(
            `${API_URL}/user/profile`,
            data,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );

          set(state => ({
            user: { ...state.user!, ...response.data },
            isLoading: false
          }));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Erreur de mise à jour';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      resetPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          await axios.post(`${API_URL}/auth/reset-password`, { email });
          set({ isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Erreur de réinitialisation';
          set({ error: message, isLoading: false });
          throw error;
        }
      }
    }),
    {
      name: 'forex-auth-storage',
      partialize: (state) => ({
        token: state.token,
        settings: state.settings
      })
    }
  )
);