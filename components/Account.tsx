import { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Alert,
  Text,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
  Dimensions,
} from 'react-native'
import { Button, TextInput, Card, Avatar, Chip } from 'react-native-paper'
import { supabase } from '../utils/supabase'
import { Session } from '@supabase/supabase-js'
import { useRouter } from 'expo-router'

const { width } = Dimensions.get('window')

export default function Account({ session }: { session: Session }) {
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState(session.user.user_metadata?.username || '')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [previewAvatar, setPreviewAvatar] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (session) getProfile()
  }, [session])

  useEffect(() => {
    setPreviewAvatar(avatarUrl)
  }, [avatarUrl])

  async function getProfile() {
    try {
      setLoading(true)
      const userId = session?.user.id
      if (!userId) throw new Error('No user on the session!')

      const { data, error, status } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', userId)
        .single()

      if (error && status !== 406) throw error

      if (data) {
        setUsername(data.username || '')
        setAvatarUrl(data.avatar_url || '')
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile({
    username,
    avatarUrl,
  }: {
    username: string
    avatarUrl?: string
  }) {
    try {
      setLoading(true)
      const userId = session?.user.id
      if (!userId) throw new Error('No user on the session!')

      const updates = {
        id: userId,
        username: username.trim(),
        avatar_url: avatarUrl?.trim() || null,
        email: session.user.email,
        updated_at: new Date(),
      }

      const { error } = await supabase.from('profiles').upsert(updates)

      if (error) throw error

      Alert.alert('Success', 'Profile updated successfully!')
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const validateAvatarUrl = (url: string) => {
    if (!url) return true
    try {
      new URL(url)
      return /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
    } catch {
      return false
    }
  }

  const isValidAvatar = validateAvatarUrl(avatarUrl)

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={64}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <Card style={styles.avatarCard}>
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                {previewAvatar && isValidAvatar ? (
                  <Image
                    source={{ uri: previewAvatar }}
                    style={styles.avatar}
                    onError={() => setPreviewAvatar('')}
                  />
                ) : (
                  <Avatar.Text
                    size={120}
                    label={username ? username.charAt(0).toUpperCase() : session.user.email?.charAt(0).toUpperCase() || '?'}
                    style={styles.avatarFallback}
                  />
                )}
              </View>

              <Text style={styles.welcomeText}>
                {username || session.user.email?.split('@')[0] || 'User'}
              </Text>

              <View style={styles.statusChip}>
                <Chip icon="check-circle" mode="outlined" compact>
                  Account Active
                </Chip>
              </View>
            </View>
          </Card>

          <Card style={styles.formCard}>
            <Card.Content style={styles.cardContent}>
              <Text style={styles.sectionTitle}>Profile Information</Text>

              <View style={styles.inputGroup}>
                <TextInput
                  label="Email Address"
                  value={session.user.email}
                  disabled
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Icon icon="email" />}
                />
              </View>

              <View style={styles.inputGroup}>
                <TextInput
                  label="Username"
                  value={username}
                  onChangeText={setUsername}
                  mode="outlined"
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  left={<TextInput.Icon icon="account" />}
                  placeholder="Enter your username"
                />
              </View>

              <View style={styles.inputGroup}>
                <TextInput
                  label="Avatar URL"
                  value={avatarUrl}
                  onChangeText={setAvatarUrl}
                  mode="outlined"
                  style={styles.input}
                  placeholder="https://example.com/avatar.jpg"
                  autoCapitalize="none"
                  autoCorrect={false}
                  left={<TextInput.Icon icon="image" />}
                  error={avatarUrl && !isValidAvatar}
                />
                {avatarUrl && !isValidAvatar && (
                  <Text style={styles.errorText}>
                    Please enter a valid image URL (jpg, jpeg, png, gif, webp)
                  </Text>
                )}
              </View>

              <View style={styles.buttonGroup}>
                <Button
                  mode="contained"
                  loading={loading}
                  onPress={() => updateProfile({ username, avatarUrl })}
                  disabled={loading || !isValidAvatar}
                  style={styles.updateButton}
                  contentStyle={styles.buttonContent}
                  icon="content-save"
                >
                  Save Changes
                </Button>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.actionsCard}>
            <Card.Content style={styles.cardContent}>
              <Text style={styles.sectionTitle}>Account Actions</Text>
              <Button
                mode="outlined"
                onPress={() => {supabase.auth.signOut().then(() => {
                  router.replace('/(signup)/login')  // navigate to login after sign out
                })}}
                style={styles.signOutButton}
                contentStyle={styles.buttonContent}
                icon="logout"
                textColor="#d32f2f"
              >
                Sign Out
              </Button>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#F1F8E9',
    paddingVertical: 16,
  },
  container: {
    paddingHorizontal: 16,
    gap: 16,
  },
  avatarCard: {
    backgroundColor: 'white',
    elevation: 2,
    borderRadius: 12,
  },
  avatarSection: {
    alignItems: 'center',
    padding: 24,
  },
  avatarContainer: {
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  avatarFallback: {
    backgroundColor: '#4CAF50',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusChip: {
    marginTop: 8,
  },
  formCard: {
    backgroundColor: 'white',
    elevation: 2,
    borderRadius: 12,
  },
  actionsCard: {
    backgroundColor: 'white',
    elevation: 2,
    borderRadius: 12,
  },
  cardContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'white',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 12,
  },
  buttonGroup: {
    marginTop: 8,
  },
  updateButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  signOutButton: {
    borderColor: '#d32f2f',
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
})
