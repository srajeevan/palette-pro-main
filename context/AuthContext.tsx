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
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    loading: true,
    isGuest: false,
    signInAsGuest: () => { },
    signOut: async () => { },
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
            if (!__DEV__) {
                await Purchases.logOut();
            } else {
                // In DEV, logOut might be annoying if sharing sandbox account, but strictly speaking correct.
                // We'll keep it consistent.
                await Purchases.logOut();
            }
        } catch (e) {
            console.warn("RevenueCat logOut failed (likely anonymous):", e);
        }

        setIsGuest(false);
        setSession(null);
        setUser(null);
    };

    const value = {
        session,
        user,
        loading,
        isGuest,
        signInAsGuest,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
