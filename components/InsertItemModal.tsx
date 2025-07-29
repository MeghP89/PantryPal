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
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/utils/supabase";
import CheckItemSimilarity from "./checkItemSimilarity";

type ResponseSchema = {
  NutritionalItem: {
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
    CalorieUnit: string;
    NutritionalInfo: {
      NutrientName: string;
      NutrientAmount: number;
      NutrientUnit: string;
    }[];
    ItemQuantity: number;
  };
};

type Props = {
  itemData?: ResponseSchema;
  onClear: () => void;
};

const defaultItem: ResponseSchema = {
  NutritionalItem: {
    itemName: '',
    ServingUnit: 'g',
    AmountPerServing: 0,
    TotalServings: 0,
    ItemCategory: 'Misc',
    CaloriesPerServing: 0,
    CalorieUnit: 'kcal',
    NutritionalInfo: [],
    ItemQuantity: 1,
  },
};

export default function InsertItemModal({ itemData, onClear }: Props) {
  const categories = [
    "Produce", "Dairy", "Meat", "Bakery", "Frozen", "Beverages",
    "Snacks", "Canned Goods", "Condiments", "Grains", "Seasonings", "Misc"
  ];
  const [modalVisible, setModalVisible] = useState(true);
  const [item, setItem] = useState<ResponseSchema>(itemData || defaultItem);
  const [loading, setLoading] = useState(false);
  const [similarItem, setSimilarItem] = useState<{ name: string, id: string, quantity: number } | null>(null);
  const [showSimilarityCheck, setShowSimilarityCheck] = useState(false);


  const theme = useTheme();

  const updateNutrient = (index: number, field: keyof ResponseSchema["NutritionalItem"]["NutritionalInfo"][0], value: string | number) => {
    const updatedNutrients = item.NutritionalItem.NutritionalInfo.map((nutrient, i) =>
            i === index ? { ...nutrient, [field]: value } : nutrient
        );

        setItem((prev) => ({
            ...prev,
            NutritionalItem: {
            ...prev.NutritionalItem,
            NutritionalInfo: updatedNutrients,
            },
        }));
  };

  const addNutrient = () => {
    setItem({
      ...item,
      NutritionalItem: {
        ...item.NutritionalItem,
        NutritionalInfo: [
          ...item.NutritionalItem.NutritionalInfo,
          { NutrientName: "", NutrientAmount: 0, NutrientUnit: "g" },
        ],
      },
    });
  };

  const removeNutrient = (index: number) => {
    const updatedNutrients = item.NutritionalItem.NutritionalInfo.filter((_, i) => i !== index);
    setItem({
      ...item,
      NutritionalItem: {
        ...item.NutritionalItem,
        NutritionalInfo: updatedNutrients,
      },
    });
  };

  const updateSimilarItem = async () => {
    if (!similarItem) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error("User not found");

      const { error } = await supabase
        .from("nutritional_items")
        .update({ item_quantity: item.NutritionalItem.ItemQuantity + similarItem.quantity })
        .eq("itemid", similarItem.id)
        .eq("userid", session.user.id);

      if (error) throw error;
      
      console.log("item_quantity updated successfully.");
    } catch (error) {
      console.error("Failed to update item_quantity:", error);
    } finally {
      setLoading(false);
      setShowSimilarityCheck(false);
      onClear();
    }
  };

  const saveItem = async (force = false) => {
    setShowSimilarityCheck(false);
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error("User not found");

      if (!force) {
        const { data: existingItems, error: checkError } = await supabase
          .from("nutritional_items")
          .select("itemid, item_name, item_quantity")
          .eq("userid", session.user.id)
          .ilike("item_name", `%${item.NutritionalItem.itemName}%`);

        if (checkError) throw checkError;

        if (existingItems && existingItems.length > 0) {
          setSimilarItem({
            id: existingItems[0].itemid,
            name: existingItems[0].item_name,
            quantity: existingItems[0].item_quantity,
          });
          setShowSimilarityCheck(true);
          setLoading(false);
          return;
        }
      }

      const itemToSave = {
        userid: session.user.id,
        item_name: item.NutritionalItem.itemName,
        serving_unit: item.NutritionalItem.ServingUnit,
        amount_per_serving: item.NutritionalItem.AmountPerServing,
        total_servings: item.NutritionalItem.TotalServings,
        calories_per_serving: item.NutritionalItem.CaloriesPerServing,
        calorie_unit: item.NutritionalItem.CalorieUnit,
        item_category: item.NutritionalItem.ItemCategory,
        item_quantity: item.NutritionalItem.ItemQuantity,
      };

      const { data, error: insertError } = await supabase
        .from('nutritional_items')
        .insert([itemToSave])
        .select();

      if (insertError) throw insertError;

      if (data) {
        const item_id = data[0]?.itemid;
        if (item_id && item.NutritionalItem.NutritionalInfo.length > 0) {
          const nutrientsToInsert = item.NutritionalItem.NutritionalInfo.map(n => ({
            item_id: item_id,
            nutrient_name: n.NutrientName,
            nutrient_amount: n.NutrientAmount,
            nutrient_unit: n.NutrientUnit,
          }));
          const { error: nutrientError } = await supabase.from('nutritional_info').insert(nutrientsToInsert);
          if (nutrientError) throw nutrientError;
        }
        console.log("Inserted ID:", item_id);
      }
      setLoading(false);
      onClear();
    } catch (error) {
      console.error("Error saving item:", error);
      setLoading(false);
      onClear();
    }
  }

  const handleCancel = () => {
    onClear();
  };

  if (similarItem) {
    return (
      <CheckItemSimilarity
        visible={true}
        newItemName={item.NutritionalItem.itemName}
        existingItemName={similarItem.name}
        onConfirm={updateSimilarItem}
        onCancel={() => saveItem(true)}
      />
    );
  }

  return (
    <Modal visible={true} animationType="slide" transparent>
      <View pointerEvents={loading ? "none" : "auto"} style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <Card style={styles.modal}>
            <LinearGradient
              colors={[theme.colors.surface, theme.colors.surfaceVariant]}
              style={styles.header}
            >
              <Text style={styles.headerTitle}>{itemData ? 'Edit Item' : 'Add New Item'}</Text>
              <IconButton icon="close" onPress={handleCancel} />
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Item Name */}
              <View style={styles.section}>
                <Text style={styles.label}>Item Name</Text>
                <TextInput
                  mode="outlined"
                  value={item.NutritionalItem.itemName}
                  onChangeText={(text) =>
                    setItem({
                      ...item,
                      NutritionalItem: { ...item.NutritionalItem, itemName: text }
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
                      selected={item.NutritionalItem.ItemCategory === category}
                      onPress={() =>
                        setItem({
                          ...item,
                          NutritionalItem: { 
                            ...item.NutritionalItem, 
                            ItemCategory: category as any 
                          }
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
                  <Text style={styles.label}>Amount Per Serving</Text>
                  <TextInput
                    mode="outlined"
                    keyboardType="numeric"
                    value={(item.NutritionalItem.AmountPerServing ?? 0).toString()}
                    onChangeText={(text) =>
                      setItem({
                        ...item,
                        NutritionalItem: {
                          ...item.NutritionalItem,
                          AmountPerServing: parseFloat(text) || 0,
                        },
                      })
                    }
                    style={styles.smallInput}
                  />
                </View>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Unit</Text>
                  <TextInput
                    mode="outlined"
                    value={item.NutritionalItem.ServingUnit}
                    onChangeText={(text) =>
                      setItem({
                        ...item,
                        NutritionalItem: { ...item.NutritionalItem, ServingUnit: text }
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
                  value={(item.NutritionalItem.ItemQuantity ?? 0).toString()}
                  onChangeText={(text) => 
                    setItem((prev) => ({
                      ...prev,
                      NutritionalItem: {
                          ...prev.NutritionalItem,
                          ItemQuantity: parseInt(text) || 0,
                      },
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
                  value={(item.NutritionalItem.CaloriesPerServing ?? 0).toString()}
                  onChangeText={(text) =>
                    setItem({
                      ...item,
                      NutritionalItem: {
                        ...item.NutritionalItem,
                        CaloriesPerServing: parseFloat(text) || 0,
                      },
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

                {item.NutritionalItem.NutritionalInfo.map((nutrient, index) => (
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
              <Button mode="contained" loading={loading} onPress={() => saveItem()} style={styles.button}>
                Save
              </Button>
            </View>
          </Card>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
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
    backgroundColor: "rgba(0, 50, 0, 0.4)", // dark green transparent overlay
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
