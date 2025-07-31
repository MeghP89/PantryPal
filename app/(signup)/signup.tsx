import SignUpAuth from '../../components/SignUpAuth';
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
  SafeAreaView,
  View,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';

export default function SignUp() {
  const router = useRouter();
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
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <SignUpAuth />
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
});