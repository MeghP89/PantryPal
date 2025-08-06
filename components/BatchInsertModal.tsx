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
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/utils/supabase';
import { BlurView } from 'expo-blur';

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

const EditableItem = ({ item, onUpdate, isExpanded, onExpand, onRemove }) => {
  const theme = useTheme();

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
    <View style={styles.sectionContainer}>
      <TouchableOpacity onPress={onExpand} style={styles.sectionHeader}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.sectionTitleText}>{item.itemName || "New Item"}</Text>
          <Text style={styles.sectionSubtitle}>
            {`${item.ItemCategory} • Qty: ${item.ItemQuantity || 0} • ${item.AmountPerServing || 0} ${item.ServingUnit || 'serving'}`}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconButton icon={isExpanded ? "chevron-up" : "chevron-down"} size={20} />
          <IconButton icon="delete" size={20} onPress={onRemove} />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.sectionContent}>
          <View style={styles.section}>
            <Text style={styles.label}>Item Name</Text>
            <TextInput
              mode="outlined"
              value={item.itemName}
              onChangeText={(text) => updateField('itemName', text)}
              style={styles.input}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.chipContainer}>
              {categories.map((category) => (
                <Chip
                  key={category}
                  selected={item.ItemCategory === category}
                  onPress={() => updateField('ItemCategory', category)}
                  style={styles.chip}
                >
                  {category}
                </Chip>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Amount Per Serving</Text>
              <TextInput
                mode="outlined"
                keyboardType="numeric"
                value={String(item.AmountPerServing || 0)}
                onChangeText={(text) => updateField('AmountPerServing', parseFloat(text) || 0)}
                style={styles.smallInput}
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Unit</Text>
              <TextInput
                mode="outlined"
                value={item.ServingUnit}
                onChangeText={(text) => updateField('ServingUnit', text)}
                style={styles.smallInput}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Item Quantity</Text>
              <TextInput
                mode="outlined"
                keyboardType="numeric"
                value={String(item.ItemQuantity || 0)}
                onChangeText={(text) => updateField('ItemQuantity', parseInt(text) || 0)}
                style={styles.smallInput}
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Total Servings</Text>
              <TextInput
                mode="outlined"
                keyboardType="numeric"
                value={String(item.TotalServings || 0)}
                onChangeText={(text) => updateField('TotalServings', parseFloat(text) || 0)}
                style={styles.smallInput}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Calories per Serving</Text>
            <TextInput
              mode="outlined"
              keyboardType="numeric"
              value={String(item.CaloriesPerServing || 0)}
              onChangeText={(text) => updateField('CaloriesPerServing', parseFloat(text) || 0)}
              style={styles.input}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.nutritionSectionHeader}>
              <Text style={styles.label}>Nutritional Information</Text>
              <IconButton icon="plus" onPress={addNutrient} size={20} />
            </View>

            {item.NutritionalInfo && item.NutritionalInfo.map((nutrient, index) => (
              <Card key={index} style={styles.nutrientCard}>
                <Card.Content style={styles.nutrientContent}>
                  <TextInput
                    mode="outlined"
                    placeholder="Nutrient name"
                    value={nutrient.NutrientName}
                    onChangeText={(text) => updateNutrient(index, 'NutrientName', text)}
                    style={styles.nutrientNameInput}
                  />
                  <TextInput
                    mode="outlined"
                    placeholder="Amount"
                    keyboardType="numeric"
                    value={String(nutrient.NutrientAmount || 0)}
                    onChangeText={(text) => updateNutrient(index, 'NutrientAmount', parseFloat(text) || 0)}
                    style={styles.nutrientAmountInput}
                  />
                  <TextInput
                    mode="outlined"
                    placeholder="Unit"
                    value={nutrient.NutrientUnit}
                    onChangeText={(text) => updateNutrient(index, 'NutrientUnit', text)}
                    style={styles.nutrientUnitInput}
                  />
                  <IconButton
                    icon="delete"
                    size={20}
                    onPress={() => removeNutrient(index)}
                  />
                </Card.Content>
              </Card>
            ))}
          </View>
        </View>
      )}
    </View>
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
        ).filter(n => n.nutrient_name && n.nutrient_name.trim() !== '');

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

  return (
    <Modal visible={true} animationType="slide" transparent>
      <BlurView pointerEvents={loading ? "none" : "auto"} style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <Card style={styles.modal}>
            <LinearGradient
              colors={[theme.colors.surface, theme.colors.surfaceVariant]}
              style={styles.header}
            >
              <Text style={styles.headerTitle}>Review & Add Items ({items.length})</Text>
              <IconButton icon="close" onPress={onClear} />
            </LinearGradient>
            <ScrollView contentContainerStyle={styles.content}>
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
            <View style={styles.actions}>
              <Button mode="outlined" onPress={onClear} style={styles.button}>Cancel</Button>
              <Button mode="contained" onPress={handleSaveAll} loading={loading} disabled={items.length === 0 || loading} style={styles.button}>
                Save All
              </Button>
            </View>
          </Card>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(107, 54, 0, 0.56)",
    justifyContent: "center",
    alignItems: "center",
  },
  keyboardView: {
    width: "95%",
    maxHeight: "90%",
  },
  modal: {
    borderRadius: 16,
    overflow: "hidden",
    width: '100%',
    maxHeight: '100%',
    backgroundColor: '#F5EFE0',
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
  content: {
    padding: 8,
  },
  sectionContainer: {
    backgroundColor: 'rgba(255, 60, 0, 0.1)',
    borderRadius: 10,
    marginBottom: 15,
    marginHorizontal: 8,
    marginTop: 10
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5D4037',
  },
  sectionSubtitle: {
      fontSize: 12,
      color: '#8A655A',
      marginTop: 2,
  },
  sectionContent: {
      padding: 15,
      paddingTop: 0,
  },
  section: {
    marginBottom: 16,
  },
  nutritionSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#1b5e20",
  },
  input: {
    marginBottom: 4,
    backgroundColor: "#f1fdf3",
  },
  smallInput: {
    marginBottom: 4,
    height: 45,
    backgroundColor: "#f1fdf3",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  halfWidth: {
    width: "48%",
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    marginBottom: 4,
    backgroundColor: "#81c784",
  },
  nutrientCard: {
    marginBottom: 8,
    elevation: 2,
    backgroundColor: '#fafafa'
  },
  nutrientContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  nutrientNameInput: {
    flex: 2,
    marginRight: 8,
    height: 40,
  },
  nutrientAmountInput: {
    flex: 1.2,
    marginRight: 8,
    height: 40,
  },
  nutrientUnitInput: {
    flex: 1,
    height: 40,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#b2dfdb",
    backgroundColor: "#e0f2f1",
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
});