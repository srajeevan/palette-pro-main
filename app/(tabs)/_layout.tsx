import { CustomTabBar } from '@/components/CustomTabBar';
import { Tabs } from 'expo-router';
import { Eye, Layers, Palette, Pipette, User } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();

  return (
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
  );
}
