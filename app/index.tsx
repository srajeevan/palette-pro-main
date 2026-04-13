
import { useAuth } from '@/context/AuthContext';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
    const { session, loading, isGuest } = useAuth();
    const { hasCompletedOnboarding } = useOnboardingStore();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0B' }}>
                <ActivityIndicator size="large" color="#3E63DD" />
            </View>
        );
    }

    if (session || isGuest) {
        if (hasCompletedOnboarding) {
            return <Redirect href="/(tabs)" />;
        }
        return <Redirect href="/(onboarding)/identity" />;
    }

    return <Redirect href="/login" />;
}
