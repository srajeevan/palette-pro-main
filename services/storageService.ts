import { supabase } from '@/lib/supabase';
import { Alert } from 'react-native';

/**
 * Uploads a local image file to Cloudflare R2 via a presigned URL.
 *
 * Flow:
 *   1. Call the `get-r2-upload-url` Edge Function (auth-gated) to get
 *      a short-lived presigned PUT URL + the final public URL.
 *   2. PUT the image bytes directly to R2.
 *   3. Return the public URL to store in `palettes.image_url`.
 *
 * The caller is expected to pass a LOCAL file URI that is already a JPEG
 * (see useImagePicker — it converts + resizes before calling this).
 *
 * Returns null on any failure and surfaces a user-visible alert.
 */
export async function uploadReferenceImageToR2(uri: string): Promise<string | null> {
    try {
        console.log('☁️ [R2] Starting upload for', uri);

        // Step 1: Ask the Edge Function for a presigned URL.
        const { data: signed, error: fnError } = await supabase.functions.invoke(
            'get-r2-upload-url',
            { body: {} },
        );

        if (fnError || !signed?.uploadUrl || !signed?.publicUrl) {
            // supabase-js wraps non-2xx responses in FunctionsHttpError whose
            // `.context` is the Response. Pull the real body so we can see why.
            let detail = '';
            try {
                const ctx: any = (fnError as any)?.context;
                if (ctx && typeof ctx.json === 'function') {
                    const body = await ctx.clone().json();
                    detail = body?.error || JSON.stringify(body);
                } else if (ctx && typeof ctx.text === 'function') {
                    detail = await ctx.clone().text();
                }
            } catch {
                // ignore — fall back to fnError.message
            }
            console.error('[R2] Failed to get presigned URL:', {
                fnError,
                signed,
                detail,
            });
            Alert.alert(
                'Upload Error',
                detail || fnError?.message || 'Could not get an upload URL. Please try again.',
            );
            return null;
        }

        const { uploadUrl, publicUrl } = signed as {
            uploadUrl: string;
            publicUrl: string;
            key: string;
        };

        // Step 2: Read the local file into an ArrayBuffer.
        // (RN fetch → blob → arrayBuffer avoids the 0-byte upload bug.)
        const fileResp = await fetch(uri);
        const blob = await fileResp.blob();
        const arrayBuffer = await new Response(blob).arrayBuffer();
        console.log('[R2] File size:', arrayBuffer.byteLength, 'bytes');

        // Step 3: PUT the bytes to R2 using the presigned URL.
        const putResp = await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'image/jpeg' },
            body: arrayBuffer,
        });

        if (!putResp.ok) {
            const text = await putResp.text().catch(() => '');
            console.error('[R2] PUT failed:', putResp.status, text);
            Alert.alert('Upload Error', `Upload failed (${putResp.status}).`);
            return null;
        }

        console.log('[R2] Upload success:', publicUrl);
        return publicUrl;
    } catch (error: any) {
        console.error('[R2] Upload exception:', error);
        Alert.alert('Upload Failed', error?.message || 'Unexpected upload error.');
        return null;
    }
}

