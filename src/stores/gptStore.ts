import create from 'zustand';
import { persist } from 'zustand/middleware';

interface GptStore {
  apiKey: string;
  model: string;
  systemPrompt: string;
  error: string | null;
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  setSystemPrompt: (prompt: string) => void;
}

const DEFAULT_SYSTEM_PROMPT = `Tu es un expert en trading Forex spécialisé dans l'analyse des actualités financières. Ta mission est de fournir des recommandations de trading précises et exploitables.

Format de réponse requis:

SYNTHÈSE DU MARCHÉ:
- Résumé bref des points clés des actualités

OPPORTUNITÉS DE TRADING:
1. [Paire de devises] - [Direction: ACHAT/VENTE]
   - Point d'entrée: [niveau]
   - Stop loss: [niveau]
   - Take profit: [niveau]
   - Ratio risque/rendement: [ratio]
   - Justification: [explication courte]

RISQUES PRINCIPAUX:
- Liste des risques majeurs à surveiller

HORIZON DE TRADING:
- Court terme (intraday/swing)

Important:
- Concentre-toi uniquement sur les paires majeures (EUR/USD, GBP/USD, USD/JPY, etc.)
- Fournis des niveaux précis pour chaque recommandation
- Sois direct et concis dans tes recommandations
- Base tes analyses sur les actualités fournies`;

export const useGptStore = create<GptStore>()(
  persist(
    (set) => ({
      apiKey: '',
      model: 'gpt-3.5-turbo',
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      error: null,
      
      setApiKey: (key) => {
        if (!key.trim().startsWith('sk-')) {
          set({ error: 'La clé API doit commencer par "sk-"' });
          return;
        }
        set({ apiKey: key, error: null });
      },
      
      setModel: (model) => {
        const validModels = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo-preview'];
        if (!validModels.includes(model)) {
          set({ error: 'Modèle GPT invalide' });
          return;
        }
        set({ model, error: null });
      },

      setSystemPrompt: (prompt) => {
        if (!prompt.trim()) {
          set({ error: 'Le prompt système ne peut pas être vide' });
          return;
        }
        set({ systemPrompt: prompt, error: null });
      },
    }),
    {
      name: 'forex-gpt-storage',
      partialize: (state) => ({ 
        apiKey: state.apiKey, 
        model: state.model,
        systemPrompt: state.systemPrompt 
      }),
    }
  )
);