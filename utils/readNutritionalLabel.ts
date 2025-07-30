import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: 'AIzaSyAEa_yhtmAibFNwU5hViphAmbV8FPNo6d0' });

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
  imageBase64,
  prompt,
  responseSchema
}: {
  imageBase64: string;
  prompt: string;
  responseSchema: any;
}) {
  const contents = [
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBase64
      }
    },
    { text: prompt }
  ];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents,
    config: {
      responseMimeType: "application/json",
      responseSchema
    }
  });

  if (!response.text) throw new Error("No response text returned from API");
  return JSON.parse(response.text);
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

  return await generateNutritionFromImage({ imageBase64, prompt, responseSchema });
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

  return await generateNutritionFromImage({ imageBase64, prompt, responseSchema });
}
