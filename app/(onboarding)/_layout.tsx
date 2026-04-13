import { Stack } from 'expo-router';

export default function OnboardingLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: '#0A0A0B' },
            }}
        >
            <Stack.Screen name="welcome" />
            <Stack.Screen name="goals" />
            <Stack.Screen name="painpoints" />
            <Stack.Screen name="showcase" />
            <Stack.Screen name="socialproof" />
            <Stack.Screen name="solution" />
            <Stack.Screen name="usecase" />
            <Stack.Screen name="upload" />
            <Stack.Screen name="paywall" />
            {/* Legacy screens kept for backward compat */}
            <Stack.Screen name="identity" />
        </Stack>
    );
}
