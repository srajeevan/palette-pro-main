import { useAuth } from '@/context/AuthContext';
import { useProjectStore } from '@/store/useProjectStore';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { uploadReferenceImage } from './storageService';

export const useImagePicker = () => {
    const { setImage, setUploading } = useProjectStore();
    const { user } = useAuth();

    const verifyPermissions = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permission Denied',
                'Sorry, we need camera roll permissions to make this work!'
            );
            return false;
        }
        return true;
    };

    const verifyCameraPermissions = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permission Denied',
                'Sorry, we need camera permissions to make this work!'
            );
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
                allowsEditing: true, // Allow basic cropping/editing
                quality: 1,
            });

            if (!result.canceled && result.assets[0]) {
                const { uri, width, height } = result.assets[0];
                return await processImage(uri, width, height);
            }
        } catch (error) {
            console.log('Error picking image:', error);
            Alert.alert('Error', 'An error occurred while picking the image.');
        }
        return null;
    };

    const takePhoto = async () => {
        const hasPermission = await verifyCameraPermissions();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                quality: 1,
            });

            if (!result.canceled && result.assets[0]) {
                const { uri, width, height } = result.assets[0];
                return await processImage(uri, width, height);
            }
        } catch (error) {
            console.log('Error taking photo:', error);
            Alert.alert('Error', 'An error occurred while taking the photo.');
        }
        return null;
    };

    return {
        pickImage,
        takePhoto,
    };
};
