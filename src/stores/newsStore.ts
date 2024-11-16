import create from 'zustand';
import axios from 'axios';
import { FeedSource, NewsItem } from '../types';
import { persist } from 'zustand/middleware';

interface NewsStore {
  feeds: FeedSource[];
  news: NewsItem[];
  isLoading: boolean;
  error: string | null;
  addFeed: (feed: FeedSource) => void;
  removeFeed: (url: string) => void;
  toggleFeed: (url: string) => void;
  updateFeed: (originalUrl: string, updatedFeed: FeedSource) => void;
  fetchNews: () => Promise<void>;
}

// Helper to validate URL
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Helper to parse XML to JSON
const parseXML = (xml: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const items = Array.from(doc.querySelectorAll('item'));
  
  return items.map(item => ({
    title: item.querySelector('title')?.textContent?.trim() || 'No title',
    description: (
      item.querySelector('description')?.textContent?.trim() ||
      item.querySelector('content\\:encoded')?.textContent?.trim() ||
      'No description'
    ),
    pubDate: item.querySelector('pubDate')?.textContent || new Date().toISOString(),
    link: item.querySelector('link')?.textContent || '#',
  }));
};

export const useNewsStore = create<NewsStore>()(
  persist(
    (set, get) => ({
      feeds: [
        {
          name: 'ForexLive',
          url: 'https://www.forexlive.com/feed/news',
          enabled: true,
        },
      ],
      news: [],
      isLoading: false,
      error: null,

      addFeed: (feed) => {
        if (!feed.name.trim() || !isValidUrl(feed.url)) {
          set({ error: 'Données du flux invalides' });
          return;
        }

        const feeds = get().feeds;
        if (feeds.some(f => f.url === feed.url)) {
          set({ error: 'Ce flux existe déjà' });
          return;
        }

        set((state) => ({
          feeds: [...state.feeds, feed],
          error: null,
        }));
      },

      removeFeed: (url) => {
        set((state) => ({
          feeds: state.feeds.filter((feed) => feed.url !== url),
          error: null,
        }));
      },

      toggleFeed: (url) => {
        set((state) => ({
          feeds: state.feeds.map((feed) =>
            feed.url === url ? { ...feed, enabled: !feed.enabled } : feed
          ),
          error: null,
        }));
      },

      updateFeed: (originalUrl, updatedFeed) => {
        if (!updatedFeed.name.trim() || !isValidUrl(updatedFeed.url)) {
          set({ error: 'Données du flux invalides' });
          return;
        }

        const feeds = get().feeds;
        if (updatedFeed.url !== originalUrl && feeds.some(f => f.url === updatedFeed.url)) {
          set({ error: 'Ce flux existe déjà' });
          return;
        }

        set((state) => ({
          feeds: state.feeds.map((feed) =>
            feed.url === originalUrl ? updatedFeed : feed
          ),
          error: null,
        }));
      },

      fetchNews: async () => {
        set({ isLoading: true, error: null });
        try {
          const enabledFeeds = get().feeds.filter((feed) => feed.enabled);
          
          if (enabledFeeds.length === 0) {
            throw new Error('Aucune source d\'actualités activée');
          }

          console.log('Récupération des actualités depuis:', enabledFeeds.map(f => f.name).join(', '));

          const newsPromises = enabledFeeds.map(async (feed) => {
            try {
              const response = await axios.get(feed.url, {
                timeout: 10000,
                headers: {
                  'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml',
                }
              });
              
              const items = parseXML(response.data);
              return items.map(item => ({
                source: feed.name,
                ...item,
              }));
            } catch (error) {
              console.error(`Erreur lors de la récupération du flux ${feed.name}:`, error);
              return [];
            }
          });

          const allNews = await Promise.all(newsPromises);
          const flattenedNews = allNews
            .flat()
            .filter(item => item.title && item.description)
            .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
            .slice(0, 10); // Limite aux 10 dernières actualités

          console.log(`${flattenedNews.length} actualités récupérées au total`);

          set({ 
            news: flattenedNews, 
            isLoading: false,
            error: null 
          });
        } catch (error) {
          console.error('Erreur lors de la récupération des actualités:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Échec de la récupération des actualités',
            isLoading: false,
            news: [] 
          });
        }
      },
    }),
    {
      name: 'forex-news-storage',
      partialize: (state) => ({ feeds: state.feeds }),
    }
  )
);