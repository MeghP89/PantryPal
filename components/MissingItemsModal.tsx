import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Modal, ScrollView, Dimensions, BackHandler } from 'react-native';
import { Text, Button, Card, TextInput, List, Chip, Divider, IconButton, Portal, Snackbar, useTheme } from 'react-native-paper';
import { controlShoppingList } from '../utils/shoppingListControlAgent';
import { handleUseRecipe, Recipe, MissingItem } from '../utils/useRecipe';
import { theme as appTheme } from '../utils/theme';

interface MissingItemsModalProps {
  visible: boolean;
  onClose: () => void;
  recipe: Recipe | null;
}

type ModalStep = 'loading' | 'initial' | 'contextNeeded' | 'final' | 'readyForUse';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function MissingItemsModal({ visible, onClose, recipe }: MissingItemsModalProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const [step, setStep] = useState<ModalStep>('loading');
  const [missingItems, setMissingItems] = useState<MissingItem[]>([]);
  const [aiResponse, setAiResponse] = useState('');
  const [userInput, setUserInput] = useState('');
  const [resultMessage, setResultMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [inputError, setInputError] = useState('');

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visible && !loading) {
        handleClose();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [visible, loading]);

  useEffect(() => {
    if (visible && recipe) {
      checkRecipeIngredients();
    } else {
      resetState();
    }
  }, [visible, recipe]);

  const resetState = useCallback(() => {
    setStep('loading');
    setMissingItems([]);
    setAiResponse('');
    setUserInput('');
    setResultMessage('');
    setLoading(false);
    setInputError('');
    setSnackbarVisible(false);
    setSnackbarMessage('');
  }, []);

  const handleClose = useCallback(() => {
    if (!loading) {
      onClose();
    }
  }, [loading, onClose]);

  const showSnackbar = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  const checkRecipeIngredients = async () => {
    if (!recipe) {
      setResultMessage('No recipe provided.');
      setStep('final');
      return;
    }

    setLoading(true);
    setStep('loading');
    
    try {
      const result = await handleUseRecipe(recipe);
      if (result.success) {
        setResultMessage(`✅ Great! You have all the ingredients for ${recipe.recipeName}!`);
        setStep('readyForUse');
        showSnackbar('All ingredients available!');
      } else if (result.missingOrInsufficient && result.missingOrInsufficient.length > 0) {
        setMissingItems(result.missingOrInsufficient);
        setStep('initial');
      } else {
        setResultMessage(result.error || '❌ An unknown error occurred while checking ingredients.');
        setStep('final');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check ingredients';
      setResultMessage(`❌ Error: ${errorMessage}`);
      setStep('final');
      showSnackbar('Failed to check ingredients');
    } finally {
      setLoading(false);
    }
  };

  const validateInput = (input: string): boolean => {
    if (!input.trim()) {
      setInputError('Please provide an answer');
      return false;
    }
    if (input.trim().length < 2) {
      setInputError('Please provide a more detailed answer');
      return false;
    }
    setInputError('');
    return true;
  };

  const handleAddToShoppingList = async (prompt?: string) => {
    setLoading(true);
    let currentPrompt = prompt;

    if (!currentPrompt) {
      const itemsString = missingItems
        .map(item => `${item.name} (${item.reason === 'missing' ? 'missing' : `need ${item.shortfall} more`})`)
        .join(', ');
      currentPrompt = `Please add the following items to my shopping list for the recipe "${recipe?.recipeName}" that uses ${recipe?.recipeIngredients} and is missing: ${itemsString}. Use appropriate quantities and units and only add the missing ingredients.`;
    }

    try {
      const response = await controlShoppingList(currentPrompt);
      
      if (response.includes('?')) {
        setAiResponse(response);
        setStep('contextNeeded');
      } else {
        setResultMessage(`✅ ${response}`);
        setStep('final');
        showSnackbar('Items added to shopping list!');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      setResultMessage(`❌ Error: ${errorMessage}`);
      setStep('final');
      showSnackbar('Failed to add items to shopping list');
    } finally {
      setLoading(false);
    }
  };

  const handleContextSubmit = () => {
    if (!validateInput(userInput)) {
      return;
    }

    const newPrompt = `${aiResponse}\n\nMy answer: ${userInput.trim()}`;
    setUserInput('');
    setInputError('');
    handleAddToShoppingList(newPrompt);
  };

  const handleGoBack = () => {
    if (step === 'contextNeeded') {
      setStep('initial');
      setUserInput('');
      setInputError('');
      setAiResponse('');
    } else if (step === 'final') {
      if (missingItems.length > 0) {
        setStep('initial');
      } else {
        handleClose();
      }
      setResultMessage('');
    }
  };

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
      <Text style={styles.loadingText}>Checking ingredients...</Text>
    </View>
  );

  const renderInitialState = () => (
    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Missing Ingredients</Text>
        <Text style={styles.subtitle}>For {recipe?.recipeName}</Text>
      </View>
      
      <View style={styles.statsContainer}>
        <Chip icon="alert-circle-outline" style={styles.statsChip}>
          {missingItems.length} items needed
        </Chip>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.itemsContainer}>
        {missingItems.map((item, index) => (
          <Card key={index} style={styles.itemCard} mode="outlined">
            <List.Item
              title={item.name}
              description={
                item.reason === 'missing' 
                  ? 'Not in pantry' 
                  : `Need ${item.shortfall} more`
              }
              left={props => (
                <List.Icon 
                  {...props} 
                  icon={item.reason === 'missing' ? 'minus-circle' : 'alert-circle-outline'}
                  color={item.reason === 'missing' ? theme.colors.error : theme.colors.accent}
                />
              )}
              titleStyle={styles.itemTitle}
              descriptionStyle={styles.itemDescription}
            />
          </Card>
        ))}
      </View>

      <View style={styles.actionsContainer}>
        <Button 
          mode="outlined" 
          onPress={handleClose}
          style={styles.secondaryButton}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          mode="contained" 
          onPress={() => handleAddToShoppingList()} 
          loading={loading} 
          disabled={loading}
          style={styles.primaryButton}
          icon="cart-plus"
        >
          Add to Shopping List
        </Button>
      </View>
    </ScrollView>
  );

  const renderContextNeededState = () => (
    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <IconButton 
          icon="arrow-left" 
          onPress={handleGoBack} 
          disabled={loading}
          style={styles.backButton}
        />
        <Text style={styles.title}>Additional Information Needed</Text>
      </View>

      <Card style={styles.questionCard} mode="outlined">
        <Card.Content>
          <Text style={styles.aiQuestion}>{aiResponse}</Text>
        </Card.Content>
      </Card>

      <TextInput
        label="Your Answer"
        value={userInput}
        onChangeText={(text) => {
          setUserInput(text);
          if (inputError) setInputError('');
        }}
        mode="outlined"
        style={styles.input}
        disabled={loading}
        error={!!inputError}
        multiline
        numberOfLines={3}
        placeholder="Please provide the requested information..."
      />
      
      {inputError ? (
        <Text style={styles.errorText}>{inputError}</Text>
      ) : null}

      <View style={styles.actionsContainer}>
        <Button 
          mode="outlined" 
          onPress={handleGoBack}
          style={styles.secondaryButton}
          disabled={loading}
        >
          Back
        </Button>
        <Button 
          mode="contained" 
          onPress={handleContextSubmit} 
          loading={loading} 
          disabled={loading || !userInput.trim()}
          style={styles.primaryButton}
          icon="send"
        >
          Submit
        </Button>
      </View>
    </ScrollView>
  );

  const renderFinalUseState = () => (
    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        {missingItems.length > 0 && (
          <IconButton 
            icon="arrow-left" 
            onPress={handleGoBack}
            style={styles.backButton}
          />
        )}
        <Text style={styles.title}>
          Ready To Use
        </Text>
      </View>

      <Card style={styles.resultCard} mode="outlined">
        <Card.Content>
          <Text style={styles.resultMessage}>{resultMessage}</Text>
        </Card.Content>
      </Card>

      <View style={styles.actionsContainer}>
        <Button 
          mode="contained" 
          onPress={handleClose}
          style={styles.primaryButton}
          icon="check"
        >
          Use Pantry Items
        </Button>
      </View>
    </ScrollView>
  );

  const renderFinalState = () => (
    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        {missingItems.length > 0 && (
          <IconButton 
            icon="arrow-left" 
            onPress={handleGoBack}
            style={styles.backButton}
          />
        )}
        <Text style={styles.title}>
          {resultMessage.startsWith('✅') ? 'Success!' : 
           resultMessage.startsWith('❌') ? 'Error' : 'Complete'}
        </Text>
      </View>

      <Card style={styles.resultCard} mode="outlined">
        <Card.Content>
          <Text style={styles.resultMessage}>Added Items To Grocery List!</Text>
        </Card.Content>
      </Card>

      <View style={styles.actionsContainer}>
        {missingItems.length > 0 && !resultMessage.startsWith('❌') && (
          <Button 
            mode="outlined" 
            onPress={handleGoBack}
            style={styles.secondaryButton}
            icon="arrow-left"
          >
            Back to Items
          </Button>
        )}
        <Button 
          mode="contained" 
          onPress={handleClose}
          style={styles.primaryButton}
          icon="check"
        >
          Done
        </Button>
      </View>
    </ScrollView>
  );

  const renderContent = () => {
    switch (step) {
      case 'loading':
        return renderLoadingState();
      case 'initial':
        return renderInitialState();
      case 'contextNeeded':
        return renderContextNeededState();
      case 'final':
        return renderFinalState();
      case 'readyForUse':
        return renderFinalUseState();
      default:
        return null;
    }
  };

  return (
    <Portal>
      <Modal
        transparent={true}
        animationType="slide"
        visible={visible}
        onRequestClose={handleClose}
      >
        <View style={styles.overlay}>
          <Card style={styles.modalCard}>
            {renderContent()}
          </Card>
        </View>
      </Modal>
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </Portal>
  );
}

const createStyles = (theme: typeof appTheme) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 20,
  },
  modalCard: {
    width: Math.min(SCREEN_WIDTH - 40, 400),
    maxHeight: SCREEN_HEIGHT * 0.85,
    borderRadius: theme.roundness,
    elevation: 8,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  backButton: {
    marginRight: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.secondaryText,
    marginTop: 4,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.secondaryText,
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  statsChip: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surface,
  },
  divider: {
    marginHorizontal: 20,
    marginVertical: 10,
    backgroundColor: theme.colors.borderColor,
  },
  itemsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  itemCard: {
    marginBottom: 8,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderColor,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  itemDescription: {
    fontSize: 14,
    color: theme.colors.secondaryText,
  },
  questionCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderColor,
  },
  aiQuestion: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text,
  },
  input: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  resultCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderColor,
  },
  resultMessage: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: theme.colors.text,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 10,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
  },
  secondaryButton: {
    flex: 1,
  },
  snackbar: {
    bottom: 100,
    backgroundColor: theme.colors.accent,
  },
});