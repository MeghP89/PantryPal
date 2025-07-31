import { Alert } from 'react-native';
import { supabase } from './supabase';
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY });

type Recipe = {
  recipeId: string;
  recipeName: string;
  recipeIngredients: {
    name: string;
    amount: string;
  }[];
};

export const handleUseRecipe = async (recipe: Recipe) => {
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
      - If an ingredient is not found, list it as missing.
      - If found but the quantity is too low, list it as insufficient and specify the shortfall.
      - The 'itemId' in the output MUST be the original ID from the pantry contents for insufficient items.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ text: prompt }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            canCook: { type: Type.BOOLEAN },
            missingOrInsufficient: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  shortfall: { type: Type.STRING, nullable: true }, // Added to capture shortfall amount
                },
              },
            },
          },
        },
      },
    });

    if (!response.text) {
      throw new Error("AI validation failed to return a response.");
    }

    const validationResult = JSON.parse(response.text);

    if (validationResult.canCook) {
      Alert.alert("Success!", `You have all the ingredients needed for ${recipe.recipeName}.`);
      return { success: true };
    }

    const missingList = validationResult.missingOrInsufficient
      .map((item: any) => {
        if (item.reason === "missing") {
          return `${item.name}: Not found in pantry`;
        } else {
          return `${item.name}: Not enough (short by ${item.shortfall})`;
        }
      })
      .join('\n');

    Alert.alert(
      "Missing or Insufficient Ingredients",
      `You need the following for ${recipe.recipeName}:\n\n${missingList}`
    );
    return { success: false };

  } catch (error) {
    console.error("Error checking recipe:", error);
    if (error instanceof Error) {
      Alert.alert("Error", error.message);
    }
    return { success: false };
  }
};