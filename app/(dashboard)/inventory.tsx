import React, { useState } from 'react'
import { View, Text, FlatList, StyleSheet } from 'react-native'
import FloatingImagePickerButton from '../../components/FloatingImagePickerButton'
import CategoryTabs from '../../components/CategoryTabs'
import InventoryItem from '../../components/InventoryItem'
import SearchBar from '../../components/SearchBar'

interface GroceryItem {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  price: number
}

const SAMPLE_ITEMS: GroceryItem[] = [
  { id: '1', name: 'Bananas', category: 'Produce', quantity: 6, unit: 'pcs', price: 3.49 },
  { id: '2', name: 'Milk', category: 'Dairy', quantity: 1, unit: 'gal', price: 4.29 },
  { id: '3', name: 'Bread', category: 'Bakery', quantity: 1, unit: 'loaf', price: 3.99 },
  { id: '4', name: 'Beef', category: 'Meat', quantity: 2, unit: 'lbs', price: 12.98 },
  { id: '5', name: 'Sauce', category: 'Pantry', quantity: 2, unit: 'jars', price: 5.98 },
  { id: '6', name: 'Yogurt', category: 'Dairy', quantity: 4, unit: 'cups', price: 6.49 },
  { id: '7', name: 'Apples', category: 'Produce', quantity: 8, unit: 'pcs', price: 4.99 },
  { id: '8', name: 'Chicken', category: 'Meat', quantity: 3, unit: 'lbs', price: 15.99 }
]

export default function Inventory() {
  const [items] = useState<GroceryItem[]>(SAMPLE_ITEMS)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [search, setSearch] = useState('')

  const categories = ['All', 'Produce', 'Dairy', 'Meat', 'Bakery', 'Pantry']

  const filteredItems = items.filter(item => {
    const matchCategory = selectedCategory === 'All' || item.category === selectedCategory
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
    return matchCategory && matchSearch
  })

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Inventory</Text>
      <SearchBar value={search} onChange={setSearch} />
      <CategoryTabs
        categories={categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />
      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <InventoryItem
            name={item.name}
            quantity={item.quantity}
            unit={item.unit}
            price={item.price}
          />
        )}
      />
      <FloatingImagePickerButton />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff'
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12
  }
})
