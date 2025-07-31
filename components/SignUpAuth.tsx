import React, { useState, useEffect } from 'react';
import { Alert, StyleSheet, View, AppState, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../utils/supabase';
import { Button, TextInput, Card } from 'react-native-paper';
import { useRouter } from 'expo-router';

function validatePassword(password: string) {
  const minLength = /.{8,}/;
  const uppercase = /[A-Z]/;
  const lowercase = /[a-z]/;
  const number = /[0-9]/;
  const specialChar = /[!@#$%^&*(),.?":{}|<>]/;

  if (!minLength.test(password)) return 'Password must be at least 8 characters long.';
  if (!uppercase.test(password)) return 'Password must include at least one uppercase letter.';
  if (!lowercase.test(password)) return 'Password must include at least one lowercase letter.';
  if (!number.test(password)) return 'Password must include at least one number.';
  if (!specialChar.test(password)) return 'Password must include at least one special character.';

  return null;
}

export default function SignUpAuth() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleAppStateChange = (state: string) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  async function signUpWithEmail() {
    const passwordError = validatePassword(password);
    if (passwordError) {
      Alert.alert('Invalid Password', passwordError);
      return;
    }

    if (!username.trim()) {
      Alert.alert('Invalid Username', 'Please enter a username.');
      return;
    }

    setLoading(true);

    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: { username: username.trim() },
      },
    });

    if (error) {
      if (error.message.includes('already registered') || error.status === 400) {
        Alert.alert('Sign Up Error', 'This email is already registered. Please log in instead.');
      } else {
        Alert.alert('Sign Up Error', error.message);
      }
      setLoading(false);
      return;
    }

    if (!session) {
      Alert.alert('Success!', 'Please check your inbox for email verification.');
      router.push('/(signup)/login');
    }
    
    setLoading(false);
  }

  return (
    <Card style={styles.formCard}>
      <Card.Content>
        <TextInput
          label="Username"
          mode="outlined"
          onChangeText={setUsername}
          value={username}
          placeholder="Enter username"
          autoCapitalize="none"
          style={styles.input}
          outlineColor="#8A655A"
          activeOutlineColor="#5D4037"
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
          outlineColor="#8A655A"
          activeOutlineColor="#5D4037"
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
          outlineColor="#8A655A"
          activeOutlineColor="#5D4037"
        />
        <Button
          mode="contained"
          loading={loading}
          disabled={loading}
          onPress={signUpWithEmail}
          style={styles.button}
          labelStyle={styles.buttonLabel}
          buttonColor="#5D4037"
        >
          Create Account
        </Button>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  formCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(245, 239, 224, 0.95)',
    borderRadius: 12,
    elevation: 3,
    paddingVertical: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'rgba(245, 239, 224, 0.5)',
  },
  button: {
    marginTop: 8,
    borderRadius: 30,
    paddingVertical: 8,
  },
  buttonLabel: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});