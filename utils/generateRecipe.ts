import { supabase } from "./supabase";

type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  total_servings: number;
  unit: string;
  amount: number;
};

async function callGenerateRecipeEdge(items: InventoryItem[], pantryList: string, additionalInstructions?: string) {
  // Send only the items, pantry info, and additional instructions to the Edge Function
  const { data, error } = await supabase.functions.invoke("generate-recipe", {
    body: { items, pantryList, additionalInstructions },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data.recipe;
}

export async function generateRecipe(items: InventoryItem[], userId: string, additionalInstructions?: string) {
  // --- Supabase logic remains in the app ---
  // Check for existing recipe
  const { data: existingData, error: existingError } = await supabase
    .from("recipes")
    .select("*")
    .neq("user_id", userId);

  if (existingError) {
    console.error("Error fetching existing recipes:", existingError);
  }

  const normalized = items.map(i => i.name.trim().toLowerCase()).sort();
  const existing = existingData?.find(recipe => {
    try {
      const recipeNames = JSON.parse(recipe.ingredients).map((i: any) => i.name.trim().toLowerCase()).sort();
      return JSON.stringify(recipeNames) === JSON.stringify(normalized);
    } catch {
      return false;
    }
  });

  if (existing) {
    console.log("Found existing recipe:", existing.recipe_name);
    return existing;
  }

  // Fetch pantry items
  const { data: pantryItems, error: pantryError } = await supabase
    .from("nutritional_items")
    .select("item_name, item_quantity, serving_unit, amount_per_serving")
    .eq("userid", userId);

  if (pantryError) {
    console.error("Error fetching pantry items:", pantryError);
  }

  const pantryListString = pantryItems && pantryItems.length > 0
    ? pantryItems.map(item => `${item.item_name} (available: ${item.item_quantity}, each is ${item.amount_per_serving} ${item.serving_unit})`).join("\n- ")
    : "Pantry information not available or pantry is empty.";

  // --- Call Edge Function for AI generation ---
  const recipe = await callGenerateRecipeEdge(items, pantryListString, additionalInstructions);

  return recipe;
}
