import { useAuth } from '@/context/AuthContext';
import { usePro } from '@/context/ProContext';
import { showToast } from '@/utils/toast';
import { useRouter } from 'expo-router';

export const useUpgradeFlow = () => {
    const { isGuest } = useAuth();
    const { setPendingUpgrade } = usePro();
    const router = useRouter();

    /**
     * Checks if the user is a guest.
     * If Guest -> Shows "Soft-Wall" Alert, sets pending intent, navigates to Login.
     * If Registered -> Executes the success callback (usually opening the Paywall).
     * @param onAccessGranted Callback to run if user is allowed to proceed (e.g. show paywall or navigate to feature)
     * @param options Optional callbacks for handling UI state (e.g. closing modals)
     */
    const triggerUpgradeFlow = (onAccessGranted: () => void) => {
        if (isGuest) {
            // Phase 5.2: Conditional Logic - Show Toast but Allow Access
            // Use global toast ref
            showToast("Account creation required for Pro features.");
        }

        // Always proceed to open the modal (modal will handle the rest)
        onAccessGranted();
    };

    return { triggerUpgradeFlow };
};
