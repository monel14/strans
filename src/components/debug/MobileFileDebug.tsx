import React, { useRef, useState } from 'react';

export const MobileFileDebug: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [debugInfo, setDebugInfo] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const addDebug = (message: string) => {
        setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
        console.log('🔍 DEBUG:', message);
    };

    const testClick = () => {
        addDebug('Tentative click programmatique');
        try {
            if (fileInputRef.current) {
                fileInputRef.current.click();
                addDebug('Click réussi');
            } else {
                addDebug('ERREUR: fileInputRef.current est null');
            }
        } catch (error) {
            addDebug(`ERREUR click: ${error}`);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            addDebug(`Fichier sélectionné: ${file.name} (${file.size} bytes)`);
        } else {
            addDebug('Aucun fichier sélectionné');
        }
    };

    const clearDebug = () => {
        setDebugInfo([]);
        setSelectedFile(null);
    };

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    return (
        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <h3 className="font-bold mb-4">🔍 Debug Mobile File Upload</h3>
            
            <div className="mb-4">
                <p><strong>Device:</strong> {isMobile ? 'Mobile' : 'Desktop'}</p>
                <p><strong>User Agent:</strong> {navigator.userAgent}</p>
            </div>

            {/* Input caché */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ position: 'absolute', left: '-9999px' }}
            />

            {/* Boutons de test */}
            <div className="space-x-2 mb-4">
                <button
                    onClick={testClick}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Test Click Programmatique
                </button>
                
                <button
                    onClick={clearDebug}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                    Clear Debug
                </button>
            </div>

            {/* Input visible pour comparaison */}
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Input visible (pour comparaison):</label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
            </div>

            {/* Fichier sélectionné */}
            {selectedFile && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                    <h4 className="font-semibold text-green-800">Fichier sélectionné:</h4>
                    <p>Nom: {selectedFile.name}</p>
                    <p>Taille: {selectedFile.size} bytes</p>
                    <p>Type: {selectedFile.type}</p>
                </div>
            )}

            {/* Debug log */}
            <div className="bg-black text-green-400 p-3 rounded font-mono text-xs max-h-40 overflow-y-auto">
                {debugInfo.length === 0 ? (
                    <p>Aucun debug info...</p>
                ) : (
                    debugInfo.map((info, index) => (
                        <div key={index}>{info}</div>
                    ))
                )}
            </div>
        </div>
    );
};