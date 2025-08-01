import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BackHandler } from 'react-native';
import { useFocusEffect } from 'expo-router';
import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { theme } from '../../utils/theme'; // Import the custom theme

export default function Layout() {
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        return true; // Prevent default back button behavior
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => subscription.remove();
    }, [])
  );

  return (
    <PaperProvider theme={theme}>
      <Tabs
        screenOptions={({ route }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'ellipse-outline';

          if (route.name === 'profile') iconName = 'person-outline';
          if (route.name === 'shopping') iconName = 'cart-outline';
          if (route.name === 'inventory') iconName = 'cube-outline';
          if (route.name === 'recipes') iconName = 'book-outline';

          return {
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={iconName} size={size} color={color} />
            ),
            tabBarLabel:
              route.name.charAt(0).toUpperCase() + route.name.slice(1),
            tabBarActiveTintColor: theme.colors.tabBarActive,
            tabBarInactiveTintColor: theme.colors.tabBarInactive,
            tabBarStyle: {
              backgroundColor: theme.colors.tabBarBackground,
              borderTopColor: theme.colors.borderColor,
              borderTopWidth: 1,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600',
            },
            header: () => undefined, // Hide header
          };
        }}
      />
    </PaperProvider>
  );
}