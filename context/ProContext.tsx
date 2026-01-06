import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';

interface ProContextType {
    isPro: boolean;
    isLoading: boolean;
    unlockPro: () => Promise<void>;
    restorePurchases: () => Promise<void>;
    resetProStatus: () => Promise<void>;
}

const ProContext = createContext<ProContextType | undefined>(undefined);

export function ProProvider({ children }: { children: React.ReactNode }) {
    const [isPro, setIsPro] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkProStatus();
    }, []);

    const checkProStatus = async () => {
        try {
            // Check for existing "PRO" status in local storage (Mock for now)
            const status = await AsyncStorage.getItem('@palette_pro_status');
            setIsPro(status === 'active');
        } catch (error) {
            console.error('Failed to check pro status', error);
        } finally {
            setIsLoading(false);
        }
    };

    const unlockPro = async () => {
        // Mock Purchase Flow
        setIsLoading(true);
        // Simulate network request
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            await AsyncStorage.setItem('@palette_pro_status', 'active');
            setIsPro(true);
            // Haptic would go here
        } catch (error) {
            Alert.alert('Error', 'Failed to process purchase. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const restorePurchases = async () => {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        // Mock restore check
        // For now, let's say restore always finds nothing unless previously purchased locally
        const status = await AsyncStorage.getItem('@palette_pro_status');
        if (status === 'active') {
            setIsPro(true);
            Alert.alert('Success', 'Purchases restored.');
        } else {
            Alert.alert('Restore', 'No active subscriptions found.');
        }
        setIsLoading(false);
    };

    const resetProStatus = async () => {
        try {
            await AsyncStorage.removeItem('@palette_pro_status');
            setIsPro(false);
            Alert.alert('Debug', 'Pro status reset to Free.');
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <ProContext.Provider value={{ isPro, isLoading, unlockPro, restorePurchases, resetProStatus }}>
            {children}
        </ProContext.Provider>
    );
}

export function usePro() {
    const context = useContext(ProContext);
    if (context === undefined) {
        throw new Error('usePro must be used within a ProProvider');
    }
    return context;
}
