import { CustomTabBar } from '@/components/CustomTabBar';
import { NotificationPriming, useNotificationPriming } from '@/components/NotificationPriming';
import { PromoPaywall, usePromoPaywall } from '@/components/PromoPaywall';
import { trackScreenView } from '@/services/analytics';
import { scheduleRetentionNotifications } from '@/services/notificationService';
import { useEngagementStore } from '@/store/useEngagementStore';
import { Tabs, usePathname } from 'expo-router';
import { Eye, Layers, Palette, Pipette, User } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useRef } from 'react';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const recordActivity = useEngagementStore((s) => s.recordActivity);
  const { showPriming, dismissPriming } = useNotificationPriming();
  const { showPromo, dismissPromo } = usePromoPaywall();
  const pathname = usePathname();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    recordActivity();
    // Reschedule retention notifications (idempotent, once per day)
    scheduleRetentionNotifications();
  }, []);

  // Track screen views on tab changes
  useEffect(() => {
    if (pathname) {
      const screenName = pathname.replace('/', '') || 'index';
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
          name="squint"
          options={{
            tabBarIcon: ({ color }) => <Eye size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="valuemap"
          options={{
            tabBarIcon: ({ color }) => <Layers size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ color }) => <User size={24} color={color} />,
          }}
        />
      </Tabs>

      {/* Notification permission priming (shown once, after value is experienced) */}
      <NotificationPriming visible={showPriming} onDismiss={dismissPriming} />

      {/* Promo paywall for free users (after 3rd session, every 3 days max) */}
      {!showPriming && <PromoPaywall visible={showPromo} onDismiss={dismissPromo} />}
    </>
  );
}
