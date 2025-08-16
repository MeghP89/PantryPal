import { Alert } from 'react-native';
import { supabase } from './supabase';

export type Recipe = {
  recipeId: string;
  recipeName: string;
  recipeIngredients: {
    name: string;
    amount: string;
  }[];
};

export type MissingItem = {
  name: string;
  reason: 'missing' | 'insufficient';
  shortfall: string | null;
};

type HandleUseRecipeResult = {
  success: boolean;
  missingOrInsufficient?: MissingItem[];
  error?: string;
};

export const handleUseRecipe = async (recipe: Recipe): Promise<HandleUseRecipeResult> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      throw new Error("User not logged in");
    }

    const { data: inventoryItems, error: inventoryError } = await supabase
      .from('nutritional_items')
      .select('itemid, item_name, item_quantity, serving_unit, amount_per_serving')
      .eq('userid', session.user.id);

    if (inventoryError) throw inventoryError;

    const recipeIngredientsString = recipe.recipeIngredients
      .map(ing => `${ing.name} (needs: ${ing.amount})`)
      .join('\n- ');

    const pantryItemsString = inventoryItems
      .map(item => `ID: ${item.itemid}, Name: ${item.item_name}, Quantity: ${item.item_quantity}, Unit: ${item.amount_per_serving} ${item.serving_unit}`)
      .join('\n- ');

    const prompt = `
      You are an intelligent pantry manager. Your task is to determine if a user has enough ingredients in their pantry to cook a recipe.

      **Recipe Ingredients:**
      - ${recipeIngredientsString}

      **Pantry Contents:**
      - ${pantryItemsString}

      **Your Task:**
      1. For each recipe ingredient, find the best matching item in the pantry. Matching should be fuzzy (e.g., 'egg' matches 'eggs').
      2. Compare the required amount from the recipe with the available amount in the pantry. Assume simple unit matching for now (e.g., if recipe needs '2 eggs', check if pantry has quantity >= 2).
      3. Determine if the user can cook the recipe.
      4. If they cannot, list missing or insufficient ingredients with details.
      5. Return a JSON object based on the defined schema.

      **Important:**
      - If an ingredient is not found, list it as missing unless it is water.
      - If found but the quantity is too low, list it as insufficient and specify the shortfall.
      - The 'itemId' in the output MUST be the original ID from the pantry contents for insufficient items.
    `;

    const { data, error } = await supabase.functions.invoke('useRecipe', {
      body: { prompt: prompt },
    })

    const validationResult = data;
    console.log(validationResult)

    console.log("Validation result:", validationResult);

    if (validationResult.canCook) {
      return { success: true };
    } else {
      return { success: false, missingOrInsufficient: validationResult.missingOrInsufficient };
    }

  } catch (error) {
    console.error("Error checking recipe:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "An unknown error occurred." };
  }
};
