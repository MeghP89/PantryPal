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

type ResponseSchema = {
  NutritionalItem: {
    itemName: string;
    ServingUnit: string;
    NumberOfServings: number;
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
  };
  ItemQuantity: number;
};

const categories = [
  "Produce", "Dairy", "Meat", "Bakery", "Frozen", "Beverages",
  "Snacks", "Canned Goods", "Condiments", "Grains", "Seasonings", "Misc"
];

export default function NutritionalItemModal() {
  const [modalVisible, setModalVisible] = useState(true);
  const [item, setItem] = useState<ResponseSchema>({
    NutritionalItem: {
      itemName: "Chia Seeds",
      ServingUnit: "tablespoons",
      NumberOfServings: 3,
      TotalServings: 45,
      ItemCategory: "Grains",
      CaloriesPerServing: 150,
      CalorieUnit: "Cal",
      NutritionalInfo: [
        { NutrientName: "Total Fat", NutrientAmount: 9, NutrientUnit: "g" },
        { NutrientName: "Protein", NutrientAmount: 5, NutrientUnit: "g" },
        { NutrientName: "Calcium", NutrientAmount: 189, NutrientUnit: "mg" },
      ],
    },
    ItemQuantity: 1,
  });

  const theme = useTheme();

  const updateNutrient = (index: number, field: string, value: string | number) => {
    const updatedNutrients = [...item.NutritionalItem.NutritionalInfo];
    updatedNutrients[index] = {
      ...updatedNutrients[index],
      [field]: value,
    };
    setItem({
      ...item,
      NutritionalItem: {
        ...item.NutritionalItem,
        NutritionalInfo: updatedNutrients,
      },
    });
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

  const handleSave = () => {
    console.log("Saved item:", item);
    setModalVisible(false);
  };

  const handleCancel = () => {
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Button 
        mode="contained" 
        onPress={() => setModalVisible(true)}
        style={styles.openButton}
      >
        Edit Nutritional Item
      </Button>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
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
                    <Text style={styles.label}>Servings</Text>
                    <TextInput
                      mode="outlined"
                      keyboardType="numeric"
                      value={item.NutritionalItem.NumberOfServings.toString()}
                      onChangeText={(text) =>
                        setItem({
                          ...item,
                          NutritionalItem: {
                            ...item.NutritionalItem,
                            NumberOfServings: parseFloat(text) || 0,
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
                    value={item.ItemQuantity.toString()}
                    onChangeText={(text) => 
                      setItem({ ...item, ItemQuantity: parseInt(text) || 0 })
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
                    value={item.NutritionalItem.CaloriesPerServing.toString()}
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
                          value={nutrient.NutrientAmount.toString()}
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
                <Button mode="contained" onPress={handleSave} style={styles.button}>
                  Save
                </Button>
              </View>
            </Card>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
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
    paddingVertical: 8,
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
    flex: 1,
    marginRight: 8,
    height: 40,
    textAlign: "center",
    fontSize: 17,
    fontFamily: "Roboto",
  },
  nutrientUnitInput: {
    flex: 1,
    marginRight: 8,
    height: 40,
    fontSize: 17,
    fontFamily: "Roboto",
    textAlign: "center",
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
