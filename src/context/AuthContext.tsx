
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { handleSupabaseError } from '../utils/errorUtils';
import { User } from '../types';

export interface AuthContextState {
    session: Session | null;
    currentUser: User | null;
    loading: boolean;
    handleLogin: (email: string, password_is_ignored_for_demo: string) => Promise<boolean>;
    handleLogout: () => void;
    refreshCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        try {
            const savedUser = localStorage.getItem('currentUser');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(true);
    const [isFetchingProfile, setIsFetchingProfile] = useState(false);

    const fetchUserProfile = useCallback(async (userId: string): Promise<void> => {
        if (isFetchingProfile) return;
        setIsFetchingProfile(true);

        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('id, agency_id, avatar_seed, email, name, role, solde, status, suspension_reason, commissions_dues')
                .eq('id', userId)
                .single();

            if (error) {
                handleSupabaseError({ ...error, message: "Votre profil utilisateur n'a pas pu être chargé." }, "Chargement du profil utilisateur");
                await supabase.auth.signOut();
                return;
            }

            if (profile) {
                const user = profile as User;
                setCurrentUser(user);
                localStorage.setItem('currentUser', JSON.stringify(user));
            } else {
                setCurrentUser(null);
                localStorage.removeItem('currentUser');
            }
        } catch (err) {
            console.error("Erreur inattendue lors du chargement du profil:", err);
            setCurrentUser(null);
        } finally {
            setIsFetchingProfile(false);
            setLoading(false);
        }
    }, [isFetchingProfile]);
    
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            if (session?.user) {
                if (currentUser?.id !== session.user.id) {
                    setLoading(true);
                    await fetchUserProfile(session.user.id);
                } else {
                    setLoading(false);
                }
            } else {
                setCurrentUser(null);
                localStorage.removeItem('currentUser');
                setLoading(false);
            }
        });

        // Initial check
        const checkInitialSession = async () => {
            const { data: { session: initialSession } } = await supabase.auth.getSession();
            if (initialSession?.user) {
                if (!currentUser || currentUser.id !== initialSession.user.id) {
                    await fetchUserProfile(initialSession.user.id);
                } else {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        checkInitialSession();

        return () => subscription.unsubscribe();
    }, [fetchUserProfile, currentUser]);

    const handleLogin = async (email: string, password: string): Promise<boolean> => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ 
            email, 
            password: password // Utilise le vrai mot de passe
        });

        if (error) {
            handleSupabaseError(error, "Tentative de connexion");
            setLoading(false);
            return false;
        }
        // onAuthStateChange will handle setting the user and loading state
        return true;
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
        setSession(null);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentPageKey'); // Nettoyer aussi la navigation
    };

    const refreshCurrentUser = async () => {
        if (session?.user?.id) {
            await fetchUserProfile(session.user.id);
        }
    };
    
    const value: AuthContextState = {
        session,
        currentUser,
        loading,
        handleLogin,
        handleLogout,
        refreshCurrentUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextState => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
