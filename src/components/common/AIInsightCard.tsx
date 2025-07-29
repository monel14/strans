
import React from 'react';

interface AIInsightCardProps {
    insight: string | null;
    loading: boolean;
    error: string | null;
}

// This component has been disabled as per the request to remove AI functionality.
export const AIInsightCard: React.FC<AIInsightCardProps> = () => {
    return null; // Render nothing.
};
