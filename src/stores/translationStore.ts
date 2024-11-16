import create from 'zustand';
import axios from 'axios';
import { persist } from 'zustand/middleware';

interface TranslationCache {
  [key: string]: {
    translation: string;
    timestamp: number;
  };
}

interface TranslationStore {
  cache: TranslationCache;
  error: string | null;
  lastRequestTime: number;
  translateText: (text: string) => Promise<string>;
  clearCache: () => void;
}

// Configuration
const MYMEMORY_API_URL = 'https://api.mymemory.translated.net/get';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 heures
const MIN_REQUEST_INTERVAL = 2000; // 2 secondes entre chaque requête
const MAX_RETRIES = 3;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useTranslationStore = create<TranslationStore>()(
  persist(
    (set, get) => ({
      cache: {},
      error: null,
      lastRequestTime: 0,

      translateText: async (text: string) => {
        try {
          const store = get();
          const cacheKey = text.trim();

          // Vérifier le cache
          const cachedResult = store.cache[cacheKey];
          if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_DURATION) {
            console.log('Traduction trouvée dans le cache');
            return cachedResult.translation;
          }

          // Respecter l'intervalle minimum entre les requêtes
          const timeSinceLastRequest = Date.now() - store.lastRequestTime;
          if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
            await sleep(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
          }

          let lastError = null;
          for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
              const response = await axios.get(MYMEMORY_API_URL, {
                params: {
                  q: text,
                  langpair: 'en|fr',
                  de: 'admin@dilm-trading.fr',
                  mt: '1'
                },
                timeout: 10000
              });

              set({ lastRequestTime: Date.now() });

              if (response.data?.responseStatus === 429) {
                throw new Error('Limite de traduction atteinte');
              }

              if (response.data?.responseData?.translatedText) {
                const translation = response.data.responseData.translatedText;
                
                // Mettre en cache
                set(state => ({
                  cache: {
                    ...state.cache,
                    [cacheKey]: {
                      translation,
                      timestamp: Date.now()
                    }
                  },
                  error: null
                }));

                return translation;
              }

              throw new Error('Réponse de traduction invalide');
            } catch (error) {
              lastError = error;
              if (error.response?.status === 429) {
                // Attendre plus longtemps entre les tentatives
                await sleep(MIN_REQUEST_INTERVAL * (attempt + 1));
              } else {
                break;
              }
            }
          }

          // Si toutes les tentatives ont échoué, retourner le texte original
          console.error('Échec de la traduction après plusieurs tentatives:', lastError);
          return text;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Erreur de traduction inconnue';
          set({ error: errorMsg });
          return text; // Retourner le texte original en cas d'erreur
        }
      },

      clearCache: () => set({ cache: {} })
    }),
    {
      name: 'forex-translation-storage',
      partialize: (state) => ({ cache: state.cache }),
    }
  )
);