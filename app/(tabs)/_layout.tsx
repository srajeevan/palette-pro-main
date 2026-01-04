import { Tabs } from 'expo-router';
import { Eye, Layers, Palette, Pipette, User } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#18181b', // zinc-900
        tabBarInactiveTintColor: '#a1a1aa', // zinc-400
        tabBarStyle: {
          position: 'absolute',
          bottom: 25,
          left: 20,
          right: 20,
          elevation: 5,
          backgroundColor: '#ffffff',
          borderRadius: 24,
          height: 64,
          paddingBottom: 0,
          paddingTop: 0,
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          zIndex: 50,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 0,
        },
        tabBarShowLabel: false, // Minimalist look
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
