import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#5D4037', // Deep brown for primary actions
    accent: '#8A655A', // Lighter brown for secondary elements
    background: '#F5EFE0', // Warm off-white for backgrounds
    surface: '#FFFFFF', // White for card surfaces
    text: '#3E2723', // Dark brown for primary text
    secondaryText: '#795548', // Lighter brown for secondary text
    placeholder: '#BCAAA4', // Light brown for placeholders
    error: '#D32F2F', // Standard error red
    
    // Custom colors for specific components
    tabBarActive: '#5D4037',
    tabBarInactive: '#A1887F',
    tabBarBackground: '#F5EFE0',
    borderColor: '#E8E0D0',
  },
  roundness: 12, // Consistent border radius
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      fontFamily: 'System',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '600',
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '100',
    },
  },
};
