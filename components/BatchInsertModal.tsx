import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  KeyboardAvoidingView,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  useTheme,
  IconButton,
  Chip,
  Menu,
  Divider,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/utils/supabase';
import LoadingComponent from './LoadingComponent';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type NutritionalItemData = {
  itemName: string;
  ServingUnit: string;
  AmountPerServing: number;
  TotalServings: number;
  ItemCategory:
    | 'Produce' | 'Dairy' | 'Meat' | 'Bakery' | 'Frozen' | 'Beverages'
    | 'Snacks' | 'Canned Goods' | 'Condiments' | 'Grains' | 'Seasonings' | 'Misc';
  CaloriesPerServing: number;
  CalorieUnit: string;
  NutritionalInfo: {
    NutrientName: string;
    NutrientAmount: number;
    NutrientUnit: string;
  }[];
  ItemQuantity?: number;
};

type Props = {
  itemsData: NutritionalItemData[];
  onClear: () => void;
};

const categories = [
  "Produce", "Dairy", "Meat", "Bakery", "Frozen", "Beverages",
  "Snacks", "Canned Goods", "Condiments", "Grains", "Seasonings", "Misc"
];

const servingUnits = [
  "cup", "tbsp", "tsp", "oz", "fl oz", "lb", "g", "kg", "ml", "l", 
  "piece", "slice", "serving", "container", "package", "can", "bottle"
];

const EditableItem = ({ item, onUpdate, isExpanded, onExpand, onRemove }) => {
  const theme = useTheme();
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [servingUnitMenuVisible, setServingUnitMenuVisible] = useState(false);

  const updateField = (field, value) => {
    onUpdate({ ...item, [field]: value });
  };

  const updateNutrient = (nutrientIndex, field, value) => {
    const updatedNutrients = item.NutritionalInfo.map((nutrient, i) =>
      i === nutrientIndex ? { ...nutrient, [field]: value } : nutrient
    );
    onUpdate({ ...item, NutritionalInfo: updatedNutrients });
  };

  const addNutrient = () => {
    const newNutrient = {
      NutrientName: '',
      NutrientAmount: 0,
      NutrientUnit: 'g'
    };
    onUpdate({ 
      ...item, 
      NutritionalInfo: [...item.NutritionalInfo, newNutrient] 
    });
  };

  const removeNutrient = (nutrientIndex) => {
    const updatedNutrients = item.NutritionalInfo.filter((_, i) => i !== nutrientIndex);
    onUpdate({ ...item, NutritionalInfo: updatedNutrients });
  };

  return (
    <Card style={styles.itemCard}>
      <TouchableOpacity onPress={onExpand}>
        <Card.Title
          title={item.itemName || "New Item"}
          subtitle={`${item.ItemCategory} • Qty: ${item.ItemQuantity || 0} • ${item.AmountPerServing || 0} ${item.ServingUnit || 'serving'}`}
          right={(props) => (
            <View style={{ flexDirection: 'row' }}>
              <IconButton {...props} icon={isExpanded ? "chevron-up" : "chevron-down"} />
              <IconButton {...props} icon="delete" onPress={onRemove} />
            </View>
          )}
        />
      </TouchableOpacity>
      
      {isExpanded && (
        <Card.Content>
          {/* Basic Item Information */}
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <TextInput
            label="Item Name"
            value={item.itemName}
            onChangeText={(text) => updateField('itemName', text)}
            style={styles.input}
          />

          <View style={styles.row}>
            <TextInput
              label="Item Quantity"
              value={String(item.ItemQuantity || 1)}
              onChangeText={(text) => updateField('ItemQuantity', parseInt(text) || 0)}
              keyboardType="numeric"
              style={[styles.input, styles.halfWidth]}
            />
            
            <Menu
              visible={categoryMenuVisible}
              onDismiss={() => setCategoryMenuVisible(false)}
              anchor={
                <TouchableOpacity 
                  onPress={() => setCategoryMenuVisible(true)}
                  style={[styles.input, styles.halfWidth, styles.menuButton]}
                >
                  <Text style={styles.menuButtonText}>
                    {item.ItemCategory || 'Select Category'}
                  </Text>
                </TouchableOpacity>
              }
            >
              {categories.map((category) => (
                <Menu.Item
                  key={category}
                  onPress={() => {
                    updateField('ItemCategory', category);
                    setCategoryMenuVisible(false);
                  }}
                  title={category}
                />
              ))}
            </Menu>
          </View>

          {/* Serving Information */}
          <Text style={styles.sectionTitle}>Serving Information</Text>
          
          <View style={styles.row}>
            <TextInput
              label="Amount Per Serving"
              value={String(item.AmountPerServing || 0)}
              onChangeText={(text) => updateField('AmountPerServing', parseFloat(text) || 0)}
              keyboardType="numeric"
              style={[styles.input, styles.halfWidth]}
            />
            
            <Menu
              visible={servingUnitMenuVisible}
              onDismiss={() => setServingUnitMenuVisible(false)}
              anchor={
                <TouchableOpacity 
                  onPress={() => setServingUnitMenuVisible(true)}
                  style={[styles.input, styles.halfWidth, styles.menuButton]}
                >
                  <Text style={styles.menuButtonText}>
                    {item.ServingUnit || 'Select Unit'}
                  </Text>
                </TouchableOpacity>
              }
            >
              {servingUnits.map((unit) => (
                <Menu.Item
                  key={unit}
                  onPress={() => {
                    updateField('ServingUnit', unit);
                    setServingUnitMenuVisible(false);
                  }}
                  title={unit}
                />
              ))}
            </Menu>
          </View>

          <View style={styles.row}>
            <TextInput
              label="Total Servings"
              value={String(item.TotalServings || 1)}
              onChangeText={(text) => updateField('TotalServings', parseFloat(text) || 1)}
              keyboardType="numeric"
              style={[styles.input, styles.halfWidth]}
            />
            
            <TextInput
              label="Calories Per Serving"
              value={String(item.CaloriesPerServing || 0)}
              onChangeText={(text) => updateField('CaloriesPerServing', parseFloat(text) || 0)}
              keyboardType="numeric"
              style={[styles.input, styles.halfWidth]}
            />
          </View>

          <TextInput
            label="Calorie Unit"
            value={item.CalorieUnit || 'kcal'}
            onChangeText={(text) => updateField('CalorieUnit', text)}
            style={styles.input}
          />

          {/* Nutritional Information */}
          <View style={styles.nutritionHeader}>
            <Text style={styles.sectionTitle}>Nutritional Information</Text>
            <IconButton
              icon="plus"
              size={20}
              onPress={addNutrient}
            />
          </View>

          {item.NutritionalInfo && item.NutritionalInfo.map((nutrient, index) => (
            <View key={index} style={styles.nutrientRow}>
              <TextInput
                label="Nutrient Name"
                value={nutrient.NutrientName}
                onChangeText={(text) => updateNutrient(index, 'NutrientName', text)}
                style={[styles.input, styles.nutrientName]}
              />
              <TextInput
                label="Amount"
                value={String(nutrient.NutrientAmount || 0)}
                onChangeText={(text) => updateNutrient(index, 'NutrientAmount', parseFloat(text) || 0)}
                keyboardType="numeric"
                style={[styles.input, styles.nutrientAmount]}
              />
              <TextInput
                label="Unit"
                value={nutrient.NutrientUnit}
                onChangeText={(text) => updateNutrient(index, 'NutrientUnit', text)}
                style={[styles.input, styles.nutrientUnit]}
              />
              <IconButton
                icon="delete"
                size={20}
                onPress={() => removeNutrient(index)}
                style={styles.deleteNutrientButton}
              />
            </View>
          ))}
        </Card.Content>
      )}
    </Card>
  );
};

export default function BatchInsertModal({ itemsData, onClear }: Props) {
  const [items, setItems] = useState<NutritionalItemData[]>(
    itemsData.map(i => ({ ...i, ItemQuantity: i.ItemQuantity || 1 }))
  );
  const [loading, setLoading] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const theme = useTheme();

  const handleUpdateItem = (index: number, updatedItem: NutritionalItemData) => {
    const newItems = [...items];
    newItems[index] = updatedItem;
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    // Adjust expanded index if necessary
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else if (expandedIndex && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
  };

  const handleExpandItem = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleSaveAll = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error("User not found");
      const userId = session.user.id;

      const itemsToInsert = items.map(item => ({
        userid: userId,
        item_name: item.itemName,
        serving_unit: item.ServingUnit,
        amount_per_serving: item.AmountPerServing,
        total_servings: item.TotalServings,
        calories_per_serving: item.CaloriesPerServing,
        calorie_unit: item.CalorieUnit,
        item_category: item.ItemCategory,
        item_quantity: item.ItemQuantity || 1,
      }));

      const { data, error } = await supabase
        .from('nutritional_items')
        .insert(itemsToInsert)
        .select();

      if (error) throw error;

      if (data) {
        const nutrientsToInsert = data.flatMap((insertedItem, index) => 
          items[index].NutritionalInfo?.map(nutrient => ({
            item_id: insertedItem.itemid,
            nutrient_name: nutrient.NutrientName,
            nutrient_amount: nutrient.NutrientAmount,
            nutrient_unit: nutrient.NutrientUnit,
          })) || []
        );

        if (nutrientsToInsert.length > 0) {
          await supabase.from('nutritional_info').insert(nutrientsToInsert);
        }
      }
    } catch (error) {
      console.error("An error occurred during batch save:", error);
    } finally {
      setLoading(false);
      onClear();
    }
  };

  if (loading) {
    return <LoadingComponent visible={true} message="Saving all items..." />;
  }

  return (
    <Modal visible={true} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.overlay}>
          <Card style={styles.modal}>
            <LinearGradient
              colors={[theme.colors.surface, theme.colors.surfaceVariant]}
              style={styles.header}
            >
              <Text style={styles.headerTitle}>Review & Add Items ({items.length})</Text>
              <IconButton icon="close" onPress={onClear} />
            </LinearGradient>
            <ScrollView>
              {items.map((item, index) => (
                <EditableItem
                  key={index}
                  item={item}
                  onUpdate={(updated) => handleUpdateItem(index, updated)}
                  isExpanded={expandedIndex === index}
                  onExpand={() => handleExpandItem(index)}
                  onRemove={() => handleRemoveItem(index)}
                />
              ))}
            </ScrollView>
            <Card.Actions style={styles.actions}>
              <Button mode="outlined" onPress={onClear}>Cancel</Button>
              <Button mode="contained" onPress={handleSaveAll} disabled={items.length === 0}>
                Save All
              </Button>
            </Card.Actions>
          </Card>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 50, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: '95%',
    maxHeight: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#34a853",
  },
  itemCard: {
    marginHorizontal: 8,
    marginBottom: 40,
    marginTop: 8,
    elevation: 2,
  },
  input: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 8,
    color: '#34a853',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    flex: 0.48,
  },
  menuButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  menuButtonText: {
    fontSize: 16,
    color: '#333',
  },
  nutritionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  nutrientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  nutrientName: {
    flex: 0.4,
    marginRight: 8,
  },
  nutrientAmount: {
    flex: 0.25,
    marginRight: 8,
  },
  nutrientUnit: {
    flex: 0.25,
    marginRight: 8,
  },
  deleteNutrientButton: {
    margin: 0,
  },
  actions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
});