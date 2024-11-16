import React, { useEffect, useState, useCallback } from 'react';
import { useNewsStore } from '../stores/newsStore';
import { useTranslationStore } from '../stores/translationStore';
import { decode } from 'html-entities';
import toast from 'react-hot-toast';

const NewsList = () => {
  const { news, fetchNews } = useNewsStore();
  const { translateText } = useTranslationStore();
  const [translatedNews, setTranslatedNews] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTranslatingAll, setIsTranslatingAll] = useState(false);

  useEffect(() => {
    fetchNews();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchNews();
      toast.success('Actualités mises à jour');
      // Réinitialiser les traductions car nous avons de nouvelles actualités
      setTranslatedNews({});
    } catch (error) {
      toast.error('Erreur lors de la mise à jour des actualités');
    } finally {
      setIsRefreshing(false);
    }
  };

  const cleanHtml = useCallback((html: string): string => {
    const withoutTags = html.replace(/<[^>]*>/g, ' ');
    const decoded = decode(withoutTags);
    return decoded.replace(/\s+/g, ' ').trim();
  }, []);

  const handleTranslate = async (id: string, text: string) => {
    if (isTranslating[id]) return;

    setIsTranslating(prev => ({ ...prev, [id]: true }));
    try {
      const translatedText = await translateText(cleanHtml(text));
      if (translatedText !== text) { // Ne mettre à jour que si la traduction est différente
        setTranslatedNews(prev => ({ ...prev, [id]: translatedText }));
        toast.success('Traduction réussie', { duration: 2000 });
      } else {
        toast.error('Service de traduction temporairement indisponible', { duration: 3000 });
      }
    } catch (error) {
      toast.error('Erreur de traduction - Réessayez plus tard', { duration: 3000 });
      console.error('Erreur de traduction:', error);
    } finally {
      setIsTranslating(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleTranslateAll = async () => {
    if (isTranslatingAll) return;
    setIsTranslatingAll(true);

    try {
      let count = 0;
      const total = news.length * 2; // Titre + Description pour chaque news

      for (const item of news) {
        const newsId = `${item.source}-${news.indexOf(item)}`;
        
        // Traduire le titre s'il n'est pas déjà traduit
        if (!translatedNews[`${newsId}-title`]) {
          const cleanTitle = cleanHtml(item.title);
          const translatedTitle = await translateText(cleanTitle);
          if (translatedTitle !== cleanTitle) {
            setTranslatedNews(prev => ({ ...prev, [`${newsId}-title`]: translatedTitle }));
          }
          count++;
          toast.success(`Traduction en cours... ${Math.round((count/total) * 100)}%`, { duration: 500 });
          await new Promise(resolve => setTimeout(resolve, 2000)); // Attendre 2s entre chaque traduction
        }

        // Traduire la description si elle n'est pas déjà traduite
        if (!translatedNews[`${newsId}-desc`]) {
          const cleanDescription = cleanHtml(item.description);
          const translatedDesc = await translateText(cleanDescription);
          if (translatedDesc !== cleanDescription) {
            setTranslatedNews(prev => ({ ...prev, [`${newsId}-desc`]: translatedDesc }));
          }
          count++;
          toast.success(`Traduction en cours... ${Math.round((count/total) * 100)}%`, { duration: 500 });
          await new Promise(resolve => setTimeout(resolve, 2000)); // Attendre 2s entre chaque traduction
        }
      }

      toast.success('Traductions terminées', { duration: 3000 });
    } catch (error) {
      toast.error('Erreur lors de la traduction globale', { duration: 3000 });
      console.error('Erreur de traduction globale:', error);
    } finally {
      setIsTranslatingAll(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Actualités Forex</h2>
        <div className="flex gap-4">
          <button
            onClick={handleTranslateAll}
            disabled={isTranslatingAll || news.length === 0}
            className={`flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors ${
              isTranslatingAll || news.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-500'
            }`}
          >
            <span>🌐</span>
            {isTranslatingAll ? 'Traduction...' : 'Tout traduire'}
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors ${
              isRefreshing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-500'
            }`}
          >
            <span className={`inline-block ${isRefreshing ? 'animate-spin' : ''}`}>
              {isRefreshing ? '⟳' : '↻'}
            </span>
            {isRefreshing ? 'Rafraîchissement...' : 'Rafraîchir'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {news.map((item, index) => {
          const newsId = `${item.source}-${index}`;
          const cleanDescription = cleanHtml(item.description);
          const cleanTitle = cleanHtml(item.title);

          return (
            <div key={newsId} className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-indigo-400">
                  {translatedNews[`${newsId}-title`] || cleanTitle}
                  {!translatedNews[`${newsId}-title`] && (
                    <button
                      onClick={() => handleTranslate(`${newsId}-title`, cleanTitle)}
                      disabled={isTranslating[`${newsId}-title`]}
                      className="ml-2 text-sm text-indigo-400 hover:text-indigo-300"
                      title="Traduire"
                    >
                      {isTranslating[`${newsId}-title`] ? '...' : '🌐'}
                    </button>
                  )}
                </h3>
                <span className="text-sm text-gray-400">{item.source}</span>
              </div>
              
              <p className="mt-2 text-gray-300">
                {translatedNews[`${newsId}-desc`] || cleanDescription}
                {!translatedNews[`${newsId}-desc`] && (
                  <button
                    onClick={() => handleTranslate(`${newsId}-desc`, cleanDescription)}
                    disabled={isTranslating[`${newsId}-desc`]}
                    className="ml-2 text-indigo-400 hover:text-indigo-300"
                    title="Traduire"
                  >
                    {isTranslating[`${newsId}-desc`] ? '...' : '🌐'}
                  </button>
                )}
              </p>
              
              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm text-gray-400">
                  {new Date(item.pubDate).toLocaleString('fr-FR')}
                </span>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Lire plus →
                </a>
              </div>
            </div>
          );
        })}

        {news.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400">Aucune actualité disponible</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsList;