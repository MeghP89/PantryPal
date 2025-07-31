import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ImageBackground, SafeAreaView, Image } from 'react-native';
import { Button } from 'react-native-paper';

export default function Index() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={{ uri: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAyADIDASIAAhEBAxEB/8QAGAAAAwEBAAAAAAAAAAAAAAAAAAIDAQT/xAAfEAEAAgICAwEBAQAAAAAAAAABEQIDEgQhMVFBYXH/xAAXAQADAQAAAAAAAAAAAAAAAAAAAQID/8QAFhEBAQEAAAAAAAAAAAAAAAAAAAER/9oADAMBAAIRAxEAPwD00iYiZifTExEzE+mJ48zHhHHmY8JgAGAAAAAAAAAABiWWY9sSyx7YmADAAAAAAAAAAAGBZY9sCyx7YmADAAAAAAAAAAAGBZY9sCyx7YmADAAAAAAAAAAAGBZY9sCyx7YmADAAAAAAAAAAAGBZY9sCyx7YmADAAAAAAAAAAAGBZY9sCyx7YmADAAAAAAAAAAAGBZY9sCyx7YmAD//2Q==' }}
        style={styles.backgroundGradient}
        resizeMode="repeat"
      >
        <View style={styles.content}>
          <Image source={require('../assets/images/icon.png')} style={styles.logo} />
          <Text style={styles.title}>Smart Kitchen</Text>
          <Text style={styles.subtitle}>Your personal pantry assistant.</Text>

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={() => router.push('/(signup)/login')}
              style={styles.button}
              labelStyle={styles.buttonText}
              buttonColor="#5D4037"
            >
              Login
            </Button>
            <Button
              mode="outlined"
              onPress={() => router.push('/(signup)/signup')}
              style={[styles.button, styles.signupButton]}
              labelStyle={styles.signupButtonText}
            >
              Create Account
            </Button>
          </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    borderRadius: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#F5EFE0',
    fontFamily: 'serif',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#E8E0D0',
    marginBottom: 60,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '80%',
    maxWidth: 300,
  },
  button: {
    marginBottom: 16,
    paddingVertical: 8,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#5D4037',
  },
  signupButton: {
    borderColor: '#F5EFE0',
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupButtonText: {
    color: '#F5EFE0',
  },
});
