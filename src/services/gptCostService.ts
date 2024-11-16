import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Prix par 1000 tokens (en USD) selon le modèle
const MODEL_PRICES = {
  'gpt-3.5-turbo': {
    input: 0.0015,
    output: 0.002,
    name: 'GPT-3.5 Turbo',
    description: 'Bon rapport qualité/prix'
  },
  'gpt-4': {
    input: 0.03,
    output: 0.06,
    name: 'GPT-4',
    description: 'Meilleure qualité d\'analyse'
  },
  'gpt-4-turbo-preview': {
    input: 0.01,
    output: 0.03,
    name: 'GPT-4 Turbo',
    description: 'Version préliminaire plus rapide'
  }
};

// Estimation plus précise du nombre de tokens
function estimateTokenCount(text: string): number {
  // Règles d'estimation plus précises
  const rules = {
    punctuation: 0.3, // Les signes de ponctuation comptent moins
    numbers: 0.5,    // Les chiffres comptent moins
    spaces: 0.25,    // Les espaces comptent moins
    average: 4       // Moyenne de caractères par token
  };

  // Compter les différents types de caractères
  const stats = {
    punctuation: (text.match(/[.,!?;:]/g) || []).length,
    numbers: (text.match(/\d/g) || []).length,
    spaces: (text.match(/\s/g) || []).length,
    total: text.length
  };

  // Calculer le nombre ajusté de caractères
  const adjustedLength = 
    (stats.total - stats.punctuation) +
    (stats.punctuation * rules.punctuation) +
    (stats.numbers * rules.numbers) +
    (stats.spaces * rules.spaces);

  return Math.ceil(adjustedLength / rules.average);
}

interface CostTracking {
  totalCost: number;
  lastAnalysisCost: number;
  analysisCount: number;
  resetCosts: () => void;
  addAnalysisCost: (cost: number) => void;
  getModelInfo: (model: string) => {
    name: string;
    description: string;
    estimatedCostPer1000Chars: number;
  };
}

export const useCostTracking = create<CostTracking>()(
  persist(
    (set, get) => ({
      totalCost: 0,
      lastAnalysisCost: 0,
      analysisCount: 0,
      resetCosts: () => set({ totalCost: 0, lastAnalysisCost: 0, analysisCount: 0 }),
      addAnalysisCost: (cost) => set((state) => ({
        totalCost: Number((state.totalCost + cost).toFixed(4)),
        lastAnalysisCost: cost,
        analysisCount: state.analysisCount + 1
      })),
      getModelInfo: (model) => {
        const modelData = MODEL_PRICES[model as keyof typeof MODEL_PRICES];
        if (!modelData) return {
          name: 'Modèle inconnu',
          description: 'Information non disponible',
          estimatedCostPer1000Chars: 0
        };

        const avgCostPer1000Tokens = (modelData.input + modelData.output) / 2;
        const estimatedCostPer1000Chars = avgCostPer1000Tokens * 0.25; // ~4 chars per token

        return {
          name: modelData.name,
          description: modelData.description,
          estimatedCostPer1000Chars: Number(estimatedCostPer1000Chars.toFixed(4))
        };
      }
    }),
    {
      name: 'forex-cost-tracking',
      version: 1
    }
  )
);

export function calculateAnalysisCost(
  inputText: string,
  outputText: string,
  model: string
): number {
  const prices = MODEL_PRICES[model as keyof typeof MODEL_PRICES];
  if (!prices) return 0;

  const inputTokens = estimateTokenCount(inputText);
  const outputTokens = estimateTokenCount(outputText);

  const inputCost = (inputTokens / 1000) * prices.input;
  const outputCost = (outputTokens / 1000) * prices.output;

  return Number((inputCost + outputCost).toFixed(4));
}