import { AppText } from '@/components/AppText';
import { GuestSyncCard } from '@/components/GuestSyncCard';
import { SettingsRow } from '@/components/SettingsRow';
import { useAuth } from '@/context/AuthContext';
import { usePro } from '@/context/ProContext';
import { Crown, HelpCircle, Lock, LogOut, Moon, Zap } from 'lucide-react-native';
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
    onManageSubscription: () => void;
}

export const SettingsModal = ({ visible, onClose, onManageSubscription }: SettingsModalProps) => {
    const { isGuest, signOut } = useAuth();
    const { isPro, resetProStatus } = usePro();

    // Mock Toggle States
    const [darkMode, setDarkMode] = React.useState(false);
    const [haptics, setHaptics] = React.useState(true);

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.overlayContainer}>
                {/* Dimmed Overlay - Closes on press */}
                <Pressable style={styles.backdrop} onPress={onClose}>
                    <Animated.View
                        entering={FadeIn.duration(200)}
                        style={styles.dimmedLayer}
                    />
                </Pressable>

                {/* Bottom Sheet */}
                <Animated.View
                    entering={SlideInUp.springify().damping(15)}
                    style={styles.sheet}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.dragHandle} />
                        <AppText style={styles.title}>Settings</AppText>
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Guest Sync Card */}
                        {isGuest && (
                            <View style={{ marginBottom: 24 }}>
                                <GuestSyncCard onPressSync={signOut} />
                            </View>
                        )}

                        {/* Group 0: Membership */}
                        <View style={styles.group}>
                            <AppText style={styles.groupTitle}>MEMBERSHIP</AppText>
                            <SettingsRow
                                label={isPro ? "Pro Member" : "Upgrade to Pro"}
                                icon={<Crown size={20} />}
                                type={isPro ? "link" : "link"} // Both are links/buttons
                                value={isPro} // Not really used for link type but good for tracking
                                onPress={onManageSubscription}
                            // Optional: Change color if upgrade needed
                            // We can handle this by passing a custom icon with color above if needed, 
                            // but SettingsRow handles coloring.
                            />
                            {isPro && (
                                <AppText style={{ color: '#F59E0B', fontSize: 12, marginTop: -8, marginBottom: 12, marginLeft: 44, fontFamily: 'Inter_500Medium' }}>
                                    ● Status: Active
                                </AppText>
                            )}
                        </View>

                        {/* Group 1: Preferences */}
                        <View style={styles.group}>
                            <AppText style={styles.groupTitle}>PREFERENCES</AppText>
                            <SettingsRow
                                label="Appearance"
                                icon={<Moon size={20} />}
                                type="toggle"
                                value={darkMode}
                                onToggle={setDarkMode}
                            />
                            <SettingsRow
                                label="Haptic Feedback"
                                icon={<Zap size={20} />}
                                type="toggle"
                                value={haptics}
                                onToggle={setHaptics}
                            />
                        </View>

                        {/* Group 2: Support */}
                        <View style={styles.group}>
                            <AppText style={styles.groupTitle}>SUPPORT</AppText>
                            <SettingsRow
                                label="Help & FAQ"
                                icon={<HelpCircle size={20} />}
                                type="link"
                                onPress={() => { }}
                            />
                            <SettingsRow
                                label="Privacy Policy"
                                icon={<Lock size={20} />}
                                type="link"
                                onPress={() => { }}
                            />
                            <SettingsRow
                                label="Log Out"
                                icon={<LogOut size={20} />}
                                type="destructive"
                                onPress={signOut}
                            />
                            {/* Debug Section */}
                            <SettingsRow
                                label="[DEBUG] Reset Pro Status"
                                icon={<Zap size={20} color="#EF4444" />}
                                type="destructive"
                                onPress={resetProStatus}
                            />
                        </View>

                        {/* Bottom Spacer for SafeArea */}
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlayContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    dimmedLayer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)', // Slightly darker overlay
    },
    sheet: {
        backgroundColor: '#161618', // Surface L1
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '75%',
        width: '100%',
        paddingTop: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
        borderTopWidth: 1,
        borderTopColor: '#28282A',
    },
    header: {
        alignItems: 'center',
        paddingBottom: 4,
    },
    dragHandle: {
        width: 40,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#3F3F46', // Zinc-700
        marginBottom: 20,
    },
    title: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 28,
        color: '#FFFFFF', // White
        marginBottom: 16,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    group: {
        marginBottom: 32,
    },
    groupTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 12,
        color: '#A1A1AA', // Zinc-400
        marginBottom: 8,
        marginLeft: 4,
        letterSpacing: 0.5,
    }
});
