import { Stack } from 'expo-router';
import { ImageBackground, StyleSheet } from 'react-native';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#5D4037',
        },
        headerTintColor: '#F5EFE0',
        headerTitleStyle: {
          fontFamily: 'serif',
          fontSize: 24,
          fontWeight: 'bold',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: 'Login',
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          title: 'Create Account',
        }}
      />
    </Stack>
  );
}