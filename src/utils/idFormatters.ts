import React from 'react';

/**
 * Système d'ID user-friendly adapté aux tables Supabase
 * Basé sur l'analyse de votre structure de base de données
 */

export type EntityType = 
    | 'transaction' 
    | 'request' 
    | 'profile' 
    | 'agency' 
    | 'notification' 
    | 'recharge_request' 
    | 'audit_log';

/**
 * Configuration des préfixes et formats pour chaque type d'entité
 */
const ID_CONFIG = {
    transaction: {
        prefix: 'TXN',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        description: 'Transaction'
    },
    request: {
        prefix: 'REQ',
        color: 'text-green-600', 
        bgColor: 'bg-green-50',
        description: 'Requête Support'
    },
    profile: {
        prefix: 'USR',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50', 
        description: 'Utilisateur'
    },
    agency: {
        prefix: 'AGY',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        description: 'Agence'
    },
    notification: {
        prefix: 'NOT',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        description: 'Notification'
    },
    recharge_request: {
        prefix: 'RCH',
        color: 'text-teal-600',
        bgColor: 'bg-teal-50',
        description: 'Demande de Recharge'
    },
    audit_log: {
        prefix: 'AUD',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        description: 'Log d\'Audit'
    }
} as const;

/**
 * Génère un ID court et lisible à partir d'un UUID
 * Exemples: TXN-CE0ECF, REQ-A1B2C3, USR-FF344B
 */
export const formatShortId = (fullId: string, type: EntityType): string => {
    if (!fullId) return '';
    
    const config = ID_CONFIG[type];
    if (!config) return fullId.substring(0, 8);
    
    // Prendre les 6 premiers caractères hex de l'UUID (sans les tirets)
    const shortPart = fullId.replace(/-/g, '').substring(0, 6).toUpperCase();
    
    return `${config.prefix}-${shortPart}`;
};

/**
 * Génère un ID avec date pour un affichage temporel
 * Format: TXN-240127-CE0ECF (année-mois-jour + ID court)
 */
export const formatDateId = (fullId: string, type: EntityType, date?: Date): string => {
    const shortId = formatShortId(fullId, type);
    const dateObj = date || new Date();
    
    const year = dateObj.getFullYear().toString().slice(-2);
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');
    
    const datePart = `${year}${month}${day}`;
    const idPart = shortId.split('-')[1];
    
    return `${ID_CONFIG[type].prefix}-${datePart}-${idPart}`;
};

/**
 * Composant React pour afficher un ID stylé avec tooltip
 */
export const IdDisplay: React.FC<{
    id: string;
    type: EntityType;
    variant?: 'short' | 'date' | 'full';
    showTooltip?: boolean;
    className?: string;
    date?: Date;
}> = ({ 
    id, 
    type, 
    variant = 'short', 
    showTooltip = true, 
    className = '',
    date 
}) => {
    const config = ID_CONFIG[type];
    
    const getDisplayId = () => {
        switch (variant) {
            case 'date':
                return formatDateId(id, type, date);
            case 'full':
                return id;
            case 'short':
            default:
                return formatShortId(id, type);
        }
    };
    
    const displayId = getDisplayId();
    
    return (
        <span 
            className={`
                inline-flex items-center px-2 py-1 rounded-md text-xs font-mono font-medium
                ${config.color} ${config.bgColor} border border-current border-opacity-20
                ${showTooltip ? 'cursor-help' : ''}
                ${className}
            `}
            title={showTooltip ? `${config.description} - ID complet: ${id}` : undefined}
        >
            {displayId}
        </span>
    );
};

/**
 * Composant pour afficher un ID simple sans style
 */
export const SimpleIdDisplay: React.FC<{
    id: string;
    type: EntityType;
    className?: string;
}> = ({ id, type, className = '' }) => {
    const shortId = formatShortId(id, type);
    
    return (
        <span 
            className={`font-mono text-sm ${className}`}
            title={`ID complet: ${id}`}
        >
            {shortId}
        </span>
    );
};

/**
 * Utilitaire pour rechercher par ID court ou complet
 */
export const matchesIdSearch = (fullId: string, type: EntityType, searchTerm: string): boolean => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    const shortId = formatShortId(fullId, type).toLowerCase();
    const fullIdLower = fullId.toLowerCase();
    
    return shortId.includes(search) || fullIdLower.includes(search);
};

/**
 * Génère un ID séquentiel pour l'affichage (basé sur la date et un compteur)
 * Utile pour les numéros de transaction visibles par l'utilisateur
 */
export const generateSequentialId = (type: EntityType, sequence: number, date?: Date): string => {
    const dateObj = date || new Date();
    const year = dateObj.getFullYear().toString().slice(-2);
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');
    
    const seqStr = sequence.toString().padStart(4, '0');
    
    return `${ID_CONFIG[type].prefix}-${year}${month}${day}-${seqStr}`;
};