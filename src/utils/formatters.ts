
export const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.toLocaleDateString('fr-FR')} ${date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}`;
};

export const formatAmount = (amount?: number | string | null): string => {
    if (amount === null || amount === undefined || amount === '') return '-';
    
    const num = Number(amount);
    if (isNaN(num)) {
      return '-';
    }
    
    return num.toLocaleString('fr-FR') + ' XOF';
};

export const timeAgo = (dateString?: string): string => {
    if (!dateString) return 'jamais';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 5) {
        return "à l'instant";
    }

    let interval = seconds / 31536000;
    if (interval > 1) {
        const years = Math.floor(interval);
        return `il y a ${years} an${years > 1 ? 's' : ''}`;
    }
    interval = seconds / 2592000;
    if (interval > 1) {
        const months = Math.floor(interval);
        return `il y a ${months} mois`;
    }
    interval = seconds / 86400;
    if (interval > 1) {
        const days = Math.floor(interval);
        return `il y a ${days} jour${days > 1 ? 's' : ''}`;
    }
    interval = seconds / 3600;
    if (interval > 1) {
        const hours = Math.floor(interval);
        return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    }
    interval = seconds / 60;
    if (interval > 1) {
        const minutes = Math.floor(interval);
        return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    return "il y a " + Math.floor(seconds) + " secondes";
};
