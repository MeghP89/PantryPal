import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import LoginAuth from '../../components/LoginAuth';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  ImageBackground,
  SafeAreaView,
} from 'react-native';
import { Session } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import { IconButton } from 'react-native-paper';

export default function Login() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!loading && session && session.user) {
      router.replace('/(dashboard)/inventory');
    }
  }, [loading, session]);

  if (loading || (session && session.user)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F5EFE0" animating />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={{ uri: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAyADIDASIAAhEBAxEB/8QAGAAAAwEBAAAAAAAAAAAAAAAAAAIDAQT/xAAfEAEAAgICAwEBAQAAAAAAAAABEQIDEgQhMVFBYXH/xAAXAQADAQAAAAAAAAAAAAAAAAAAAQID/8QAFhEBAQEAAAAAAAAAAAAAAAAAAAER/9oADAMBAAIRAxEAPwD00iYiZifTExEzE+mJ48zHhHHmY8JgAGAAAAAAAAAABiWWY9sSyx7YmADAAAAAAAAAAAGBZY9sCyx7YmADAAAAAAAAAAAGBZY9sCyx7YmADAAAAAAAAAAAGBZY9sCyx7YmADAAAAAAAAAAAGBZY9sCyx7YmADAAAAAAAAAAAGBZY9sCyx7YmADAAAAAAAAAAAGBZY9sCyx7YmAD//2Q==' }}
        style={styles.backgroundGradient}
        resizeMode="repeat"
      >
        <View style={{ flex: 1 }}>
          <View style={styles.backButtonContainer}>
            <IconButton
              icon="arrow-left"
              iconColor="#F5EFE0"
              size={28}
              onPress={() => router.back()}
            />
          </View>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <LoginAuth />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5D4037',
  },
  backgroundGradient: {
    flex: 1,
  },
  backButtonContainer: {
    paddingTop: 10,
    paddingLeft: 10,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#5D4037',
  },
});