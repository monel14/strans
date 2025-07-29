import { supabase } from '../supabaseClient';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Optimise une image côté client avant l'upload.
 * Redimensionne, compresse et convertit en WebP.
 * @param file Le fichier image original.
 * @param maxWidth La largeur maximale de l'image.
 * @param quality La qualité de compression (0 à 1).
 * @returns Une promesse qui se résout avec le fichier optimisé.
 */
export const optimizeImage = (file: File, maxWidth = 1280, quality = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Ne pas optimiser les types de fichiers non-images
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      if (!event.target?.result) {
        return reject(new Error("FileReader did not load the file."));
      }
      const img = new Image();
      img.src = event.target.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Redimensionner en gardant l'aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Impossible d\'obtenir le contexte du canvas.'));
        }
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('La conversion du canvas en Blob a échoué.'));
            }
            // Si l'image optimisée est plus lourde, on garde l'originale
            if (blob.size > file.size) {
                console.log('Image optimisée plus lourde, on garde l\'originale.');
                resolve(file);
                return;
            }
            const newFile = new File([blob], file.name, {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            resolve(newFile);
          },
          'image/webp',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};


export const uploadFile = async (
  bucketName: string, 
  file: File, 
  userId: string,
  customPath?: string
): Promise<UploadResult> => {
  try {
    // Déterminer le fichier à uploader (original ou optimisé)
    let fileToUpload = file;
    if (file.type.startsWith('image/')) {
        try {
            console.log(`Optimisation de l'image: ${file.name}, taille: ${(file.size / 1024).toFixed(2)} KB`);
            const optimizedFile = await optimizeImage(file);
            console.log(`Taille de l'image optimisée: ${(optimizedFile.size / 1024).toFixed(2)} KB`);
            fileToUpload = optimizedFile;
        } catch (optimizationError) {
            console.warn('L\'optimisation de l\'image a échoué, envoi du fichier original.', optimizationError);
            fileToUpload = file; // Fallback sur le fichier original
        }
    }

    // Générer le chemin du fichier
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = customPath || `${userId}/${fileName}`;
    
    // Upload du fichier (optimisé ou original)
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileToUpload);

    if (uploadError) {
      console.error('Erreur lors de l\'upload:', uploadError);
      
      // Messages d'erreur personnalisés
      let errorMessage = 'Erreur lors du téléversement du fichier';
      
      if (uploadError.message.includes('Bucket not found')) {
        errorMessage = `Le bucket de stockage '${bucketName}' n'existe pas. Contactez l'administrateur pour configurer le stockage.`;
      } else if (uploadError.message.includes('File size')) {
        errorMessage = 'Le fichier est trop volumineux. Taille maximale autorisée: 5MB.';
      } else if (uploadError.message.includes('mime type')) {
        errorMessage = 'Type de fichier non autorisé. Formats acceptés: JPG, PNG, PDF.';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: urlData.publicUrl
    };

  } catch (error) {
    console.error('Erreur générale lors de l\'upload:', error);
    return {
      success: false,
      error: 'Erreur inattendue lors du téléversement'
    };
  }
};

export const deleteFile = async (bucketName: string, filePath: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error('Erreur lors de la suppression:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur générale lors de la suppression:', error);
    return false;
  }
};

export const getFileUrl = (bucketName: string, filePath: string): string => {
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
};

// Fonction pour valider les fichiers avant upload
export const validateFile = (file: File, maxSizeMB: number = 5): { valid: boolean; error?: string } => {
  // Vérifier la taille
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `Le fichier est trop volumineux. Taille maximale: ${maxSizeMB}MB`
    };
  }

  // Vérifier le type de fichier
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'application/pdf'
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Type de fichier non autorisé. Formats acceptés: JPG, PNG, WEBP, PDF'
    };
  }

  return { valid: true };
};