import { AppButton } from '@/components/AppButton';
import { AppHeader } from '@/components/AppHeader';
import { AppText } from '@/components/AppText';
import { useAuth } from '@/context/AuthContext';
import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
    const { user, loading, isGuest, signOut } = useAuth();

    if (loading || (!user && !isGuest)) {
        return <View className="flex-1 bg-stone-100" />;
    }

    return (
        <SafeAreaView className="flex-1 bg-stone-100">
            <View className="flex-1 px-6 pt-10">
                <AppHeader
                    title={isGuest ? "Guest Profile" : "Profile"}
                    subtitle={isGuest ? "Temporary Access" : user?.email || "Artist"}
                />

                {isGuest && (
                    <View className="bg-orange-50 p-4 rounded-xl border border-orange-100 mb-6">
                        <AppText className="text-orange-800 text-center">
                            You are browsing as a Guest. Sign in to save your palettes and preferences.
                        </AppText>
                    </View>
                )}

                <View className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-stone-200">
                    <AppText className="text-zinc-800 font-medium mb-2">My Palette</AppText>
                    <AppText className="text-zinc-500 text-sm">
                        {isGuest ? "Sign in to save palettes." : "No palettes saved yet."}
                    </AppText>
                </View>

                <AppButton
                    title={isGuest ? "Sign In / Create Account" : "Sign Out"}
                    onPress={() => signOut()}
                    variant={isGuest ? "primary" : "secondary"}
                />
            </View>
        </SafeAreaView>
    );
}
