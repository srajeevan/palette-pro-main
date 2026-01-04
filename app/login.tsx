import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useProjectStore } from '@/store/useProjectStore';
import { useRouter } from 'expo-router';
import { Palette } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

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
        <SafeAreaView className="flex-1 bg-stone-50" edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                    className="px-8"
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header Section */}
                    <Animated.View
                        entering={FadeInDown.springify().damping(12).delay(100)}
                        className="items-center mb-12"
                    >
                        <View className="bg-stone-900 p-4 rounded-3xl mb-6 shadow-xl shadow-stone-400/20">
                            <Palette size={40} color="#fff" strokeWidth={1.5} />
                        </View>
                        <AppText className="text-4xl text-stone-900 text-center mb-3" style={{ fontFamily: 'PlayfairDisplay_700Bold' }}>
                            PalettePro
                        </AppText>
                        <AppText className="text-stone-500 text-center text-lg" style={{ fontFamily: 'Inter_400Regular' }}>
                            Your digital artist companion.
                        </AppText>
                    </Animated.View>

                    {/* Form Section */}
                    <Animated.View
                        entering={FadeInDown.springify().damping(12).delay(200)}
                        className="space-y-5"
                    >
                        <View>
                            <AppText className="text-stone-600 font-medium mb-2 ml-1 text-sm uppercase tracking-wider">Email</AppText>
                            <TextInput
                                className="bg-white border border-stone-200 rounded-2xl px-5 py-4 text-stone-800 font-sans text-base shadow-sm"
                                placeholder="artist@example.com"
                                placeholderTextColor="#a8a29e"
                                autoCapitalize="none"
                                keyboardType="email-address"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        <View>
                            <AppText className="text-stone-600 font-medium mb-2 ml-1 text-sm uppercase tracking-wider">Password</AppText>
                            <TextInput
                                className="bg-white border border-stone-200 rounded-2xl px-5 py-4 text-stone-800 font-sans text-base shadow-sm"
                                placeholder="••••••••"
                                placeholderTextColor="#a8a29e"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>

                        <View className="pt-4">
                            <AppButton
                                title={isSignUp ? 'Create Account' : 'Sign In'}
                                onPress={handleAuth}
                                loading={authLoading}
                                variant="primary"
                                className="w-full py-4 shadow-lg shadow-emerald-900/10"
                            />
                        </View>

                        <AppButton
                            title={isSignUp ? 'Already have an account? Sign In' : 'New to PalettePro? Create Account'}
                            onPress={() => setIsSignUp(!isSignUp)}
                            variant="ghost"
                            className="w-full"
                        />
                    </Animated.View>

                    {/* Divider */}
                    <Animated.View
                        entering={FadeInDown.springify().damping(12).delay(300)}
                        className="my-10 flex-row items-center"
                    >
                        <View className="flex-1 h-[1px] bg-stone-200" />
                        <AppText className="mx-4 text-stone-400 text-sm font-medium">OR</AppText>
                        <View className="flex-1 h-[1px] bg-stone-200" />
                    </Animated.View>

                    {/* Guest Action */}
                    <Animated.View
                        entering={FadeInDown.springify().damping(12).delay(400)}
                        className="items-center"
                    >
                        <AppButton
                            title="Continue as Guest"
                            onPress={() => {
                                resetProject();
                                signInAsGuest();
                                router.replace('/(tabs)');
                            }}
                            variant="outline"
                            className="w-full border-stone-300"
                        />
                        <AppText className="text-stone-400 text-xs text-center mt-4 px-4">
                            Guest access allows you to try all features but your data won't be synced across devices.
                        </AppText>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
