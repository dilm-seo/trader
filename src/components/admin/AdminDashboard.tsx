import React, { useEffect } from 'react';
import { useAdminStore } from '../../stores/adminStore';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

const AdminDashboard: React.FC = () => {
  const { stats, users, fetchStats, fetchUsers, isLoading } = useAdminStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchStats().catch(() => toast.error('Erreur de chargement des statistiques'));
      fetchUsers().catch(() => toast.error('Erreur de chargement des utilisateurs'));
    }
  }, [user]);

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Accès non autorisé</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">
          Tableau de bord administrateur
        </h1>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats && (
            <>
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-300">Utilisateurs</h3>
                <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                <p className="text-sm text-gray-400">Actifs: {stats.activeUsers}</p>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-300">Analyses</h3>
                <p className="text-2xl font-bold text-white">{stats.totalAnalyses}</p>
                <p className="text-sm text-gray-400">Coût total: ${stats.totalCosts}</p>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-300">Abonnements</h3>
                <div className="space-y-2 mt-2">
                  <p className="text-sm text-gray-400">
                    Premium: {stats.subscriptionStats.premium}
                  </p>
                  <p className="text-sm text-gray-400">
                    Basic: {stats.subscriptionStats.basic}
                  </p>
                  <p className="text-sm text-gray-400">
                    Free: {stats.subscriptionStats.free}
                  </p>
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-300">Actions</h3>
                <div className="space-y-2 mt-4">
                  <button
                    onClick={() => useAdminStore.getState().exportData()}
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-500"
                  >
                    Exporter les données
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Liste des utilisateurs */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">
              Utilisateurs ({users.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Abonnement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{user.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{user.subscription}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          // Implémenter la modification
                        }}
                        className="text-indigo-400 hover:text-indigo-300 mr-4"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
                            useAdminStore.getState().deleteUser(user.id)
                              .then(() => toast.success('Utilisateur supprimé'))
                              .catch(() => toast.error('Erreur lors de la suppression'));
                          }
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;