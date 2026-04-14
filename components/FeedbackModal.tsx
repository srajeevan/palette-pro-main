import { AppText } from '@/components/AppText';
import { useAuth } from '@/context/AuthContext';
import { submitFeedback } from '@/services/feedbackService';
import { trackEvent } from '@/services/analytics';
import { showToast } from '@/utils/toast';
import { X } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { Easing, FadeIn, SlideInUp } from 'react-native-reanimated';

interface FeedbackModalProps {
    visible: boolean;
    onClose: () => void;
}

type Category = 'bug' | 'feedback' | 'other';

const CATEGORIES: { key: Category; label: string }[] = [
    { key: 'bug', label: 'Bug Report' },
    { key: 'feedback', label: 'Feedback' },
    { key: 'other', label: 'Other' },
];

export const FeedbackModal = ({ visible, onClose }: FeedbackModalProps) => {
    const { isGuest } = useAuth();
    const [category, setCategory] = useState<Category>('feedback');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!message.trim()) {
            showToast('Please enter a message');
            return;
        }

        setSubmitting(true);
        const { success, error } = await submitFeedback({ category, message: message.trim() });
        setSubmitting(false);

        if (success) {
            trackEvent('feedback_submitted', { category });
            showToast('Thanks for your feedback!');
            setMessage('');
            setCategory('feedback');
            onClose();
        } else {
            showToast(error || 'Failed to submit feedback');
        }
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <View style={styles.overlayContainer}>
                <Pressable style={styles.backdrop} onPress={onClose}>
                    <Animated.View entering={FadeIn.duration(200)} style={styles.dimmedLayer} />
                </Pressable>

                <Animated.View
                    entering={SlideInUp.duration(350).easing(Easing.out(Easing.cubic))}
                    style={styles.sheet}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.dragHandle} />
                        <View style={styles.headerRow}>
                            <AppText style={styles.title}>Send Feedback</AppText>
                            <Pressable onPress={onClose} hitSlop={12}>
                                <X size={24} color="#A1A1AA" />
                            </Pressable>
                        </View>
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                        {/* Category Pills */}
                        <View style={styles.pillRow}>
                            {CATEGORIES.map((cat) => (
                                <Pressable
                                    key={cat.key}
                                    onPress={() => setCategory(cat.key)}
                                    style={[
                                        styles.pill,
                                        category === cat.key && styles.pillActive,
                                    ]}
                                >
                                    <AppText
                                        style={[
                                            styles.pillText,
                                            category === cat.key && styles.pillTextActive,
                                        ]}
                                    >
                                        {cat.label}
                                    </AppText>
                                </Pressable>
                            ))}
                        </View>

                        {/* Message Input */}
                        <TextInput
                            style={styles.textInput}
                            placeholder="Tell us what's on your mind..."
                            placeholderTextColor="#52525B"
                            multiline
                            textAlignVertical="top"
                            value={message}
                            onChangeText={setMessage}
                            maxLength={2000}
                        />

                        {/* Guest Notice */}
                        {isGuest && (
                            <AppText style={styles.guestNotice}>
                                Submitting as Guest — we won't be able to reply
                            </AppText>
                        )}

                        {/* Submit Button */}
                        <Pressable
                            onPress={handleSubmit}
                            disabled={submitting || !message.trim()}
                            style={[
                                styles.submitButton,
                                (!message.trim() || submitting) && styles.submitButtonDisabled,
                            ]}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <AppText style={styles.submitText}>Submit</AppText>
                            )}
                        </Pressable>
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlayContainer: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject },
    dimmedLayer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
    sheet: {
        backgroundColor: '#161618',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '75%',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#28282A',
    },
    header: { alignItems: 'center', paddingBottom: 4 },
    dragHandle: {
        width: 40, height: 5, borderRadius: 2.5,
        backgroundColor: '#3F3F46', marginBottom: 20,
    },
    headerRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', width: '100%', paddingHorizontal: 20,
        marginBottom: 16,
    },
    title: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 28, color: '#FFFFFF',
    },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    pillRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    pill: {
        paddingHorizontal: 16, paddingVertical: 10,
        borderRadius: 20, backgroundColor: '#1C1C1E',
        borderWidth: 1, borderColor: '#28282A',
    },
    pillActive: { backgroundColor: '#3E63DD', borderColor: '#3E63DD' },
    pillText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: '#A1A1AA' },
    pillTextActive: { color: '#FFFFFF' },
    textInput: {
        backgroundColor: '#1C1C1E', borderWidth: 1, borderColor: '#28282A',
        borderRadius: 12, padding: 16, color: '#FFFFFF',
        fontFamily: 'Inter_400Regular', fontSize: 16,
        minHeight: 160, marginBottom: 16,
    },
    guestNotice: {
        fontFamily: 'Inter_400Regular', fontSize: 13,
        color: '#71717A', marginBottom: 16,
    },
    submitButton: {
        backgroundColor: '#3E63DD', borderRadius: 12,
        paddingVertical: 16, alignItems: 'center',
    },
    submitButtonDisabled: { opacity: 0.5 },
    submitText: {
        fontFamily: 'Inter_700Bold', fontSize: 16, color: '#FFFFFF',
    },
});
