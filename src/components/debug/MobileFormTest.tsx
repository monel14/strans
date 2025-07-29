import React, { useState } from 'react';
import { MobileFileUpload } from '../common/MobileFileUpload';

export const MobileFormTest: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        description: ''
    });
    const [file, setFile] = useState<File | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        console.log('📝 Champ modifié:', name, value);
    };

    const handleFileSelect = (selectedFile: File | null) => {
        setFile(selectedFile);
        console.log('📁 Fichier sélectionné:', selectedFile?.name || 'null');
        console.log('📋 État du formulaire préservé:', formData);
    };

    const resetForm = () => {
        setFormData({ name: '', amount: '', description: '' });
        setFile(null);
        console.log('🔄 Formulaire réinitialisé');
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">🧪 Test Formulaire Mobile</h2>

            <form className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Nom</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded"
                        placeholder="Entrez votre nom"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Montant</label>
                    <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded"
                        placeholder="0"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <input
                        type="text"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded"
                        placeholder="Description de l'opération"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Fichier</label>
                    <MobileFileUpload
                        onFileSelect={handleFileSelect}
                        accept="image/*,application/pdf"
                        currentFile={file}
                    />
                </div>

                <div className="pt-4 space-y-2">
                    <button
                        type="button"
                        onClick={resetForm}
                        className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        Réinitialiser
                    </button>
                </div>
            </form>

            {/* État actuel */}
            <div className="mt-6 p-4 bg-gray-50 rounded">
                <h3 className="font-semibold mb-2">État Actuel :</h3>
                <pre className="text-xs overflow-x-auto">
                    {JSON.stringify({ formData, file: file?.name || null }, null, 2)}
                </pre>
            </div>

            {/* Instructions de test */}
            <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
                <h4 className="font-semibold text-blue-800 mb-1">Test Mobile :</h4>
                <ol className="text-blue-700 space-y-1">
                    <li>1. Remplissez les champs</li>
                    <li>2. Sélectionnez un fichier</li>
                    <li>3. Vérifiez que les champs restent remplis</li>
                </ol>
            </div>
        </div>
    );
};

export default MobileFormTest;