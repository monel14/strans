import React from 'react';

interface SkeletonProps {
    className?: string;
    width?: string;
    height?: string;
    rounded?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
    className = '', 
    width = 'w-full', 
    height = 'h-4', 
    rounded = false 
}) => (
    <div 
        className={`skeleton ${width} ${height} ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
    />
);

// Skeleton pour une carte de transaction
export const TransactionCardSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
                <Skeleton width="w-8" height="h-8" rounded />
                <div className="space-y-2">
                    <Skeleton width="w-32" height="h-4" />
                    <Skeleton width="w-24" height="h-3" />
                </div>
            </div>
            <Skeleton width="w-20" height="h-6" />
        </div>
        <div className="flex items-center justify-between">
            <Skeleton width="w-24" height="h-6" />
            <div className="text-right space-y-1">
                <Skeleton width="w-20" height="h-4" />
                <Skeleton width="w-16" height="h-3" />
            </div>
        </div>
        <div className="flex gap-2 mt-4">
            <Skeleton width="w-20" height="h-8" />
            <Skeleton width="w-20" height="h-8" />
        </div>
    </div>
);

// Skeleton pour une carte d'utilisateur
export const UserCardSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
                <Skeleton width="w-12" height="h-12" rounded />
                <div className="space-y-2">
                    <Skeleton width="w-32" height="h-5" />
                    <Skeleton width="w-24" height="h-4" />
                </div>
            </div>
            <Skeleton width="w-16" height="h-6" />
        </div>
        <div className="space-y-2 mb-4">
            <Skeleton width="w-full" height="h-4" />
            <Skeleton width="w-3/4" height="h-4" />
        </div>
        <div className="flex justify-between items-center">
            <Skeleton width="w-20" height="h-4" />
            <div className="flex gap-2">
                <Skeleton width="w-8" height="h-8" />
                <Skeleton width="w-8" height="h-8" />
            </div>
        </div>
    </div>
);

// Skeleton pour une liste de requêtes
export const RequestListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
    <div className="space-y-4">
        {Array.from({ length: count }).map((_, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="px-4 py-3 border-l-4 border-gray-300">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                            <Skeleton width="w-8" height="h-8" rounded />
                            <div className="flex-1 space-y-2">
                                <Skeleton width="w-3/4" height="h-5" />
                                <Skeleton width="w-1/2" height="h-4" />
                                <Skeleton width="w-full" height="h-4" />
                            </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                            <Skeleton width="w-20" height="h-6" />
                            <Skeleton width="w-16" height="h-4" />
                        </div>
                    </div>
                </div>
                <div className="px-4 py-3">
                    <div className="flex gap-2">
                        <Skeleton width="w-24" height="h-8" />
                        <Skeleton width="w-24" height="h-8" />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

// Skeleton pour les statistiques
export const StatsCardSkeleton: React.FC = () => (
    <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6">
        <div className="flex items-center">
            <div className="p-3 bg-gray-300 dark:bg-gray-600 rounded-full mr-4">
                <Skeleton width="w-6" height="h-6" />
            </div>
            <div className="space-y-2">
                <Skeleton width="w-20" height="h-4" />
                <Skeleton width="w-16" height="h-8" />
            </div>
        </div>
    </div>
);

// Skeleton pour une table
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ 
    rows = 5, 
    cols = 4 
}) => (
    <div className="overflow-hidden">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {/* Header */}
            {Array.from({ length: cols }).map((_, colIndex) => (
                <Skeleton key={`header-${colIndex}`} width="w-full" height="h-6" />
            ))}
            
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) =>
                Array.from({ length: cols }).map((_, colIndex) => (
                    <Skeleton 
                        key={`row-${rowIndex}-col-${colIndex}`} 
                        width="w-full" 
                        height="h-4" 
                    />
                ))
            )}
        </div>
    </div>
);