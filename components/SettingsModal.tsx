import { AppText } from '@/components/AppText';
import { GuestSyncCard } from '@/components/GuestSyncCard';
import { SettingsRow } from '@/components/SettingsRow';
import { useAuth } from '@/context/AuthContext';
import { HelpCircle, Lock, LogOut, Moon, Zap } from 'lucide-react-native';
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
}

export const SettingsModal = ({ visible, onClose }: SettingsModalProps) => {
    const { isGuest, signOut } = useAuth();

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

                        {/* Group 1: Preferences */}
                        <View style={styles.group}>
                            <AppText style={styles.groupTitle}>PREFERENCES</AppText>
                            <SettingsRow
                                label="Appearance"
                                icon={<Moon size={20} color="#333" />}
                                type="toggle"
                                value={darkMode}
                                onToggle={setDarkMode}
                            />
                            <SettingsRow
                                label="Haptic Feedback"
                                icon={<Zap size={20} color="#333" />}
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
                                icon={<HelpCircle size={20} color="#333" />}
                                type="link"
                                onPress={() => { }}
                            />
                            <SettingsRow
                                label="Privacy Policy"
                                icon={<Lock size={20} color="#333" />}
                                type="link"
                                onPress={() => { }}
                            />
                            <SettingsRow
                                label="Log Out"
                                icon={<LogOut size={20} color="#EF4444" />}
                                type="destructive"
                                onPress={signOut}
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
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '75%',
        width: '100%',
        paddingTop: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
    },
    header: {
        alignItems: 'center',
        paddingBottom: 4,
    },
    dragHandle: {
        width: 40,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#E5E5E5',
        marginBottom: 20,
    },
    title: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 28,
        color: '#1A1A1A',
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
        fontFamily: 'Inter_700Bold', // Or Medium/Bold
        fontSize: 12,
        color: '#8E8E93',
        marginBottom: 8,
        marginLeft: 4,
        letterSpacing: 0.5,
    }
});
