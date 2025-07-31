import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  Card,
  useTheme,
  IconButton,
  Chip,
} from "react-native-paper";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/utils/supabase";

type NutritionalItem = {
    id: string;
    itemName: string;
    ServingUnit: string;
    AmountPerServing: number;
    TotalServings: number;
    ItemCategory:
      | "Produce"
      | "Dairy"
      | "Meat"
      | "Bakery"
      | "Frozen"
      | "Beverages"
      | "Snacks"
      | "Canned Goods"
      | "Condiments"
      | "Grains"
      | "Seasonings"
      | "Misc";
    CaloriesPerServing: number;
    ItemQuantity: number;
    NutritionalInfo: {
      NutrientName: string;
      NutrientAmount: number;
      NutrientUnit: string;
    }[];
  };

type Props = {
  itemData: NutritionalItem;
  onClear: () => void;
  onFetch: () => void;
};

export default function EditItemModal({ itemData, onClear, onFetch}: Props) {
  console.log("Item received in EditItemModal:", JSON.stringify(itemData, null, 2));
  const categories = [
    "Produce", "Dairy", "Meat", "Bakery", "Frozen", "Beverages",
    "Snacks", "Canned Goods", "Condiments", "Grains", "Seasonings", "Misc"
  ];
  const [modalVisible, setModalVisible] = useState(true);
  const [item, setItem] = useState<NutritionalItem>(itemData);
  const [loading, setLoading] = useState(false);

  const theme = useTheme();

  const updateNutrient = (index: number, field: keyof NutritionalItem["NutritionalInfo"][0], value: string | number) => {
    const updatedNutrients = item.NutritionalInfo.map((nutrient, i) =>
            i === index ? { ...nutrient, [field]: value } : nutrient
        );

        setItem((prev) => ({
            ...prev,
            NutritionalInfo: updatedNutrients,
        }));
  };

  const addNutrient = () => {
    setItem({
      ...item,
      NutritionalInfo: [
          ...item.NutritionalInfo,
          { NutrientName: "", NutrientAmount: 0, NutrientUnit: "g" },
      ],
    });
  };

  const removeNutrient = (index: number) => {
    const updatedNutrients = item.NutritionalInfo.filter((_, i) => i !== index);
    setItem({
      ...item,
      NutritionalInfo: updatedNutrients,
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const itemToSave = {
        item_name: item.itemName,
        serving_unit: item.ServingUnit,
        amount_per_serving: item.AmountPerServing,
        total_servings: item.TotalServings,
        calories_per_serving: item.CaloriesPerServing,
        item_category: item.ItemCategory,
        item_quantity: item.ItemQuantity,
      };

      const { data, error } = await supabase
        .from('nutritional_items')
        .update(itemToSave)
        .eq('itemid', item.id)
      
      

      if (error) {
        console.error("Update failed:", error);
      } else {
        console.log("Update successful",data);
        // Now, handle the nutritional info. This is a bit more complex.
        // We need to delete all existing nutritional info for the item and then insert the new ones.
        const { error: deleteError } = await supabase
          .from('nutritional_info')
          .delete()
          .eq('item_id', item.id)

        if (deleteError) {
          console.error("Failed to delete old nutritional info:", deleteError);
          // Handle this error - maybe rollback the item update?
        } else {
          const nutrientsToInsert = item.NutritionalInfo.map(nutrient => ({
            item_id: item.id,
            nutrient_name: nutrient.NutrientName,
            nutrient_amount: nutrient.NutrientAmount,
            nutrient_unit: nutrient.NutrientUnit,
          }));

          console.log("Updating nutritional_info with:", JSON.stringify(nutrientsToInsert, null, 2));

          if (nutrientsToInsert.length > 0) {
              const { error: insertError } = await supabase
                  .from('nutritional_info')
                  .insert(nutrientsToInsert);

              if (insertError) {
                  console.error("Failed to insert new nutritional info:", insertError);
              }
          }
        }
      }
    } catch (error) {
      setLoading(false);
      console.error("Error saving item:", error);
    } finally {
      console.log("Saved item:", item);
      onFetch();
      setLoading(false);
      setModalVisible(false);
      onClear()
    }
  };

  const handleCancel = () => {
    setModalVisible(false);
    onClear();
  };

  return (
      <Modal visible={modalVisible} animationType="slide" transparent>
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
                <Text style={styles.headerTitle}>Edit Item</Text>
                <IconButton icon="close" onPress={handleCancel} />
              </LinearGradient>

              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Item Name */}
                <View style={styles.section}>
                  <Text style={styles.label}>Item Name</Text>
                  <TextInput
                    mode="outlined"
                    value={item.itemName}
                    onChangeText={(text) =>
                      setItem({
                        ...item,
                        itemName: text
                      })
                    }
                    style={styles.input}
                  />
                </View>

                {/* Category Selection */}
                <View style={styles.section}>
                  <Text style={styles.label}>Category</Text>
                  <View style={styles.chipContainer}>
                    {categories.map((category) => (
                      <Chip
                        key={category}
                        selected={item.ItemCategory === category}
                        onPress={() =>
                          setItem({
                            ...item,
                            ItemCategory: category as any
                          })
                        }
                        style={styles.chip}
                      >
                        {category}
                      </Chip>
                    ))}
                  </View>
                </View>

                {/* Serving Info */}
                <View style={styles.row}>
                  <View style={styles.halfWidth}>
                    <Text style={styles.label}>Serving Size</Text>
                    <TextInput
                      mode="outlined"
                      keyboardType="numeric"
                      value={(item.AmountPerServing ?? 0).toString()}
                      onChangeText={(text) =>
                        setItem({
                          ...item,
                          AmountPerServing: parseFloat(text) || 0,
                        })
                      }
                      style={styles.smallInput}
                    />
                  </View>
                  <View style={styles.halfWidth}>
                    <Text style={styles.label}>Unit</Text>
                    <TextInput
                      mode="outlined"
                      value={item.ServingUnit}
                      onChangeText={(text) =>
                        setItem({
                          ...item,
                          ServingUnit: text
                        })
                      }
                      style={styles.smallInput}
                    />
                  </View>
                </View>

                {/* Quantity */}
                <View style={styles.section}>
                  <Text style={styles.label}>Quantity</Text>
                  <TextInput
                    mode="outlined"
                    keyboardType="numeric"
                    value={(item.ItemQuantity ?? 0).toString()}
                    onChangeText={(text) =>
                      setItem((prev) => ({
                        ...prev,
                        ItemQuantity: parseInt(text) || 0,
                        }))
                    }
                    style={styles.quantityInput}
                  />
                </View>

                {/* Calories */}
                <View style={styles.section}>
                  <Text style={styles.label}>Calories per Serving</Text>
                  <TextInput
                    mode="outlined"
                    keyboardType="numeric"
                    value={(item.CaloriesPerServing ?? 0).toString()}
                    onChangeText={(text) =>
                      setItem({
                        ...item,
                        CaloriesPerServing: parseFloat(text) || 0,
                      })
                    }
                    style={styles.input}
                  />
                </View>

                {/* Nutritional Info */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.label}>Nutritional Information</Text>
                    <IconButton icon="plus" onPress={addNutrient} size={20} />
                  </View>

                  {item.NutritionalInfo.map((nutrient, index) => (
                    <Card key={index} style={styles.nutrientCard}>
                      <Card.Content style={styles.nutrientContent}>
                        <TextInput
                          mode="outlined"
                          placeholder="Nutrient name"
                          value={nutrient.NutrientName}
                          onChangeText={(text) => updateNutrient(index, "NutrientName", text)}
                          style={styles.nutrientNameInput}
                        />
                        <TextInput
                          mode="outlined"
                          placeholder="Amount"
                          keyboardType="numeric"
                          value={(nutrient.NutrientAmount ?? 0).toString()}
                          onChangeText={(text) =>
                            updateNutrient(index, "NutrientAmount", parseFloat(text) || 0)
                          }
                          style={styles.nutrientAmountInput}
                        />
                        <TextInput
                          mode="outlined"
                          placeholder="Unit"
                          value={nutrient.NutrientUnit}
                          onChangeText={(text) => updateNutrient(index, "NutrientUnit", text)}
                          style={styles.nutrientUnitInput}
                        />
                        <IconButton
                          icon="delete"
                          onPress={() => removeNutrient(index)}
                          size={20}
                        />
                      </Card.Content>
                    </Card>
                  ))}
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.actions}>
                <Button mode="outlined" onPress={handleCancel} style={styles.button}>
                  Cancel
                </Button>
                <Button mode="contained" loading={loading} onPress={handleSave} style={styles.button}>
                  Save
                </Button>
              </View>
            </Card>
          </KeyboardAvoidingView>
        </BlurView>
      </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e6f5ea", // soft greenish background
  },
  openButton: {
    marginBottom: 20,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(107, 54, 0, 0.56)", // dark green transparent overlay
    justifyContent: "center",
    alignItems: "center",
  },
  keyboardView: {
    width: "90%",
    maxHeight: "90%",
  },
  modal: {
    borderRadius: 16,
    overflow: "hidden",
    maxHeight: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#34a853", // Google Green
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#34a853",
  },
  content: {
    padding: 16,
    maxHeight: 400,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#1b5e20", // dark green
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
  quantityInput: {
    width: 80,
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
    backgroundColor: "#81c784", // medium green
  },
  nutrientCard: {
    marginBottom: 8,
    elevation: 2,
  },
  nutrientContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 30,
    height: 20,
  },
  nutrientNameInput: {
    flex: 2,
    marginRight: 25,
    height: 40,
    textAlign: "center",
    fontSize: 17,
    fontFamily: "Roboto"
  },
  nutrientAmountInput: {
    flex: 1.2,
    marginRight: 4,
    height: 40,
    textAlign: "center",
    fontSize: 17,
    fontFamily: "Roboto",
  },
  nutrientUnitInput: {
    flex: 1.2,
    marginRight: 8,
    height: 40,
    fontSize: 17,
    fontFamily: "Roboto",
    textAlign: "left",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#b2dfdb", // teal border
    backgroundColor: "#e0f2f1",
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
});
