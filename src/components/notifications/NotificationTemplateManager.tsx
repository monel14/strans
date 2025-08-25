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
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);

  const handleEditTemplate = (template: NotificationTemplate) => {
    setEditingTemplate({ ...template });
    setIsEditing(true);
  };

  const handleSaveTemplate = () => {
    if (editingTemplate) {
      // Ici vous pourriez sauvegarder le template modifié
      console.log('Sauvegarde du template:', editingTemplate);
      setIsEditing(false);
      setEditingTemplate(null);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingTemplate(null);
  };

  const addAction = () => {
    if (editingTemplate) {
      const newAction: NotificationAction = {
        action: 'new_action',
        title: 'Nouvelle Action',
        icon: ''
      };
      setEditingTemplate({
        ...editingTemplate,
        actions: [...(editingTemplate.actions || []), newAction]
      });
    }
  };

  const removeAction = (index: number) => {
    if (editingTemplate && editingTemplate.actions) {
      const newActions = editingTemplate.actions.filter((_, i) => i !== index);
      setEditingTemplate({
        ...editingTemplate,
        actions: newActions
      });
    }
  };

  const updateAction = (index: number, field: keyof NotificationAction, value: string) => {
    if (editingTemplate && editingTemplate.actions) {
      const newActions = [...editingTemplate.actions];
      newActions[index] = { ...newActions[index], [field]: value };
      setEditingTemplate({
        ...editingTemplate,
        actions: newActions
      });
    }
  };

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
              {isEditing ? 'Modifier le Template' : 'Gestionnaire de Templates'}
            </h2>
            <div className="flex items-center space-x-3">
              {selectedTemplate && !isEditing && (
                <button
                  onClick={() => handleEditTemplate(selectedTemplate)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <i className="fas fa-edit mr-2"></i>
                  Modifier
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isEditing && editingTemplate ? (
              /* Edit Mode */
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Titre
                      </label>
                      <input
                        type="text"
                        value={editingTemplate.title}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Corps du message
                      </label>
                      <textarea
                        value={editingTemplate.body}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type
                      </label>
                      <select
                        value={editingTemplate.type}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="transaction">Transaction</option>
                        <option value="validation">Validation</option>
                        <option value="security">Sécurité</option>
                        <option value="system">Système</option>
                        <option value="communication">Communication</option>
                      </select>
                    </div>
                  </div>

                  {/* Visual Settings */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Icône
                      </label>
                      <input
                        type="text"
                        value={editingTemplate.icon || ''}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, icon: e.target.value })}
                        placeholder="🔔"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Couleur
                      </label>
                      <input
                        type="color"
                        value={editingTemplate.color || '#6366F1'}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, color: e.target.value })}
                        className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Son
                      </label>
                      <select
                        value={editingTemplate.sound || 'default'}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, sound: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="default">Par défaut</option>
                        <option value="soft">Doux</option>
                        <option value="urgent">Urgent</option>
                        <option value="message">Message</option>
                        <option value="silent">Silencieux</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Vibration Pattern */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motif de vibration (ms)
                  </label>
                  <input
                    type="text"
                    value={editingTemplate.vibration?.join(', ') || ''}
                    onChange={(e) => {
                      const pattern = e.target.value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
                      setEditingTemplate({ ...editingTemplate, vibration: pattern });
                    }}
                    placeholder="200, 100, 200"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Séparez les valeurs par des virgules (ex: 200, 100, 200)
                  </p>
                </div>

                {/* Actions */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Actions
                    </label>
                    <button
                      onClick={addAction}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      <i className="fas fa-plus mr-1"></i>
                      Ajouter
                    </button>
                  </div>

                  <div className="space-y-3">
                    {editingTemplate.actions?.map((action, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 border rounded-md">
                        <input
                          type="text"
                          value={action.action}
                          onChange={(e) => updateAction(index, 'action', e.target.value)}
                          placeholder="Action ID"
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={action.title}
                          onChange={(e) => updateAction(index, 'title', e.target.value)}
                          placeholder="Titre"
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={action.icon || ''}
                          onChange={(e) => updateAction(index, 'icon', e.target.value)}
                          placeholder="Icône"
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => removeAction(index)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <i className="fas fa-trash text-sm"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-6 border-t">
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveTemplate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Sauvegarder
                  </button>
                </div>
              </div>
            ) : selectedTemplate ? (
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
                        <dt className="text-sm font-medium text-gray-500">Vibration</dt>
                        <dd className="text-sm text-gray-900">
                          {selectedTemplate.vibration?.join(', ') || 'Aucune'}
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