
export const getBadgeClass = (status?: string): string => {
    if (!status) return 'badge-gray';
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'validé' || lowerStatus === 'approuvée' || lowerStatus === 'actif' || lowerStatus === 'active' || lowerStatus === 'ok') return 'badge-success';
    if (lowerStatus.includes('en attente') || lowerStatus === 'inactive' || lowerStatus === 'avertissement') return 'badge-warning';
    if (lowerStatus === 'rejeté' || lowerStatus === 'erreur') return 'badge-danger';
    return 'badge-gray';
};
