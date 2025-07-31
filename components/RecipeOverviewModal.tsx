import React, { useState } from 'react';
import { View, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, IconButton, Chip, Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { handleUseRecipe } from '@/utils/useRecipe';

type Recipe = {
  recipeId: string;
  recipeName: string;
  recipeDescription: string;
  recipeDifficulty: string;
  timeEstimate: string;
  recipeIngredients: {
    name: string,
    amount: string
  }[];
  recipeSteps: {
    step: number;
    description: string;
  }[];
};

type RecipeOverviewModalProps = {
  recipe: Recipe | null;
  onClose: () => void;
};

const Section = ({ title, children }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.section}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <MaterialIcons name={expanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={24} color="#5D4037" />
      </TouchableOpacity>
      {expanded && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
};

export default function RecipeOverviewModal({ recipe, onClose }: RecipeOverviewModalProps) {
  const [loading, setLoading] = useState(false);

  if (!recipe) return null;

  const onUseRecipe = async () => {
    if (!recipe) return;
    setLoading(true);
    const result = await handleUseRecipe(recipe);
    if (result.success) {
      onClose();
    }
    setLoading(false);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={!!recipe}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <Card style={styles.modalCard}>
          <ScrollView>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{recipe.recipeName}</Text>
              <IconButton icon="close" size={20} onPress={onClose} style={styles.closeButton} />
            </View>
            <View style={styles.infoChips}>
              <Chip icon="gauge" style={styles.chip}>{recipe.recipeDifficulty}</Chip>
              <Chip icon="clock-outline" style={styles.chip}>{recipe.timeEstimate}</Chip>
            </View>
            <Text style={styles.description}>{recipe.recipeDescription}</Text>
            
            <Section title="Ingredients">
              {recipe.recipeIngredients.map((ing, index) => (
                <View key={index} style={styles.stepItem}>
                    <Text style={styles.ingredientItem}>{ing.name}</Text>
                    <Text style={styles.ingredientAmount}>{ing.amount}</Text>
                </View>
              ))}
            </Section>
            
            <Section title="Steps">
              {recipe.recipeSteps.map((step, index) => (
                <View key={index} style={styles.stepItem}>
                  <Text style={styles.stepNumber}>Step {step.step}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              ))}
            </Section>
          </ScrollView>
          <Card.Actions style={styles.actions}>
            <Button onPress={onClose} disabled={loading}>Close</Button>
            <Button mode="contained" onPress={onUseRecipe} loading={loading} disabled={loading}>
              Use Recipe
            </Button>
          </Card.Actions>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalCard: {
    justifyContent: 'center',
    width: '100%',
    maxHeight: '100%',
    backgroundColor: '#F5EFE0',
    borderRadius: 15,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D0',
    paddingBottom: 10,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5D4037',
    flex: 1,
  },
  closeButton: {
    margin: -8,
    marginRight: 10
  },
  infoChips: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  chip: {
    backgroundColor: '#E8E0D0',
  },
  description: {
    fontSize: 16,
    color: '#8A655A',
    marginBottom: 20,
    lineHeight: 22,
  },
  section: {
    backgroundColor: 'rgba(138, 101, 90, 0.1)',
    borderRadius: 10,
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5D4037',
  },
  sectionContent: {
    padding: 15,
    paddingTop: 0,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D0',
  },
  ingredientName: {
    fontSize: 16,
    color: '#5D4037',
  },
  ingredientAmount: {
    fontSize: 16,
    color: '#8A655A',
  },
  stepItem: {
    marginBottom: 15,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5D4037',
    marginBottom: 5,
  },
  stepDescription: {
    fontSize: 16,
    color: '#8A655A',
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E8E0D0',
  },
});
