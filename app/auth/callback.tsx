import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function AuthCallback() {
    const router = useRouter();
    const { session } = useAuth();

    useEffect(() => {
        // Supabase Auth Listener in _layout.tsx will handle the session
        // We just need to wait a moment or redirect if already set.
        if (session) {
            router.replace('/(tabs)');
        }
    }, [session]);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0B' }}>
            <ActivityIndicator size="large" color="#3E63DD" />
        </View>
    );
}
