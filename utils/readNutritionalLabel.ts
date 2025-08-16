import { Type } from "@google/genai";
import { supabase } from "./supabase";


const COMMON_ITEM_PROPERTIES = {
  itemName: { type: Type.STRING },
  ServingUnit: { type: Type.STRING },
  AmountPerServing: { type: Type.NUMBER },
  TotalServings: { type: Type.NUMBER },
  ItemCategory: {
    type: Type.STRING,
    enum: [
      "Produce", "Dairy", "Meat", "Bakery", "Frozen",
      "Beverages", "Snacks", "Canned Goods", "Condiments",
      "Grains", "Seasonings", "Misc"
    ]
  },
  CaloriesPerServing: { type: Type.INTEGER },
  NutritionalInfo: {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        NutrientName: { type: Type.STRING },
        NutrientAmount: { type: Type.NUMBER },
        NutrientUnit: { type: Type.STRING }
      },
      propertyOrdering: ["NutrientName", "NutrientAmount", "NutrientUnit"]
    }
  }
};

async function generateNutritionFromImage({
  randomDigit,
  prompt,
  responseSchema
}: {
  randomDigit: number;
  prompt: string;
  responseSchema: any;
}) {
  const { data, error } = await supabase.functions.invoke("generateNutritionFromImage", {
    body: { randomDigit, prompt, responseSchema },
  });
  console.log(data)
  return data;
}

export async function extractNutritionalInfoFromLabel(imageBase64: string) {
  console.log("Single item extraction...");
  const prompt = `
    Extract nutritional information from the provided image.
    - Identify produce items or read nutritional labels.
    - Choose the serving unit that a user could most easily quantify.
    - Return a structured JSON object wrapped in "NutritionalItem" with:
      - itemName (string)
      - ServingUnit (string)
      - AmountPerServing (float)
      - TotalServings (float)
      - CaloriesPerServing (integer)
      - ItemCategory (enum)
      - NutritionalInfo (array of nutrient objects)
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      NutritionalItem: {
        type: Type.OBJECT,
        properties: COMMON_ITEM_PROPERTIES,
        propertyOrdering: [
          "itemName", "ServingUnit", "AmountPerServing", "TotalServings",
          "CaloriesPerServing", "ItemCategory", "NutritionalInfo"
        ]
      }
    },
    propertyOrdering: ["NutritionalItem"]
  };
  const randomDigit = Math.floor(Math.random() * 10000000);
  const { data, error: insertError } = await supabase
          .from('images')
          .insert({id: randomDigit, imageBase64: imageBase64})
          .select();
  
  if (data) {
    return await generateNutritionFromImage({ randomDigit, prompt, responseSchema })
  }

  return Error('Failed to read details');
}

export async function extractBatchNutritionalInfoFromLabel(imageBase64: string) {
  console.log("Batch item extraction...");
  const prompt = `
    Extract all nutritional items from the provided image of a receipt or multiple labels.
    - Identify all distinct items.
    - Choose the serving unit that a user could most easily quantify.
    - For each item, return a structured JSON object with:
      - itemName (string)
      - ServingUnit (string)
      - AmountPerServing (float)
      - TotalServings (float)
      - CaloriesPerServing (integer)
      - ItemCategory (enum)
      - NutritionalInfo (array of nutrient objects)
    - Return a JSON array containing all extracted items.
  `;

  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: COMMON_ITEM_PROPERTIES
    }
  };

  const randomDigit = Math.floor(Math.random() * 10000000);
  const { data, error: insertError } = await supabase
          .from('images')
          .insert({id: randomDigit, imageBase64: imageBase64})
          .select();
  
  if (data) {
    return await generateNutritionFromImage({ randomDigit, prompt, responseSchema })
  }

  return Error('Failed to read details');
}
