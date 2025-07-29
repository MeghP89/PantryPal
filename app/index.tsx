import { useRouter } from 'expo-router'
import { View, Text, StyleSheet } from 'react-native'
import { Button } from 'react-native-paper'
import { batchInsertItems } from '@/utils/batchInsertItems'

export default function Index() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>Please choose an option to continue</Text>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={() => router.push('/(signup)/signup')}  // navigate programmatically
            style={styles.loginButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonText}
          >
            Sign Up
          </Button>

          <Button
            mode="contained"
            onPress={() => router.push('/(dashboard)/inventory')}  // navigate programmatically
            style={styles.loginButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonText}
          >
            Camera
          </Button>

          <Button
            mode="outlined"
            onPress={() => router.push('/(signup)/login')}  // navigate programmatically
            style={styles.signupButton}
            contentStyle={styles.buttonContent}
            labelStyle={[styles.buttonText, styles.signupButtonText]}
          >
            Login
          </Button>

          <Button
            mode="outlined"
            onPress={batchInsertItems}  // navigate programmatically
            style={styles.signupButton}
            contentStyle={styles.buttonContent}
            labelStyle={[styles.buttonText, styles.signupButtonText]}
          >
            test
          </Button>
        </View>
      </View>
    </View>
  )
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',  // light creamy/off-white like a clean kitchen
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',  // deep green like fresh leaves
    marginBottom: 10,
    fontFamily: 'Helvetica', // simple, clean font
  },
  subtitle: {
    fontSize: 16,
    color: '#4CAF50', // softer green for secondary text
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: 300,
    alignSelf: 'center',
  },
  buttonContent: {
    paddingVertical: 15,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#81C784', // lighter fresh green (like lettuce)
    marginBottom: 20,
  },
  signupButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#388E3C', // darker forest green border
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  signupButtonText: {
    color: '#388E3C',
  },
})
