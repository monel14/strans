import React, { useState } from 'react';
import { MobileFileUpload } from '../common/MobileFileUpload';

export const MobileFileTest: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFileSelect = (file: File | null) => {
        setSelectedFile(file);
        
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setPreviewUrl(null);
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4">Test Mobile File Upload</h2>
            
            <MobileFileUpload
                onFileSelect={handleFileSelect}
                accept="image/*,application/pdf"
                required={true}
                currentFile={selectedFile}
                previewUrl={previewUrl}
                className="mb-4"
            />
            
            {selectedFile && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                    <h3 className="font-semibold text-green-800">Fichier sélectionné :</h3>
                    <p><strong>Nom :</strong> {selectedFile.name}</p>
                    <p><strong>Taille :</strong> {(selectedFile.size / 1024).toFixed(2)} KB</p>
                    <p><strong>Type :</strong> {selectedFile.type}</p>
                </div>
            )}
        </div>
    );
};

export default MobileFileTest;