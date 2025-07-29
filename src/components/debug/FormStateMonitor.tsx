import React, { useEffect, useState } from 'react';

interface FormStateMonitorProps {
    formData: Record<string, any>;
    proofFile: File | null;
    selectedOpType: any;
    isFormValid: boolean;
    className?: string;
}

export const FormStateMonitor: React.FC<FormStateMonitorProps> = ({
    formData,
    proofFile,
    selectedOpType,
    isFormValid,
    className = ''
}) => {
    const [history, setHistory] = useState<string[]>([]);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timestamp = new Date().toLocaleTimeString();
        const entry = `${timestamp}: FormData(${Object.keys(formData).length}) | File(${proofFile?.name || 'null'}) | OpType(${selectedOpType?.name || 'null'}) | Valid(${isFormValid})`;
        
        setHistory(prev => [entry, ...prev.slice(0, 9)]); // Garder 10 dernières entrées
    }, [formData, proofFile, selectedOpType, isFormValid]);

    if (!isVisible) {
        return (
            <button
                onClick={() => setIsVisible(true)}
                className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full shadow-lg z-50"
                title="Afficher le moniteur d'état"
            >
                🔍
            </button>
        );
    }

    return (
        <div className={`fixed bottom-4 right-4 bg-white border shadow-lg rounded-lg p-4 max-w-md z-50 ${className}`}>
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-sm">📊 Moniteur d'État</h3>
                <button
                    onClick={() => setIsVisible(false)}
                    className="text-gray-500 hover:text-gray-700"
                >
                    ✕
                </button>
            </div>
            
            <div className="space-y-2">
                <div className="text-xs">
                    <strong>État Actuel:</strong>
                    <div className="bg-gray-50 p-2 rounded mt-1">
                        <div>📝 Champs: {Object.keys(formData).length}</div>
                        <div>📁 Fichier: {proofFile?.name || 'null'}</div>
                        <div>🔧 Type: {selectedOpType?.name || 'null'}</div>
                        <div>✅ Valide: {isFormValid ? 'Oui' : 'Non'}</div>
                    </div>
                </div>
                
                <div className="text-xs">
                    <strong>Historique:</strong>
                    <div className="bg-gray-50 p-2 rounded mt-1 max-h-32 overflow-y-auto">
                        {history.map((entry, index) => (
                            <div key={index} className="text-xs font-mono mb-1">
                                {entry}
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="text-xs">
                    <strong>Détails FormData:</strong>
                    <div className="bg-gray-50 p-2 rounded mt-1 max-h-20 overflow-y-auto">
                        <pre className="text-xs">
                            {JSON.stringify(formData, null, 1)}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FormStateMonitor;