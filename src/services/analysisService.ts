import { dbService } from './database';
import { useAuthStore } from '../stores/authStore';

export const analysisService = {
  saveAnalysis(content: string, model: string, cost: number) {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('Non authentifié');

    return dbService.saveAnalysis(user.id, content, model, cost);
  },

  getUserAnalyses() {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('Non authentifié');

    return dbService.getUserAnalyses(user.id);
  },

  checkAnalysisLimit() {
    const user = useAuthStore.getState().user;
    if (!user) return false;

    return dbService.checkAnalysisLimit(user.id);
  }
};