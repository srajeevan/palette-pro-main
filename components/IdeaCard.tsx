import { AppText } from '@/components/AppText';
import { useAuth } from '@/context/AuthContext';
import { FeatureRequest } from '@/services/featureRequestService';
import { ChevronUp } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

interface IdeaCardProps {
    item: FeatureRequest;
    hasVoted: boolean;
    onVote: (id: string) => void;
}

export const IdeaCard = ({ item, hasVoted, onVote }: IdeaCardProps) => {
    const { user } = useAuth();
    const isOwn = user?.id === item.user_id;

    return (
        <View style={styles.card}>
            {/* Vote Button */}
            <Pressable
                onPress={() => onVote(item.id)}
                style={styles.voteSection}
                hitSlop={8}
            >
                <ChevronUp size={20} color={hasVoted ? '#3E63DD' : '#52525B'} />
                <AppText style={[styles.voteCount, hasVoted && styles.voteCountActive]}>
                    {item.vote_count}
                </AppText>
            </Pressable>

            {/* Content */}
            <View style={styles.content}>
                <View style={styles.titleRow}>
                    <AppText style={styles.title} numberOfLines={2}>{item.title}</AppText>
                    {isOwn && (
                        <View style={styles.badge}>
                            <AppText style={styles.badgeText}>You</AppText>
                        </View>
                    )}
                    {isOwn && item.status === 'pending' && (
                        <View style={[styles.badge, styles.badgePending]}>
                            <AppText style={styles.badgeText}>Under Review</AppText>
                        </View>
                    )}
                </View>
                <AppText style={styles.description} numberOfLines={2}>
                    {item.description}
                </AppText>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: '#1C1C1E',
        borderWidth: 1,
        borderColor: '#28282A',
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
    },
    voteSection: {
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
        minWidth: 36,
    },
    voteCount: {
        fontFamily: 'Inter_700Bold',
        fontSize: 14,
        color: '#52525B',
        marginTop: 2,
    },
    voteCountActive: { color: '#3E63DD' },
    content: { flex: 1 },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 4,
    },
    title: {
        fontFamily: 'Inter_700Bold',
        fontSize: 15,
        color: '#FFFFFF',
        flexShrink: 1,
    },
    description: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: '#A1A1AA',
        lineHeight: 18,
    },
    badge: {
        backgroundColor: '#3E63DD',
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    badgePending: { backgroundColor: '#71717A' },
    badgeText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 11,
        color: '#FFFFFF',
    },
});
