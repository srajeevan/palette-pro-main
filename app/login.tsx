import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { useAuth } from '@/context/AuthContext';
import { usePro } from '@/context/ProContext';
import { supabase } from '@/lib/supabase';
import { useProjectStore } from '@/store/useProjectStore';
import { showToast } from '@/utils/toast';
import { useRouter } from 'expo-router';
import { Palette } from 'lucide-react-native';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
    const router = useRouter();
    const { signInAsGuest } = useAuth();
    const { pendingUpgrade, resetProStatus } = usePro();
    const resetProject = useProjectStore((state) => state.resetProject);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    // Auto-switch to Sign Up if coming from "Create Account" flow
    const [isSignUp, setIsSignUp] = useState(pendingUpgrade);

    const handleAuth = async () => {
        if (!email || !password || (isSignUp && !fullName)) {
            showToast('Please fill in all fields');
            return;
        }

        setAuthLoading(true);
        try {
            if (isSignUp) {
                console.log('Attempting Sign Up:', email);
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        },
                    },
                });
                if (error) throw error;
                showToast('Check your email for the confirmation link!');
            } else {
                console.log('Attempting Sign In:', email);
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                console.log('Sign In Result:', { data, error });
                if (error) throw error;

                // Force navigation on success
                // AuthContext listener is async, so we manually push to tabs here 
                // to avoid waiting for the state update to trigger layout navigation
                router.replace('/(tabs)');
            }
        } catch (error: any) {
            console.error('Auth Error:', error);
            showToast(error.message || 'Authentication failed');
        } finally {
            setAuthLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#0A0A0B]" edges={['top', 'bottom']}>
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
                        {/* Standard Branding - Always Visible */}
                        <View className="bg-[#1C1C1E] p-4 rounded-3xl mb-6 border border-[#28282A]">
                            <Palette size={40} color="#fff" strokeWidth={1.5} />
                        </View>
                        <AppText className="text-4xl text-center mb-3 text-white" style={{ fontFamily: 'PlayfairDisplay_700Bold', color: '#FFFFFF' }}>
                            PalettePro
                        </AppText>
                        <AppText className="text-center text-lg text-[#8E8E93]" style={{ fontFamily: 'Inter_400Regular', color: '#8E8E93' }}>
                            Your digital artist companion.
                        </AppText>
                    </Animated.View>

                    {/* Form Section */}
                    <Animated.View
                        entering={FadeInDown.springify().damping(12).delay(200)}
                        className="space-y-5"
                    >
                        {isSignUp && (
                            <View>
                                <AppText className="font-medium mb-2 ml-1 text-sm uppercase tracking-wider text-[#A1A1AA]" style={{ color: '#A1A1AA' }}>Name</AppText>
                                <TextInput
                                    className="bg-[#1C1C1E] border border-[#28282A] rounded-2xl px-5 h-14 font-sans text-lg text-white"
                                    placeholder="Your Name"
                                    placeholderTextColor="#52525B"
                                    autoCapitalize="words"
                                    value={fullName}
                                    onChangeText={setFullName}
                                    style={{ color: '#FFFFFF', fontSize: 17 }}
                                />
                            </View>
                        )}

                        <View>
                            <AppText className="font-medium mb-2 ml-1 text-sm uppercase tracking-wider text-[#A1A1AA]" style={{ color: '#A1A1AA' }}>Email</AppText>
                            <TextInput
                                className="bg-[#1C1C1E] border border-[#28282A] rounded-2xl px-5 h-14 font-sans text-lg text-white"
                                placeholder="artist@example.com"
                                placeholderTextColor="#52525B"
                                autoCapitalize="none"
                                keyboardType="email-address"
                                value={email}
                                onChangeText={setEmail}
                                style={{ color: '#FFFFFF', fontSize: 17 }}
                            />
                        </View>

                        <View>
                            <AppText className="font-medium mb-2 ml-1 text-sm uppercase tracking-wider text-[#A1A1AA]" style={{ color: '#A1A1AA' }}>Password</AppText>
                            <TextInput
                                className="bg-[#1C1C1E] border border-[#28282A] rounded-2xl px-5 h-14 font-sans text-lg text-white"
                                placeholder="••••••••"
                                placeholderTextColor="#52525B"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                                style={{ color: '#FFFFFF', fontSize: 17 }}
                            />
                        </View>

                        <View className="pt-4">
                            <AppButton
                                title={isSignUp ? 'Create Account' : 'Sign In'}
                                onPress={handleAuth}
                                loading={authLoading}
                                variant="primary"
                                className="w-full py-4 bg-[#3E63DD]"
                            />
                        </View>

                        <AppButton
                            title={isSignUp ? 'Already have an account? Sign In' : 'New to PalettePro? Create Account'}
                            onPress={() => setIsSignUp(!isSignUp)}
                            variant="secondary" // Changed from invalid 'ghost'
                            className="w-full bg-transparent"
                            textStyle={{ color: '#A1A1AA', fontSize: 14 }}
                        />
                    </Animated.View>

                    {/* Divider */}
                    <Animated.View
                        entering={FadeInDown.springify().damping(12).delay(300)}
                        className="my-10 flex-row items-center"
                    >
                        <View className="flex-1 h-[1px] bg-[#28282A]" />
                        <AppText className="mx-4 text-sm font-medium text-[#52525B]" style={{ color: '#52525B' }}>OR</AppText>
                        <View className="flex-1 h-[1px] bg-[#28282A]" />
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
                            className="w-full border-[#28282A] bg-[#1C1C1E]"
                            textStyle={{ color: '#FFFFFF' }}
                        />
                        <AppText className="text-sm text-center mt-4 px-4 text-[#A1A1AA]" style={{ color: '#A1A1AA' }}>
                            Guest access allows you to try all features but your data won't be synced across devices.
                        </AppText>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
