import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ImageBackground,
  RefreshControl,
} from "react-native";
import {
  Text,
  Card,
  useTheme,
  IconButton,
  Chip,
  Searchbar,
} from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";

import { supabase } from "../../utils/supabase";
import FloatingImagePickerButton from "@/components/FloatingImagePickerButton";
import EditItemModal from "@/components/EditItemModal";
import ItemOverView from "@/components/ItemOverview";

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
  const [edit, setEdit] = useState<string | null>(null);
  const [overviewItemId, setOverviewItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();

  const fetchItems = useCallback(async () => {
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
          AmountPerServing: item.amount_per_serving,
          TotalServings: item.total_servings,
          ItemCategory: item.item_category,
          CaloriesPerServing: item.calories_per_serving,
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
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchItems().then(() => setRefreshing(false));
  }, [fetchItems]);

  useEffect(() => {
    fetchItems();
    const subscription = supabase
      .channel("inventory-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "nutritional_items" },
        () => fetchItems()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "nutritional_info" },
        () => fetchItems()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchItems]);

  const categories = [
    "All", "Produce", "Dairy", "Meat", "Bakery", "Frozen", "Beverages",
    "Snacks", "Canned Goods", "Condiments", "Grains", "Seasonings", "Misc",
  ];

  const onEdit = (id: string | null) => {
    setEdit(id);
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === "All" || item.ItemCategory === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedItems = filteredItems.reduce((acc, item) => {
    const category = item.ItemCategory;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, NutritionalItem[]>);

  const shelfOrder = [
    "Produce", "Dairy", "Meat", "Bakery", "Grains", "Canned Goods",
    "Condiments", "Seasonings", "Beverages", "Snacks", "Frozen", "Misc"
  ];

  const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
    const indexA = shelfOrder.indexOf(a);
    const indexB = shelfOrder.indexOf(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const handleDelete = async (id: string) => {
      const { error } = await supabase.from("nutritional_items").delete().eq("itemid", id);
      if (!error) fetchItems(); // refresh the list
  };

  const renderNutritionalInfo = (nutrients: NutritionalItem["NutritionalInfo"]) => {
    return nutrients.slice(0, 3).map((nutrient, index) => (
      <Text key={index} style={styles.nutrientText}>
        {nutrient.NutrientName}: {nutrient.NutrientAmount}{nutrient.NutrientUnit}
      </Text>
    ));
  };

  const renderItemCard = (item: NutritionalItem) => {
    if (overviewItemId === item.id) {
      return (
        <ItemOverView
          itemData={item}
          getCategoryColor={getCategoryColor}
          onClose={() => setOverviewItemId(null)}
          onEdit={() => {
            setOverviewItemId(null);
            onEdit(item.id);
          }}
        />
      );
    }

    return (
      <View key={item.id} style={{ marginRight: 12 }}>
        <TouchableOpacity onPress={() => setOverviewItemId(item.id)} key={item.id} activeOpacity={0.8}>
          <Card style={styles.itemCard}>
            <LinearGradient
              colors={['#F5EFE0', '#E8E0D0']}
              style={styles.cardGradient}
            >
              <Card.Content style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.itemName}</Text>
                    <Chip
                      style={[styles.categoryChip, { backgroundColor: getCategoryColor(item.ItemCategory) }]}
                      textStyle={styles.categoryChipText}
                    >
                      {item.ItemCategory}
                    </Chip>
                  </View>
                  <IconButton icon="pencil" size={20} onPress={() => onEdit(item.id)} style={styles.overviewEditButton} />
                  <IconButton icon="delete" size={20} onPress={() => handleDelete(item.id)} style={styles.overviewEditButton} key={`delete-btn-${item.id}`} />
                </View>

                <View style={styles.servingInfo}>
                  <View style={styles.servingDetail}>
                    <Text style={styles.servingLabel}>Serving</Text>
                    <Text style={styles.servingValue}>{item.AmountPerServing} {item.ServingUnit}</Text>
                  </View>
                  <View style={styles.servingDetail}>
                    <Text style={styles.servingLabel}>Quantity</Text>
                    <Text style={styles.servingValue}>{item.ItemQuantity}</Text>
                  </View>
                  <View style={styles.servingDetail}>
                    <Text style={styles.servingLabel}>Calories</Text>
                    <Text style={styles.calorieValue}>{item.CaloriesPerServing} cal</Text>
                  </View>
                </View>
              </Card.Content>
            </LinearGradient>
          </Card>
          {edit === item.id && <EditItemModal itemData={item} onClear={() => onEdit(null)} onFetch={() => fetchItems()} />}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground 
        source={{ uri: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAyADIDASIAAhEBAxEB/8QAGAAAAwEBAAAAAAAAAAAAAAAAAAIDAQT/xAAfEAEAAgICAwEBAQAAAAAAAAABEQIDEgQhMVFBYXH/xAAXAQADAQAAAAAAAAAAAAAAAAAAAQID/8QAFhEBAQEAAAAAAAAAAAAAAAAAAAER/9oADAMBAAIRAxEAPwD00iYiZifTExEzE+mJ48zHhHHmY8JgAGAAAAAAAAAABiWWY9sSyx7YmADAAAAAAAAAAAGBZY9sCyx7YmADAAAAAAAAAAAGBZY9sCyx7YmADAAAAAAAAAAAGBZY9sCyx7YmADAAAAAAAAAAAGBZY9sCyx7YmADAAAAAAAAAAAGBZY9sCyx7YmADAAAAAAAAAAAGBZY9sCyx7YmAD//2Q==' }}
        style={styles.backgroundGradient}
        resizeMode="repeat"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>My Pantry</Text>
              <Text style={styles.headerSubtitle}>{filteredItems.length} items in stock</Text>
            </View>
          </TouchableWithoutFeedback>

          <View style={styles.searchContainer}>
            <Searchbar
              placeholder="Search in pantry..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
              iconColor="#5D4037"
              inputStyle={styles.searchInput}
            />
          </View>

          <View style={styles.categorySection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryContent}>
              {categories.map((category) => (
                <Chip
                  key={category}
                  compact
                  selected={selectedCategory === category || (category === "All" && !selectedCategory)}
                  onPress={() => setSelectedCategory(category === "All" ? null : category)}
                  style={[styles.filterChip, (selectedCategory === category || (category === "All" && !selectedCategory)) && styles.selectedFilterChip]}
                  textStyle={[styles.filterChipText, (selectedCategory === category || (category === "All" && !selectedCategory)) && styles.selectedFilterChipText]}
                >
                  {category}
                </Chip>
              ))}
            </ScrollView>
          </View>

          <ScrollView
            style={styles.itemsList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.itemsContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} tintColor={theme.colors.primary} />
            }
          >
            {sortedCategories.map((category) => (
              <View key={category} style={styles.shelfContainer}>
                <Text style={styles.shelfTitle}>{category}</Text>
                <View style={styles.shelf}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shelfContent}>
                    {groupedItems[category].map(renderItemCard)}
                  </ScrollView>
                </View>
              </View>
            ))}
          </ScrollView>

          <FloatingImagePickerButton />
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5D4037',
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F5EFE0',
    fontFamily: 'serif',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E8E0D0',
    opacity: 0.9,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  searchBar: {
    backgroundColor: 'rgba(245, 239, 224, 0.9)',
    elevation: 2,
    borderRadius: 30,
  },
  searchInput: {
    color: '#5D4037',
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
    backgroundColor: 'rgba(245, 239, 224, 0.8)',
    borderColor: '#8A655A',
    borderWidth: 1,
  },
  selectedFilterChip: {
    backgroundColor: '#8A655A',
  },
  filterChipText: {
    color: '#5D4037',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedFilterChipText: {
    color: '#F5EFE0',
  },
  itemsList: {
    flex: 1,
  },
  itemsContent: {
    paddingHorizontal: 10,
    paddingBottom: 100,
  },
  shelfContainer: {
    marginBottom: 24,
  },
  shelfTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F5EFE0',
    marginBottom: 12,
    paddingHorizontal: 10,
    fontFamily: 'serif',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  shelf: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 8,
    paddingVertical: 16,
    borderBottomWidth: 4,
    padding: 10,
    borderBottomColor: 'rgba(0,0,0,0.4)',
    minHeight: 150,
  },
  shelfContent: {
    paddingHorizontal: 10,
    marginBlock: 10, 
    alignItems: 'center',
  },
  itemCard: {
    width: "100%",
    marginRight: 10,
    elevation: 5,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  cardGradient: {
    borderRadius: 12,
  },
  cardContent: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#5D4037",
    marginBottom: 6,
  },
  overviewEditButton: {
    margin: -4,
    marginLeft: 10,
    backgroundColor: '#f5f5f5',
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
    marginTop: 8,
    paddingVertical: 8,
    backgroundColor: "rgba(138, 101, 90, 0.1)",
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  servingDetail: {
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    margin: 4,
  },
  servingLabel: {
    fontSize: 12,
    color: "#8A655A",
    marginBottom: 2,
    fontWeight: "500",
  },
  servingValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5D4037",
  },
  calorieValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#C62828",
  },
  nutrientText: {
    fontSize: 12,
    color: "#5D4037",
    backgroundColor: "rgba(138, 101, 90, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: "hidden",
  },
});