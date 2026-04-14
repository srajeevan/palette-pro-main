import { supabase } from '@/lib/supabase';
import { isVersionLessThan } from '@/utils/semver';
import Constants from 'expo-constants';

export type UpdateType = 'feature' | 'minor';

export interface UpdateInfo {
    updateAvailable: boolean;
    latestVersion: string;
    storeUrl: string;
    updateMessage: string;
    type: UpdateType;
    features: string[];
}

export async function checkForUpdate(): Promise<UpdateInfo | null> {
    try {
        const currentVersion = Constants.expoConfig?.version;
        if (!currentVersion) return null;

        const { data, error } = await supabase
            .from('app_config')
            .select('value')
            .eq('key', 'latest_version')
            .single();

        if (error || !data) return null;

        const config = data.value as {
            version: string;
            min_version: string;
            store_url_ios: string;
            update_message: string;
            type?: UpdateType;
            features?: string[];
        };

        if (!isVersionLessThan(currentVersion, config.version)) {
            return null;
        }

        return {
            updateAvailable: true,
            latestVersion: config.version,
            storeUrl: config.store_url_ios,
            updateMessage: config.update_message,
            type: config.type || 'minor',
            features: config.features || [],
        };
    } catch (err) {
        console.error('Update check failed:', err);
        return null;
    }
}
