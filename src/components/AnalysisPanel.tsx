import React, { useState, useCallback } from 'react';
import { useNewsStore } from '../stores/newsStore';
import { useGptStore } from '../stores/gptStore';
import { useAuthStore } from '../stores/authStore';
import { useAnalysisLimitStore } from '../stores/analysisLimitStore';
import { analyzeWithGpt } from '../services/gptService';
import { useCostTracking } from '../services/gptCostService';
import toast from 'react-hot-toast';
import PromoPopup from './PromoPopup';
import ReactMarkdown from 'react-markdown';
import LoginModal from './auth/LoginModal';

type OutputFormat = 'html' | 'markdown' | 'text';

const AnalysisPanel = () => {
  const { news } = useNewsStore();
  const { apiKey, model, systemPrompt } = useGptStore();
  const { user } = useAuthStore();
  const { checkLimit, incrementCount } = useAnalysisLimitStore();
  const { totalCost, lastAnalysisCost, analysisCount, getModelInfo } = useCostTracking();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [showPromo, setShowPromo] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('html');

  const modelInfo = getModelInfo(model);
  const estimatedCost = (
    (news.reduce((acc, item) => acc + item.title.length + item.description.length, 0) / 1000) *
    modelInfo.estimatedCostPer1000Chars
  ).toFixed(4);

  const renderAnalysis = useCallback(() => {
    if (!analysis) return null;

    switch (outputFormat) {
      case 'html':
        return <div dangerouslySetInnerHTML={{ __html: analysis }} />;
      case 'markdown':
        return <ReactMarkdown>{analysis}</ReactMarkdown>;
      default:
        return <pre className="whitespace-pre-wrap">{analysis}</pre>;
    }
  }, [analysis, outputFormat]);

  const handleAnalyze = async () => {
    if (!user && !checkLimit()) {
      toast.error('Limite d\'analyses atteinte. Veuillez vous connecter pour continuer.');
      setShowLoginModal(true);
      return;
    }

    if (!apiKey) {
      toast.error('Veuillez configurer votre clé API GPT dans les paramètres');
      return;
    }

    if (news.length === 0) {
      toast.error('Aucune actualité à analyser');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeWithGpt(apiKey, model, systemPrompt, news, outputFormat);
      
      if (result.success && result.content) {
        setAnalysis(result.content);
        toast.success(`Analyse terminée (Coût: ${result.cost}$)`);
        setShowPromo(true);
        if (!user) {
          incrementCount();
        }
      } else {
        throw new Error(result.error || 'Erreur lors de l\'analyse');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(errorMessage);
      console.error('Erreur d\'analyse:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-6 text-white">Analyse du Marché</h2>
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <div className="text-gray-300">
              <div>Modèle: <span className="text-indigo-400">{modelInfo.name}</span></div>
              <div className="text-sm text-gray-400">{modelInfo.description}</div>
              <div>Actualités disponibles: <span className="text-indigo-400">{news.length}</span></div>
              {!user && (
                <div className="text-yellow-400">
                  Analyses restantes aujourd'hui: {5 - useAnalysisLimitStore.getState().count}/5
                </div>
              )}
            </div>
            <div className="text-sm text-gray-400">
              <div>Coût estimé: <span className="text-green-400">${estimatedCost}</span></div>
              <div>Coût dernière analyse: <span className="text-green-400">${lastAnalysisCost}</span></div>
              <div>Coût total: <span className="text-green-400">${totalCost}</span> ({analysisCount} analyses)</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
              className="bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="html">HTML</option>
              <option value="markdown">Markdown</option>
              <option value="text">Texte brut</option>
            </select>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || news.length === 0}
              className={`bg-indigo-600 text-white px-6 py-3 rounded-lg transition-colors ${
                isAnalyzing || news.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-500'
              }`}
            >
              {isAnalyzing ? 'Analyse en cours...' : 'Analyser les actualités'}
            </button>
          </div>
        </div>
        {news.length === 0 && (
          <p className="text-yellow-400">
            Aucune actualité disponible. Veuillez configurer et activer des sources d'actualités dans les paramètres.
          </p>
        )}
      </div>

      {analysis && (
        <div className="bg-gray-800 rounded-lg p-6 prose prose-invert max-w-none">
          {renderAnalysis()}
        </div>
      )}

      <PromoPopup isOpen={showPromo} onClose={() => setShowPromo(false)} />
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
};

export default AnalysisPanel;