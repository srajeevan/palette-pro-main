import { AppText } from '@/components/AppText';
import { IdeaCard } from '@/components/IdeaCard';
import { SubmitIdeaModal } from '@/components/SubmitIdeaModal';
import { useAuth } from '@/context/AuthContext';
import {
    FeatureRequest,
    getUserVotes,
    loadApprovedRequests,
    loadMyRequests,
    toggleVote,
} from '@/services/featureRequestService';
import { trackEvent } from '@/services/analytics';
import { showToast } from '@/utils/toast';
import { Lightbulb, Plus, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, SlideInUp } from 'react-native-reanimated';

interface IdeaBoardModalProps {
    visible: boolean;
    onClose: () => void;
}

type SortMode = 'votes' | 'recent';

export const IdeaBoardModal = ({ visible, onClose }: IdeaBoardModalProps) => {
    const { isGuest, user } = useAuth();
    const [ideas, setIdeas] = useState<FeatureRequest[]>([]);
    const [myIdeas, setMyIdeas] = useState<FeatureRequest[]>([]);
    const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
    const [sortBy, setSortBy] = useState<SortMode>('votes');
    const [refreshing, setRefreshing] = useState(false);
    const [showSubmit, setShowSubmit] = useState(false);

    const fetchData = useCallback(async () => {
        const [approvedResult, votesResult] = await Promise.all([
            loadApprovedRequests(sortBy),
            getUserVotes(),
        ]);

        if (approvedResult.data) setIdeas(approvedResult.data);
        setVotedIds(votesResult);

        if (user) {
            const myResult = await loadMyRequests();
            if (myResult.data) {
                // Filter to non-approved items (pending/rejected) that aren't in the approved list
                setMyIdeas(myResult.data.filter((r) => r.status !== 'approved'));
            }
        }
    }, [sortBy, user]);

    useEffect(() => {
        if (visible) fetchData();
    }, [visible, fetchData]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const handleVote = async (id: string) => {
        if (isGuest) {
            showToast('Sign in to participate');
            return;
        }

        const { voted, error } = await toggleVote(id);
        if (error) {
            showToast('Failed to vote');
            return;
        }

        trackEvent('feature_request_voted', { feature_request_id: id, voted });

        // Optimistic update
        setVotedIds((prev) => {
            const next = new Set(prev);
            if (voted) next.add(id);
            else next.delete(id);
            return next;
        });
        setIdeas((prev) =>
            prev.map((item) =>
                item.id === id
                    ? { ...item, vote_count: item.vote_count + (voted ? 1 : -1) }
                    : item
            )
        );
    };

    const handleSuggest = () => {
        if (isGuest) {
            showToast('Sign in to participate');
            return;
        }
        setShowSubmit(true);
    };

    const renderItem = ({ item }: { item: FeatureRequest }) => (
        <IdeaCard item={item} hasVoted={votedIds.has(item.id)} onVote={handleVote} />
    );

    const renderHeader = () => (
        <>
            {/* My Ideas (pending/rejected) */}
            {myIdeas.length > 0 && (
                <View style={styles.myIdeasSection}>
                    <AppText style={styles.sectionTitle}>MY IDEAS</AppText>
                    {myIdeas.map((item) => (
                        <IdeaCard
                            key={item.id}
                            item={item}
                            hasVoted={votedIds.has(item.id)}
                            onVote={handleVote}
                        />
                    ))}
                </View>
            )}

            {/* Sort Toggle */}
            <View style={styles.sortRow}>
                <AppText style={styles.sectionTitle}>COMMUNITY IDEAS</AppText>
                <View style={styles.sortToggle}>
                    <Pressable
                        onPress={() => setSortBy('votes')}
                        style={[styles.sortButton, sortBy === 'votes' && styles.sortButtonActive]}
                    >
                        <AppText style={[styles.sortText, sortBy === 'votes' && styles.sortTextActive]}>
                            Top Voted
                        </AppText>
                    </Pressable>
                    <Pressable
                        onPress={() => setSortBy('recent')}
                        style={[styles.sortButton, sortBy === 'recent' && styles.sortButtonActive]}
                    >
                        <AppText style={[styles.sortText, sortBy === 'recent' && styles.sortTextActive]}>
                            Most Recent
                        </AppText>
                    </Pressable>
                </View>
            </View>
        </>
    );

    const renderEmpty = () => (
        <View style={styles.emptyState}>
            <Lightbulb size={40} color="#52525B" />
            <AppText style={styles.emptyText}>No ideas yet. Be the first to suggest a feature!</AppText>
        </View>
    );

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
                            <AppText style={styles.title}>Feature Requests</AppText>
                            <View style={styles.headerActions}>
                                <Pressable onPress={handleSuggest} style={styles.suggestButton}>
                                    <Plus size={16} color="#FFFFFF" />
                                    <AppText style={styles.suggestText}>Suggest</AppText>
                                </Pressable>
                                <Pressable onPress={onClose} hitSlop={12}>
                                    <X size={24} color="#A1A1AA" />
                                </Pressable>
                            </View>
                        </View>
                    </View>

                    <FlatList
                        data={ideas}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        ListHeaderComponent={renderHeader}
                        ListEmptyComponent={renderEmpty}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                                tintColor="#A1A1AA"
                            />
                        }
                        showsVerticalScrollIndicator={false}
                    />
                </Animated.View>

                {/* Submit Idea Modal */}
                <SubmitIdeaModal
                    visible={showSubmit}
                    onClose={() => setShowSubmit(false)}
                    onSuccess={fetchData}
                />
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
        height: '85%',
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
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    title: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 28, color: '#FFFFFF',
    },
    suggestButton: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#3E63DD', borderRadius: 20,
        paddingHorizontal: 14, paddingVertical: 8,
    },
    suggestText: {
        fontFamily: 'Inter_500Medium', fontSize: 14, color: '#FFFFFF',
    },
    listContent: { paddingHorizontal: 20, paddingBottom: 40 },
    myIdeasSection: { marginBottom: 20 },
    sectionTitle: {
        fontFamily: 'Inter_700Bold', fontSize: 12,
        color: '#A1A1AA', marginBottom: 10, letterSpacing: 0.5,
    },
    sortRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 12,
    },
    sortToggle: {
        flexDirection: 'row', backgroundColor: '#1C1C1E',
        borderRadius: 8, borderWidth: 1, borderColor: '#28282A',
    },
    sortButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 7 },
    sortButtonActive: { backgroundColor: '#28282A' },
    sortText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: '#52525B' },
    sortTextActive: { color: '#FFFFFF' },
    emptyState: {
        alignItems: 'center', justifyContent: 'center',
        paddingVertical: 60, gap: 16,
    },
    emptyText: {
        fontFamily: 'Inter_500Medium', fontSize: 15,
        color: '#52525B', textAlign: 'center', paddingHorizontal: 20,
    },
});
