import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';

export async function uploadReferenceImage(uri: string, userId: string): Promise<string | null> {
    try {
        const timestamp = new Date().getTime();
        const fileExtension = uri.split('.').pop();
        const path = `${userId}/${timestamp}.${fileExtension}`;

        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: 'base64',
        });

        const { data, error } = await supabase.storage
            .from('reference-images')
            .upload(path, decode(base64), {
                contentType: `image/${fileExtension}`,
                upsert: true,
            });

        if (error) {
            console.error('Supabase upload error:', error);
            throw error;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('reference-images')
            .getPublicUrl(path);

        return publicUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        return null;
    }
}
