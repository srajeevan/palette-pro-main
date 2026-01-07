import { supabase } from '@/lib/supabase';
import { showToast } from '@/utils/toast';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

// RevenueCat Configuration
const API_KEY_IOS = 'appl_ErKGCnkiNeQlPvFFuVAnClgRNho';
const ENTITLEMENT_ID = 'pro';

interface ProContextType {
    isPro: boolean;
    isLoading: boolean;
    offerings: PurchasesOffering | null;
    purchasePackage: (pack: PurchasesPackage) => Promise<boolean>;
    restorePurchases: () => Promise<void>;
    resetProStatus: () => Promise<void>; // Debug only
    pendingUpgrade: boolean;
    setPendingUpgrade: (pending: boolean) => void;
}

const ProContext = createContext<ProContextType | undefined>(undefined);

export function ProProvider({ children }: { children: React.ReactNode }) {
    const [isPro, setIsPro] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
    const [pendingUpgrade, setPendingUpgrade] = useState(false);

    useEffect(() => {
        initRevenueCat();
    }, []);

    // Hydrate Pro status from Supabase (Source of Truth for manual/admin grants)
    useEffect(() => {
        const fetchProfileStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                console.log('🔄 Checking Supabase profile for Pro status...');
                const { data, error } = await supabase
                    .from('profiles')
                    .select('is_pro')
                    .eq('id', user.id)
                    .single();

                if (data && data.is_pro) {
                    console.log('✅ User marked as Pro in Supabase. Granting access.');
                    setIsPro(true);
                } else if (error) {
                    console.error('Error fetching profile:', error);
                }
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                fetchProfileStatus();
            }
        });

        // Initial check
        fetchProfileStatus();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const initRevenueCat = async () => {
        try {
            if (Platform.OS === 'ios') {
                await Purchases.configure({ apiKey: API_KEY_IOS });
            }
            // Add Android key here if needed

            const info = await Purchases.getCustomerInfo();
            checkEntitlements(info);

            // Listen for real-time updates (syncs with AuthContext login)
            Purchases.addCustomerInfoUpdateListener((info) => {
                checkEntitlements(info);
            });

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

    const syncProStatusToSupabase = async (active: boolean, info: CustomerInfo) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return; // Not logged in, can't sync

            // 1. Update Profile is_pro
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ is_pro: active })
                .eq('id', user.id);

            if (profileError) console.error('Supabase profile sync failed:', profileError);

            // 2. Update Subscriptions Table (Best Effort mapping)
            if (active) {
                const entitlement = info.entitlements.active[ENTITLEMENT_ID];
                if (entitlement) {
                    const { error: subError } = await supabase
                        .from('subscriptions')
                        .upsert({
                            id: `rc_${entitlement.productIdentifier}_${user.id}`, // Synthetic ID
                            user_id: user.id,
                            status: 'active',
                            price_id: entitlement.productIdentifier,
                            created: entitlement.latestPurchaseDate,
                            current_period_start: entitlement.latestPurchaseDate,
                            current_period_end: entitlement.expirationDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Fallback if lifetime
                            metadata: { source: 'revenue_cat', original_id: entitlement.identifier }
                        }, { onConflict: 'id' });

                    if (subError) console.error('Supabase subscription sync failed:', subError);
                }
            } else {
                // If not active, we might want to mark status as canceled/expired if we tracked it, 
                // but for now we just rely on is_pro = false in profile.
            }

        } catch (err) {
            console.warn('Sync to Supabase failed:', err);
        }
    };

    const checkEntitlements = (info: CustomerInfo) => {
        const hasPro = typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
        if (hasPro !== isPro) {
            setIsPro(hasPro);
        }
        // Always attempt sync when entitlements are checked/changed, to ensure consistency
        if (hasPro) {
            syncProStatusToSupabase(true, info);
        }
    };

    const purchasePackage = async (pack: PurchasesPackage): Promise<boolean> => {
        setIsLoading(true);
        try {
            const { customerInfo } = await Purchases.purchasePackage(pack);
            checkEntitlements(customerInfo);
            const isSuccess = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
            return isSuccess;
        } catch (error: any) {
            // Check for cancellation first
            const isCancelled = error.userCancelled ||
                error.message?.includes('cancelled') ||
                error.code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR ||
                error.code === '1';

            // Check for "Already Subscribed" (Code 6 typically, or distinct message)
            const isAlreadySubscribed = error.code === Purchases.PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR ||
                error.message?.toLowerCase().includes('already purchased') ||
                error.message?.toLowerCase().includes('already subscribed');

            if (isCancelled) {
                console.log('User cancelled transaction');
                // Engagement Toast/Alert as requested
                const messages = [
                    "Your wallet is safe... for now. 😉",
                    "Playing hard to get? We can wait. 🎨",
                    "The Pro tools are missing you already.",
                    "No pressure! We'll be here when you're ready."
                ];
                const randomMsg = messages[Math.floor(Math.random() * messages.length)];
                showToast(randomMsg);
            } else if (isAlreadySubscribed) {
                // Explicitly handle "Already Owned" -> Treat as restore
                console.log("User already subscribed, attempting restore/sync.");
                try {
                    const info = await Purchases.restorePurchases();
                    checkEntitlements(info);
                    showToast("Access restored. You were already subscribed.");
                    return typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
                } catch (restoreErr) {
                    showToast('Failed to restore. Please try "Restore Purchases".');
                }
            } else {
                console.error('Purchase Error:', error);
                showToast(error.message || 'Something went wrong.');
            }
            return false;
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
                showToast('Purchases restored successfully.');
            } else {
                showToast('No active subscriptions found to restore.');
            }
        } catch (error: any) {
            showToast(error.message || 'Restore failed.');
        } finally {
            setIsLoading(false);
        }
    };

    // Debug method to force logout from RevenueCat (Sandbox only usually)
    const resetProStatus = async () => {
        if (__DEV__) {
            try {
                await Purchases.logOut();
            } catch (e) {
                console.warn("RevenueCat logOut failed in reset:", e);
            }
            setIsPro(false);
            console.log('Logged out of RevenueCat. Pro status reset.');
            // Re-login anonymous to reset
            await Purchases.logIn(Math.random().toString(36).substring(7));
        }
    };

    return (
        <ProContext.Provider value={{
            isPro,
            isLoading,
            offerings,
            purchasePackage,
            restorePurchases,
            resetProStatus,
            pendingUpgrade,
            setPendingUpgrade
        }}>
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
