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
import { supabase } from '../../utils/supabase';

type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
};

export default function RecipesScreen() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
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
          .select('itemid, item_name, item_quantity, serving_unit')
          .eq('userid', session.user.id);

        if (error) throw error;

        if (data) {
          const formattedItems: InventoryItem[] = data.map((item) => ({
            id: item.itemid,
            name: item.item_name,
            quantity: item.item_quantity,
            unit: item.serving_unit,
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

    const subscription = supabase
      .channel("inventory-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "nutritional_items" },
        (payload) => {
          console.log("Change on nutritional_items:", payload);
          fetchInventory();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "nutritional_info" },
        (payload) => {
          console.log("Change on nutritional_info:", payload);
          fetchInventory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);


  const handleToggleItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleCreateRecipe = () => {
    // --- Placeholder for your future implementation ---
    console.log("Creating recipe with the following data:");
    console.log("Selected Item IDs:", selectedItems);
    console.log("Instructions:", instructions);
    Alert.alert(
      "Recipe Created (Placeholder)",
      `Selected ${selectedItems.length} items with instructions: "${instructions}"`
    );
    // --- End of placeholder ---
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading Inventory...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.heading}>Create a New Recipe</Text>
      <Text style={styles.subheading}>
        Select items from your inventory to include in the recipe.
      </Text>

      <Card style={styles.card}>
        <Card.Title title="Your Inventory" titleStyle={styles.cardTitle} />
        <Card.Content>
          {inventoryItems.length > 0 ? (
            inventoryItems.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Checkbox.Android
                  status={selectedItems.includes(item.id) ? 'checked' : 'unchecked'}
                  onPress={() => handleToggleItem(item.id)}
                  color={theme.colors.primary}
                />
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDetails}>
                  ({item.quantity} {item.unit})
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Your inventory is empty.</Text>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Instructions" titleStyle={styles.cardTitle} />
        <Card.Content>
          <TextInput
            mode="outlined"
            label="Cooking Instructions"
            placeholder="e.g., Mix all ingredients and bake at 350°F for 20 minutes."
            value={instructions}
            onChangeText={setInstructions}
            multiline
            numberOfLines={4}
            style={styles.textInput}
            outlineColor={theme.colors.primary}
          />
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={handleCreateRecipe}
        style={styles.createButton}
        disabled={selectedItems.length === 0 || !instructions}
        icon="silverware-fork-knife"
      >
        Create Recipe
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F8E9',
  },
  contentContainer: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F8E9',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#2E7D32',
  },
  heading: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 16,
    color: '#558B2F',
    marginBottom: 24,
    textAlign: 'center',
  },
  card: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
  },
  itemDetails: {
    fontSize: 14,
    color: '#757575',
  },
  emptyText: {
    textAlign: 'center',
    padding: 16,
    color: '#757575',
  },
  textInput: {
    backgroundColor: 'white',
  },
  createButton: {
    marginTop: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
});
