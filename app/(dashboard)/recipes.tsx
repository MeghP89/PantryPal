import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ImageBackground,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Text, Searchbar, Card, IconButton, useTheme } from 'react-native-paper';
import AddRecipe from '@/components/AddRecipe';
import { supabase } from '@/utils/supabase';
import RecipeOverviewModal from '@/components/RecipeOverviewModal';

type Recipe = {
  recipeId: string;
  recipeName: string;
  recipeDescription: string;
  recipeDifficulty: string;
  timeEstimate: string;
  recipeIngredients: {
    name: string,
    amount: string
  }[];
  recipeSteps: {
    step: number;
    description: string;
  }[];
};


export default function RecipesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [activeTab, setActiveTab] = useState('view'); // 'view' or 'add'
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();

  const fetchItems = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Error fetching items:", error);
      } else if (data) {
        const formattedRecipes: Recipe[] = data.map((recipe: any) => ({
          recipeId: recipe.id.toString(),
          recipeName: recipe.recipe_name,
          recipeDescription: recipe.recipe_description,
          recipeDifficulty: recipe.recipe_difficulty,
          timeEstimate: recipe.time_estimate,
          recipeIngredients: recipe.recipe_ingredients.map((ingredient: any) => ({
            name: ingredient.name,
            amount: ingredient.amount
          })),
          recipeSteps: recipe.recipe_steps.map((step: any) => ({
            step: step.stepNumber,
            description: step.stepDescription
          }))
        }));
        setRecipes(formattedRecipes);
        console.log(formattedRecipes[0].recipeSteps);
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
      .channel("recipe-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "recipes" },
        () => fetchItems()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchItems]);

  const handleDelete = async (id: string) => {
    if (selectedRecipe && selectedRecipe.recipeId === id) {
      setSelectedRecipe(null);
    }
    const { error } = await supabase.from("recipes").delete().eq("id", id);
    if (!error) fetchItems(); // refresh the list
  };

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.recipeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderRecipeCard = (recipe: Recipe) => (
    <TouchableOpacity onPress={() => setSelectedRecipe(recipe)}>
      <Card key={recipe.recipeId} style={styles.recipeCard}>
        <Card.Title
          title={recipe.recipeName}
          titleStyle={styles.recipeTitle}
          right={(props) => <IconButton {...props} icon="delete" onPress={() => handleDelete(recipe.recipeId)} />}
        />
        <Card.Content>
          <Text style={styles.recipeDescription}>{recipe.recipeDescription}</Text>
          <View style={styles.ingredientList}>
            {recipe.recipeIngredients.map((ing, index) => (
              <Text key={index} style={styles.ingredientText}>
                {ing.name}
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
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} tintColor={theme.colors.primary} />
              }
            >
              {filteredRecipes.length === 0 ? (
                <Card style={styles.emptyCard}>
                  <Card.Content>
                    <Text style={styles.emptyText}>No recipes found</Text>
                    <Text style={styles.emptySubtext}>
                      Add a recipe to get started!
                    </Text>
                  </Card.Content>
                </Card>
              ) : (
                filteredRecipes.map(renderRecipeCard)
              )}
            </ScrollView>
          </>
        ) : (
          <AddRecipe onRecipeCreated={() => {
            fetchItems();
            setActiveTab('view');
          }} />
        )}
        <RecipeOverviewModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
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
  emptyCard: {
    backgroundColor: "rgba(245, 239, 224, 0.95)",
    borderRadius: 12,
    marginTop: 40,
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