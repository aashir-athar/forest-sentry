// Tabs — bottom navigation, role-aware labels via copy that flexes by user role.
// Lever: Jakob's Law — keep tab placement conventional (bottom, 4 destinations).
import { useAuthStore } from '@/src/stores/useAuthStore';
import { useColors } from '@/src/theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

export default function TabsLayout() {
  const colors = useColors();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const role = user?.role ?? 'ranger';

  if (!hydrated) return null;
  if (!user) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.divider,
          height: Platform.OS === 'ios' ? 84 : 68,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.3 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: role === 'researcher' ? 'Overview' : 'Field',
          tabBarIcon: ({ color, size }) => <Ionicons name="leaf" color={color} size={size} />,
          tabBarAccessibilityLabel: role === 'researcher' ? 'Overview tab' : 'Field tab',
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => <Ionicons name="map" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="trees"
        options={{
          title: role === 'researcher' ? 'Dataset' : 'Trees',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-sharp" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
