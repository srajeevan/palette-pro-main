
import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
    const { session, loading, isGuest } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#18181b" />
            </View>
        );
    }

    if (session || isGuest) {
        return <Redirect href="/(tabs)" />;
    }

    return <Redirect href="/login" />;
}
