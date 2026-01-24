import { useAuth } from '@/context/AuthContext';
import { useProjectStore } from '@/store/useProjectStore';
import { showToast } from '@/utils/toast';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { uploadReferenceImage } from './storageService';

export const useImagePicker = () => {
    const { setImage, setUploading } = useProjectStore();
    const { user } = useAuth();

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

    const processImage = async (uri: string, width: number, height: number) => {
        setUploading(true); // Show loading spinner during conversion + upload
        try {
            // 1. Convert to JPEG (fixes HEIC/Skia crash)
            console.log('🖼️ Converting image to JPEG...');
            const manipResult = await manipulateAsync(
                uri,
                [], // No actions (resize/crop), just format conversion
                { compress: 0.8, format: SaveFormat.JPEG }
            );
            const jpegUri = manipResult.uri;
            console.log('✅ Conversion done:', jpegUri);

            // 2. Upload if user is logged in
            if (user) {
                const publicUrl = await uploadReferenceImage(jpegUri, user.id);

                if (publicUrl) {
                    setImage(publicUrl, { width, height });
                    return publicUrl;
                }
            }

            // Fallback (Guest or Upload Failed): Use the converted local JPEG
            setImage(jpegUri, { width, height });
            return jpegUri;

        } catch (error) {
            console.error('❌ Error processing image:', error);
            showToast("Failed to process image. Please try again.");
            // Last resort fallback
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
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false, // Disable cropping to allow full image
                quality: 0.7,
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
                allowsEditing: false,
                quality: 0.7,
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
