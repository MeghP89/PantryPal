import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from "./supabase";

const ai = new GoogleGenAI({ apiKey: 'AIzaSyAEa_yhtmAibFNwU5hViphAmbV8FPNo6d0' });

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

  const itemList = items.map(
    (item) => `${item.name} (${item.quantity} x ${item.amount}${item.unit})`
  );
  console.log("Generating new recipe...")

  const prompt = `
    Using the following pantry items, generate a creative recipe:
    ${itemList.join(", ")}.

    Include:
    - recipeName: A concise fun title
    - recipeDescription: A concise description that sells the product
    - ingredients: List of ingredients that should solely be ingredient name with quantities. It is possible to add some extra ingredients not included to make food better.
    - recipeSteps: Step-by-step instructions.

    ${additionalInstructions ? `Additional instructions: ${additionalInstructions}` : ""}
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
  console.log("Generated new recipe:", recipe.recipeName);
  return recipe;
}

