import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  ActivityIndicator, 
  Modal, 
  ScrollView, 
  Dimensions, 
  BackHandler,
  Alert 
} from 'react-native';
import { 
  Text, 
  Button, 
  Card, 
  List, 
  Chip, 
  Divider, 
  IconButton, 
  Portal, 
  Snackbar, 
  useTheme 
} from 'react-native-paper';
import { supabase } from '../utils/supabase';
import { handleUseRecipe, Recipe, MissingItem } from '../utils/useRecipe';
import { theme as appTheme } from '../utils/theme';

interface MissingItemsModalProps {
  visible: boolean;
  onClose: () => void;
  recipe: Recipe | null;
}

type ModalStep = 'loading' | 'initial' | 'final' | 'readyForUse';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Constants for better maintainability
const MODAL_ANIMATION_DURATION = 300;
const SNACKBAR_DURATION = 3000;
const MAX_MODAL_WIDTH = 400;
const MODAL_HEIGHT_RATIO = 0.85;

export default function MissingItemsModal({ visible, onClose, recipe }: MissingItemsModalProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // State management
  const [step, setStep] = useState<ModalStep>('loading');
  const [missingItems, setMissingItems] = useState<MissingItem[]>([]);
  const [resultMessage, setResultMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Memoized values
  const modalDimensions = useMemo(() => ({
    width: Math.min(SCREEN_WIDTH - 40, MAX_MODAL_WIDTH),
    maxHeight: SCREEN_HEIGHT * MODAL_HEIGHT_RATIO,
  }), []);

  const hasAllIngredients = useMemo(() => 
    step === 'readyForUse' && missingItems.length === 0, 
    [step, missingItems.length]
  );

  // Handle Android back button with cleanup
  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!loading) {
        handleClose();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [visible, loading, handleClose]);

  // Main effect for modal visibility changes
  useEffect(() => {
    if (visible && recipe) {
      checkRecipeIngredients();
    } else if (!visible) {
      // Small delay to allow modal animation to complete before resetting
      const timeoutId = setTimeout(resetState, MODAL_ANIMATION_DURATION);
      return () => clearTimeout(timeoutId);
    }
  }, [visible, recipe]);

  const resetState = useCallback(() => {
    setStep('loading');
    setMissingItems([]);
    setResultMessage('');
    setLoading(false);
    setSnackbarVisible(false);
    setSnackbarMessage('');
  }, []);

  const handleClose = useCallback(() => {
    if (loading) {
      Alert.alert(
        'Operation in Progress',
        'Please wait for the current operation to complete before closing.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }
    onClose();
  }, [loading, onClose]);

  const showSnackbar = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  const checkRecipeIngredients = useCallback(async () => {
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
      } else if (result.missingOrInsufficient?.length > 0) {
        setMissingItems(result.missingOrInsufficient);
        setStep('initial');
      } else {
        const errorMsg = result.error || 'An unknown error occurred while checking ingredients.';
        setResultMessage(`❌ ${errorMsg}`);
        setStep('final');
      }
    } catch (error) {
      console.error('Error checking recipe ingredients:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to check ingredients';
      setResultMessage(`❌ Error: ${errorMessage}`);
      setStep('final');
      showSnackbar('Failed to check ingredients');
    } finally {
      setLoading(false);
    }
  }, [recipe, showSnackbar]);

  const parseQuantityFromShortfall = useCallback((shortfall: string) => {
    const parts = shortfall.trim().split(' ');
    const numericPart = parseFloat(parts[0]);
    
    if (isNaN(numericPart)) {
      return { quantity: 1, unit: 'units' };
    }
    
    return {
      quantity: numericPart,
      unit: parts.length > 1 ? parts.slice(1).join(' ') : 'units'
    };
  }, []);

  const updateExistingShoppingItem = useCallback(async (
    existingItem: any, 
    additionalQuantity: number
  ) => {
    const { error } = await supabase
      .from('shopping_list')
      .update({ quantity: existingItem.quantity + additionalQuantity })
      .eq('id', existingItem.id);
    
    if (error) {
      console.error('Error updating shopping list item:', error);
      throw new Error(`Failed to update ${existingItem.item_name}`);
    }
  }, []);

  const insertNewShoppingItem = useCallback(async (
    userId: string,
    item: MissingItem,
    quantity: number,
    unit: string
  ) => {
    const newItem = {
      user_id: userId,
      item_name: item.name,
      quantity,
      unit,
      category: 'Misc',
      priority: 'medium',
      is_completed: false,
    };

    const { error } = await supabase
      .from('shopping_list')
      .insert([newItem]);
    
    if (error) {
      console.error('Error inserting shopping list item:', error);
      throw new Error(`Failed to add ${item.name}`);
    }
  }, []);

  const handleAddToShoppingList = useCallback(async () => {
    if (missingItems.length === 0) {
      showSnackbar('No items to add');
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Please log in to add items to your shopping list");
      }

      const errors: string[] = [];

      for (const item of missingItems) {
        try {
          const { quantity, unit } = item.shortfall 
            ? parseQuantityFromShortfall(item.shortfall)
            : { quantity: 1, unit: 'units' };
          
          // Check for existing item (case-insensitive)
          const { data: existingItem, error: fetchError } = await supabase
            .from('shopping_list')
            .select('id, quantity, item_name')
            .eq('user_id', session.user.id)
            .ilike('item_name', item.name)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error checking existing item:', fetchError);
            errors.push(`Failed to check ${item.name}`);
            continue;
          }

          if (existingItem) {
            await updateExistingShoppingItem(existingItem, quantity);
          } else {
            await insertNewShoppingItem(session.user.id, item, quantity, unit);
          }
        } catch (itemError) {
          const errorMsg = itemError instanceof Error ? itemError.message : `Failed to process ${item.name}`;
          errors.push(errorMsg);
        }
      }

      if (errors.length > 0) {
        const errorMessage = errors.length === missingItems.length 
          ? 'Failed to add all items to shopping list'
          : `Some items couldn't be added: ${errors.join(', ')}`;
        
        setResultMessage(`⚠️ ${errorMessage}`);
        showSnackbar('Some items failed to add');
      } else {
        setResultMessage('✅ All items successfully added to your shopping list!');
        showSnackbar('Items added to shopping list!');
      }

      setStep('final');

    } catch (error) {
      console.error('Shopping list error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setResultMessage(`❌ Error: ${errorMessage}`);
      setStep('final');
      showSnackbar('Failed to add items to shopping list');
    } finally {
      setLoading(false);
    }
  }, [missingItems, parseQuantityFromShortfall, updateExistingShoppingItem, insertNewShoppingItem, showSnackbar]);

  const handleGoBack = useCallback(() => {
    if (step === 'final' && missingItems.length > 0) {
      setStep('initial');
      setResultMessage('');
    } else {
      handleClose();
    }
  }, [step, missingItems.length, handleClose]);

  // Render methods
  const renderLoadingState = useCallback(() => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator 
        animating={true} 
        size="large" 
        color={theme.colors.primary}
        accessibilityLabel="Checking ingredients"
      />
      <Text style={styles.loadingText}>Checking ingredients...</Text>
    </View>
  ), [styles, theme.colors.primary]);

  const renderMissingItemCard = useCallback((item: MissingItem, index: number) => {
    const isMissing = item.reason === 'missing';
    const description = isMissing ? 'Not in pantry' : `Need ${item.shortfall} more`;
    const iconName = isMissing ? 'minus-circle' : 'alert-circle-outline';
    const iconColor = isMissing ? theme.colors.error : theme.colors.accent;

    return (
      <Card 
        key={`${item.name}-${index}`} 
        style={styles.itemCard} 
        mode="outlined"
        accessible={true}
        accessibilityLabel={`${item.name}, ${description}`}
      >
        <List.Item
          title={item.name}
          description={description}
          left={props => (
            <List.Icon 
              {...props} 
              icon={iconName}
              color={iconColor}
            />
          )}
          titleStyle={styles.itemTitle}
          descriptionStyle={styles.itemDescription}
        />
      </Card>
    );
  }, [theme.colors.error, theme.colors.accent, styles]);

  const renderInitialState = useCallback(() => (
    <ScrollView 
      style={styles.scrollContainer} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Missing Ingredients
        </Text>
        <Text style={styles.subtitle}>For {recipe?.recipeName}</Text>
      </View>
      
      <View style={styles.statsContainer}>
        <Chip 
          icon="alert-circle-outline" 
          style={styles.statsChip}
          textStyle={styles.chipText}
        >
          {missingItems.length} item{missingItems.length !== 1 ? 's' : ''} needed
        </Chip>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.itemsContainer}>
        {missingItems.map(renderMissingItemCard)}
      </View>

      <View style={styles.actionsContainer}>
        <Button 
          mode="outlined" 
          onPress={handleClose}
          style={styles.secondaryButton}
          disabled={loading}
          accessibilityLabel="Cancel and close modal"
        >
          Cancel
        </Button>
        <Button 
          mode="contained" 
          onPress={handleAddToShoppingList} 
          loading={loading} 
          disabled={loading}
          style={styles.primaryButton}
          icon="cart-plus"
          accessibilityLabel="Add missing items to shopping list"
        >
          Add to Shopping List
        </Button>
      </View>
    </ScrollView>
  ), [styles, recipe, missingItems, loading, handleClose, handleAddToShoppingList, renderMissingItemCard]);

  const renderFinalUseState = useCallback(() => (
    <ScrollView 
      style={styles.scrollContainer} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Ready To Cook!
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
          icon="chef-hat"
          accessibilityLabel="Start cooking with available ingredients"
        >
          Start Cooking
        </Button>
      </View>
    </ScrollView>
  ), [styles, resultMessage, handleClose]);

  const renderFinalState = useCallback(() => (
    <ScrollView 
      style={styles.scrollContainer} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        {missingItems.length > 0 && (
          <IconButton 
            icon="arrow-left" 
            onPress={handleGoBack}
            style={styles.backButton}
            accessibilityLabel="Go back to missing items list"
          />
        )}
        <Text style={styles.title} accessibilityRole="header">
          {resultMessage.startsWith('✅') ? 'Success!' : 
           resultMessage.startsWith('❌') ? 'Error' : 
           resultMessage.startsWith('⚠️') ? 'Partial Success' : 'Complete'}
        </Text>
      </View>

      <Card style={styles.resultCard} mode="outlined">
        <Card.Content>
          <Text style={styles.resultMessage}>{resultMessage}</Text>
        </Card.Content>
      </Card>

      <View style={styles.actionsContainer}>
        {missingItems.length > 0 && !resultMessage.startsWith('❌') && (
          <Button 
            mode="outlined" 
            onPress={handleGoBack}
            style={styles.secondaryButton}
            icon="arrow-left"
            accessibilityLabel="Go back to missing items"
          >
            Back to Items
          </Button>
        )}
        <Button 
          mode="contained" 
          onPress={handleClose}
          style={styles.primaryButton}
          icon="check"
          accessibilityLabel="Close modal"
        >
          Done
        </Button>
      </View>
    </ScrollView>
  ), [styles, missingItems.length, resultMessage, handleGoBack, handleClose]);

  const renderContent = useCallback(() => {
    switch (step) {
      case 'loading':
        return renderLoadingState();
      case 'initial':
        return renderInitialState();
      case 'final':
        return renderFinalState();
      case 'readyForUse':
        return renderFinalUseState();
      default:
        return null;
    }
  }, [step, renderLoadingState, renderInitialState, renderFinalState, renderFinalUseState]);

  return (
    <Portal>
      <Modal
        transparent={true}
        animationType="slide"
        visible={visible}
        onRequestClose={handleClose}
        statusBarTranslucent={true}
        accessible={true}
        accessibilityViewIsModal={true}
      >
        <View style={styles.overlay}>
          <Card 
            style={[styles.modalCard, modalDimensions]}
            accessible={true}
            accessibilityLabel="Missing ingredients modal"
          >
            {renderContent()}
          </Card>
        </View>
      </Modal>
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={SNACKBAR_DURATION}
        style={styles.snackbar}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
        }}
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
    borderRadius: theme.roundness,
    elevation: 8,
    backgroundColor: theme.colors.background,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  scrollContainer: {
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  backButton: {
    position: 'absolute',
    left: 8,
    top: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.secondaryText,
    marginTop: 4,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.secondaryText,
    textAlign: 'center',
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  statsChip: {
    backgroundColor: theme.colors.surface,
  },
  chipText: {
    fontSize: 12,
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