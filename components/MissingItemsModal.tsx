import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { Text, Button, Card, TextInput, List } from 'react-native-paper';
import { controlShoppingList } from '../utils/shoppingListControlAgent';
import { handleUseRecipe, Recipe, MissingItem } from '../utils/useRecipe';

interface MissingItemsModalProps {
  visible: boolean;
  onClose: () => void;
  recipe: Recipe | null;
}

type ModalStep = 'loading' | 'initial' | 'contextNeeded' | 'final';

export default function MissingItemsModal({ visible, onClose, recipe }: MissingItemsModalProps) {
  const [step, setStep] = useState<ModalStep>('loading');
  const [missingItems, setMissingItems] = useState<MissingItem[]>([]);
  const [aiResponse, setAiResponse] = useState('');
  const [userInput, setUserInput] = useState('');
  const [resultMessage, setResultMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && recipe) {
      checkRecipeIngredients();
    } else {
      resetState();
    }
  }, [visible, recipe]);

  const resetState = () => {
    setStep('loading');
    setMissingItems([]);
    setAiResponse('');
    setUserInput('');
    setResultMessage('');
    setLoading(false);
  };

  const checkRecipeIngredients = async () => {
    if (!recipe) return;
    setLoading(true);
    setStep('loading');
    const result = await handleUseRecipe(recipe);
    if (result.success) {
      setResultMessage(`You have all the ingredients for ${recipe.recipeName}!`);
      setStep('final');
    } else if (result.missingOrInsufficient) {
      setMissingItems(result.missingOrInsufficient);
      setStep('initial');
    } else {
      setResultMessage(result.error || 'An unknown error occurred.');
      setStep('final');
    }
    setLoading(false);
  };

  const handleAddToShoppingList = async (prompt?: string) => {
    setLoading(true);
    let currentPrompt = prompt;

    if (!currentPrompt) {
      const itemsString = missingItems.map(item => `${item.name} (${item.reason === 'missing' ? 'missing' : `short by ${item.shortfall}`})`).join(', ');
      currentPrompt = `Please add the following items to my shopping list: ${itemsString}.`;
    }

    try {
      const response = await controlShoppingList(currentPrompt);
      if (response.includes('?')) {
        setAiResponse(response);
        setStep('contextNeeded');
      } else {
        setResultMessage(response);
        setStep('final');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      setResultMessage(`Error: ${errorMessage}`);
      setStep('final');
    } finally {
      setLoading(false);
    }
  };

  const handleContextSubmit = () => {
    const newPrompt = `${aiResponse}\n\nMy answer is: ${userInput}`;
    setUserInput('');
    handleAddToShoppingList(newPrompt);
  };

  const renderContent = () => {
    if (loading && step === 'loading') {
      return <ActivityIndicator animating={true} size="large" style={{ marginVertical: 20 }} />;
    }

    switch (step) {
      case 'initial':
        return (
          <>
            <Card.Title title="Missing Ingredients" subtitle={`For ${recipe?.recipeName}`} />
            <Card.Content>
              <List.Section>
                {missingItems.map((item, index) => (
                  <List.Item
                    key={index}
                    title={item.name}
                    description={item.reason === 'missing' ? 'Not in pantry' : `Insufficient, short by ${item.shortfall}`}
                    left={props => <List.Icon {...props} icon="alert-circle-outline" />}
                  />
                ))}
              </List.Section>
            </Card.Content>
            <Card.Actions>
              <Button onPress={onClose}>Cancel</Button>
              <Button mode="contained" onPress={() => handleAddToShoppingList()} loading={loading} disabled={loading}>
                Add to List
              </Button>
            </Card.Actions>
          </>
        );

      case 'contextNeeded':
        return (
          <>
            <Card.Title title="AI Needs More Information" />
            <Card.Content>
              <Text style={styles.aiQuestion}>{aiResponse}</Text>
              <TextInput
                label="Your Answer"
                value={userInput}
                onChangeText={setUserInput}
                mode="outlined"
                style={styles.input}
                disabled={loading}
              />
            </Card.Content>
            <Card.Actions>
              <Button onPress={onClose}>Cancel</Button>
              <Button mode="contained" onPress={handleContextSubmit} loading={loading} disabled={loading}>
                Submit
              </Button>
            </Card.Actions>
          </>
        );

      case 'final':
        return (
          <>
            <Card.Title title={resultMessage.startsWith('Error') ? "Error" : "Success"} />
            <Card.Content>
              <Text>{resultMessage}</Text>
            </Card.Content>
            <Card.Actions>
              <Button mode="contained" onPress={onClose}>Close</Button>
            </Card.Actions>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      transparent={true}
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <Card style={styles.card}>
          {renderContent()}
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  card: {
    width: '90%',
    padding: 10,
  },
  input: {
    marginTop: 20,
  },
  aiQuestion: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 10,
  },
});