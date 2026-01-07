import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '../global.css';

import { PaywallModal } from '@/components/PaywallModal';
import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { usePro } from '@/context/ProContext';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
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

export default function RootLayout() {
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
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

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
import { toastRef } from '@/utils/toast';

export { toastRef }; // Optional re-export if needed, but better to import from utils

function RootLayoutNavContent() {
  // ... (keep existing hooks)
  const colorScheme = useColorScheme();
  const { session, loading, isGuest } = useAuth();
  const { pendingUpgrade, setPendingUpgrade } = usePro();
  const segments = useSegments();
  const router = useRouter();
  const paywallRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (loading) return;

    const inTabsGroup = segments[0] === '(tabs)';

    // If not logged in and not guest, require login
    // But allow access to modal if needed (though modal is usually on top of something)
    if (!session && !isGuest && inTabsGroup) {
      router.replace('/login');
    } else if ((session || isGuest) && segments[0] === 'login') {
      // If already logged in, go to tabs
      router.replace('/(tabs)');
    }
  }, [session, loading, isGuest, segments]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <SafeAreaProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
