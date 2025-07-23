import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import dotenv from "dotenv";
import path from "path";
import fs from "fs/promises";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: "AIzaSyAEa_yhtmAibFNwU5hViphAmbV8FPNo6d0",
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai"
});

// Define schema for nutritional information
const NutritionalItem = z.object({
  name: z.string(), // Item name (e.g., "apple" or "2% skim milk")
  calories: z.number().gte(0), // Calories per serving (kcal)
  servingSize: z.string(), // Serving size (e.g., "100g", "1 cup")
  totalFat: z.number().gte(0), // Total fat in grams
  protein: z.number().gte(0), // Protein in grams
  carbohydrates: z.number().gte(0), // Total carbohydrates in grams
  category: z.enum([
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
  ])
});

const NutritionalList = z.array(NutritionalItem);

export async function extractNutritionalInfoFromLabel(base64Image: string) {
  try {
    const messages = [
      {
        role: "system",
        content: "Extract nutritional information from a nutritional label image or identify produce items and provide basic nutritional information."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `
              Extract nutritional information from the provided image. For packaged items, parse the nutritional label to extract the item name, calories, serving size, total fat, protein, and carbohydrates. Do not include brand names, and group similar items (e.g., tomatoes from different brands as "tomatoes"). For produce items without a label, identify the item and provide basic nutritional information based on standard values for a typical serving size (e.g., 100g for produce). Categorize each item into one of the following: Produce, Dairy, Meat, Bakery, Frozen, Beverages, Snacks, Canned Goods, Condiments, Grains, Seasonings, Misc. Return a JSON array of objects with the fields: name (string), calories (number), servingSize (string), totalFat (number), protein (number), carbohydrates (number), and category (enum).
            `
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`
            }
          }
        ]
      }
    ];

    const completion = await openai.chat.completions.parse({
      model: "gemini-2.0-flash",
      messages,
      response_format: zodResponseFormat(NutritionalList, "nutritionalList")
    });

    const parsedItems = completion.choices[0].message.parsed;
    let formattedItems;
    if (parsedItems) {
      formattedItems = parsedItems.map(item => ({
        ...item,
        calories: Number(item.calories.toFixed(0)), // Round to whole number
        totalFat: Number(item.totalFat.toFixed(1)), // Round to 1 decimal
        protein: Number(item.protein.toFixed(1)), // Round to 1 decimal
        carbohydrates: Number(item.carbohydrates.toFixed(1)) // Round to 1 decimal
      }));
    } else {
      throw new Error("No nutritional information extracted from the image.");
    }

    console.log("Parsed nutritional items:", formattedItems);
    return formattedItems;

  } catch (error) {
    console.error("Error extracting nutritional information:", error);
    throw error;
  }
}