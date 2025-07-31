import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { View } from 'react-native'
import ProfileHeader from '../../components/ProfileHeader'

export default function Layout() {
  return (
    <Tabs
      screenOptions={({ route }) => {
        let iconName: keyof typeof Ionicons.glyphMap = 'ellipse-outline'

        if (  route.name === 'profile') iconName = 'person-outline'
        if (route.name === 'shopping') iconName = 'cart-outline'
        if (route.name === 'inventory') iconName = 'cube-outline'
        if (route.name === 'recipes') iconName = 'book-outline'

        return {
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={iconName} size={size} color={color} />
          ),
          tabBarLabel:
            route.name.charAt(0).toUpperCase() + route.name.slice(1),
          tabBarActiveTintColor: '#2E7D32', // Fresh green
          tabBarInactiveTintColor: '#81C784', // Light green
          tabBarStyle: {
            backgroundColor: '#F1F8E9', // Very light green background
            borderTopColor: '#A5D6A7', // Soft green border
            borderTopWidth: 1,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
          header: () =>
            undefined
        }
      }}
    />
  )
}