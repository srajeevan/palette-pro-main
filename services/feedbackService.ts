import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

interface SubmitFeedbackInput {
    category: 'bug' | 'feedback' | 'other';
    message: string;
}

export async function submitFeedback({ category, message }: SubmitFeedbackInput): Promise<{ success: boolean; error: string | null }> {
    try {
        const { data, error } = await supabase.functions.invoke('submit-feedback', {
            body: {
                category,
                message,
                appVersion: Constants.expoConfig?.version || 'unknown',
                deviceInfo: {
                    os: Platform.OS,
                    version: Platform.Version,
                },
            },
        });

        if (error) {
            console.error('Submit feedback error:', error);
            return { success: false, error: error.message };
        }

        return { success: true, error: null };
    } catch (err: any) {
        console.error('Unexpected feedback error:', err);
        return { success: false, error: err.message || 'Something went wrong' };
    }
}
