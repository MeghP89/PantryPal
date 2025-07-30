import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import { Text, Searchbar, Card } from 'react-native-paper';
import AddRecipe from '@/components/AddRecipe';

// Mock data for recipes - replace with your actual data fetching
const mockRecipes = [
  {
    id: '1',
    name: 'Classic Spaghetti Bolognese',
    description: 'A rich and hearty pasta dish that is a true family favorite.',
    ingredients: ['Spaghetti', 'Ground Beef', 'Tomato Sauce', 'Onion', 'Garlic'],
  },
  {
    id: '2',
    name: 'Chicken & Veggie Stir-fry',
    description: 'A quick, healthy, and colorful stir-fry, perfect for a weeknight meal.',
    ingredients: ['Chicken Breast', 'Broccoli', 'Bell Peppers', 'Soy Sauce', 'Ginger'],
  },
  {
    id: '3',
    name: 'Lentil Soup',
    description: 'A nourishing and flavorful soup, great for a cozy day.',
    ingredients: ['Lentils', 'Carrots', 'Celery', 'Vegetable Broth', 'Spices'],
  },
];

export default function RecipesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('view'); // 'view' or 'add'

  const filteredRecipes = mockRecipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderRecipeCard = (recipe) => (
    <TouchableOpacity>
      <Card key={recipe.id} style={styles.recipeCard}>
        <Card.Title title={recipe.name} titleStyle={styles.recipeTitle} />
        <Card.Content>
          <Text style={styles.recipeDescription}>{recipe.description}</Text>
          <View style={styles.ingredientList}>
            {recipe.ingredients.map((ing, index) => (
              <Text key={index} style={styles.ingredientText}>
                {ing}
              </Text>
            ))}
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={{ uri: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAyADIDASIAAhEBAxEB/8QAGAAAAwEBAAAAAAAAAAAAAAAAAAIDAQT/xAAfEAEAAgICAwEBAQAAAAAAAAABEQIDEgQhMVFBYXH/xAAXAQADAQAAAAAAAAAAAAAAAAAAAQID/8QAFhEBAQEAAAAAAAAAAAAAAAAAAAER/9oADAMBAAIRAxEAPwD00iYiZifTExEzE+mJ48zHhHHmY8JgAGAAAAAAAAAABiWWY9sSyx7YmADAAAAAAAAAAAGBZY9sCyx7YmADAAAAAAAAAAAGBZY9sCyx7YmADAAAAAAAAAAAGBZY9sCyx7YmADAAAAAAAAAAAGBZY9sCyx7YmADAAAAAAAAAAAGBZY9sCyx7YmADAAAAAAAAAAAGBZY9sCyx7YmAD//2Q==' }}
        style={styles.backgroundGradient}
        resizeMode="repeat"
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Recipes</Text>
          <Text style={styles.headerSubtitle}>Your personal cookbook</Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'view' && styles.activeTab]}
            onPress={() => setActiveTab('view')}
          >
            <Text style={[styles.tabText, activeTab === 'view' && styles.activeTabText]}>
              My Recipes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'add' && styles.activeTab]}
            onPress={() => setActiveTab('add')}
          >
            <Text style={[styles.tabText, activeTab === 'add' && styles.activeTabText]}>
              Add New Recipe
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'view' ? (
          <>
            <View style={styles.searchContainer}>
              <Searchbar
                placeholder="Search recipes..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
                iconColor="#5D4037"
                inputStyle={styles.searchInput}
              />
            </View>
            <ScrollView
              style={styles.recipeList}
              contentContainerStyle={styles.recipeListContent}
            >
              {filteredRecipes.map(renderRecipeCard)}
            </ScrollView>
          </>
        ) : (
          <AddRecipe onRecipeCreated={() => setActiveTab('view')} />
        )}
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
    marginBottom: 10
  },
  searchInput: {
    color: '#5D4037',
  },
  recipeList: {
    flex: 1,
  },
  recipeListContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  recipeCard: {
    marginBottom: 16,
    backgroundColor: 'rgba(245, 239, 224, 0.95)',
    borderRadius: 12,
    elevation: 3,
  },
  recipeTitle: {
    color: '#5D4037',
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
  recipeDescription: {
    marginBottom: 12,
    color: '#8A655A',
  },
  ingredientList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ingredientText: {
    backgroundColor: 'rgba(138, 101, 90, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    color: '#5D4037',
    fontSize: 12,
    overflow: 'hidden',
  },
});