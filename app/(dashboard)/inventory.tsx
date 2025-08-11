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
  Dimensions,
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
import { addToShoppingList } from "../../utils/shoppingList";
import ConfirmationModal from "@/components/ConfirmationModal";

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = Math.min(280, screenWidth * 0.75);

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

// Utility function to truncate text
const truncateText = (text: string, maxLength: number = 20) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export default function NutritionalItemsScreen() {
  const [items, setItems] = useState<NutritionalItem[]>([]);
  const [edit, setEdit] = useState<string | null>(null);
  const [overviewItemId, setOverviewItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    null
  );
  const [refreshing, setRefreshing] = useState(false);
  const [
    showAddToShoppingListModal,
    setShowAddToShoppingListModal,
  ] = useState(false);
  const [
    itemToAddToShoppingList,
    setItemToAddToShoppingList,
  ] = useState<NutritionalItem | null>(null);
  const theme = useTheme();

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
  };

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

  const onEdit = (id: string | null) => {
    setEdit(id);
  };

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

  const groupedItems = filteredItems.reduce((acc, item) => {
    const category = item.ItemCategory;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, NutritionalItem[]>);

  const shelfOrder = [
    "Produce",
    "Dairy",
    "Meat",
    "Bakery",
    "Grains",
    "Canned Goods",
    "Condiments",
    "Seasonings",
    "Beverages",
    "Snacks",
    "Frozen",
    "Misc",
  ];

  const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
    const indexA = shelfOrder.indexOf(a);
    const indexB = shelfOrder.indexOf(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("nutritional_items")
      .delete()
      .eq("itemid", id)
    if (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleUseItem = async (item: NutritionalItem) => {
    const newQuantity = item.ItemQuantity - 1;
    if (newQuantity > 0) {
      const { error } = await supabase
        .from("nutritional_items")
        .update({ item_quantity: newQuantity })
        .eq("itemid", item.id)
      fetchItems();
      if (error) {
        console.error("Error updating item quantity:", error);
      }
    } else {
      setItemToAddToShoppingList(item);
      setShowAddToShoppingListModal(true);
    }
  };

  const handleAddItem = async (item: NutritionalItem) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.error("No user logged in to update item quantity");
      return;
    }
    const newQuantity = item.ItemQuantity + 1;
    const { error } = await supabase
      .from("nutritional_items")
      .update({ item_quantity: newQuantity })
      .eq("itemid", item.id)
      .eq("userid", user.id);
    fetchItems();
    if (error) {
      console.error("Error updating item quantity:", error);
    }
  };

  const confirmAddToShoppingList = async () => {
    if (itemToAddToShoppingList) {
      await addToShoppingList(
        itemToAddToShoppingList.itemName,
        itemToAddToShoppingList.ItemCategory
      );
      await handleDelete(itemToAddToShoppingList.id);
      setShowAddToShoppingListModal(false);
      setItemToAddToShoppingList(null);
    }
  };

  const declineAddToShoppingList = async () => {
    if (itemToAddToShoppingList) {
      await handleDelete(itemToAddToShoppingList.id);
      setShowAddToShoppingListModal(false);
      setItemToAddToShoppingList(null);
    }
  };

  const renderNutritionalInfo = (
    nutrients: NutritionalItem["NutritionalInfo"]
  ) => {
    return nutrients.slice(0, 2).map((nutrient, index) => (
      <View key={index} style={styles.nutrientContainer}>
        <Text style={styles.nutrientText} numberOfLines={1}>
          {truncateText(nutrient.NutrientName, 8)}: {nutrient.NutrientAmount}
          {nutrient.NutrientUnit}
        </Text>
      </View>
    ));
  };

  const renderItemCard = (item: NutritionalItem) => {
    if (overviewItemId === item.id) {
      return (
        <View key={item.id} style={styles.cardContainer}>
          <ItemOverView
            itemData={item}
            getCategoryColor={getCategoryColor}
            onClose={() => setOverviewItemId(null)}
            onEdit={() => {
              setOverviewItemId(null);
              onEdit(item.id);
            }}
          />
        </View>
      );
    }

    return (
      <View key={item.id} style={styles.cardContainer}>
        <TouchableOpacity
          onPress={() => setOverviewItemId(item.id)}
          activeOpacity={0.8}
          style={styles.cardTouchable}
        >
          <Card style={styles.itemCard}>
            <LinearGradient
              colors={["#F5EFE0", "#E8E0D0"]}
              style={styles.cardGradient}
            >
              <Card.Content style={styles.cardContent}>
                {/* Header Section */}
                <View style={styles.cardHeader}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.itemName}
                    </Text>
                    <Chip
                      style={[
                        styles.categoryChip,
                        { backgroundColor: getCategoryColor(item.ItemCategory) },
                      ]}
                      textStyle={styles.categoryChipText}
                      compact
                    >
                      {item.ItemCategory}
                    </Chip>
                  </View>
                  
                  {/* Quantity Badge */}
                  <View style={styles.quantityBadge}>
                    <Text style={styles.quantityText}>{item.ItemQuantity}</Text>
                  </View>
                </View>

                {/* Action Buttons Row */}
                <View style={styles.actionButtons}>
                  <IconButton
                    icon="pencil"
                    size={18}
                    onPress={() => onEdit(item.id)}
                    style={styles.actionButton}
                    iconColor="#5D4037"
                  />
                  <IconButton
                    icon="minus-circle-outline"
                    size={18}
                    onPress={() => handleUseItem(item)}
                    style={styles.actionButton}
                    iconColor="#FF6B35"
                  />
                  <IconButton
                    icon="plus-circle-outline"
                    size={18}
                    onPress={() => handleAddItem(item)}
                    style={styles.actionButton}
                    iconColor="#0b8615ff"
                  />
                  <IconButton
                    icon="delete"
                    size={18}
                    onPress={() => handleDelete(item.id)}
                    style={styles.actionButton}
                    iconColor="#D32F2F"
                  />
                </View>

                {/* Serving Information */}
                <View style={styles.servingInfo}>
                  <View style={styles.servingDetail}>
                    <Text style={styles.servingLabel}>Serving</Text>
                    <Text style={styles.servingValue} numberOfLines={1}>
                      {item.AmountPerServing} {truncateText(item.ServingUnit, 6)}
                    </Text>
                  </View>
                  <View style={styles.servingDetail}>
                    <Text style={styles.servingLabel}>Calories</Text>
                    <Text style={styles.calorieValue}>
                      {item.CaloriesPerServing}
                    </Text>
                  </View>
                </View>

                {/* Nutritional Information */}
                {item.NutritionalInfo.length > 0 && (
                  <View style={styles.nutritionalSection}>
                    <Text style={styles.nutritionalTitle}>Nutrients</Text>
                    <View style={styles.nutrientsContainer}>
                      {renderNutritionalInfo(item.NutritionalInfo)}
                    </View>
                  </View>
                )}
              </Card.Content>
            </LinearGradient>
          </Card>
        </TouchableOpacity>
        
        {edit === item.id && (
          <EditItemModal
            itemData={item}
            onClear={() => onEdit(null)}
            onFetch={() => fetchItems()}
          />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={{
          uri:
            "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAyADIDASIAAhEBAxEB/8QAGAAAAwEBAAAAAAAAAAAAAAAAAAIDAQT/xAAfEAEAAgICAwEBAQAAAAAAAAABEQIDEgQhMVFBYXH/xAAXAQADAQAAAAAAAAAAAAAAAAAAAQID/8QAFhEBAQEAAAAAAAAAAAAAAAAAAAER/9oADAMBAAIRAxEAPwD00iYiZifTExEzE+mJ48zHhHHmY8JgAGAAAAAAAAAABiWWY9sSyx7YmADAAAAAAAAAAAGBZY9sCyx7YmADAAAAAAAAAAAGBZY9sCyx7YmADAAAAAAAAAAAGBZY9sCyx7YmADAAAAAAAAAAAGBZY9sCyx7YmADAAAAAAAAAAAGBZY9sCyx7YmADAAAAAAAAAAAGBZY9sCyx7YmAD//2Q==",
        }}
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
              <Text style={styles.headerSubtitle}>
                {filteredItems.length} items in stock
              </Text>
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
                  textStyle={[
                    styles.filterChipText,
                    (selectedCategory === category ||
                      (category === "All" && !selectedCategory)) &&
                      styles.selectedFilterChipText,
                  ]}
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
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
          >
            {sortedCategories.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Card.Content>
                  <Text style={styles.emptyText}>No items in your pantry</Text>
                  <Text style={styles.emptySubtext}>
                    Add some items to get started!
                  </Text>
                </Card.Content>
              </Card>
            ) : (
              sortedCategories.map((category) => (
                <View key={category} style={styles.shelfContainer}>
                  <Text style={styles.shelfTitle}>{category}</Text>
                  <View style={styles.shelf}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.shelfContent}
                    >
                      {groupedItems[category].map(renderItemCard)}
                    </ScrollView>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <FloatingImagePickerButton />
        </KeyboardAvoidingView>
      </ImageBackground>
      {itemToAddToShoppingList && (
        <ConfirmationModal
          visible={showAddToShoppingListModal}
          onConfirm={confirmAddToShoppingList}
          onDecline={declineAddToShoppingList}
          itemName={itemToAddToShoppingList.itemName}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5D4037",
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
    fontWeight: "bold",
    color: "#F5EFE0",
    fontFamily: "serif",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#E8E0D0",
    opacity: 0.9,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  searchBar: {
    backgroundColor: "rgba(245, 239, 224, 0.9)",
    elevation: 2,
    borderRadius: 30,
  },
  searchInput: {
    color: "#5D4037",
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
    backgroundColor: "rgba(245, 239, 224, 0.8)",
    borderColor: "#8A655A",
    borderWidth: 1,
  },
  selectedFilterChip: {
    backgroundColor: "#8A655A",
  },
  filterChipText: {
    color: "#5D4037",
    fontSize: 12,
    fontWeight: "600",
  },
  selectedFilterChipText: {
    color: "#F5EFE0",
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
    fontWeight: "bold",
    color: "#F5EFE0",
    marginBottom: 12,
    paddingHorizontal: 10,
    fontFamily: "serif",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  shelf: {
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 8,
    paddingVertical: 16,
    borderBottomWidth: 4,
    padding: 10,
    borderBottomColor: "rgba(0,0,0,0.4)",
    minHeight: 200,
  },
  shelfContent: {
    paddingHorizontal: 10,
    marginBlock: 10,
    alignItems: "center",
  },
  // Card-specific styles
  cardContainer: {
    marginRight: 12,
    width: CARD_WIDTH,
  },
  cardTouchable: {
    width: '100%',
  },
  itemCard: {
    width: '100%',
    elevation: 6,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  cardGradient: {
    borderRadius: 16,
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
    marginRight: 12,
  },
  itemName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#5D4037",
    marginBottom: 8,
    lineHeight: 22,
  },
  quantityBadge: {
    backgroundColor: "#5D4037",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 40,
    alignItems: "center",
    elevation: 2,
  },
  quantityText: {
    color: "#F5EFE0",
    fontWeight: "bold",
    fontSize: 16,
  },
  categoryChip: {
    alignSelf: "flex-start",
    marginTop: 4,
  },
  categoryChipText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
    backgroundColor: "rgba(138, 101, 90, 0.1)",
    borderRadius: 12,
    paddingVertical: 4,
  },
  actionButton: {
    margin: 0,
    backgroundColor: "rgba(245, 239, 224, 0.8)",
    borderRadius: 20,
  },
  servingInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(138, 101, 90, 0.1)",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  servingDetail: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 4,
  },
  servingLabel: {
    fontSize: 11,
    color: "#8A655A",
    marginBottom: 4,
    fontWeight: "500",
  },
  servingValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5D4037",
    textAlign: "center",
  },
  calorieValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#C62828",
  },
  nutritionalSection: {
    marginTop: 8,
  },
  nutritionalTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5D4037",
    marginBottom: 6,
  },
  nutrientsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  nutrientContainer: {
    flex: 1,
    minWidth: "45%",
  },
  nutrientText: {
    fontSize: 10,
    color: "#5D4037",
    backgroundColor: "rgba(138, 101, 90, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    textAlign: "center",
  },
  emptyCard: {
    backgroundColor: "rgba(245, 239, 224, 0.95)",
    borderRadius: 12,
    marginTop: 40,
    marginHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#5D4037",
    textAlign: "center",
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#8A655A",
    textAlign: "center",
  },
});