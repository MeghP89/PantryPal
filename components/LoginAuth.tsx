import React, { useState } from 'react';
import { Alert, StyleSheet, View, AppState } from 'react-native';
import { supabase } from '../utils/supabase';
import { Button, TextInput, Card, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Session } from '@supabase/supabase-js';

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
  const [passwordVisible, setPasswordVisible] = useState(false);
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
      await upsertProfileOnLogin(session);
      router.replace('/(dashboard)/inventory');
    }

    setLoading(false);
  }

  async function upsertProfileOnLogin(session: Session) {
    try {
      const userId = session.user.id;
      const email = session.user.email;
      const username = session.user.user_metadata?.username;

      if (!userId || !username) {
        console.log('User ID or username not found in session, skipping profile upsert.');
        return;
      }

      const updates = {
        id: userId,
        username: username.trim(),
        email: email,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) {
        console.error('Failed to upsert profile on login:', error);
        Alert.alert('Profile Sync Failed', 'Your profile could not be synced. Please press update on your account screen');
      }
    } catch (error) {
      console.error('An unexpected error occurred during profile upsert:', error);
      Alert.alert('Profile Sync Error', 'An unexpected error occurred while syncing your profile. Please press update on your account scren');
    }
  }

  return (
    <Card style={styles.formCard}>
      <Card.Title
        title="Welcome Back!"
        subtitle="Sign in to continue"
        titleStyle={styles.cardTitle}
        subtitleStyle={styles.cardSubtitle}
      />
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
          secureTextEntry={!passwordVisible}
          placeholder="Enter your password"
          autoCapitalize="none"
          style={styles.input}
          outlineColor="#8A655A"
          activeOutlineColor="#5D4037"
          right={
            <TextInput.Icon
              icon={passwordVisible ? 'eye-off' : 'eye'}
              onPress={() => setPasswordVisible(!passwordVisible)}
            />
          }
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
        <View style={styles.switchScreenContainer}>
          <Text style={styles.switchScreenText}>Don't have an account?</Text>
          <Button
            mode="text"
            onPress={() => router.replace('/(signup)/signup')}
            labelStyle={styles.switchScreenButton}
          >
            Sign Up
          </Button>
        </View>
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
  cardTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#5D4037',
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 16,
    color: '#5D4037',
    textAlign: 'center',
    marginBottom: 10,
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
  switchScreenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  switchScreenText: {
    color: '#5D4037',
  },
  switchScreenButton: {
    color: '#5D4037',
    fontWeight: 'bold',
  },
});
