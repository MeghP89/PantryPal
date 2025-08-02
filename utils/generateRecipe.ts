import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from "./supabase";

const ai = new GoogleGenAI({ apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY });

type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  total_servings: number;
  unit: string;
  amount: number;
};

// ⬅️ Optional helper to normalize ingredients
function normalizeIngredientName(name: string) {
  return name.trim().toLowerCase();
}

async function checkForExistingRecipe(items: any[], userId: string) {
  if (!Array.isArray(items)) {
    throw new Error("Invalid input: 'items' must be an array");
  }

  const normalized = items.map(item => normalizeIngredientName(item.name)).sort();

  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .neq('user_id', userId)

  if (error) {
    console.error("Supabase query failed:", error.message);
    throw error;
  }

  const found = data.find(recipe => {
    try {
      console.log("Checking recipe:", recipe.recipe_name)
      const recipeIngredients = JSON.parse(recipe.ingredients);
      const recipeNames = recipeIngredients.map(i => normalizeIngredientName(i.name)).sort();
      return JSON.stringify(recipeNames) === JSON.stringify(normalized);
    } catch (err) {
      return false;
    }
  });

  return found || null;
}

export async function generateRecipe(items: InventoryItem[], userId: string, additionalInstructions?: string) {
  const existing = await checkForExistingRecipe(items, userId);
  if (existing) {
    console.log("Found existing recipe from another user:", existing.recipe_name);
    return existing;
  }

  // Fetch all pantry items for the user
  const { data: pantryItems, error: pantryError } = await supabase
    .from('nutritional_items')
    .select('item_name, item_quantity, serving_unit, amount_per_serving')
    .eq('userid', userId);

  if (pantryError) {
    console.error("Failed to fetch pantry:", pantryError);
    // Not throwing an error, just proceeding without full pantry context if it fails.
  }

  const pantryListString = pantryItems && pantryItems.length > 0
    ? pantryItems.map(
        (item) => `${item.item_name} (available: ${item.item_quantity} quantity, each is ${item.amount_per_serving} ${item.serving_unit})`
      ).join('\n- ')
    : 'Pantry information not available or pantry is empty.';

  const selectedItemsList = items.map(
    (item) => `${item.name} (${item.quantity} x ${item.amount}${item.unit})`
  );
  
  console.log("Generating new recipe...");

  const prompt = `
    You are a creative chef tasked with generating a recipe based on a user's pantry.

    **Primary Ingredients:**
    The user has specifically selected the following items to be the star of the dish. These MUST be used.
    - ${selectedItemsList.join("\n- ")}

    **Full Pantry List:**
    Here is a complete list of items in the user's pantry. You can use these to supplement the recipe. Be mindful of the quantities available and try to use what's on hand.
    - ${pantryListString}

    **Your Task:**
    Generate a creative recipe that prominently features the **Primary Ingredients**. You may use items from the **Full Pantry List** as needed. It is also acceptable to suggest a small number of common staple ingredients (like salt, pepper, oil, water) that might not be listed.

    **Important:** When listing the ingredients in the final recipe, ensure the names are clear and the amounts are reasonable based on the user's pantry. For example, if the user has "2 eggs", don't create a recipe that requires "4 eggs".
    In ingredient amount required utilize the amount that you think is necessary for the recipe and do not use the amount the user has in their pantry for that item.

    ${additionalInstructions ? `**Additional Instructions from User:** ${additionalInstructions}` : ""}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ text: prompt }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recipeName: { type: Type.STRING },
          timeEstimate: { type: Type.STRING },
          recipeDifficulty: { type: Type.STRING },
          recipeDescription: { type: Type.STRING },
          ingredients: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                amount: { type: Type.STRING }
              } 
            } 
          },
          recipeSteps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                stepNumber: { type: Type.INTEGER },
                stepDescription: { type: Type.STRING },
              },
            },
          },
        },
      },
    },
  });

  if (!response.text) throw new Error("Gemini returned no recipe");

  const recipe = JSON.parse(response.text);
  console.log("Generated new recipe:", recipe);
  return recipe;
}

