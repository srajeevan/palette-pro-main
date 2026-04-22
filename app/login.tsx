import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { useAuth } from '@/context/AuthContext';
import { usePro } from '@/context/ProContext';
import { supabase } from '@/lib/supabase';
import { useProjectStore } from '@/store/useProjectStore';
import { showToast } from '@/utils/toast';
import { AntDesign } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { useRouter } from 'expo-router';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import React, { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

GoogleSignin.configure({
    iosClientId: '1049473771008-edc1ltging084fulv8be7ficpa3nojfl.apps.googleusercontent.com',
    webClientId: '1049473771008-8gr0qb1urkkkcghb04k3qs4qcaga0i45.apps.googleusercontent.com',
});

export default function LoginScreen() {
    const router = useRouter();
    const { signInAsGuest } = useAuth();
    const { pendingUpgrade, resetProStatus } = usePro();
    const resetProject = useProjectStore((state) => state.resetProject);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [emailLoading, setEmailLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    // Stays true after successful sign-in to prevent login screen flash
    const [signedIn, setSignedIn] = useState(false);
    // Auto-switch to Sign Up if coming from "Create Account" flow
    const [isSignUp, setIsSignUp] = useState(pendingUpgrade);

    const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const checkEmailTypos = (email: string) => {
        const domain = email.split('@')[1];
        if (!domain) return null;

        const commonTypos: { [key: string]: string } = {
            // Gmail
            'gmil.com': 'gmail.com', 'gnail.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmal.com': 'gmail.com',
            'gmail.co': 'gmail.com', 'gmail.om': 'gmail.com', 'gmail.con': 'gmail.com', 'gmail.cm': 'gmail.com',
            'gmil.om': 'gmail.com', 'gmil.co': 'gmail.com',

            // Yahoo
            'yaho.com': 'yahoo.com', 'yahoo.co': 'yahoo.com', 'yahoo.om': 'yahoo.com', 'yahoo.con': 'yahoo.com',

            // Hotmail
            'hotmal.com': 'hotmail.com', 'hormail.com': 'hotmail.com', 'hotmail.co': 'hotmail.com', 'hotmail.om': 'hotmail.com',

            // Outlook
            'otlook.com': 'outlook.com', 'outlook.co': 'outlook.com', 'outlook.om': 'outlook.com',

            // iCloud
            'iclud.com': 'icloud.com', 'icloud.co': 'icloud.com', 'icloud.om': 'icloud.com',
        };

        return commonTypos[domain] || null;
    };

    const handleAuth = async () => {
        if (!email || !password || (isSignUp && !fullName)) {
            showToast('Please fill in all fields');
            return;
        }

        if (!isValidEmail(email)) {
            showToast('Please enter a valid email address');
            return;
        }

        const typoSuggestion = checkEmailTypos(email.toLowerCase());
        if (typoSuggestion) {
            showToast(`Did you mean @${typoSuggestion}?`);
            return;
        }

        setEmailLoading(true);
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
                        emailRedirectTo: 'https://palettepro.app', // Redirects to web (Universal Link recommended)
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
                setSignedIn(true);
            }
        } catch (error: any) {
            console.error('Auth Error:', error);
            showToast(error.message || 'Authentication failed');
        } finally {
            setEmailLoading(false);
        }
    };


    const performGoogleSignIn = async () => {
        setGoogleLoading(true);
        try {
            await GoogleSignin.hasPlayServices();

            // Generate nonce: raw for Supabase, SHA-256 hash for Google
            const rawNonce = Crypto.randomUUID();
            const hashedNonce = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                rawNonce,
            );

            const response = await GoogleSignin.signIn({ nonce: hashedNonce } as any);

            if (response.data?.idToken) {
                // Show spinner immediately after Google sheet dismisses
                setSignedIn(true);
                const { error } = await supabase.auth.signInWithIdToken({
                    provider: 'google',
                    token: response.data.idToken,
                    nonce: rawNonce,
                });
                if (error) {
                    setSignedIn(false);
                    throw error;
                }
            } else {
                throw new Error('No ID token received from Google');
            }
        } catch (error: any) {
            if (error.code === 'SIGN_IN_CANCELLED' || error.message?.includes('canceled')) {
                console.log('Google Sign-In canceled by user');
            } else {
                console.error('Google Auth Error:', error);
                showToast(error.message || 'Google Sign-In failed');
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    const performAppleSignIn = async () => {
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            if (credential.identityToken) {
                setSignedIn(true);
                const { error } = await supabase.auth.signInWithIdToken({
                    provider: 'apple',
                    token: credential.identityToken,
                });

                if (error) {
                    setSignedIn(false);
                    throw error;
                }
            } else {
                throw new Error('No identityToken.');
            }
        } catch (e: any) {
            if (e.code === 'ERR_CANCELED' || e.message?.toLowerCase().includes('canceled')) {
                // User canceled, do nothing
                console.log('Apple Sign-In canceled by user');
            } else {
                console.error('Apple Auth Error:', e);
                showToast(e.message || 'Apple Sign-In failed');
            }
        }
    };

    if (signedIn) {
        return (
            <View style={{ flex: 1, backgroundColor: '#0A0A0B', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#3E63DD" />
            </View>
        );
    }

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
                        entering={FadeInDown.duration(500).easing(Easing.out(Easing.cubic)).delay(100)}
                        className="items-center mb-12"
                    >
                        {/* App Icon */}
                        <Image
                            source={require('@/assets/images/splash-p.jpg')}
                            style={{ width: 80, height: 80, borderRadius: 20, marginBottom: 24 }}
                        />
                        <AppText className="text-4xl text-center mb-3 text-white" style={{ fontFamily: 'PlayfairDisplay_700Bold', color: '#FFFFFF' }}>
                            PalettePro
                        </AppText>
                        {/* Gold accent line */}
                        <View style={{ width: 30, height: 2, backgroundColor: '#C4A44A', borderRadius: 1, marginBottom: 12 }} />
                        <AppText className="text-center text-lg text-[#8E8E93]" style={{ fontFamily: 'Inter_400Regular', color: '#8E8E93' }}>
                            Your digital artist companion.
                        </AppText>
                    </Animated.View>

                    {/* Form Section */}
                    <Animated.View
                        entering={FadeInDown.duration(500).easing(Easing.out(Easing.cubic)).delay(200)}
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
                                loading={emailLoading}
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
                        entering={FadeInDown.duration(500).easing(Easing.out(Easing.cubic)).delay(300)}
                        className="my-10 flex-row items-center"
                    >
                        <View className="flex-1 h-[1px] bg-[#28282A]" />
                        <AppText className="mx-4 text-sm font-medium text-[#52525B]" style={{ color: '#52525B' }}>OR</AppText>
                        <View className="flex-1 h-[1px] bg-[#28282A]" />
                    </Animated.View>

                    {/* Guest Action */}
                    <Animated.View
                        entering={FadeInDown.duration(500).easing(Easing.out(Easing.cubic)).delay(400)}
                        className="items-center space-y-4"
                    >
                        {Platform.OS === 'ios' && (
                            <AppButton
                                title="Sign in with Apple"
                                onPress={performAppleSignIn}
                                variant="outline"
                                className="w-full border-[#28282A] bg-[#1C1C1E] mb-4"
                                textStyle={{ color: '#FFFFFF' }}
                                icon={<AntDesign name="apple" size={20} color="white" />}
                            />
                        )}

                        <AppButton
                            title="Sign in with Google"
                            onPress={performGoogleSignIn}
                            loading={googleLoading}
                            variant="outline"
                            className="w-full border-[#28282A] bg-[#1C1C1E] mb-4"
                            textStyle={{ color: '#FFFFFF' }}
                            icon={<AntDesign name="google" size={20} color="white" />}
                        />

                        <AppButton
                            title="Continue as Guest"
                            onPress={() => {
                                resetProject();
                                signInAsGuest();
                                // Navigation handled by _layout.tsx redirect logic
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
