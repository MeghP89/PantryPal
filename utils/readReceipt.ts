import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = "AIzaSyAEa_yhtmAibFNwU5hViphAmbV8FPNo6d0"

export async function extractNutritionalInfoFromLabel(imageBase64: string) {
  console.log("in the function")
  const ai = new GoogleGenAI({ apiKey: "AIzaSyAEa_yhtmAibFNwU5hViphAmbV8FPNo6d0" });

  const contents = [
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBase64
      }
    },
    {
      text: `
        Extract nutritional information from the provided image.
        - Identify produce items or read nutritional labels.
        - Return a structured JSON object wrapped in "NutritionalItem" with:
          - itemName (string)
          - ServingUnit (string)
          - AmountPerServing (integer/float)
          - TotalServings (integer/float)
          - ItemCategory (enum)
          - NutritionalInfo: array of objects with:
            - NutrientName (string)
            - NutrientAmount (number)
            - NutrientUnit (string)
      `
    }
  ];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          NutritionalItem: {
            type: Type.OBJECT,
            properties: {
              itemName: { type: Type.STRING },
              ServingUnit: { type: Type.STRING },
              AmountPerServing: { type: Type.NUMBER },
              TotalServings: { type: Type.NUMBER },
              ItemCategory: {
                type: Type.STRING,
                enum: [
                  "Produce",
                  "Dairy",
                  "Meat",
                  "Bakery",
                  "Frozen",
                  "Beverages",
                  "Snacks",
                  "Canned Goods",
                  "Condiments",
                  "Grains",
                  "Seasonings",
                  "Misc"
                ]
              },
              CaloriesPerServing: { type: Type.INTEGER },
              CalorieUnit: { type: Type.STRING },
              NutritionalInfo: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    NutrientName: { type: Type.STRING },
                    NutrientAmount: { type: Type.NUMBER },
                    NutrientUnit: { type: Type.STRING }
                  },
                  propertyOrdering: [
                    "NutrientName",
                    "NutrientAmount",
                    "NutrientUnit"
                  ]
                }
              },
            },
            propertyOrdering: [
              "itemName",
              "ServingUnit",
              "AmountPerServing",
              "TotalServings",
              "CaloriesPerServing",
              "CalorieUnit",
              "ItemCategory",
              "NutritionalInfo"
            ]
          }
        },
        propertyOrdering: ["NutritionalItem"]
      }
    }
  });
  if (!response.text) {
    throw new Error("No response text returned from API");
  }
  console.log(response.text)
  return JSON.parse(response.text);
}
