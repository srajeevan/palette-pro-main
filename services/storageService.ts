import { supabase } from '@/lib/supabase';
import { Alert } from 'react-native';

export async function uploadReferenceImage(uri: string, userId: string): Promise<string | null> {
    try {
        console.log("---- STARTING UPLOAD ----");
        console.log("URI:", uri);

        const timestamp = new Date().getTime();
        const fileExtension = uri.split('.').pop();
        const path = `${userId}/${timestamp}.${fileExtension}`;

        // Step 1: Fetch
        console.log("Step 1: Fetching URI...");
        // Alert.alert("Debug", "Step 1: Fetching...");
        const response = await fetch(uri);
        console.log("Fetch Status:", response.status);

        // Step 2: Blob & Buffer
        console.log("Step 2: Creating Blob & Buffer...");
        const blob = await response.blob();
        console.log("Blob Size:", blob.size);

        // Convert Blob to ArrayBuffer (Fixes 0-byte upload bug on RN)
        const arrayBuffer = await new Response(blob).arrayBuffer();
        console.log("Buffer Size:", arrayBuffer.byteLength);

        // Step 3: Upload
        console.log("Step 3: Uploading to Supabase...");
        const { data, error } = await supabase.storage
            .from('reference-images')
            .upload(path, arrayBuffer, {
                contentType: `image/${fileExtension}`,
                upsert: true,
            });

        if (error) {
            console.error('Supabase upload error:', error);
            Alert.alert("Upload Error", error.message);
            throw error;
        }

        console.log("Upload Success:", data);
        // Alert.alert("Debug", "Upload Done!");

        const { data: { publicUrl } } = supabase.storage
            .from('reference-images')
            .getPublicUrl(path);

        console.log("Public URL:", publicUrl);
        return publicUrl;
    } catch (error: any) {
        console.error('Error uploading image:', error);
        Alert.alert("Upload Failed", error.message || JSON.stringify(error));
        return null;
    }
}
