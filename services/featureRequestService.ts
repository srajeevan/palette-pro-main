import { supabase } from '@/lib/supabase';

export interface FeatureRequest {
    id: string;
    user_id: string | null;
    title: string;
    description: string;
    status: 'pending' | 'approved' | 'rejected';
    vote_count: number;
    dev_response: string | null;
    dev_response_at: string | null;
    created_at: string;
    updated_at: string;
}

export async function submitFeatureRequest({ title, description }: { title: string; description: string }): Promise<{ success: boolean; error: string | null }> {
    try {
        const { error } = await supabase.functions.invoke('submit-feature-request', {
            body: { title, description },
        });

        if (error) {
            console.error('Submit feature request error:', error);
            return { success: false, error: error.message };
        }

        return { success: true, error: null };
    } catch (err: any) {
        console.error('Unexpected feature request error:', err);
        return { success: false, error: err.message || 'Something went wrong' };
    }
}

export async function loadApprovedRequests(sortBy: 'votes' | 'recent' = 'votes'): Promise<{ data: FeatureRequest[] | null; error: string | null }> {
    try {
        const orderColumn = sortBy === 'votes' ? 'vote_count' : 'created_at';

        const { data, error } = await supabase
            .from('feature_requests')
            .select('*')
            .eq('status', 'approved')
            .order(orderColumn, { ascending: false });

        if (error) {
            return { data: null, error: error.message };
        }

        return { data, error: null };
    } catch (err: any) {
        return { data: null, error: err.message };
    }
}

export async function loadMyRequests(): Promise<{ data: FeatureRequest[] | null; error: string | null }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { data: null, error: 'Not authenticated' };

        const { data, error } = await supabase
            .from('feature_requests')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            return { data: null, error: error.message };
        }

        return { data, error: null };
    } catch (err: any) {
        return { data: null, error: err.message };
    }
}

export async function toggleVote(featureRequestId: string): Promise<{ voted: boolean; error: string | null }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { voted: false, error: 'Not authenticated' };

        // Check if vote exists
        const { data: existing } = await supabase
            .from('feature_request_votes')
            .select('id')
            .eq('feature_request_id', featureRequestId)
            .eq('user_id', user.id)
            .maybeSingle();

        if (existing) {
            // Un-vote
            const { error } = await supabase
                .from('feature_request_votes')
                .delete()
                .eq('id', existing.id);

            if (error) return { voted: false, error: error.message };
            return { voted: false, error: null };
        } else {
            // Vote
            const { error } = await supabase
                .from('feature_request_votes')
                .insert({ feature_request_id: featureRequestId, user_id: user.id });

            if (error) return { voted: false, error: error.message };
            return { voted: true, error: null };
        }
    } catch (err: any) {
        return { voted: false, error: err.message };
    }
}

export async function getUserVotes(): Promise<Set<string>> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return new Set();

        const { data } = await supabase
            .from('feature_request_votes')
            .select('feature_request_id')
            .eq('user_id', user.id);

        return new Set((data || []).map((v: any) => v.feature_request_id));
    } catch {
        return new Set();
    }
}
