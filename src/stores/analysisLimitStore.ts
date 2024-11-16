import create from 'zustand';
import { persist } from 'zustand/middleware';

interface AnalysisLimit {
  count: number;
  lastReset: string;
  checkLimit: () => boolean;
  incrementCount: () => void;
  resetCount: () => void;
}

const DAILY_LIMIT = 100;

export const useAnalysisLimitStore = create<AnalysisLimit>()(
  persist(
    (set, get) => ({
      count: 0,
      lastReset: new Date().toDateString(),

      checkLimit: () => {
        const { count, lastReset } = get();
        const today = new Date().toDateString();

        // Réinitialiser le compteur si c'est un nouveau jour
        if (lastReset !== today) {
          set({ count: 0, lastReset: today });
          return true;
        }

        return count < DAILY_LIMIT;
      },

      incrementCount: () => {
        const { checkLimit } = get();
        if (checkLimit()) {
          set(state => ({ count: state.count + 1 }));
        }
      },

      resetCount: () => {
        set({ count: 0, lastReset: new Date().toDateString() });
      }
    }),
    {
      name: 'forex-analysis-limit'
    }
  )
);