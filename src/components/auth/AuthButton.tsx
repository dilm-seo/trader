import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import LoginModal from './LoginModal';

const AuthButton: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [showModal, setShowModal] = useState(false);

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-gray-300">
          {user.email}
        </span>
        <button
          onClick={logout}
          className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-500 transition-colors"
        >
          Déconnexion
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 transition-colors"
      >
        Connexion / Inscription
      </button>
      <LoginModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};

export default AuthButton;