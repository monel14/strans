import React, { useState } from 'react';
import { uploadFile, validateFile } from '../../utils/storageUtils';

export const UploadTest: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadResult, setUploadResult] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setSelectedFile(file || null);
        setUploadResult('');
    };

    const testUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        setUploadResult('🔄 Test en cours...');

        try {
            // Test validation
            const validation = validateFile(selectedFile);
            if (!validation.valid) {
                setUploadResult(`❌ Validation échouée: ${validation.error}`);
                return;
            }
            setUploadResult('✅ Validation OK\n🔄 Upload en cours...');

            // Test upload
            const result = await uploadFile('proofs', selectedFile, 'test-user-id');
            if (result.success) {
                setUploadResult(`✅ Upload réussi!\nURL: ${result.url}`);
            } else {
                setUploadResult(`❌ Upload échoué: ${result.error}`);
            }
        } catch (error) {
            setUploadResult(`❌ Erreur: ${error}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <h3 className="font-bold mb-4">🧪 Test Upload Fichier</h3>
            
            <div className="space-y-4">
                <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-500"
                />
                
                {selectedFile && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                        <p><strong>Fichier:</strong> {selectedFile.name}</p>
                        <p><strong>Taille:</strong> {(selectedFile.size / 1024).toFixed(2)} KB</p>
                        <p><strong>Type:</strong> {selectedFile.type}</p>
                    </div>
                )}
                
                <button
                    onClick={testUpload}
                    disabled={!selectedFile || isUploading}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                >
                    {isUploading ? 'Test en cours...' : 'Tester Upload'}
                </button>
                
                {uploadResult && (
                    <div className="p-3 bg-black text-green-400 rounded font-mono text-sm whitespace-pre-line">
                        {uploadResult}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadTest;