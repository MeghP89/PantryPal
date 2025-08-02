import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ImageBackground,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  Searchbar,
  Card,
  IconButton,
  Chip,
  TextInput,
  Button,
  useTheme,
  Divider,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker'
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '@/utils/supabase';
import { extractNutritionalInfoFromLabel } from '@/utils/readNutritionalLabel';
import LoadingComponent from '@/components/LoadingComponent';
import InsertItemModal, { ResponseSchema } from '@/components/InsertItemModal';

type ShoppingItem = {
  id: string;
  itemName: string;
  quantity: number;
  unit: string;
  category: 
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
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  estimatedPrice?: number;
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

const getPriorityColor = (priority: string) => {
  const colors = {
    low: "#4CAF50",
    medium: "#FF9800", 
    high: "#F44336",
  };
  return colors[priority] || "#4CAF50";
};

export default function ShoppingListScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'add'
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [inventoryItem, setInventoryItem] = useState<ResponseSchema | null>(null); 
  const [imageBase64, setImageBase64] = useState<string | null | undefined>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    active: true,
    completed: false
  });
  const theme = useTheme();
  
  // Add item form state
  const [newItem, setNewItem] = useState({
    itemName: '',
    quantity: 1,
    unit: 'pieces',
    category: 'Misc' as ShoppingItem['category'],
    priority: 'medium' as ShoppingItem['priority'],
    notes: '',
    estimatedPrice: undefined as number | undefined | string,
  });

  const fetchShoppingItems = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      const { data, error } = await supabase
        .from("shopping_list")
        .select("*")
        .eq("user_id", session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching shopping items:", error);
      } else if (data) {
        const formattedItems: ShoppingItem[] = data.map((item: any) => ({
          id: item.id.toString(),
          itemName: item.item_name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          isCompleted: item.is_completed,
          priority: item.priority,
          notes: item.notes,
          estimatedPrice: item.estimated_price,
        }));
        setShoppingItems(formattedItems);
      }
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchShoppingItems().then(() => setRefreshing(false));
  }, [fetchShoppingItems]);

  useFocusEffect(
    useCallback(() => {
      fetchShoppingItems();
    }, [fetchShoppingItems])
  );

  useEffect(() => {
    const subscription = supabase
      .channel("shopping-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shopping_list" },
        () => fetchShoppingItems()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchShoppingItems]);

  const addShoppingItem = async () => {
    if (!newItem.itemName.trim()) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    if (session) {
      const { error } = await supabase.from("shopping_list").insert([
        {
          user_id: session.user.id,
          item_name: newItem.itemName,
          quantity: newItem.quantity,
          unit: newItem.unit,
          category: newItem.category,
          priority: newItem.priority,
          notes: newItem.notes || null,
          estimated_price: newItem.estimatedPrice ? parseFloat(newItem.estimatedPrice) : null,
          is_completed: false,
        },
      ]);

      if (!error) {
        setNewItem({
          itemName: '',
          quantity: 1,
          unit: 'pieces',
          category: 'Misc',
          priority: 'medium',
          notes: '',
          estimatedPrice: undefined,
        });
        setActiveTab('list');
        fetchShoppingItems();
      }
    }
  };

  const toggleCompleted = async (id: string, isCompleted: boolean) => {
    const { error } = await supabase
      .from("shopping_list")
      .update({ is_completed: !isCompleted })
      .eq("id", id);
    
    if (!error) fetchShoppingItems();
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from("shopping_list").delete().eq("id", id);
    if (!error) fetchShoppingItems();
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) {
      alert('Camera permission is required.')
      return null
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      base64: true,
      aspect: [4, 3],
      allowsEditing: true,
      quality: 1,
    })

    if (result.canceled) {
      alert('You did not select any image.')
      return null
    }

    return result.assets[0].base64 || null
  }

  const addToInventory = async (item: ShoppingItem) => {
    const imageData = await handleTakePhoto();
    
    if (imageData) {
      setLoading(true);
      try {
        const parsedItem = await extractNutritionalInfoFromLabel(imageData);
        if (parsedItem) {
          // If OCR fails to find an item name, use the one from the shopping list.
          setInventoryItem({ ...parsedItem, itemName: parsedItem.itemName || item.itemName });
          setModalVisible(true);
        } else {
          Alert.alert("Failed to read label", "Please enter item details manually.", [
            { text: "OK", onPress: () => {
              setInventoryItem({ ...parsedItem, itemName: item.itemName });
              setModalVisible(true);
            }}
          ]);
        }
      } catch (e) {
        Alert.alert("Error", "Failed to process image. Please try again.", [{ text: "OK" }]);
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
  };

  const clearCompleted = async () => {
    Alert.alert(
      "Clear Completed Items",
      "Are you sure you want to remove all completed items?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("shopping_list")
              .delete()
              .eq("is_completed", true);
            
            if (!error) fetchShoppingItems();
          }
        }
      ]
    );
  };

  const categories = [
    "All", "Produce", "Dairy", "Meat", "Bakery", "Frozen", "Beverages",
    "Snacks", "Canned Goods", "Condiments", "Grains", "Seasonings", "Misc",
  ];

  const units = ['pieces', 'lbs', 'oz', 'cups', 'tbsp', 'tsp', 'gallons', 'liters', 'packages'];

  const filteredItems = shoppingItems.filter((item) => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const activeItems = filteredItems.filter(item => !item.isCompleted);
  const completedItems = filteredItems.filter(item => item.isCompleted);

  const completedCount = shoppingItems.filter(item => item.isCompleted).length;
  const totalCount = shoppingItems.length;
  const totalEstimatedCost = activeItems
    .filter(item => item.estimatedPrice)
    .reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);

  const toggleSection = (section: 'active' | 'completed') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderShoppingItem = (item: ShoppingItem, isCompleted: boolean = false) => (
    <Card key={item.id} style={[styles.itemCard, isCompleted && styles.completedCard]}>
      <Card.Content>
        <View style={styles.itemRow}>
          <TouchableOpacity 
            onPress={() => toggleCompleted(item.id, item.isCompleted)}
            style={styles.checkboxContainer}
          >
            <IconButton 
              icon={item.isCompleted ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
              iconColor={item.isCompleted ? "#4CAF50" : "#8A655A"}
              size={24}
            />
          </TouchableOpacity>
          
          <View style={styles.itemDetails}>
            <View style={styles.itemHeader}>
              <Text style={[styles.itemName, item.isCompleted && styles.completedText]}>
                {item.itemName}
              </Text>
              <View style={styles.badgeContainer}>
                <Chip
                  style={[styles.categoryChip, { backgroundColor: getCategoryColor(item.category) }]}
                  textStyle={styles.categoryChipText}
                  compact
                >
                  {item.category}
                </Chip>
                {!item.isCompleted && (
                  <Chip
                    style={[styles.priorityChip, { backgroundColor: getPriorityColor(item.priority) }]}
                    textStyle={styles.priorityChipText}
                    compact
                  >
                    {item.priority}
                  </Chip>
                )}
              </View>
            </View>
            
            <View style={styles.itemMeta}>
              <Text style={[styles.quantityText, item.isCompleted && styles.completedText]}>
                {item.quantity} {item.unit}
              </Text>
              {item.estimatedPrice && (
                <Text style={[styles.priceText, item.isCompleted && styles.completedText]}>
                  ${item.estimatedPrice.toFixed(2)}
                </Text>
              )}
            </View>
            
            {item.notes && (
              <Text style={[styles.notesText, item.isCompleted && styles.completedText]}>
                {item.notes}
              </Text>
            )}
          </View>
          
          <View style={styles.actionButtons}>
            {item.isCompleted && (
              <TouchableOpacity
                style={styles.inventoryButton}
                onPress={() => addToInventory(item)}
              >
                <IconButton
                  icon="package-variant-closed"
                  size={20}
                  iconColor="#2E7D32"
                />
                <Text style={styles.inventoryButtonText}>Inventory</Text>
              </TouchableOpacity>
            )}
            <IconButton
              icon="delete"
              size={20}
              onPress={() => deleteItem(item.id)}
              iconColor="#F44336"
              style={styles.deleteButton}
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderAddItemForm = () => (
    <ScrollView style={styles.formContainer} contentContainerStyle={styles.formContent}>
      <Card style={styles.formCard}>
        <Card.Content>
          <Text style={styles.formTitle}>Add New Item</Text>
          
          <TextInput
            label="Item Name"
            value={newItem.itemName}
            onChangeText={(text) => setNewItem({...newItem, itemName: text})}
            style={styles.input}
            mode="outlined"
            outlineColor="#8A655A"
            activeOutlineColor="#5D4037"
          />
          
          <View style={styles.row}>
            <TextInput
              label="Quantity"
              value={newItem.quantity.toString()}
              onChangeText={(text) => setNewItem({...newItem, quantity: parseInt(text) || 1})}
              style={[styles.input, styles.halfInput]}
              mode="outlined"
              keyboardType="numeric"
              outlineColor="#8A655A"
              activeOutlineColor="#5D4037"
            />
            
            <View style={styles.halfInput}>
              <Text style={styles.labelText}>Unit</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipRow}>
                  {units.map((unit) => (
                    <Chip
                      key={unit}
                      selected={newItem.unit === unit}
                      onPress={() => setNewItem({...newItem, unit})}
                      style={[styles.unitChip, newItem.unit === unit && styles.selectedChip]}
                      textStyle={newItem.unit === unit ? styles.selectedChipText : styles.chipText}
                      compact
                    >
                      {unit}
                    </Chip>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
          
          <View>
            <Text style={styles.labelText}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {categories.filter(cat => cat !== 'All').map((category) => (
                  <Chip
                    key={category}
                    selected={newItem.category === category}
                    onPress={() => setNewItem({...newItem, category: category as ShoppingItem['category']})}
                    style={[
                      styles.categorySelectChip, 
                      newItem.category === category && { backgroundColor: getCategoryColor(category) }
                    ]}
                    textStyle={newItem.category === category ? styles.selectedChipText : styles.chipText}
                    compact
                  >
                    {category}
                  </Chip>
                ))}
              </View>
            </ScrollView>
          </View>
          
          <View>
            <Text style={styles.labelText}>Priority</Text>
            <View style={styles.chipRow}>
              {['low', 'medium', 'high'].map((priority) => (
                <Chip
                  key={priority}
                  selected={newItem.priority === priority}
                  onPress={() => setNewItem({...newItem, priority: priority as ShoppingItem['priority']})}
                  style={[
                    styles.prioritySelectChip,
                    newItem.priority === priority && { backgroundColor: getPriorityColor(priority) }
                  ]}
                  textStyle={newItem.priority === priority ? styles.selectedChipText : styles.chipText}
                  compact
                >
                  {priority}
                </Chip>
              ))}
            </View>
          </View>
          
          <TextInput
            label="Estimated Price (optional)"
            value={newItem.estimatedPrice?.toString() || ''}
            onChangeText={(text) =>
              setNewItem({ ...newItem, estimatedPrice: text ? parseFloat(text) : undefined })
            }
            style={styles.input}
            mode="outlined"
            keyboardType="decimal-pad"
            outlineColor="#8A655A"
            activeOutlineColor="#5D4037"
            left={<TextInput.Affix text="$" />}
          />
                    
          <TextInput
            label="Notes (optional)"
            value={newItem.notes}
            onChangeText={(text) => setNewItem({...newItem, notes: text})}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={2}
            outlineColor="#8A655A"
            activeOutlineColor="#5D4037"
          />
          
          <Button 
            mode="contained" 
            onPress={addShoppingItem}
            style={styles.addButton}
            buttonColor="#5D4037"
            disabled={!newItem.itemName.trim()}
          >
            Add to Shopping List
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );

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
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Shopping List</Text>
            <Text style={styles.headerSubtitle}>
              {totalCount - completedCount} active • {completedCount} completed
              {totalEstimatedCost > 0 && ` • Est. $${totalEstimatedCost.toFixed(2)}`}
            </Text>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'list' && styles.activeTab]}
              onPress={() => setActiveTab('list')}
            >
              <Text style={[styles.tabText, activeTab === 'list' && styles.activeTabText]}>
                Shopping List
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'add' && styles.activeTab]}
              onPress={() => setActiveTab('add')}
            >
              <Text style={[styles.tabText, activeTab === 'add' && styles.activeTabText]}>
                Add Item
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'list' ? (
            <>
                <View style={styles.searchContainer}>
                  <Searchbar
                    placeholder="Search shopping list..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                    iconColor="#5D4037"
                    inputStyle={styles.searchInput}
                  />
                </View>

                <View style={styles.filterContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
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
                  contentContainerStyle={styles.itemsListContent}
                  refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} tintColor={theme.colors.primary} />
                  }
                >
                  {/* Active Items Section */}
                  <TouchableOpacity
                    style={styles.sectionHeader}
                    onPress={() => toggleSection('active')}
                  >
                    <View style={styles.sectionHeaderContent}>
                      <Text style={styles.sectionTitle}>
                        Shopping List ({activeItems.length})
                      </Text>
                      <IconButton
                        icon={expandedSections.active ? "chevron-up" : "chevron-down"}
                        size={24}
                        iconColor="#F5EFE0"
                      />
                    </View>
                  </TouchableOpacity>

                  {expandedSections.active && (
                    <View style={styles.sectionContent}>
                      {activeItems.length === 0 ? (
                        <Card style={styles.emptyCard}>
                          <Card.Content>
                            <Text style={styles.emptyText}>No active items</Text>
                            <Text style={styles.emptySubtext}>Add some items to get started!</Text>
                          </Card.Content>
                        </Card>
                      ) : (
                        activeItems.map(item => renderShoppingItem(item, false))
                      )}
                    </View>
                  )}

                  {/* Completed Items Section */}
                  {completedItems.length > 0 && (
                    <>
                      <Divider style={styles.sectionDivider} />
                      <TouchableOpacity
                        style={styles.sectionHeader}
                        onPress={() => toggleSection('completed')}
                      >
                        <View style={styles.sectionHeaderContent}>
                          <Text style={styles.sectionTitle}>
                            Completed ({completedItems.length})
                          </Text>
                          <View style={styles.sectionHeaderActions}>
                            <TouchableOpacity
                              style={styles.clearAllButton}
                              onPress={clearCompleted}
                            >
                              <Text style={styles.clearAllText}>Clear All</Text>
                            </TouchableOpacity>
                            <IconButton
                              icon={expandedSections.completed ? "chevron-up" : "chevron-down"}
                              size={24}
                              iconColor="#F5EFE0"
                            />
                          </View>
                        </View>
                      </TouchableOpacity>

                      {expandedSections.completed && (
                        <View style={styles.sectionContent}>
                          {completedItems.map(item => renderShoppingItem(item, true))}
                        </View>
                      )}
                    </>
                  )}
                </ScrollView>
                {loading && (<LoadingComponent visible={loading} message='Reading Image' />)}
                {modalVisible && (<InsertItemModal itemData={inventoryItem} onClear={() => setModalVisible(false)} />)}
            </>
          ) : (
            renderAddItemForm()
          )}
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
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 16,
    backgroundColor: 'rgba(245, 239, 224, 0.8)',
    borderRadius: 30,
    marginHorizontal: 20,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#8A655A',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5D4037',
  },
  activeTabText: {
    color: '#F5EFE0',
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
  filterContainer: {
    marginBottom: 8,
  },
  filterContent: {
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
  itemsListContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 8,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(138, 101, 90, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F5EFE0',
    fontFamily: 'serif',
  },
  sectionHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearAllButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.8)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  clearAllText: {
    color: '#F5EFE0',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionContent: {
    marginBottom: 16,
  },
  sectionDivider: {
    backgroundColor: 'rgba(245, 239, 224, 0.3)',
    height: 1,
    marginVertical: 16,
  },
  itemCard: {
    marginBottom: 8,
    backgroundColor: 'rgba(245, 239, 224, 0.95)',
    borderRadius: 12,
    elevation: 2,
  },
  completedCard: {
    backgroundColor: 'rgba(245, 239, 224, 0.7)',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxContainer: {
    marginRight: 8,
  },
  itemDetails: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#5D4037',
    flex: 1,
    marginTop: 10,
    marginRight: 8,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  categoryChip: {
    marginTop: 10,
    height: 'auto',
  },
  categoryChipText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  priorityChip: {
    marginTop: 10,
    height: 'auto',
  },
  priorityChipText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  quantityText: {
    fontSize: 14,
    color: '#8A655A',
    fontWeight: '600',
  },
  priceText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  notesText: {
    fontSize: 12,
    color: '#8A655A',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'column',
    alignItems: 'center',
    marginLeft: 8,
  },
  inventoryButton: {
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  inventoryButtonText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: '600',
    marginTop: -4,
  },
  deleteButton: {
    margin: 0,
  },
  emptyCard: {
    backgroundColor: 'rgba(245, 239, 224, 0.95)',
    borderRadius: 12,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5D4037',
    textAlign: 'center',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8A655A',
    textAlign: 'center',
  },
  // Form styles
  formContainer: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  formCard: {
    backgroundColor: 'rgba(245, 239, 224, 0.95)',
    borderRadius: 12,
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5D4037',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 12,
    backgroundColor: 'rgba(245, 239, 224, 0.5)',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  labelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5D4037',
    marginBottom: 8,
    marginTop: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  unitChip: {
    backgroundColor: 'rgba(138, 101, 90, 0.2)',
  },
  categorySelectChip: {
    backgroundColor: 'rgba(138, 101, 90, 0.2)',
  },
  prioritySelectChip: {
    backgroundColor: 'rgba(138, 101, 90, 0.2)',
  },
  selectedChip: {
    backgroundColor: '#8A655A',
  },
  chipText: {
    color: '#5D4037',
    fontSize: 12,
  },
  selectedChipText: {
    color: '#F5EFE0',
    fontSize: 12,
  },
  addButton: {
    marginTop: 16,
    paddingVertical: 4,
  },
});