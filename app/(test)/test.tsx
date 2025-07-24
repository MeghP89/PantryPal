import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import {
  Text,
  Card,
  useTheme,
  IconButton,
  Chip,
  Searchbar,
  FAB,
} from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../utils/supabase";

type NutritionalItem = {
  id: string;
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
  ItemQuantity: number;
  NutritionalInfo: {
    NutrientName: string;
    NutrientAmount: number;
    NutrientUnit: string;
  }[];
};

const getCategoryColor = (category: string) => {
  const colors = {
    Produce: "#4CAF50",
    Dairy: "#2196F3",
    Meat: "#F44336",
    Bakery: "#FF9800",
    Frozen: "#9C27B0",
    Beverages: "#00BCD4",
    Snacks: "#FFEB3B",
    "Canned Goods": "#795548",
    Condiments: "#607D8B",
    Grains: "#8BC34A",
    Seasonings: "#E91E63",
    Misc: "#9E9E9E",
  };
  return colors[category] || "#9E9E9E";
};

export default function NutritionalItemsScreen() {
  const [items, setItems] = useState<NutritionalItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    null
  );
  const theme = useTheme();

  useEffect(() => {
    const fetchItems = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const { data, error } = await supabase
          .from("nutritional_items")
          .select("*, nutritional_info(*)")
          .eq("userid", session.user.id);

        if (error) {
          console.error("Error fetching items:", error);
        } else if (data) {
          const formattedItems: NutritionalItem[] = data.map((item: any) => ({
            id: item.itemid.toString(),
            itemName: item.item_name,
            ServingUnit: item.serving_unit,
            NumberOfServings: item.number_of_servings,
            TotalServings: item.total_servings,
            ItemCategory: item.item_category,
            CaloriesPerServing: item.calories_per_serving,
            CalorieUnit: item.calorie_unit,
            ItemQuantity: item.item_quantity,
            NutritionalInfo: item.nutritional_info.map((nutrient: any) => ({
              NutrientName: nutrient.nutrient_name,
              NutrientAmount: nutrient.nutrient_amount,
              NutrientUnit: nutrient.nutrient_unit,
            })),
          }));
          setItems(formattedItems);
        }
      }
    };

    fetchItems();
    const subscription = supabase
      .channel("custom-all-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "nutritional_items" },
        (payload) => {
          console.log("Change received!", payload);
          fetchItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const categories = [
    "All",
    "Produce",
    "Dairy",
    "Meat",
    "Bakery",
    "Frozen",
    "Beverages",
    "Snacks",
    "Canned Goods",
    "Condiments",
    "Grains",
    "Seasonings",
    "Misc",
  ];

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.itemName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategory ||
      selectedCategory === "All" ||
      item.ItemCategory === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderNutritionalInfo = (
    nutrients: NutritionalItem["NutritionalInfo"]
  ) => {
    return nutrients.slice(0, 3).map((nutrient, index) => (
      <Text key={index} style={styles.nutrientText}>
        {nutrient.NutrientName}: {nutrient.NutrientAmount}
        {nutrient.NutrientUnit}
      </Text>
    ));
  };

  const renderItemCard = (item: NutritionalItem) => (
    <TouchableOpacity key={item.id} activeOpacity={0.7}>
      <Card style={styles.itemCard}>
        <LinearGradient
          colors={[theme.colors.surface, theme.colors.surfaceVariant]}
          style={styles.cardGradient}
        >
          <Card.Content style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.itemName}</Text>
                <Chip
                  style={[
                    styles.categoryChip,
                    { backgroundColor: getCategoryColor(item.ItemCategory) },
                  ]}
                  textStyle={styles.categoryChipText}
                >
                  {item.ItemCategory}
                </Chip>
              </View>
              <IconButton
                icon="pencil"
                size={20}
                onPress={() => console.log("Edit item:", item.id)}
              />
            </View>

            <View style={styles.servingInfo}>
              <View style={styles.servingDetail}>
                <Text style={styles.servingLabel}>Serving</Text>
                <Text style={styles.servingValue}>
                  {item.NumberOfServings} {item.ServingUnit}
                </Text>
              </View>
              <View style={styles.servingDetail}>
                <Text style={styles.servingLabel}>Quantity</Text>
                <Text style={styles.servingValue}>{item.ItemQuantity}</Text>
              </View>
              <View style={styles.servingDetail}>
                <Text style={styles.servingLabel}>Calories</Text>
                <Text style={styles.calorieValue}>
                  {item.CaloriesPerServing} {item.CalorieUnit}
                </Text>
              </View>
            </View>

            <View style={styles.nutritionalSection}>
              <Text style={styles.nutritionalTitle}>Key Nutrients</Text>
              <View style={styles.nutrientsList}>
                {renderNutritionalInfo(item.NutritionalInfo)}
              </View>
            </View>
          </Card.Content>
        </LinearGradient>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#e8f5e8", "#f1f8e9"]}
        style={styles.backgroundGradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Nutritional Items</Text>
          <Text style={styles.headerSubtitle}>
            {filteredItems.length} items found
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search items..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            iconColor="#1b5e20"
            inputStyle={styles.searchInput}
          />
        </View>

        {/* Category Filter */}
        <View style={styles.categorySection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryContent}
          >
            {categories.map((category) => (
              <Chip
                key={category}
                compact
                selected={
                  selectedCategory === category ||
                  (category === "All" && !selectedCategory)
                }
                onPress={() =>
                  setSelectedCategory(category === "All" ? null : category)
                }
                style={[
                  styles.filterChip,
                  (selectedCategory === category ||
                    (category === "All" && !selectedCategory)) &&
                    styles.selectedFilterChip,
                ]}
                textStyle={styles.filterChipText}
              >
                {category}
              </Chip>
            ))}
          </ScrollView>
        </View>

        {/* Items List */}
        <ScrollView
          style={styles.itemsList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.itemsContent}
        >
          {filteredItems.map(renderItemCard)}
        </ScrollView>

        {/* Floating Action Button */}
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => console.log("Add new item")}
          color="#ffffff"
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e8f5e8",
  },
  backgroundGradient: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1b5e20",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#388e3c",
    opacity: 0.8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  searchBar: {
    backgroundColor: "#ffffff",
    elevation: 2,
  },
  searchInput: {
    color: "#1b5e20",
  },
  categorySection: {
    marginBottom: 12,
  },
  categoryContent: {
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: "#ffffff",
    borderColor: "#81c784",
    borderWidth: 1,
  },
  selectedFilterChip: {
    backgroundColor: "#4CAF50",
  },
  filterChipText: {
    color: "#1b5e20",
    fontSize: 12,
  },
  itemsList: {
    flex: 1,
  },
  itemsContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  itemCard: {
    marginBottom: 16,
    elevation: 3,
    borderRadius: 12,
    overflow: "hidden",
  },
  cardGradient: {
    borderRadius: 12,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1b5e20",
    marginBottom: 6,
  },
  categoryChip: {
    alignSelf: "flex-start",
  },
  categoryChipText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
  },
  servingInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: "#f1f8e9",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  servingDetail: {
    alignItems: "center",
  },
  servingLabel: {
    fontSize: 12,
    color: "#388e3c",
    marginBottom: 4,
    fontWeight: "500",
  },
  servingValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1b5e20",
  },
  calorieValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#d32f2f",
  },
  nutritionalSection: {
    marginTop: 8,
  },
  nutritionalTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1b5e20",
    marginBottom: 8,
  },
  nutrientsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  nutrientText: {
    fontSize: 12,
    color: "#388e3c",
    backgroundColor: "#e8f5e8",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: "hidden",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#4CAF50",
  },
});
