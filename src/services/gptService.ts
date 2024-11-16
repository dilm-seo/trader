import axios, { AxiosError } from 'axios';
import { decode } from 'html-entities';
import { calculateAnalysisCost, useCostTracking } from './gptCostService';

interface GptResponse {
  success: boolean;
  content?: string;
  error?: string;
  cost?: number;
}

type OutputFormat = 'html' | 'markdown' | 'text';

function formatNewsForAnalysis(news: any[]): string {
  return news.map(item => (
    `SOURCE: ${item.source}\n` +
    `TITRE: ${decode(item.title)}\n` +
    `DATE: ${new Date(item.pubDate).toLocaleString('fr-FR')}\n` +
    `DESCRIPTION: ${decode(item.description)}\n`
  )).join('\n---\n\n');
}

function adaptSystemPrompt(basePrompt: string, format: OutputFormat): string {
  const formatInstructions = {
    html: 'Formatez votre réponse en HTML avec des balises appropriées pour la mise en forme.',
    markdown: 'Formatez votre réponse en Markdown pour une meilleure lisibilité.',
    text: 'Fournissez votre réponse en texte brut sans formatage particulier.'
  };

  return `${basePrompt}\n\nFormat de sortie: ${formatInstructions[format]}`;
}

function handleGptError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    switch (axiosError.response?.status) {
      case 401:
        return 'Clé API invalide. Veuillez vérifier vos paramètres.';
      case 429:
        return 'Limite de requêtes atteinte. Veuillez réessayer dans quelques minutes.';
      case 500:
        return 'Erreur serveur OpenAI. Veuillez réessayer plus tard.';
      default:
        return `Erreur réseau: ${axiosError.message}`;
    }
  }
  return error instanceof Error ? error.message : 'Erreur inconnue lors de l\'analyse';
}

export async function analyzeWithGpt(
  apiKey: string,
  model: string,
  systemPrompt: string,
  news: any[],
  outputFormat: OutputFormat = 'html'
): Promise<GptResponse> {
  try {
    if (!apiKey?.trim()) {
      throw new Error('Clé API non configurée');
    }

    if (!news || news.length === 0) {
      throw new Error('Aucune actualité à analyser');
    }

    const formattedNews = formatNewsForAnalysis(news);
    const adaptedPrompt = adaptSystemPrompt(systemPrompt, outputFormat);
    const inputText = `${adaptedPrompt}\n\n${formattedNews}`;

    console.log('Analyse en cours...', {
      model,
      format: outputFormat,
      newsCount: news.length
    });

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
        messages: [
          {
            role: 'system',
            content: adaptedPrompt
          },
          {
            role: 'user',
            content: `Voici les dernières actualités Forex à analyser:\n\n${formattedNews}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Réponse GPT invalide ou vide');
    }

    const outputText = response.data.choices[0].message.content;
    const cost = calculateAnalysisCost(inputText, outputText, model);
    useCostTracking.getState().addAnalysisCost(cost);

    console.log('Analyse terminée avec succès', {
      cost,
      outputLength: outputText.length
    });

    return {
      success: true,
      content: outputText,
      cost
    };
  } catch (error) {
    const errorMessage = handleGptError(error);
    console.error('Erreur GPT:', errorMessage);
    return {
      success: false,
      error: errorMessage
    };
  }
}