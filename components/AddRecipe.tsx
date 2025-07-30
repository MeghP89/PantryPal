import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Button,
  Card,
  Checkbox,
  TextInput,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { supabase } from '../utils/supabase';
import { generateRecipe } from '@/utils/generateRecipe';

type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  total_servings: number;
  unit: string;
  amount: number;
};

type Props = {
  onRecipeCreated: () => void;
};

export default function AddRecipe({ onRecipeCreated }: Props) {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<InventoryItem[]>([]);
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) throw new Error("User not found");

        const { data, error } = await supabase
          .from('nutritional_items')
          .select('itemid, item_name, item_quantity, serving_unit, total_servings')
          .eq('userid', session.user.id);

        if (error) throw error;

        if (data) {
          const formattedItems: InventoryItem[] = data.map((item) => ({
            id: item.itemid,
            name: item.item_name,
            quantity: item.item_quantity,
            unit: item.serving_unit,
            total_servings: item.total_servings,
            amount: item.total_servings * item.item_quantity
          }));
          setInventoryItems(formattedItems);
        }
      } catch (error) {
        if (error instanceof Error) {
          Alert.alert("Error", "Failed to fetch inventory items.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  const handleToggleItem = (item: InventoryItem) => {
    setSelectedItems((prev) => {
      const exists = prev.some((selected) => selected.id === item.id);
      if (exists) {
        // Remove item by filtering out the one with the same id
        return prev.filter((selected) => selected.id !== item.id);
      } else {
        // Add the new item
        return [...prev, item];
      }
    });
  };

  const createRecipe = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) throw new Error("User not found");
    const userId = session.user.id;
    try {
      setLoading(true);
      const parsedRecipe = await generateRecipe(selectedItems, userId, instructions);
      const itemToSave = {
        user_id: userId,
        recipe_name: parsedRecipe.recipeName,
        recipe_description: parsedRecipe.recipeDescription,
        recipe_ingredients: parsedRecipe.ingredients,
        recipe_steps: parsedRecipe.recipeSteps,
        time_estimate: parsedRecipe.timeEstimate,
        recipe_difficulty: parsedRecipe.recipeDifficulty
      }
      if (parsedRecipe) {
        const { data, error } = await supabase
          .from('recipes')
          .insert([itemToSave])
      }
    } catch (error) {
      Alert.alert("Error", "Failed to create recipe.");
      console.log(error)
    } finally {
      setLoading(false);
      onRecipeCreated();
      console.log("Finished")
    }
  }

  const handleCreateRecipe = () => {
    console.log("Creating recipe with the following data:");
    console.log("Selected Item IDs:", selectedItems);
    console.log("Instructions:", instructions);
    Alert.alert(
      "Recipe Created (Placeholder)",
      `Selected ${selectedItems.length} items with instructions: "${instructions}"`
    );
    onRecipeCreated();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator animating={true} size="large" color="#8A655A" />
        <Text style={styles.loadingText}>Loading</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.subheading}>
        Select ingredients from your pantry and add instructions to create a new recipe.
      </Text>

      <Card style={styles.card}>
        <Card.Title title="Select Ingredients" titleStyle={styles.cardTitle} />
        <Card.Content>
          {inventoryItems.length > 0 ? (
            inventoryItems.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Checkbox.Android
                  status={selectedItems.some((selected) => selected.id === item.id) ? 'checked' : 'unchecked'}
                  onPress={() => handleToggleItem(item)}
                  color="#8A655A"
                />
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDetails}>
                  ({item.amount} {item.unit})
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Your inventory is empty.</Text>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Cooking Instructions" titleStyle={styles.cardTitle} />
        <Card.Content>
          <TextInput
            mode="outlined"
            placeholder="Describe the steps to make your dish..."
            value={instructions}
            onChangeText={setInstructions}
            multiline
            numberOfLines={5}
            style={styles.textInput}
            outlineColor="#8A655A"
            activeOutlineColor="#5D4037"
            theme={{ colors: { primary: '#5D4037' } }}
          />
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={() => createRecipe()}
        style={styles.createButton}
        disabled={selectedItems.length === 0 || !instructions}
        icon="silverware-fork-knife"
        labelStyle={{ color: '#F5EFE0' }}
      >
        Create Recipe
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#F5EFE0',
  },
  subheading: {
    fontSize: 16,
    color: '#E8E0D0',
    marginBottom: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  card: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 3,
    backgroundColor: 'rgba(245, 239, 224, 0.95)',
  },
  cardTitle: {
    color: '#5D4037',
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(138, 101, 90, 0.2)',
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: '#5D4037',
  },
  itemDetails: {
    fontSize: 14,
    color: '#8A655A',
  },
  emptyText: {
    textAlign: 'center',
    padding: 16,
    color: '#8A655A',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  createButton: {
    marginTop: 16,
    paddingVertical: 8,
    borderRadius: 30,
    backgroundColor: '#8A655A',
    elevation: 2,
  },
});