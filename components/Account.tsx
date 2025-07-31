import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { Button, TextInput, Card, Avatar, Text } from 'react-native-paper';
import { supabase } from '../utils/supabase';
import { Session } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';

export default function Account({ session }: { session: Session }) {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState(session.user.user_metadata?.username || '');
  const router = useRouter();

  useEffect(() => {
    if (session) getProfile();
  }, [session]);

  async function getProfile() {
    try {
      setLoading(true);
      const userId = session?.user.id;
      if (!userId) throw new Error('No user on the session!');

      const { data, error, status } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();

      if (error && status !== 406) throw error;

      if (data) {
        setUsername(data.username || '');
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error fetching profile', error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile({ username }: { username: string }) {
    try {
      setLoading(true);
      const userId = session?.user.id;
      if (!userId) throw new Error('No user on the session!');

      const updates = {
        id: userId,
        username: username.trim(),
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error updating profile', error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <Text style={styles.headerSubtitle}>Manage your account details</Text>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.avatarContainer}>
              <Avatar.Text
                size={100}
                label={username ? username.charAt(0).toUpperCase() : session.user.email?.charAt(0).toUpperCase() || '?'}
                style={styles.avatarFallback}
              />
            </View>

            <TextInput
              label="Email"
              value={session.user.email}
              disabled
              style={styles.input}
              mode="outlined"
              outlineColor="#8A655A"
              activeOutlineColor="#5D4037"
            />
            <TextInput
              label="Username"
              value={username}
              onChangeText={setUsername}
              style={styles.input}
              mode="outlined"
              outlineColor="#8A655A"
              activeOutlineColor="#5D4037"
            />

            <Button
              mode="contained"
              loading={loading}
              disabled={loading}
              onPress={() => updateProfile({ username })}
              style={styles.updateButton}
              labelStyle={styles.buttonLabel}
              buttonColor="#5D4037"
            >
              Update Profile
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Button
              mode="outlined"
              onPress={() => {
                supabase.auth.signOut().then(() => {
                  router.replace('/');
                });
              }}
              style={styles.signOutButton}
              labelStyle={styles.signOutLabel}
            >
              Sign Out
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    paddingHorizontal: 4,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F5EFE0',
    fontFamily: 'serif',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E8E0D0',
    opacity: 0.9,
  },
  card: {
    backgroundColor: 'rgba(245, 239, 224, 0.95)',
    borderRadius: 12,
    elevation: 3,
    marginBottom: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarFallback: {
    backgroundColor: '#8A655A',
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'rgba(245, 239, 224, 0.5)',
  },
  updateButton: {
    marginTop: 8,
    borderRadius: 30,
    paddingVertical: 8,
  },
  buttonLabel: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  signOutButton: {
    borderRadius: 30,
    paddingVertical: 8,
    borderColor: '#F44336',
    borderWidth: 2,
  },
  signOutLabel: {
    color: '#F44336',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
