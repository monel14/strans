import React from 'react';
import { Header } from '../layout/Header';
import { RealtimeStatusIndicator } from '../common/RealtimeStatusIndicator';

/**
 * Exemple d'intégration de l'indicateur de statut temps réel dans le Header
 * 
 * Pour intégrer dans votre Header existant, ajoutez simplement :
 * <RealtimeStatusIndicator showDetails className="mr-2" />
 * 
 * Juste avant la section des notifications dans le Header.tsx
 */


// Exemple complet d'utilisation dans différents contextes :

export const HeaderExamples: React.FC = () => {
    return (
        <div className="space-y-8 p-6">
            <h1 className="text-2xl font-bold">Exemples d'Indicateurs de Statut Temps Réel</h1>
            
            {/* Version simple */}
            <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">Version Simple</h2>
                <div className="flex items-center justify-between">
                    <span>Statut de connexion :</span>
                    <RealtimeStatusIndicator />
                </div>
            </div>

            {/* Version détaillée */}
            <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">Version Détaillée (avec dropdown)</h2>
                <div className="flex items-center justify-between">
                    <span>Contrôles temps réel :</span>
                    <RealtimeStatusIndicator showDetails />
                </div>
            </div>

            {/* Dans une barre de navigation */}
            <div className="bg-gray-800 text-white p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-4">Dans une barre de navigation</h2>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <span className="font-bold">SecureTrans</span>
                        <nav className="hidden md:flex space-x-4">
                            <a href="#" className="hover:text-gray-300">Dashboard</a>
                            <a href="#" className="hover:text-gray-300">Transactions</a>
                        </nav>
                    </div>
                    <div className="flex items-center space-x-4">
                        <RealtimeStatusIndicator showDetails className="text-white" />
                        <button className="relative">
                            <i className="fas fa-bell text-xl"></i>
                            <span className="absolute -top-1 -right-1 block h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                                3
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Dans un dashboard */}
            <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">Dans un Dashboard</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded">
                        <h3 className="font-semibold text-blue-800">Solde</h3>
                        <p className="text-2xl font-bold text-blue-600">125,000 XOF</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded">
                        <h3 className="font-semibold text-green-800">Transactions</h3>
                        <p className="text-2xl font-bold text-green-600">47</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-gray-800">Statut</h3>
                            <p className="text-sm text-gray-600">Temps réel</p>
                        </div>
                        <RealtimeStatusIndicator />
                    </div>
                </div>
            </div>

            {/* Code d'intégration */}
            <div className="bg-gray-100 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-4">Code d'Intégration</h2>
                <pre className="text-sm bg-white p-4 rounded border overflow-x-auto">
{`// 1. Import du composant
import { RealtimeStatusIndicator } from '../common/RealtimeStatusIndicator';

// 2. Utilisation simple
<RealtimeStatusIndicator />

// 3. Utilisation avec détails
<RealtimeStatusIndicator showDetails />

// 4. Avec classes CSS personnalisées
<RealtimeStatusIndicator 
    showDetails 
    className="hidden sm:block mr-4" 
/>`}
                </pre>
            </div>
        </div>
    );
};

export default HeaderExamples;