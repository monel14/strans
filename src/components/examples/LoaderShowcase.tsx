import React, { useState } from 'react';
import { Loader, PageLoader, SectionLoader, InlineLoader, ButtonLoader } from '../common/Loader';
import { TransactionCardSkeleton, UserCardSkeleton, RequestListSkeleton, StatsCardSkeleton } from '../common/SkeletonLoader';
import { Card } from '../common/Card';

export const LoaderShowcase: React.FC = () => {
    const [showDemo, setShowDemo] = useState(false);

    return (
        <div className="space-y-8">
            <Card title="🎨 Showcase des Loaders" icon="fa-spinner">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    {/* Loaders basiques */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Loaders Basiques</h3>
                        
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-sm mb-2">Spinner (défaut)</p>
                            <Loader variant="spinner" size="md" color="primary" />
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-sm mb-2">Points animés</p>
                            <Loader variant="dots" size="md" color="success" />
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-sm mb-2">Pulsation</p>
                            <Loader variant="pulse" size="md" color="warning" />
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-sm mb-2">Barres</p>
                            <Loader variant="bars" size="md" color="danger" />
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-sm mb-2">Vague</p>
                            <Loader variant="wave" size="md" color="info" />
                        </div>
                    </div>

                    {/* Tailles */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Tailles</h3>
                        
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-sm mb-2">Petit (sm)</p>
                            <Loader variant="spinner" size="sm" color="primary" />
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-sm mb-2">Moyen (md)</p>
                            <Loader variant="spinner" size="md" color="primary" />
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-sm mb-2">Grand (lg)</p>
                            <Loader variant="spinner" size="lg" color="primary" />
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-sm mb-2">Très grand (xl)</p>
                            <Loader variant="spinner" size="xl" color="primary" />
                        </div>
                    </div>

                    {/* Avec texte */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Avec Texte</h3>
                        
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <Loader variant="spinner" size="md" color="primary" text="Chargement..." />
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <Loader variant="dots" size="lg" color="success" text="Traitement en cours..." />
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <InlineLoader text="Chargement inline" />
                        </div>
                    </div>
                </div>

                {/* Loaders spécialisés */}
                <div className="mt-8 space-y-6">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Loaders Spécialisés</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm mb-2 font-medium">Page Loader</p>
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
                                <PageLoader text="Chargement de la page..." />
                            </div>
                        </div>

                        <div>
                            <p className="text-sm mb-2 font-medium">Section Loader</p>
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
                                <SectionLoader text="Chargement de la section..." />
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm mb-2 font-medium">Bouton avec loader</p>
                        <button 
                            className="btn-primary flex items-center"
                            onClick={() => setShowDemo(!showDemo)}
                        >
                            {showDemo && <ButtonLoader />}
                            {showDemo ? 'Chargement...' : 'Démarrer démo'}
                        </button>
                    </div>
                </div>

                {/* Skeleton Loaders */}
                <div className="mt-8 space-y-6">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Skeleton Loaders</h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm mb-4 font-medium">Carte de Transaction</p>
                            <TransactionCardSkeleton />
                        </div>

                        <div>
                            <p className="text-sm mb-4 font-medium">Carte d'Utilisateur</p>
                            <UserCardSkeleton />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm mb-4 font-medium">Statistiques</p>
                            <StatsCardSkeleton />
                        </div>

                        <div>
                            <p className="text-sm mb-4 font-medium">Liste de Requêtes</p>
                            <RequestListSkeleton count={2} />
                        </div>
                    </div>
                </div>

                {/* Loader plein écran */}
                <div className="mt-8">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Loader Plein Écran</h3>
                    <button 
                        className="btn-secondary"
                        onClick={() => {
                            // Simuler un loader plein écran
                            const loader = document.createElement('div');
                            loader.innerHTML = `
                                <div class="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
                                    <div class="flex flex-col items-center space-y-3">
                                        <div class="animate-spin rounded-full border-2 border-gray-200 border-t-blue-500 w-12 h-12"></div>
                                        <p class="text-lg text-blue-500 font-medium animate-pulse">Chargement plein écran...</p>
                                    </div>
                                </div>
                            `;
                            document.body.appendChild(loader);
                            
                            setTimeout(() => {
                                document.body.removeChild(loader);
                            }, 3000);
                        }}
                    >
                        Tester le loader plein écran
                    </button>
                </div>
            </Card>
        </div>
    );
};