import React, { useEffect } from 'react';

// New context hooks
import { useAuth } from './context/AuthContext';
import { useNavigation } from './context/NavigationContext';
import { useUI } from './context/UIContext';
import { useNotifications } from './context/NotificationContext';

// Layout and common components
import { LoginPage } from './features/auth/LoginPage';
import { ResetPasswordPage } from './features/auth/ResetPasswordPage';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { Fab } from './components/layout/Fab';
import { ViewProofModal } from './components/common/ViewProofModal';

// Page components and types
import { UserProfilePage } from './features/common/UserProfilePage';
import { SettingsPage } from './features/common/SettingsPage';
import { PageComponentProps, Agent, ChefAgence } from './types';
import { navigationLinks } from './config/navigation';

// Action hooks
import { useAgentActions } from './hooks/useAgentActions';
import { useChefActions } from './hooks/useChefActions';
import { Loader } from './components/common/Loader';

// Import test utilities in development
if (process.env.NODE_ENV === 'development') {
  import('./utils/testNotifications');
}

export const App: React.FC = () => {
    // State from new, separated contexts
    const { session, currentUser, loading, handleLogin, handleLogout, refreshCurrentUser } = useAuth();
    const { currentPageKey, navigateTo } = useNavigation();
    const { modalState, closeModal, openModal } = useUI();

    // Vérifier si nous sommes sur la page de réinitialisation de mot de passe
    const isResetPasswordPage = window.location.pathname === '/reset-password' ||
        window.location.hash.includes('type=recovery') ||
        window.location.search.includes('type=recovery');
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const { notificationSettings, setNotificationSettings } = useUI();

    // Role-specific action hooks
    const agentActions = useAgentActions(currentUser?.role === 'agent' ? currentUser as Agent : null, refreshCurrentUser);
    const chefActions = useChefActions(currentUser?.role === 'chef_agence' ? currentUser as ChefAgence : null, refreshCurrentUser);

    useEffect(() => {
        if (session && currentUser) {
            // Initialiser le système de notifications push
            const initializePushNotifications = async () => {
                try {
                    const { pushNotificationManager } = await import('./utils/pushNotifications');
                    
                    // Vérifier le support
                    if (!pushNotificationManager.isSupported()) {
                        console.log('📱 Notifications push non supportées sur ce navigateur');
                        return;
                    }

                    // Initialiser le service worker
                    const initialized = await pushNotificationManager.initialize();
                    if (initialized) {
                        console.log('✅ Service worker initialisé');
                        
                        // Configurer l'écoute des messages
                        pushNotificationManager.setupMessageListener();
                        
                        // Vérifier s'il y a déjà un abonnement
                        const existingSubscription = await pushNotificationManager.getSubscription();
                        if (existingSubscription) {
                            console.log('📱 Abonnement push existant trouvé');
                        }
                    }
                } catch (error) {
                    console.error('❌ Erreur lors de l\'initialisation des notifications push:', error);
                }
            };

            initializePushNotifications();
        }
    }, [session, currentUser]);

    const handleRetry = () => {
        window.location.reload();
    };

    // --- Render Logic ---
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white p-4">
                {/* Logo ou icône de l'application */}
                <div className="mb-8 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
                        <i className="fas fa-shield-alt text-3xl text-white"></i>
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        SecureTrans
                    </h1>
                    <p className="text-gray-300 text-sm mt-2">Plateforme de transactions sécurisées</p>
                </div>

                {/* Loader moderne */}
                <div className="mb-6">
                    <Loader
                        variant="wave"
                        size="xl"
                        color="primary"
                        text="Chargement de la plateforme..."
                    />
                </div>

                {/* Barre de progression animée */}
                <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden mb-8">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                </div>



                {/* Indicateurs de statut */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                            Connexion sécurisée
                        </div>
                        <div className="flex items-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                            Chiffrement SSL
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Si nous sommes sur la page de réinitialisation, l'afficher même sans session
    if (isResetPasswordPage) {
        return <ResetPasswordPage />;
    }

    if (!session || !currentUser) {
        return <LoginPage onLogin={handleLogin} />;
    }

    // Props for page components, now including role-specific actions
    const pageProps: PageComponentProps = {
        user: currentUser,
        navigateTo,
        openModal,
        refreshCurrentUser,
        agentActions: currentUser?.role === 'agent' ? agentActions : undefined,
        chefActions: currentUser?.role === 'chef_agence' ? chefActions : undefined,
    };

    // Props spécialisés pour les pages avec des besoins spécifiques
    const settingsPageProps = { ...pageProps, notificationSettings, onNotificationSettingsChange: setNotificationSettings };
    const profilePageProps = { ...pageProps, onUpdateUser: refreshCurrentUser };

    // Page component resolution
    let CurrentPageComponent: React.FC<PageComponentProps> | undefined;
    if (currentPageKey !== 'Mon Profil' && currentPageKey !== 'Paramètres') {
        CurrentPageComponent = navigationLinks[currentUser.role]?.find(l => l.key === currentPageKey)?.component;
    }

    // Renders generic modals managed by UIContext
    const renderGenericModals = () => {
        if (!modalState) return null;
        const { type, data } = modalState;

        switch (type) {
            case 'viewProof':
            case 'viewAttachment':
                return <ViewProofModal isOpen={true} onClose={closeModal} imageUrl={data} />;
            default:
                return null;
        }
    };

    // Determines FAB action based on user role and hooks
    const getFabAction = () => {
        switch (currentUser.role) {
            case 'agent':
                return { onClick: agentActions.openNewOperationModal, icon: 'fa-plus', ariaLabel: 'Initier une Opération' };
            case 'chef_agence':
                return { onClick: chefActions.openNewOperationModal, icon: 'fa-plus', ariaLabel: 'Initier une Opération' };
            default:
                return null;
        }
    };

    const fabProps = getFabAction();

    return (
        <div className="app-container-react flex flex-col min-h-screen">
            <Header
                currentUser={currentUser}
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onLogout={handleLogout}
                handleNavigate={navigateTo}
                navigationLinks={navigationLinks}
                currentPageKey={currentPageKey}
            />
            <div className="app-main-wrapper flex-grow flex">
                <main className="main-content-area flex-1 p-4 sm:p-6 pb-20 md:pb-6 overflow-y-auto w-full">
                    <div id="pageContent">
                        {currentPageKey === 'Mon Profil' ? (
                            <UserProfilePage {...profilePageProps} />
                        ) : currentPageKey === 'Paramètres' ? (
                            <SettingsPage {...settingsPageProps} />
                        ) : CurrentPageComponent ? (
                            <CurrentPageComponent {...pageProps} />
                        ) : (
                            <p>Page non trouvée</p>
                        )}
                    </div>
                </main>
            </div>

            <BottomNav currentUser={currentUser} currentPageKey={currentPageKey} handleNavigate={navigateTo} />
            {fabProps && <Fab {...fabProps} />}

            {/* Render all modals at the app root */}
            {renderGenericModals()}
            {currentUser?.role === 'agent' && <agentActions.AgentModals />}
            {currentUser?.role === 'chef_agence' && <chefActions.ChefModals />}
        </div>
    );
};