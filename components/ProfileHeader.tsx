import { View, Text, Image, StyleSheet, Pressable, Alert } from 'react-native'
import { useRouter } from 'expo-router'

export default function ProfileHeader() {
  const router = useRouter()
  const handleAvatarPress = () => {
    router.push('/(dashboard)/profile')  // Navigate to profile screen
    // You could also navigate here using router.push('/profile') if desired
  }

  return (
    <View style={styles.headerContainer}>
      <Pressable onPress={handleAvatarPress}>
        <Image
          source={{ uri: 'https://via.placeholder.com/60' }}
          style={styles.avatar}
        />
      </Pressable>
      <View>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.username}>MeghP89</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#ccc',
  },
  welcomeText: {
    fontSize: 14,
    color: '#555',
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
  },
})