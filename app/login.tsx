
import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useProjectStore } from '@/store/useProjectStore';
import React, { useState } from 'react';
import { Alert, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';
// ... previous imports

export default function LoginScreen() {
    const router = useRouter();
    const { signInAsGuest } = useAuth();
    const resetProject = useProjectStore((state) => state.resetProject);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);

    const handleAuth = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        setAuthLoading(true);
        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                Alert.alert('Success', 'Check your email for the confirmation link!');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setAuthLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-stone-100">
            <View className="flex-1 px-8 justify-center">
                <View className="mb-10 items-center">
                    <AppText className="text-4xl font-bold text-zinc-900 mb-2">PalettePro</AppText>
                    <AppText className="text-zinc-500 text-center">Your digital artist companion.</AppText>
                </View>

                <View className="space-y-4">
                    <View>
                        <AppText className="text-zinc-700 font-medium mb-1 ml-1">Email</AppText>
                        <TextInput
                            className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-zinc-800 font-sans"
                            placeholder="artist@example.com"
                            placeholderTextColor="#a1a1aa"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>

                    <View>
                        <AppText className="text-zinc-700 font-medium mb-1 ml-1">Password</AppText>
                        <TextInput
                            className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-zinc-800 font-sans"
                            placeholder="••••••••"
                            placeholderTextColor="#a1a1aa"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>

                    <AppButton
                        title={isSignUp ? 'Create Account' : 'Sign In'}
                        onPress={handleAuth}
                        loading={authLoading}
                        className="mt-4"
                    />

                    <AppButton
                        title={isSignUp ? 'Already have an account? Sign In' : 'New to PalettePro? Create Account'}
                        onPress={() => setIsSignUp(!isSignUp)}
                        variant="outline"
                        className="border-0"
                    />
                </View>

                <View className="mt-8 pt-6 border-t border-stone-200 items-center">
                    <AppButton
                        title="Continue as Guest"
                        onPress={() => {
                            resetProject();
                            signInAsGuest();
                            router.replace('/(tabs)');
                        }}
                        variant="outline"
                        className="border-0"
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}
