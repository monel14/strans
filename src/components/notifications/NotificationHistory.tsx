import React, { useState, useEffect, useMemo } from 'react';
import { useNotifications, NotificationSearchFilters, ExtendedNotification } from '../../context/NotificationContext';

interface NotificationHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationHistory: React.FC<NotificationHistoryProps> = ({ isOpen, onClose }) => {
  const { searchNotifications, getNotificationHistory, templates } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<NotificationSearchFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [historyData, setHistoryData] = useState<{ notifications: ExtendedNotification[], total: number }>({ notifications: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'search' | 'history'>('search');

  const itemsPerPage = 20;

  // Recherche en temps réel
  const searchResults = useMemo(() => {
    const searchFilters: NotificationSearchFilters = {
      query: searchQuery,
      ...filters
    };
    return searchNotifications(searchFilters);
  }, [searchQuery, filters, searchNotifications]);

  // Charger l'historique paginé
  const loadHistory = async (page: number) => {
    setLoading(true);
    try {
      const data = await getNotificationHistory(page, itemsPerPage);
      setHistoryData(data);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && viewMode === 'history') {
      loadHistory(currentPage);
    }
  }, [isOpen, currentPage, viewMode]);

  const handleFilterChange = (key: keyof NotificationSearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({});
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationIcon = (notification: ExtendedNotification) => {
    const template = notification.template ? templates[notification.template] : null;
    return template?.icon || '📱';
  };

  const getNotificationColor = (notification: ExtendedNotification) => {
    const template = notification.template ? templates[notification.template] : null;
    return template?.color || '#6366F1';
  };

  const getPriorityBadge = (priority?: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || colors.normal;
  };

  if (!isOpen) return null;

  const displayedNotifications = viewMode === 'search' ? searchResults : historyData.notifications;
  const totalPages = viewMode === 'history' ? Math.ceil(historyData.total / itemsPerPage) : 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Historique des Notifications</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex border-b">
          <button
            onClick={() => setViewMode('search')}
            className={`px-6 py-3 font-medium transition-colors ${
              viewMode === 'search'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <i className="fas fa-search mr-2"></i>
            Recherche
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`px-6 py-3 font-medium transition-colors ${
              viewMode === 'history'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <i className="fas fa-history mr-2"></i>
            Historique
          </button>
        </div>

        {/* Search and Filters */}
        {viewMode === 'search' && (
          <div className="p-6 border-b bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search Query */}
              <div className="lg:col-span-2">
                <input
                  type="text"
                  placeholder="Rechercher dans les notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Type Filter */}
              <select
                value={filters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les types</option>
                <option value="transaction">Transaction</option>
                <option value="validation">Validation</option>
                <option value="security">Sécurité</option>
                <option value="system">Système</option>
                <option value="communication">Communication</option>
              </select>

              {/* Priority Filter */}
              <select
                value={filters.priority || ''}
                onChange={(e) => handleFilterChange('priority', e.target.value || undefined)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes priorités</option>
                <option value="low">Faible</option>
                <option value="normal">Normale</option>
                <option value="high">Élevée</option>
                <option value="urgent">Urgente</option>
              </select>

              {/* Read Status Filter */}
              <select
                value={filters.read === undefined ? '' : filters.read.toString()}
                onChange={(e) => handleFilterChange('read', e.target.value === '' ? undefined : e.target.value === 'true')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes</option>
                <option value="false">Non lues</option>
                <option value="true">Lues</option>
              </select>

              {/* Date From */}
              <input
                type="date"
                value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value ? new Date(e.target.value) : undefined)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Date To */}
              <input
                type="date"
                value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value ? new Date(e.target.value) : undefined)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Clear Filters */}
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <i className="fas fa-times mr-2"></i>
                Effacer
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Chargement...</span>
            </div>
          ) : displayedNotifications.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-bell-slash text-4xl text-gray-300 mb-4"></i>
              <p className="text-gray-500">Aucune notification trouvée</p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                    notification.read ? 'bg-white' : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-lg"
                      style={{ backgroundColor: getNotificationColor(notification) }}
                    >
                      {getNotificationIcon(notification)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {notification.priority && (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadge(notification.priority)}`}>
                              {notification.priority}
                            </span>
                          )}
                          {notification.type && (
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                              {notification.type}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(notification.created_at)}
                        </span>
                      </div>
                      
                      <p className="text-gray-900 mb-2">{notification.text}</p>
                      
                      {notification.link && (
                        <a
                          href={notification.link}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Voir les détails →
                        </a>
                      )}
                    </div>
                    
                    {!notification.read && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination for History Mode */}
        {viewMode === 'history' && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-gray-700">
              Page {currentPage} sur {totalPages} ({historyData.total} notifications)
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Précédent
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};