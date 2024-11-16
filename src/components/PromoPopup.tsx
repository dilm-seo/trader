import React from 'react';

interface PromoPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const PromoPopup: React.FC<PromoPopupProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-xl shadow-2xl max-w-md w-full mx-4 relative border border-indigo-500">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          ✕
        </button>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2">
            Dilm Trading
          </h2>
          <div className="w-16 h-1 bg-indigo-500 mx-auto mb-6"></div>
          
          <p className="text-gray-300 mb-6">
            Vous aimez notre analyseur Forex ? Découvrez nos formations et services premium sur notre site !
          </p>

          <a
            href="https://dilm-trading.fr/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-500 transition-colors duration-200"
          >
            Visiter Dilm Trading
          </a>
        </div>
      </div>
    </div>
  );
};

export default PromoPopup;