import { useProjectStore } from '@/store/useProjectStore';
import { showToast } from '@/utils/toast';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

// Max dimension (long edge) after resize. Balances quality vs storage/upload cost.
// A 4000x3000 iPhone photo → 1600x1200 at q=0.8 is typically ~200-400 KB.
const MAX_IMAGE_EDGE = 1600;

export const useImagePicker = () => {
    const { setImage, setUploading } = useProjectStore();

    const verifyPermissions = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showToast("This app has no eyes! 👀 Allow camera roll access in settings.");
            return false;
        }
        return true;
    };

    const verifyCameraPermissions = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            showToast("Camera access denied. We can't see a thing! 🙈");
            return false;
        }
        return true;
    };

    /**
     * Convert to JPEG + resize to MAX_IMAGE_EDGE on the long side.
     *
     * Note: we NO LONGER upload here. The image is kept as a local file until
     * the user explicitly saves the palette. This prevents orphaned uploads
     * from users who pick an image but never save.
     */
    const processImage = async (uri: string, width: number, height: number) => {
        setUploading(true); // Show spinner during conversion
        try {
            // Calculate resize target so the longer edge = MAX_IMAGE_EDGE.
            // Only shrink, never upscale.
            const longEdge = Math.max(width, height);
            const scale = longEdge > MAX_IMAGE_EDGE ? MAX_IMAGE_EDGE / longEdge : 1;
            const targetWidth = Math.round(width * scale);
            const targetHeight = Math.round(height * scale);

            const actions = scale < 1
                ? [{ resize: { width: targetWidth, height: targetHeight } }]
                : [];

            console.log(
                `🖼️ Processing image: ${width}x${height} → ${targetWidth}x${targetHeight} (scale ${scale.toFixed(2)})`,
            );

            const manipResult = await manipulateAsync(
                uri,
                actions,
                { compress: 0.8, format: SaveFormat.JPEG },
            );
            const jpegUri = manipResult.uri;
            console.log('✅ Conversion done:', jpegUri);

            // Store LOCAL URI only. Upload happens later, on save.
            setImage(jpegUri, {
                width: manipResult.width ?? targetWidth,
                height: manipResult.height ?? targetHeight,
            });
            return jpegUri;
        } catch (error) {
            console.error('❌ Error processing image:', error);
            showToast("Failed to process image. Please try again.");
            setImage(uri, { width, height });
            return uri;
        } finally {
            setUploading(false);
        }
    };

    const pickImage = async () => {
        const hasPermission = await verifyPermissions();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: false, // Disable cropping to allow full image
                quality: 1, // Full quality from picker; we compress in processImage
            });

            if (!result.canceled && result.assets[0]) {
                const { uri, width, height } = result.assets[0];
                return await processImage(uri, width, height);
            }
        } catch (error) {
            console.log('Error picking image:', error);
            showToast("That image is playing hard to get. Try another? 📸");
        }
        return null;
    };

    const takePhoto = async () => {
        const hasPermission = await verifyCameraPermissions();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 1, // Full quality from camera; we compress in processImage
            });

            if (!result.canceled && result.assets[0]) {
                const { uri, width, height } = result.assets[0];
                return await processImage(uri, width, height);
            }
        } catch (error) {
            console.log('Error taking photo:', error);
            showToast("Camera shy? Something went wrong taking the photo. 😬");
        }
        return null;
    };

    return {
        pickImage,
        takePhoto,
    };
};
