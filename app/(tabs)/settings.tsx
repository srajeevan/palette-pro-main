import { AppText } from '@/components/AppText';
import { FeedbackModal } from '@/components/FeedbackModal';
import { GuestSyncCard } from '@/components/GuestSyncCard';
import { IdeaBoardModal } from '@/components/IdeaBoardModal';
import { PaywallModal } from '@/components/PaywallModal';
import { SceneTransition } from '@/components/SceneTransition';
import { SettingsRow } from '@/components/SettingsRow';
import { useAuth } from '@/context/AuthContext';
import { usePro } from '@/context/ProContext';
import { useUpgradeFlow } from '@/hooks/useUpgradeFlow';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { showToast } from '@/utils/toast';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { supabase } from '@/lib/supabase';
import { Crown, HelpCircle, Lightbulb, Lock, LogOut, MessageSquare, Pencil, User, Zap } from 'lucide-react-native';
import Constants from 'expo-constants';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
    const { isGuest, signOut, deleteAccount, user } = useAuth();
    const { isPro } = usePro();
    const { hapticsEnabled, setHapticsEnabled } = useSettingsStore();
    const resetOnboarding = useOnboardingStore((s) => s.resetOnboarding);
    const { triggerUpgradeFlow } = useUpgradeFlow();
    const paywallRef = useRef<BottomSheetModal>(null);

    const [isDeleting, setIsDeleting] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [showIdeaBoard, setShowIdeaBoard] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editName, setEditName] = useState('');
    const [isSavingName, setIsSavingName] = useState(false);

    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Artist';
    const userEmail = user?.email || '';
    const authProvider = user?.app_metadata?.provider || 'email';

    const handleEditName = () => {
        setEditName(displayName);
        setIsEditingName(true);
    };

    const handleSaveName = async () => {
        const trimmed = editName.trim();
        if (!trimmed || trimmed === displayName) {
            setIsEditingName(false);
            return;
        }
        setIsSavingName(true);
        const { error } = await supabase.auth.updateUser({
            data: { full_name: trimmed },
        });
        setIsSavingName(false);
        if (error) {
            showToast('Failed to update name');
        } else {
            showToast('Name updated!');
        }
        setIsEditingName(false);
    };

    const handleUpgradePress = () => {
        if (isPro) {
            showToast("You're already Pro!");
            return;
        }
        triggerUpgradeFlow(() => {
            paywallRef.current?.present();
        });
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account",
            "Are you sure you want to permanently delete your account and all saved palettes? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setIsDeleting(true);
                        try {
                            const { error } = await deleteAccount();
                            setIsDeleting(false);
                            if (error) {
                                Alert.alert('Error', 'Failed to delete account. Please try again or contact support.');
                            } else {
                                showToast("Your account has been deleted.");
                            }
                        } catch (e) {
                            setIsDeleting(false);
                            Alert.alert('Error', 'Something went wrong. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    return (
        <SceneTransition style={{ flex: 1 }}>
            <SafeAreaView style={styles.container} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <AppText style={styles.title}>Settings</AppText>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Profile Card */}
                    {!isGuest && (
                        <View style={styles.profileCard}>
                            <View style={styles.profileAvatar}>
                                <User size={28} color="#A1A1AA" />
                            </View>
                            <View style={styles.profileInfo}>
                                {isEditingName ? (
                                    <View style={styles.editNameRow}>
                                        <TextInput
                                            style={styles.editNameInput}
                                            value={editName}
                                            onChangeText={setEditName}
                                            autoFocus
                                            maxLength={40}
                                            returnKeyType="done"
                                            onSubmitEditing={handleSaveName}
                                            placeholderTextColor="#52525B"
                                        />
                                        <Pressable onPress={handleSaveName} disabled={isSavingName} style={styles.saveNameButton}>
                                            {isSavingName ? (
                                                <ActivityIndicator size="small" color="#3E63DD" />
                                            ) : (
                                                <AppText style={styles.saveNameText}>Save</AppText>
                                            )}
                                        </Pressable>
                                    </View>
                                ) : (
                                    <View style={styles.nameRow}>
                                        <AppText style={styles.profileName}>{displayName}</AppText>
                                        <Pressable onPress={handleEditName} hitSlop={8}>
                                            <Pencil size={14} color="#52525B" />
                                        </Pressable>
                                    </View>
                                )}
                                <AppText style={styles.profileEmail}>{userEmail}</AppText>
                                <AppText style={styles.profileProvider}>
                                    Signed in with {authProvider === 'apple' ? 'Apple' : authProvider === 'google' ? 'Google' : 'Email'}
                                </AppText>
                            </View>
                        </View>
                    )}

                    {/* Guest Sync Card */}
                    {isGuest && (
                        <View style={{ marginBottom: 24 }}>
                            <GuestSyncCard onPressSync={signOut} />
                        </View>
                    )}

                    {/* Membership */}
                    <View style={styles.group}>
                        <AppText style={styles.groupTitle}>MEMBERSHIP</AppText>
                        <SettingsRow
                            label={isPro ? "Pro Member" : "Upgrade to Pro"}
                            subtitle={isPro ? (
                                <AppText style={{ color: '#F59E0B', fontSize: 12, fontFamily: 'Inter_500Medium' }}>
                                    Active
                                </AppText>
                            ) : undefined}
                            icon={<Crown size={20} />}
                            type="link"
                            value={isPro}
                            onPress={handleUpgradePress}
                        />
                    </View>

                    {/* Preferences */}
                    <View style={styles.group}>
                        <AppText style={styles.groupTitle}>PREFERENCES</AppText>
                        <SettingsRow
                            label="Haptic Feedback"
                            icon={<Zap size={20} />}
                            type="toggle"
                            value={hapticsEnabled}
                            onToggle={setHapticsEnabled}
                        />
                    </View>

                    {/* Support */}
                    <View style={styles.group}>
                        <AppText style={styles.groupTitle}>SUPPORT</AppText>
                        <SettingsRow
                            label="Send Feedback"
                            icon={<MessageSquare size={20} />}
                            type="link"
                            onPress={() => setShowFeedback(true)}
                        />
                        <SettingsRow
                            label="Feature Requests"
                            icon={<Lightbulb size={20} />}
                            type="link"
                            onPress={() => setShowIdeaBoard(true)}
                        />
                        <SettingsRow
                            label="Help & FAQ"
                            icon={<HelpCircle size={20} />}
                            type="link"
                            onPress={() => Linking.openURL('https://www.palettepro.app/faq.html')}
                        />
                        <SettingsRow
                            label="Privacy Policy"
                            icon={<Lock size={20} />}
                            type="link"
                            onPress={() => Linking.openURL('https://www.palettepro.app/privacy.html')}
                        />
                        <SettingsRow
                            label="Log Out"
                            icon={<LogOut size={20} />}
                            type="destructive"
                            onPress={signOut}
                        />
                    </View>

                    {/* Danger Zone */}
                    <View style={styles.group}>
                        <AppText style={[styles.groupTitle, { color: '#EF4444' }]}>DANGER ZONE</AppText>
                        <SettingsRow
                            label="Delete Account"
                            icon={<LogOut size={20} />}
                            type="destructive"
                            onPress={handleDeleteAccount}
                        />
                    </View>

                    {/* Version */}
                    <AppText style={styles.versionLabel}>
                        PalettePro v{Constants.expoConfig?.version || '1.0.0'}
                    </AppText>

                    <View style={{ height: 80 }} />
                </ScrollView>

                {/* Deleting overlay */}
                {isDeleting && (
                    <View style={styles.deletingOverlay}>
                        <ActivityIndicator size="large" color="#FFFFFF" />
                        <AppText style={styles.deletingText}>Deleting account...</AppText>
                    </View>
                )}

                {/* Modals */}
                <FeedbackModal visible={showFeedback} onClose={() => setShowFeedback(false)} />
                <IdeaBoardModal visible={showIdeaBoard} onClose={() => setShowIdeaBoard(false)} />
                <PaywallModal ref={paywallRef} />
            </SafeAreaView>
        </SceneTransition>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0B',
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 8,
    },
    title: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 28,
        color: '#FFFFFF',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    group: {
        marginBottom: 32,
    },
    groupTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 12,
        color: '#A1A1AA',
        marginBottom: 8,
        marginLeft: 4,
        letterSpacing: 0.5,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        borderWidth: 1,
        borderColor: '#28282A',
        borderRadius: 16,
        padding: 16,
        marginBottom: 32,
    },
    profileAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#28282A',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    profileInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    profileName: {
        fontFamily: 'Inter_700Bold',
        fontSize: 17,
        color: '#FFFFFF',
    },
    profileEmail: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: '#A1A1AA',
        marginTop: 2,
    },
    profileProvider: {
        fontFamily: 'Inter_400Regular',
        fontSize: 11,
        color: '#52525B',
        marginTop: 4,
    },
    editNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    editNameInput: {
        flex: 1,
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        color: '#FFFFFF',
        backgroundColor: '#28282A',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#3E63DD',
    },
    saveNameButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    saveNameText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: '#3E63DD',
    },
    deletingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    deletingText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Inter_500Medium',
    },
    versionLabel: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#52525B',
        textAlign: 'center',
        marginTop: 8,
    },
});
