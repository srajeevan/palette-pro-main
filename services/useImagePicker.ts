import { useAuth } from '@/context/AuthContext';
import { useProjectStore } from '@/store/useProjectStore';
import { showToast } from '@/utils/toast';
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
        try {
            if (user) {
                setUploading(true);
                const publicUrl = await uploadReferenceImage(uri, user.id);
                setUploading(false);

                if (publicUrl) {
                    setImage(publicUrl, { width, height });
                    return publicUrl;
                }
            }

            // Fallback to local URI if guest or upload failed (but generally should handle error better)
            setImage(uri, { width, height });
            return uri;
        } catch (error) {
            console.error('Error processing image:', error);
            setUploading(false);
            setImage(uri, { width, height }); // Fallback
            return uri;
        }
    };

    const pickImage = async () => {
        const hasPermission = await verifyPermissions();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false, // Disable cropping to allow full image
                quality: 1,
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
                quality: 1,
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
