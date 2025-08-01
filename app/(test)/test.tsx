import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { controlShoppingList } from '../../utils/shoppingListControlAgent';

export default function TestScreen() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleProcessQuery = async () => {
    if (!prompt.trim()) {
      setResult({ error: 'Please enter a prompt.' });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const response = await controlShoppingList(prompt);
      setResult(response);
    } catch (error) {
      console.error("Error processing query:", error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      setResult({ error: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.card}>
            <Card.Title title="Shopping List AI Test" subtitle="Enter a command for your shopping list" />
            <Card.Content>
              <TextInput
                label="Your Command"
                value={prompt}
                onChangeText={setPrompt}
                mode="outlined"
                multiline
                numberOfLines={4}
                style={styles.input}
                disabled={loading}
              />
              <Button
                mode="contained"
                onPress={handleProcessQuery}
                loading={loading}
                disabled={loading}
                style={styles.button}
              >
                Process Command
              </Button>
              {loading && <ActivityIndicator animating={true} style={styles.loader} />}
              {result && (
                <View style={styles.resultContainer}>
                  <Text style={styles.resultTitle}>Result:</Text>
                  <Text style={styles.resultText}>
                    {JSON.stringify(result, null, 2)}
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    padding: 10,
    backgroundColor: '#ffffff',
  },
  input: {
    marginBottom: 20,
  },
  button: {
    paddingVertical: 8,
  },
  loader: {
    marginTop: 20,
  },
  resultContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e8e8e8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dcdcdc',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resultText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    color: '#333',
  },
});