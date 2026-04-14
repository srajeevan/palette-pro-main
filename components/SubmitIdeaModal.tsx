import { AppText } from '@/components/AppText';
import { submitFeatureRequest } from '@/services/featureRequestService';
import { trackEvent } from '@/services/analytics';
import { showToast } from '@/utils/toast';
import { containsBadWords } from '@/utils/wordFilter';
import { X } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { Easing, FadeIn, SlideInUp } from 'react-native-reanimated';

interface SubmitIdeaModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const TITLE_MAX = 80;
const DESC_MAX = 500;

export const SubmitIdeaModal = ({ visible, onClose, onSuccess }: SubmitIdeaModalProps) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        const trimmedTitle = title.trim();
        const trimmedDesc = description.trim();

        if (!trimmedTitle || !trimmedDesc) {
            showToast('Please fill in both fields');
            return;
        }

        if (containsBadWords(trimmedTitle) || containsBadWords(trimmedDesc)) {
            showToast('Please remove inappropriate language');
            return;
        }

        setSubmitting(true);
        const { success, error } = await submitFeatureRequest({
            title: trimmedTitle,
            description: trimmedDesc,
        });
        setSubmitting(false);

        if (success) {
            trackEvent('feature_request_submitted');
            showToast("Idea submitted! It'll appear after review.");
            setTitle('');
            setDescription('');
            onSuccess();
            onClose();
        } else {
            showToast(error || 'Failed to submit idea');
        }
    };

    if (!visible) return null;

    const canSubmit = title.trim().length > 0 && description.trim().length > 0 && !submitting;

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
                    <View style={styles.header}>
                        <View style={styles.dragHandle} />
                        <View style={styles.headerRow}>
                            <AppText style={styles.title}>Suggest an Idea</AppText>
                            <Pressable onPress={onClose} hitSlop={12}>
                                <X size={24} color="#A1A1AA" />
                            </Pressable>
                        </View>
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                        {/* Title Input */}
                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <AppText style={styles.label}>Title</AppText>
                                <AppText style={styles.counter}>{title.length}/{TITLE_MAX}</AppText>
                            </View>
                            <TextInput
                                style={styles.textInput}
                                placeholder="A short, descriptive title"
                                placeholderTextColor="#52525B"
                                value={title}
                                onChangeText={setTitle}
                                maxLength={TITLE_MAX}
                            />
                        </View>

                        {/* Description Input */}
                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <AppText style={styles.label}>Description</AppText>
                                <AppText style={styles.counter}>{description.length}/{DESC_MAX}</AppText>
                            </View>
                            <TextInput
                                style={[styles.textInput, styles.textArea]}
                                placeholder="Describe your idea in detail..."
                                placeholderTextColor="#52525B"
                                multiline
                                textAlignVertical="top"
                                value={description}
                                onChangeText={setDescription}
                                maxLength={DESC_MAX}
                            />
                        </View>

                        {/* Submit Button */}
                        <Pressable
                            onPress={handleSubmit}
                            disabled={!canSubmit}
                            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <AppText style={styles.submitText}>Submit Idea</AppText>
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
        height: '70%',
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
        fontSize: 24, color: '#FFFFFF',
    },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    inputGroup: { marginBottom: 20 },
    labelRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 8,
    },
    label: {
        fontFamily: 'Inter_500Medium', fontSize: 14, color: '#A1A1AA',
    },
    counter: {
        fontFamily: 'Inter_400Regular', fontSize: 12, color: '#52525B',
    },
    textInput: {
        backgroundColor: '#1C1C1E', borderWidth: 1, borderColor: '#28282A',
        borderRadius: 12, padding: 14, color: '#FFFFFF',
        fontFamily: 'Inter_400Regular', fontSize: 16,
    },
    textArea: { minHeight: 120 },
    submitButton: {
        backgroundColor: '#3E63DD', borderRadius: 12,
        paddingVertical: 16, alignItems: 'center', marginTop: 8,
    },
    submitButtonDisabled: { opacity: 0.5 },
    submitText: {
        fontFamily: 'Inter_700Bold', fontSize: 16, color: '#FFFFFF',
    },
});
