import { View, Text, StyleSheet } from 'react-native'

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Profile</Text>
      <Text>Welcome to your profile screen.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F8E9', // Light green background
  },
  heading: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
  },
})
