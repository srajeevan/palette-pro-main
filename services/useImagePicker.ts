import { useProjectStore } from '@/store/useProjectStore';
import { showToast } from '@/utils/toast';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

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
     * Convert to JPEG at full quality, no resize.
     *
     * We convert to JPEG for format consistency (iPhones default to HEIC,
     * which not all platforms can render), but we do NOT compress or resize
     * because this app's core functionality depends on image quality and
     * accurate color data.
     *
     * Upload happens later, on save — not here. This prevents orphaned
     * uploads from users who pick an image but never save.
     */
    const processImage = async (uri: string, width: number, height: number) => {
        setUploading(true);
        try {
            console.log(`🖼️ Processing image: ${width}x${height} (JPEG conversion, no resize)`);

            const manipResult = await manipulateAsync(
                uri,
                [], // No resize or transform — keep original dimensions
                { compress: 1, format: SaveFormat.JPEG },
            );
            const jpegUri = manipResult.uri;
            console.log('✅ Conversion done:', jpegUri);

            setImage(jpegUri, {
                width: manipResult.width ?? width,
                height: manipResult.height ?? height,
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
