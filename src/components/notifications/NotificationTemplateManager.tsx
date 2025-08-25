import React, { useState } from 'react';
import { useNotifications, NotificationTemplate, NotificationAction } from '../../context/NotificationContext';
import { formatShortId } from '../../utils/idFormatters';

interface NotificationTemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationTemplateManager: React.FC<NotificationTemplateManagerProps> = ({ isOpen, onClose }) => {
  const { templates } = useNotifications();
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex">
        {/* Sidebar - Liste des templates */}
        <div className="w-1/3 border-r bg-gray-50">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Templates</h3>
          </div>
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            {Object.values(templates).map((template) => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className={`p-4 border-b cursor-pointer transition-colors hover:bg-white ${
                  selectedTemplate?.id === template.id ? 'bg-white border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: template.color }}
                  >
                    {template.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{template.title}</h4>
                    <p className="text-sm text-gray-500">{template.type}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              Templates de Notification
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedTemplate ? (
              /* View Mode */
              <div className="space-y-6">
                {/* Preview */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Aperçu</h3>
                  <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex items-start space-x-3">
                      <div
                        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: selectedTemplate.color }}
                      >
                        {selectedTemplate.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{selectedTemplate.title}</h4>
                        <p className="text-gray-600 mt-1">{selectedTemplate.body}</p>
                        {selectedTemplate.actions && selectedTemplate.actions.length > 0 && (
                          <div className="flex space-x-2 mt-3">
                            {selectedTemplate.actions.map((action, index) => (
                              <button
                                key={index}
                                className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md"
                              >
                                {action.icon} {action.title}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Informations</h4>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">ID</dt>
                        <dd className="text-sm text-gray-900">{formatShortId(selectedTemplate.id, 'notification')}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Type</dt>
                        <dd className="text-sm text-gray-900">{selectedTemplate.type}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Son</dt>
                        <dd className="text-sm text-gray-900">{selectedTemplate.sound || 'Par défaut'}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Paramètres</h4>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Couleur</dt>
                        <dd className="flex items-center space-x-2">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: selectedTemplate.color }}
                          ></div>
                          <span className="text-sm text-gray-900">{selectedTemplate.color}</span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Actions</dt>
                        <dd className="text-sm text-gray-900">
                          {selectedTemplate.actions?.length || 0} action(s)
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            ) : (
              /* No Selection */
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <i className="fas fa-palette text-4xl text-gray-300 mb-4"></i>
                  <p className="text-gray-500">Sélectionnez un template pour voir les détails</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};