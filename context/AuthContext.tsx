import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import Purchases from 'react-native-purchases';

type AuthContextType = {
    session: Session | null;
    user: User | null;
    loading: boolean;
    isGuest: boolean;
    signInAsGuest: () => void;
    signOut: () => Promise<void>;
    deleteAccount: () => Promise<{ error: any }>;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    loading: true,
    isGuest: false,
    signInAsGuest: () => { },
    signOut: async () => { },
    deleteAccount: async () => ({ error: null }),
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(false);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
            if (session?.user) {
                Purchases.logIn(session.user.id);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
            if (session) {
                setIsGuest(false);
                // Link RevenueCat Identity
                await Purchases.logIn(session.user.id);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInAsGuest = () => {
        setIsGuest(true);
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        // Reset RevenueCat Identity
        try {
            const isAnonymous = await Purchases.isAnonymous();
            if (!isAnonymous) {
                await Purchases.logOut();
            } else {
                console.log("RevenueCat user is anonymous, skipping logOut.");
            }
        } catch (e) {
            console.warn("RevenueCat logOut failed:", e);
        }

        setIsGuest(false);
        setSession(null);
        setUser(null);
    };

    const deleteAccount = async () => {
        try {
            // 1. Call Supabase RPC to delete user data & auth
            const { error } = await supabase.rpc('delete_user');
            if (error) throw error;

            // 2. Sign Out locally to clean up state
            await signOut();
            return { error: null };
        } catch (error: any) {
            console.error('Delete Account Error:', error);
            // Fallback: If RPC fails (e.g. doesn't exist), try standard signout and warn
            // In production, we MUST ensure the RPC exists.
            return { error };
        }
    };

    const value = {
        session,
        user,
        loading,
        isGuest,
        signInAsGuest,
        signOut,
        deleteAccount,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
