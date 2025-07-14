import { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Alert,
  Text,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native'
import { Button, TextInput } from 'react-native-paper'
import { supabase } from '../utils/supabase'
import { Session } from '@supabase/supabase-js'

export default function Account({ session }: { session: Session }) {
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState(session.user.user_metadata?.username || '')
  const [website, setWebsite] = useState('') // no website in user_metadata by default
  const [avatarUrl, setAvatarUrl] = useState('') // optional

  // No getProfile needed since we use session data directly

  async function updateProfile() {
    try {
      setLoading(true)
      const { error } = await supabase.auth.updateUser({
        data: {
          username,
          website,
          avatar_url: avatarUrl,
        },
      })

      if (error) throw error
      Alert.alert('Success', 'Profile updated!')
    } catch (error) {
      if (error instanceof Error) Alert.alert('Update error', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={64}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.heading}>
            Welcome, {username || session.user.email}
          </Text>

          <View style={[styles.verticallySpaced, styles.mt20]}>
            <TextInput label="Email" value={session.user.email} disabled />
          </View>

          <View style={styles.verticallySpaced}>
            <TextInput
              label="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.verticallySpaced}>
            <TextInput
              label="Website"
              value={website}
              onChangeText={setWebsite}
              autoCapitalize="none"
            />
          </View>

          <View style={[styles.verticallySpaced, styles.mt20]}>
            <Button
              mode="contained"
              loading={loading}
              onPress={updateProfile}
              disabled={loading}
            >
              Update
            </Button>
          </View>

          <View style={styles.verticallySpaced}>
            <Button mode="outlined" onPress={() => supabase.auth.signOut()}>
              Sign Out
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'white',
  },
  container: {
    paddingHorizontal: 12,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  verticallySpaced: {
    paddingVertical: 6,
    alignSelf: 'stretch',
  },
  mt20: {
    marginTop: 20,
  },
})
