import { useAuth } from '@/context/AuthContext';
import { usePro } from '@/context/ProContext';
import { getPaletteCount, SaveType, savePalette } from '@/services/paletteService';
import { uploadReferenceImageToR2 } from '@/services/storageService';
import { useProjectStore } from '@/store/useProjectStore';
import { showToast } from '@/utils/toast';
import { File, Paths } from 'expo-file-system';
import { useRef, useState } from 'react';
import { Alert, View } from 'react-native';

// Lazy import to avoid crash if native module isn't linked yet
let captureRef: ((ref: any, options: any) => Promise<string>) | null = null;
try {
    captureRef = require('react-native-view-shot').captureRef;
} catch {
    console.warn('[useImageSave] react-native-view-shot not available');
}

interface UseImageSaveOptions {
    type: SaveType;
    getEffects: () => Record<string, any> | null;
    onUpgradeNeeded?: () => void;
    /** Skia canvas ref that exposes makeImageSnapshotAsync for GPU-rendered canvases */
    skiaCanvasRef?: React.RefObject<{ makeImageSnapshot: () => any; makeImageSnapshotAsync?: () => Promise<any> } | null>;
}

export function useImageSave({ type, getEffects, onUpgradeNeeded, skiaCanvasRef }: UseImageSaveOptions) {
    const { user } = useAuth();
    const { isPro } = usePro();
    const imageUri = useProjectStore((s) => s.imageUri);
    const [isSaving, setIsSaving] = useState(false);
    const thumbnailRef = useRef<View>(null);

    const captureThumbnail = async (): Promise<string | null> => {
        // Strategy 1: Skia canvas snapshot (for SquintCanvas, ValueMapCanvas)
        if (skiaCanvasRef?.current) {
            try {
                console.log('[useImageSave] Skia ref available, attempting snapshot...');
                let skImage = null;

                // Prefer async version — it waits for the current frame to finish drawing
                if (skiaCanvasRef.current.makeImageSnapshotAsync) {
                    console.log('[useImageSave] Using makeImageSnapshotAsync...');
                    skImage = await skiaCanvasRef.current.makeImageSnapshotAsync();
                } else {
                    console.log('[useImageSave] Using sync makeImageSnapshot...');
                    skImage = skiaCanvasRef.current.makeImageSnapshot();
                }

                console.log('[useImageSave] skImage result:', skImage ? `${skImage.width()}x${skImage.height()}` : 'null');

                if (skImage) {
                    // Encode as JPEG with 80% quality for smaller file size
                    // ImageFormat: 3 = JPEG in Skia's enum
                    const base64 = skImage.encodeToBase64(3, 80);
                    console.log('[useImageSave] base64 length:', base64?.length ?? 0);

                    if (base64 && base64.length > 100) {
                        const tempFile = new File(Paths.cache, `thumbnail_${Date.now()}.jpg`);
                        tempFile.write(base64, { encoding: 'base64' });
                        const tempPath = tempFile.uri;
                        console.log('[useImageSave] Temp file written:', tempPath);

                        const publicUrl = await uploadReferenceImageToR2(tempPath);
                        console.log('[useImageSave] Thumbnail uploaded:', publicUrl);
                        return publicUrl;
                    } else {
                        console.warn('[useImageSave] base64 encoding returned empty/tiny result');
                    }
                } else {
                    console.warn('[useImageSave] Skia snapshot returned null');
                }
            } catch (e) {
                console.error('[useImageSave] Skia snapshot error:', e);
            }
        } else {
            console.log('[useImageSave] No skiaCanvasRef available');
        }

        // Strategy 2: react-native-view-shot (for Studio with ExpoImage + grid overlay)
        if (thumbnailRef.current && captureRef) {
            try {
                console.log('[useImageSave] Using captureRef fallback...');
                const thumbUri = await captureRef(thumbnailRef, {
                    format: 'jpg',
                    quality: 0.7,
                });
                const fileUri = thumbUri.startsWith('file://') ? thumbUri : `file://${thumbUri}`;
                console.log('[useImageSave] View captured:', fileUri);
                const publicUrl = await uploadReferenceImageToR2(fileUri);
                console.log('[useImageSave] View thumbnail uploaded:', publicUrl);
                return publicUrl;
            } catch (e) {
                console.warn('[useImageSave] captureRef failed:', e);
            }
        }

        console.warn('[useImageSave] No thumbnail capture method succeeded');
        return null;
    };

    const save = async () => {
        if (!user) {
            showToast('Sign in to save your work!');
            return;
        }

        if (!imageUri) {
            showToast('No image to save.');
            return;
        }

        // Gating: free limit check
        if (!isPro) {
            setIsSaving(true);
            const count = await getPaletteCount();
            setIsSaving(false);

            if (count >= 3) {
                Alert.alert(
                    'Free Limit Reached',
                    'You can save up to 3 items on the free plan. Upgrade to Pro for unlimited saves.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Upgrade',
                            onPress: () => {
                                setTimeout(() => onUpgradeNeeded?.(), 200);
                            },
                        },
                    ]
                );
                return;
            }
        }

        // Pro limit: 100 saves
        if (isPro) {
            setIsSaving(true);
            const count = await getPaletteCount();
            setIsSaving(false);

            if (count >= 100) {
                Alert.alert('Save Limit', 'You have reached the maximum of 100 saves.');
                return;
            }
        }

        Alert.prompt(
            'Save Image',
            'Enter a name for this save:',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Save',
                    onPress: async (name?: string) => {
                        if (!name || name.trim() === '') {
                            Alert.alert('Invalid Name', 'Please enter a valid name.');
                            return;
                        }

                        setIsSaving(true);
                        try {
                            // 1. Upload original image (or reuse if already remote)
                            let uploadedImageUrl = imageUri;
                            if (imageUri.startsWith('http')) {
                                console.log('[useImageSave] Image already remote, skipping upload.');
                            } else {
                                console.log('[useImageSave] Uploading original image to R2...');
                                const publicUrl = await uploadReferenceImageToR2(imageUri);
                                if (!publicUrl) {
                                    setIsSaving(false);
                                    return;
                                }
                                uploadedImageUrl = publicUrl;
                            }

                            // 2. Capture thumbnail with effects applied
                            console.log('[useImageSave] Starting thumbnail capture...');
                            const thumbnailUrl = await captureThumbnail();
                            console.log('[useImageSave] Thumbnail result:', thumbnailUrl ?? 'NONE');

                            // 3. Save to DB with effects + thumbnail
                            const effects = {
                                ...(getEffects() ?? {}),
                                ...(thumbnailUrl ? { thumbnail_url: thumbnailUrl } : {}),
                            };
                            const hasEffects = Object.keys(effects).length > 0;

                            console.log('[useImageSave] Saving to DB...', { type, hasEffects, hasThumbnail: !!thumbnailUrl });
                            const { error } = await savePalette({
                                name: name.trim(),
                                colors: null,
                                image_url: uploadedImageUrl,
                                type,
                                effects: hasEffects ? effects : null,
                            });

                            if (error) {
                                console.error('[useImageSave] DB error:', error);
                                showToast(error.message || 'Save failed. Try again.');
                            } else {
                                console.log('[useImageSave] Saved successfully!');
                                showToast(`"${name.trim()}" saved to Home`);
                            }
                        } catch (e: any) {
                            console.error('[useImageSave] Error:', e);
                            showToast('Unexpected error. Try again.');
                        } finally {
                            setIsSaving(false);
                        }
                    },
                },
            ],
            'plain-text',
            '',
            'default'
        );
    };

    return { thumbnailRef, isSaving, save };
}
