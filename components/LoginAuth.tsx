import React, { useState } from 'react';
import { Alert, StyleSheet, View, AppState } from 'react-native';
import { supabase } from '../utils/supabase';
import { Button, TextInput, Card, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';

// Handle session auto-refresh
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export default function LoginAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signInWithEmail() {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please fill out both email and password.');
      return;
    }

    setLoading(true);

    const {
      data: { session },
      error,
    } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      Alert.alert('Login Failed', error.message);
      setLoading(false);
      return;
    }

    if (session) {
      router.replace('/(dashboard)/inventory');
    }
    
    setLoading(false);
  }

  return (
    <Card style={styles.formCard}>
      <Card.Content>
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
          placeholder="Enter your password"
          autoCapitalize="none"
          style={styles.input}
          outlineColor="#8A655A"
          activeOutlineColor="#5D4037"
        />
        <Button
          mode="contained"
          loading={loading}
          disabled={loading}
          onPress={signInWithEmail}
          style={styles.button}
          labelStyle={styles.buttonLabel}
          buttonColor="#5D4037"
        >
          Login
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
