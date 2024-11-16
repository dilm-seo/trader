import React, { useState } from 'react';
import { useNewsStore } from '../stores/newsStore';
import { useGptStore } from '../stores/gptStore';
import { FeedSource } from '../types';
import toast from 'react-hot-toast';

const SettingsPanel: React.FC = () => {
  const { feeds, addFeed, removeFeed, toggleFeed, updateFeed, error: feedError } = useNewsStore();
  const { 
    apiKey: gptKey, 
    model, 
    systemPrompt,
    setApiKey: setGptKey, 
    setModel, 
    setSystemPrompt,
    error: gptError 
  } = useGptStore();
  
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editedFeed, setEditedFeed] = useState<FeedSource | null>(null);
  const [newFeed, setNewFeed] = useState<FeedSource>({
    name: '',
    url: '',
    enabled: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeed.name.trim() || !newFeed.url.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      new URL(newFeed.url);
      addFeed(newFeed);
      setNewFeed({ name: '', url: '', enabled: true });
      toast.success('Flux ajouté avec succès');
    } catch {
      toast.error('Veuillez entrer une URL valide');
    }
  };

  const handleRemoveFeed = (url: string) => {
    removeFeed(url);
    toast.success('Flux supprimé avec succès');
  };

  const handleSystemPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSystemPrompt(e.target.value);
    toast.success('Prompt système mis à jour');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Section Paramètres API */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-white">Paramètres API</h2>
        
        <div className="space-y-6">
          {/* OpenAI GPT */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">OpenAI GPT</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Clé API OpenAI
              </label>
              <input
                type="password"
                value={gptKey}
                onChange={(e) => setGptKey(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="sk-..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Modèle GPT
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-4-turbo-preview">GPT-4 Turbo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Prompt Système
              </label>
              <textarea
                value={systemPrompt}
                onChange={handleSystemPromptChange}
                rows={15}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono text-sm"
                placeholder="Entrez le prompt système..."
              />
              <p className="mt-2 text-sm text-gray-400">
                Ce prompt définit le comportement et le format de réponse de l'assistant GPT.
              </p>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-400">
            <p>La traduction automatique est assurée par LibreTranslate (gratuit)</p>
            <p>Langues supportées : Anglais → Français</p>
          </div>
        </div>

        {gptError && (
          <div className="mt-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
            {gptError}
          </div>
        )}
      </div>

      {/* Section Sources d'actualités */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-white">Sources d'actualités</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Nom</label>
            <input
              type="text"
              value={newFeed.name}
              onChange={(e) => setNewFeed({ ...newFeed, name: e.target.value })}
              className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="Nom de la source"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">URL du flux RSS</label>
            <input
              type="url"
              value={newFeed.url}
              onChange={(e) => setNewFeed({ ...newFeed, url: e.target.value })}
              className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="https://example.com/feed"
            />
          </div>
          
          <button
            type="submit"
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-500 transition-colors"
          >
            Ajouter la source
          </button>
        </form>

        <div className="space-y-4">
          {feeds.map((feed) => (
            <div key={feed.url} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  checked={feed.enabled}
                  onChange={() => toggleFeed(feed.url)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <div>
                  <h4 className="font-medium text-white">{feed.name}</h4>
                  <p className="text-sm text-gray-400">{feed.url}</p>
                </div>
              </div>
              <button
                onClick={() => handleRemoveFeed(feed.url)}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>

        {feedError && (
          <div className="mt-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
            {feedError}
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;