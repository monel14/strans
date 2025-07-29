
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { handleSupabaseError } from '../utils/errorUtils';
import { navigationLinks } from '../config/navigation';
import { User, Notification, ChefAgence, Agent } from '../types';
import { Database } from '../types/database.types';

import { useAgentActions } from '../hooks/useAgentActions';
import { useChefActions } from '../hooks/useChefActions';


type Theme = 'light' | 'dark';

interface AppContextState {
    session: Session | null;
    currentUser: User | null;
    loading: boolean;
    currentPageKey: string;
    allNotifications: Notification[];
    theme: Theme;
    notificationSettings: { email: boolean; inApp: boolean };
    modalState: { type: string; data?: any } | null;
    
    setNotificationSettings: React.Dispatch<React.SetStateAction<{ email: boolean; inApp: boolean }>>;

    refreshCurrentUser: () => void;
    toggleTheme: () => void;
    closeModal: () => void;
    
    handleLogin: (email: string, password_not_used: string) => Promise<boolean>;
    handleLogout: () => void;
    handleNavigate: (pageKey: string) => void;
    handleMarkAsRead: (notificationId: string) => void;
    handleMarkAllAsRead: () => void;
    handleAction: (actionKey: string, data?: any) => void;
}

const AppContext = createContext<AppContextState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        // Restaurer l'utilisateur depuis le localStorage au démarrage
        try {
            const savedUser = localStorage.getItem('currentUser');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(true);
    const [currentPageKey, setCurrentPageKey] = useState<string>('');
    const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
    const [theme, setTheme] = useState<Theme>('light');
    const [notificationSettings, setNotificationSettings] = useState(() => {
        const saved = localStorage.getItem('notificationSettings');
        return saved ? JSON.parse(saved) : { email: true, inApp: true };
    });
    const [modalState, setModalState] = useState<{ type: string; data?: any } | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isFetchingProfile, setIsFetchingProfile] = useState(false);

    const closeModal = () => setModalState(null);

    const toggleTheme = () => { /* No-op, dark mode removed */ };

    useEffect(() => {
        // Force light theme
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
        localStorage.removeItem('theme'); // Clean up old setting
    }, []);
    
    useEffect(() => {
        localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
    }, [notificationSettings]);

    const fetchUserProfile = useCallback(async (userId: string, retries = 3): Promise<void> => {
        console.log(`[DEBUG] fetchUserProfile called with userId: ${userId}, retries: ${retries}`);
        
        if (!userId) {
            console.log(`[DEBUG] No userId provided, setting loading to false`);
            setCurrentUser(null);
            setLoading(false);
            return;
        }

        // Éviter les appels simultanés
        if (isFetchingProfile) {
            console.log(`[DEBUG] Already fetching profile, skipping this call`);
            return;
        }
        
        setIsFetchingProfile(true);

        try {
            console.log(`[DEBUG] Fetching profile for user: ${userId}`);
            
            // Ajouter un timeout pour éviter que la requête reste bloquée
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout: Profile fetch took too long')), 10000)
            );
            
            const fetchPromise = supabase
                .from('profiles')
                .select('id, agency_id, avatar_seed, email, name, role, solde, status, suspension_reason, permissions, commissions_dues')
                .eq('id', userId)
                .single();
            
            const result = await Promise.race([fetchPromise, timeoutPromise]);
            const { data: profile, error } = result as any; // Cast remains for simplicity with Promise.race

            if (error) {
                console.log(`[DEBUG] Profile fetch error:`, error);
                if (error.details && error.details.includes("0 rows") && retries > 0) {
                    console.log(`Profile not found for ${userId}, retrying... (${retries} left)`);
                    await new Promise(res => setTimeout(res, 1000));
                    await fetchUserProfile(userId, retries - 1);
                    return;
                } else {
                    console.log(`[DEBUG] Profile fetch failed permanently, signing out`);
                    setFetchError(error.message);
                    handleSupabaseError({ ...error, message: "Votre profil utilisateur n'a pas pu être chargé." }, "Chargement du profil utilisateur");
                    await supabase.auth.signOut();
                    setCurrentUser(null);
                    setLoading(false);
                    return;
                }
            }
            
            if (profile) {
                console.log(`[DEBUG] Profile found:`, profile);
                const user = profile as unknown as User;
                setCurrentUser(user);
                // Sauvegarder l'utilisateur dans le localStorage
                localStorage.setItem('currentUser', JSON.stringify(user));
                const firstPageKey = navigationLinks[user.role]?.[0]?.key;
                if (firstPageKey) setCurrentPageKey(firstPageKey);
            } else {
                console.log(`[DEBUG] No profile data returned`);
                setCurrentUser(null);
                localStorage.removeItem('currentUser');
            }
            console.log(`[DEBUG] Setting loading to false - success path`);
            setLoading(false);
        } catch (err) {
            console.error("Erreur inattendue lors du chargement du profil:", err);
            setFetchError(err instanceof Error ? err.message : "Erreur inconnue");
            setCurrentUser(null);
            console.log(`[DEBUG] Setting loading to false - error path`);
            setLoading(false);
        } finally {
            setIsFetchingProfile(false);
        }
    }, []);

    const refreshCurrentUser = useCallback(async () => {
        if (session?.user?.id) {
            await fetchUserProfile(session.user.id);
        }
    }, [session?.user?.id, fetchUserProfile]);

    useEffect(() => {
        const checkUser = async () => {
            console.log(`[DEBUG] checkUser called, currentUser from localStorage:`, currentUser);
            setLoading(true);
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                
                if (error) {
                    console.error("Erreur lors de la récupération de la session:", error);
                    setFetchError(error.message);
                    setLoading(false);
                    return;
                }
                
                setSession(session);
                if (session?.user) {
                    // Si on a déjà l'utilisateur en localStorage et que c'est le même, pas besoin de refetch
                    if (currentUser && currentUser.id === session.user.id) {
                        console.log(`[DEBUG] User already loaded from localStorage, skipping fetch`);
                        const firstPageKey = navigationLinks[currentUser.role]?.[0]?.key;
                        if (firstPageKey && !currentPageKey) setCurrentPageKey(firstPageKey);
                        setLoading(false);
                        return;
                    }
                    await fetchUserProfile(session.user.id);
                } else {
                    // Pas de session, nettoyer les données
                    setCurrentUser(null);
                    localStorage.removeItem('currentUser');
                    setLoading(false);
                }
            } catch (err) {
                console.error("Erreur inattendue lors de la vérification de l'utilisateur:", err);
                setFetchError(err instanceof Error ? err.message : "Erreur inconnue");
                setLoading(false);
            }
        };
        
        checkUser();
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            console.log(`[DEBUG] Auth state changed, event: ${_event}, session:`, session?.user?.id);
            setSession(session);
            
            // Éviter de remettre loading à true si on a déjà un utilisateur et que c'est le même
            if (session?.user && currentUser?.id === session.user.id) {
                console.log(`[DEBUG] Same user, skipping profile fetch`);
                return;
            }
            
            setLoading(true);
            if (session?.user) {
                await fetchUserProfile(session.user.id);
            } else {
                setCurrentUser(null);
                setLoading(false);
            }
        });
        
        return () => subscription.unsubscribe();
    }, [currentUser, currentPageKey, fetchUserProfile]);

    useEffect(() => {
        if (!currentUser) return;
        const channel = supabase.channel('public:notifications').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` },
            (payload) => setAllNotifications(prev => [payload.new as Notification, ...prev])
        ).subscribe();
    
        const fetchInitialNotifications = async () => {
          const { data, error } = await supabase.from('notifications').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(10);
          if (error) handleSupabaseError(error, "Chargement des notifications initiales");
          else setAllNotifications((data as Notification[]) ?? []);
        };
        fetchInitialNotifications();
        return () => { supabase.removeChannel(channel); };
    }, [currentUser]);

    const handleLogin = async (email: string, password_not_used: string): Promise<boolean> => {
        try {
            const password = 'password';
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ 
                email, 
                password 
            });

            if (signInError) {
                console.error('Erreur de connexion:', signInError);
                handleSupabaseError(signInError, "Tentative de connexion");
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Erreur inattendue:', error);
            handleSupabaseError(
                { message: "Une erreur inattendue s'est produite" },
                "Erreur de connexion"
            );
            return false;
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
        setSession(null);
        setCurrentPageKey('');
        // Nettoyer le localStorage
        localStorage.removeItem('currentUser');
    };
    
    const handleNavigate = (pageKey: string) => {
        setCurrentPageKey(pageKey);
    };

    const handleMarkAsRead = async (notificationId: string) => {
        const update: Database['public']['Tables']['notifications']['Update'] = { read: true };
        const { error } = await supabase.from('notifications').update(update).eq('id', notificationId);
        if (!error) setAllNotifications(prev => prev.map(n => (n.id === notificationId ? { ...n, read: true } : n)));
        else handleSupabaseError(error, "Marquage d'une notification comme lue");
    };
    
    const handleMarkAllAsRead = async () => {
        if (!currentUser) return;
        const update: Database['public']['Tables']['notifications']['Update'] = { read: true };
        const { error } = await supabase.from('notifications').update(update).eq('user_id', currentUser.id).eq('read', false);
        if (!error) setAllNotifications(prev => prev.map(n => ({ ...n, read: true })));
        else handleSupabaseError(error, "Marquage de toutes les notifications comme lues");
    };

    // --- Hooks for business logic ---
    const agentActions = useAgentActions(
        currentUser?.role === 'agent' ? currentUser as Agent : null,
        refreshCurrentUser
    );
    
    const chefActions = useChefActions(
        currentUser?.role === 'chef_agence' ? currentUser as ChefAgence : null,
        refreshCurrentUser
    );

    const handleAction = (actionKey: string, data?: any) => {
        if (currentUser?.role === 'agent' && agentActions) {
            if (actionKey === 'openNewOperationModal') agentActions.openNewOperationModal();
            if (actionKey === 'openRechargeModal') agentActions.openRechargeModal();
            return;
        }
        if (currentUser?.role === 'chef_agence' && chefActions) {
            if (actionKey === 'openNewOperationModal') chefActions.openNewOperationModal();
            if (actionKey === 'openRechargeAgentModal') chefActions.openRechargeAgentModal(data);
            if (actionKey === 'openApproveRechargeModal') chefActions.openApproveRechargeModal(data);
            if (actionKey === 'openRejectRechargeModal') chefActions.openRejectRechargeModal(data);
            if (actionKey === 'openSelfRechargeModal') chefActions.openSelfRechargeModal();
            if (actionKey === 'openTransferCommissionsModal') chefActions.openTransferCommissionsModal();
            return;
        }
        
        // --- Generic modal triggers ---
        const modalTriggers = ['viewProof', 'viewAttachment'];
        if (modalTriggers.includes(actionKey)) setModalState({ type: actionKey, data });
        else console.warn(`Action non-gérée déclenchée depuis le contexte: ${actionKey}`, data);
    };

    const value: AppContextState = {
        session, currentUser, loading, currentPageKey, allNotifications, theme, notificationSettings, modalState,
        setNotificationSettings,
        refreshCurrentUser, toggleTheme, closeModal,
        handleLogin, handleLogout, handleNavigate, handleMarkAsRead, handleMarkAllAsRead, handleAction,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
            {currentUser?.role === 'agent' && <agentActions.AgentModals />}
            {currentUser?.role === 'chef_agence' && <chefActions.ChefModals />}
        </AppContext.Provider>
    );
};

export const useAppContext = (): AppContextState => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};