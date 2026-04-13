import { initCrashReporting } from '@/services/crashReporting';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '../global.css';

// Initialize Sentry as early as possible
initCrashReporting();

import { PaywallModal } from '@/components/PaywallModal';
import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { usePro } from '@/context/ProContext';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'login',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

import { Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
// ...

import { Sentry } from '@/services/crashReporting';

function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    PlayfairDisplay_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      // Initialize PostHog analytics
      require('@/services/analytics').initAnalytics();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

export default Sentry.wrap(RootLayout);

// RootLayoutNav handles the router and rendering
import { ProProvider } from '@/context/ProContext';

// ...

function RootLayoutNav() {
  return (
    <AuthProvider>
      <ProProvider>
        <RootLayoutNavContent />
      </ProProvider>
    </AuthProvider>
  );
}

import { Toast } from '@/components/Toast';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { toastRef } from '@/utils/toast';
// Lazy import — native module may not be available until dev client rebuild
let Notifications: typeof import('expo-notifications') | null = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  // expo-notifications native module not available yet
}

export { toastRef }; // Optional re-export if needed, but better to import from utils

function RootLayoutNavContent() {
  // ... (keep existing hooks)
  const colorScheme = useColorScheme();
  const { session, loading, isGuest } = useAuth();
  const { pendingUpgrade, setPendingUpgrade, isPro } = usePro();
  const { hasCompletedOnboarding, completeOnboarding, identityAnswer, selectedUseCase, painPoints } = useOnboardingStore();
  const segments = useSegments();
  const router = useRouter();
  const paywallRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (session?.user?.id) {
      const { identifyUser } = require('@/services/analytics');
      const { identifyCrashUser } = require('@/services/crashReporting');
      identifyUser(session.user.id, {
        email: session.user.email,
        is_guest: isGuest,
        plan: isPro ? 'pro' : 'free',
        onboarding_goal: identityAnswer,
        onboarding_use_case: selectedUseCase,
        onboarding_pain_points: painPoints,
      });
      identifyCrashUser(session.user.id, session.user.email, isPro);
    }
  }, [session?.user?.id, isPro]);

  // Handle notification taps — deep link to palette screen
  useEffect(() => {
    if (!Notifications) return;
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const type = response.notification.request.content.data?.type;
      if (type === 'unsaved_palette' || type === 'streak_reminder' || type === 'inspiration') {
        router.push('/(tabs)/palette');
      }
    });
    return () => subscription.remove();
  }, []);

  // Auto-complete onboarding for existing users who update the app
  useEffect(() => {
    if (hasCompletedOnboarding || !session) return;
    // If user has an active session (returning user), skip onboarding
    AsyncStorage.getItem('onboarding-storage').then((data) => {
      if (!data) {
        // Store doesn't exist yet — this is an existing user updating the app
        completeOnboarding();
      }
    });
  }, [session, hasCompletedOnboarding]);

  useEffect(() => {
    if (loading) return;

    const isAuthenticated = !!session || isGuest;
    const currentSegment = segments[0];

    if (!isAuthenticated) {
      // Not logged in — force login (unless already there)
      if (currentSegment === '(tabs)' || currentSegment === '(onboarding)') {
        router.replace('/login');
      }
    } else if (!hasCompletedOnboarding) {
      // Logged in but hasn't onboarded — send to onboarding
      // Exception: Allow guest to access login for pending upgrade
      if (isGuest && pendingUpgrade) {
        // Allow access to login
      } else if (currentSegment !== '(onboarding)') {
        router.replace('/(onboarding)/welcome');
      }
    } else {
      // Logged in and onboarded — go to tabs
      if (currentSegment === 'login') {
        if (isGuest && pendingUpgrade) {
          // Allow access
        } else {
          router.replace('/(tabs)');
        }
      } else if (currentSegment === '(onboarding)') {
        router.replace('/(tabs)');
      }
    }
  }, [session, loading, isGuest, segments, hasCompletedOnboarding]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <SafeAreaProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
              <Stack.Screen name="login" />
              <Stack.Screen name="(onboarding)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
            </Stack>
            {/* Global Paywall for deferred upgrades */}
            <PaywallModal ref={paywallRef} />
            <Toast ref={toastRef} />
          </ThemeProvider>
        </SafeAreaProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
