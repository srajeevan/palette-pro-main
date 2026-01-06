import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import Purchases, { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

// RevenueCat Configuration
const API_KEY_IOS = 'appl_ErKGCnkiNeQlPvFFuVAnClgRNho';
const ENTITLEMENT_ID = 'pro';

interface ProContextType {
    isPro: boolean;
    isLoading: boolean;
    offerings: PurchasesOffering | null;
    purchasePackage: (pack: PurchasesPackage) => Promise<void>;
    restorePurchases: () => Promise<void>;
    resetProStatus: () => Promise<void>; // Debug only
}

const ProContext = createContext<ProContextType | undefined>(undefined);

export function ProProvider({ children }: { children: React.ReactNode }) {
    const [isPro, setIsPro] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);

    useEffect(() => {
        initRevenueCat();
    }, []);

    const initRevenueCat = async () => {
        try {
            if (Platform.OS === 'ios') {
                await Purchases.configure({ apiKey: API_KEY_IOS });
            }
            // Add Android key here if needed

            const info = await Purchases.getCustomerInfo();
            checkEntitlements(info);

            await loadOfferings();
        } catch (error) {
            console.error('Failed to init RevenueCat', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadOfferings = async () => {
        try {
            const offerings = await Purchases.getOfferings();
            if (offerings.current !== null) {
                setOfferings(offerings.current);
            }
        } catch (error) {
            console.error('Failed to load offerings', error);
        }
    };

    const checkEntitlements = (info: CustomerInfo) => {
        if (typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined') {
            setIsPro(true);
        } else {
            setIsPro(false);
        }
    };

    const purchasePackage = async (pack: PurchasesPackage) => {
        setIsLoading(true);
        try {
            const { customerInfo } = await Purchases.purchasePackage(pack);
            checkEntitlements(customerInfo);
        } catch (error: any) {
            console.error('Purchase Error:', error);
            if (!error.userCancelled) {
                Alert.alert('Error', error.message);
            } else {
                // Optional: Alert even on cancel to confirm it was effectively cancelled
                console.log('User cancelled transaction');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const restorePurchases = async () => {
        setIsLoading(true);
        try {
            const info = await Purchases.restorePurchases();
            checkEntitlements(info);

            // Show result
            if (typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined') {
                Alert.alert('Success', 'Purchases restored.');
            } else {
                Alert.alert('Restore', 'No active subscriptions found.');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Debug method to force logout from RevenueCat (Sandbox only usually)
    const resetProStatus = async () => {
        if (__DEV__) {
            await Purchases.logOut();
            setIsPro(false);
            Alert.alert('Debug', 'Logged out of RevenueCat. Pro status reset.');
            // Re-login anonymous to reset
            await Purchases.logIn(Math.random().toString(36).substring(7));
        }
    };

    return (
        <ProContext.Provider value={{ isPro, isLoading, offerings, purchasePackage, restorePurchases, resetProStatus }}>
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

