import { CustomTabBar } from '@/components/CustomTabBar';
import { PromoPaywall, usePromoPaywall } from '@/components/PromoPaywall';
import { UpdatePromptModal, shouldShowUpdatePrompt } from '@/components/UpdatePromptModal';
import { trackEvent, trackScreenView } from '@/services/analytics';
import { checkForUpdate, UpdateInfo } from '@/services/appConfigService';
import { useEngagementStore } from '@/store/useEngagementStore';
import { Tabs, usePathname } from 'expo-router';
import { Home, Palette, Pipette, Settings, SlidersHorizontal } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useRef, useState } from 'react';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const recordActivity = useEngagementStore((s) => s.recordActivity);
  const { showPromo, dismissPromo } = usePromoPaywall();
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const pathname = usePathname();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    recordActivity();

    // Check for app updates
    (async () => {
      const info = await checkForUpdate();
      if (!info) return;

      const shouldShow = await shouldShowUpdatePrompt(info);
      if (!shouldShow) return;

      setUpdateInfo(info);
      setShowUpdatePrompt(true);
      trackEvent('update_prompt_shown', { type: info.type });
    })();
  }, []);

  // Track screen views on tab changes
  useEffect(() => {
    if (pathname) {
      const screenName = pathname.replace('/', '') || 'home';
      if (pathname !== prevPathname.current) {
        prevPathname.current = pathname;
      }
      trackScreenView(screenName);
    }
  }, [pathname]);

  return (
    <>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="studio"
          options={{
            tabBarIcon: ({ color }) => <Pipette size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="palette"
          options={{
            tabBarIcon: ({ color }) => <Palette size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="tools"
          options={{
            tabBarIcon: ({ color }) => <SlidersHorizontal size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
          }}
        />
      </Tabs>

      {/* Promo paywall for free users (after 3rd session, every 3 days max) */}
      <PromoPaywall visible={showPromo} onDismiss={dismissPromo} />

      {/* Update prompt */}
      {updateInfo && (
        <UpdatePromptModal
          visible={showUpdatePrompt}
          updateInfo={updateInfo}
          onDismiss={() => setShowUpdatePrompt(false)}
        />
      )}
    </>
  );
}
