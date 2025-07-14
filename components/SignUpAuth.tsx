import React, { useState, useEffect } from 'react'
import { Alert, StyleSheet, View, AppState, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { supabase } from '../utils/supabase'
import { Button, TextInput } from 'react-native-paper'
import { useRouter } from 'expo-router'

function validatePassword(password: string) {
  const minLength = /.{8,}/
  const uppercase = /[A-Z]/
  const lowercase = /[a-z]/
  const number = /[0-9]/
  const specialChar = /[!@#$%^&*(),.?":{}|<>]/

  if (!minLength.test(password)) return 'Password must be at least 8 characters long.'
  if (!uppercase.test(password)) return 'Password must include at least one uppercase letter.'
  if (!lowercase.test(password)) return 'Password must include at least one lowercase letter.'
  if (!number.test(password)) return 'Password must include at least one number.'
  if (!specialChar.test(password)) return 'Password must include at least one special character.'

  return null
}

const theme = {
  primary: '#4CAF50', // fresh green
  secondary: '#81C784', // light green
  background: '#FAFAFA', // soft off-white
  textPrimary: '#212121',
  textSecondary: '#757575',
  error: '#D32F2F', // red for errors
  border: '#E0E0E0',
}

export default function SignUpAuth() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const handleAppStateChange = (state: string) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh()
      } else {
        supabase.auth.stopAutoRefresh()
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)

    return () => {
      subscription?.remove()
    }
  }, [])

  async function signUpWithEmail() {
    const passwordError = validatePassword(password)
    if (passwordError) {
      Alert.alert('Invalid Password', passwordError)
      return
    }

    if (!username.trim()) {
      Alert.alert('Invalid Username', 'Please enter a username.')
      return
    }

    setLoading(true)

    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: { username: username.trim() },
      },
    })

    if (error) {
        if (error.message.includes('already registered') || error.status === 400) {
            Alert.alert('Sign Up Error', 'This email is already registered. Please log in instead.')
        } else {
            Alert.alert('Sign Up Error', error.message)
        }
        return
    }


    if (!error) {
       router.push('/(signup)/login')
    }

    if (error) Alert.alert(error.message)
    else if (!session) Alert.alert('Please check your inbox for email verification!')

    setLoading(false)
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <TextInput
            label="Username"
            mode="outlined"
            onChangeText={setUsername}
            value={username}
            placeholder="Enter username"
            autoCapitalize="none"
            style={styles.input}
            activeOutlineColor={theme.primary}
          />
          <TextInput
            label="Email"
            mode="outlined"
            onChangeText={setEmail}
            value={email}
            placeholder="email@address.com"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            activeOutlineColor={theme.primary}
          />
          <TextInput
            label="Password"
            mode="outlined"
            onChangeText={setPassword}
            value={password}
            secureTextEntry
            placeholder="Create a strong password"
            autoCapitalize="none"
            style={styles.input}
            activeOutlineColor={theme.primary}
          />
          <Button
            mode="contained"
            loading={loading}
            disabled={loading}
            onPress={signUpWithEmail}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Sign Up
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  form: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: theme.primary,
  },
  buttonContent: {
    paddingVertical: 12,
  },
  buttonLabel: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
})