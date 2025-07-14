import React, { useState } from 'react'
import { Alert, StyleSheet, View, AppState } from 'react-native'
import { supabase } from '../utils/supabase'
import { Button, TextInput } from 'react-native-paper'

// Handle session auto-refresh
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})

export default function LoginAuth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

    async function signInWithEmail() {
        if (!email || !password) {
            Alert.alert('Missing fields', 'Please fill out both email and password.')
            return
        }

        setLoading(true)

        const {
            data: { session },
            error,
        } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
            Alert.alert('Login Failed', error.message)
            setLoading(false)
            return
        }

        // Get user details from session
        const user = session?.user
        console.log('User session:', typeof(user?.id))
        if (!user) {
            Alert.alert('Login Failed', 'User session is missing.')
            setLoading(false)
            return
        }

        // Check if user already has a profile
        const { data: existingProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        // If profile doesn't exist, create one
        if (!existingProfile && !fetchError) {
            const { error: insertError } = await supabase
                .from('profiles')
                .insert([
                    {
                        id: user.id,
                    },
                    {
                        username: user.user_metadata?.username?.trim() || '',
                    },
                    {
                        email: user.email,
                    },
                    {
                        avatar_url: '',
                    },
                ])

            if (insertError) {
                Alert.alert('Profile Creation Failed', insertError.message)
                setLoading(false)
                return
            }
        }

        // Proceed to next screen (e.g., home/dashboard)
        // router.push('/home') // ← if you're using `expo-router`

        Alert.alert('Success', 'Logged in successfully!')
        setLoading(false)
    }

  return (
    <View style={styles.form}>
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
        placeholder="Enter your password"
        autoCapitalize="none"
        style={styles.input}
        activeOutlineColor={theme.primary}
    />
    <Button
        mode="contained"
        loading={loading}
        disabled={loading}
        onPress={signInWithEmail}
        style={styles.button}
        contentStyle={styles.buttonContent}
        labelStyle={styles.buttonLabel}
    >
        Login
    </Button>
    </View>
  )
}

const theme = {
  primary: '#4CAF50', // fresh green
  secondary: '#81C784',
  background: '#FAFAFA',
  textPrimary: '#212121',
  textSecondary: '#757575',
  error: '#D32F2F',
  border: '#E0E0E0',
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  form: {
    width: '100%',
    maxWidth: 400,
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
