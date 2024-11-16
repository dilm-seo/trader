import React from 'react';
import { Toaster } from 'react-hot-toast';
import { useNewsStore } from './stores/newsStore';
import NewsList from './components/NewsList';
import SettingsPanel from './components/SettingsPanel';
import AnalysisPanel from './components/AnalysisPanel';
import AuthButton from './components/auth/AuthButton';

function App() {
  const [activeTab, setActiveTab] = React.useState('news');
  const { isLoading } = useNewsStore();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1F2937',
            color: '#F3F4F6',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#F3F4F6',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#F3F4F6',
            },
          },
        }}
      />

      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-indigo-400">Forex Analyzer Pro</h1>
            <AuthButton />
          </div>
          <nav className="mt-4">
            <div className="flex space-x-4">
              {['news', 'analysis', 'settings'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
              <p className="mt-4 text-center text-gray-300">Loading...</p>
            </div>
          </div>
        )}

        {activeTab === 'news' && <NewsList />}
        {activeTab === 'analysis' && <AnalysisPanel />}
        {activeTab === 'settings' && <SettingsPanel />}
      </main>
    </div>
  );
}

export default App;