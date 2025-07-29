import { supabase } from './supabase';

type NutritionalItem = {
  itemName: string;
  ServingUnit: string;
  AmountPerServing: number;
  TotalServings: number;
  ItemCategory:
    | "Produce"
    | "Dairy"
    | "Meat"
    | "Bakery"
    | "Frozen"
    | "Beverages"
    | "Snacks"
    | "Canned Goods"
    | "Condiments"
    | "Grains"
    | "Seasonings"
    | "Misc";
  CaloriesPerServing: number;
  CalorieUnit: string;
  ItemQuantity: number;
  NutritionalInfo: {
    NutrientName: string;
    NutrientAmount: number;
    NutrientUnit: string;
  }[];
};

const foodItems: NutritionalItem[] = [
  {
    itemName: "Organic Bananas",
    ServingUnit: "piece",
    AmountPerServing: 1,
    TotalServings: 6,
    ItemCategory: "Produce",
    CaloriesPerServing: 105,
    CalorieUnit: "kcal",
    ItemQuantity: 6,
    NutritionalInfo: [
      { NutrientName: "Potassium", NutrientAmount: 422, NutrientUnit: "mg" },
      { NutrientName: "Vitamin C", NutrientAmount: 10, NutrientUnit: "mg" },
      { NutrientName: "Fiber", NutrientAmount: 3, NutrientUnit: "g" },
    ],
  },
  {
    itemName: "Greek Yogurt",
    ServingUnit: "g",
    AmountPerServing: 170,
    TotalServings: 1,
    ItemCategory: "Dairy",
    CaloriesPerServing: 100,
    CalorieUnit: "kcal",
    ItemQuantity: 4,
    NutritionalInfo: [
      { NutrientName: "Protein", NutrientAmount: 17, NutrientUnit: "g" },
      { NutrientName: "Calcium", NutrientAmount: 200, NutrientUnit: "mg" },
      { NutrientName: "Sugar", NutrientAmount: 6, NutrientUnit: "g" },
    ],
  },
  {
    itemName: "Chicken Breast",
    ServingUnit: "oz",
    AmountPerServing: 4,
    TotalServings: 4,
    ItemCategory: "Meat",
    CaloriesPerServing: 165,
    CalorieUnit: "kcal",
    ItemQuantity: 2,
    NutritionalInfo: [
      { NutrientName: "Protein", NutrientAmount: 31, NutrientUnit: "g" },
      { NutrientName: "Iron", NutrientAmount: 1, NutrientUnit: "mg" },
      { NutrientName: "Fat", NutrientAmount: 3.6, NutrientUnit: "g" },
    ],
  },
  {
    itemName: "Whole Wheat Bread",
    ServingUnit: "slice",
    AmountPerServing: 1,
    TotalServings: 20,
    ItemCategory: "Bakery",
    CaloriesPerServing: 80,
    CalorieUnit: "kcal",
    ItemQuantity: 1,
    NutritionalInfo: [
      { NutrientName: "Fiber", NutrientAmount: 2, NutrientUnit: "g" },
      { NutrientName: "Protein", NutrientAmount: 4, NutrientUnit: "g" },
      { NutrientName: "Carbohydrates", NutrientAmount: 14, NutrientUnit: "g" },
    ],
  },
  {
    itemName: "Frozen Mixed Berries",
    ServingUnit: "cup",
    AmountPerServing: 1,
    TotalServings: 3,
    ItemCategory: "Frozen",
    CaloriesPerServing: 70,
    CalorieUnit: "kcal",
    ItemQuantity: 1,
    NutritionalInfo: [
      { NutrientName: "Vitamin C", NutrientAmount: 60, NutrientUnit: "mg" },
      { NutrientName: "Fiber", NutrientAmount: 5, NutrientUnit: "g" },
      { NutrientName: "Antioxidants", NutrientAmount: 500, NutrientUnit: "units" },
    ],
  },
  {
    itemName: "Almond Milk",
    ServingUnit: "cup",
    AmountPerServing: 1,
    TotalServings: 8,
    ItemCategory: "Beverages",
    CaloriesPerServing: 30,
    CalorieUnit: "kcal",
    ItemQuantity: 1,
    NutritionalInfo: [
      { NutrientName: "Calcium", NutrientAmount: 450, NutrientUnit: "mg" },
      { NutrientName: "Vitamin E", NutrientAmount: 7, NutrientUnit: "mg" },
      { NutrientName: "Fat", NutrientAmount: 2.5, NutrientUnit: "g" },
    ],
  },
  {
    itemName: "Kettle-Cooked Potato Chips",
    ServingUnit: "oz",
    AmountPerServing: 1,
    TotalServings: 8,
    ItemCategory: "Snacks",
    CaloriesPerServing: 150,
    CalorieUnit: "kcal",
    ItemQuantity: 1,
    NutritionalInfo: [
      { NutrientName: "Fat", NutrientAmount: 9, NutrientUnit: "g" },
      { NutrientName: "Sodium", NutrientAmount: 180, NutrientUnit: "mg" },
      { NutrientName: "Carbohydrates", NutrientAmount: 16, NutrientUnit: "g" },
    ],
  },
  {
    itemName: "Canned Black Beans",
    ServingUnit: "cup",
    AmountPerServing: 0.5,
    TotalServings: 3.5,
    ItemCategory: "Canned Goods",
    CaloriesPerServing: 110,
    CalorieUnit: "kcal",
    ItemQuantity: 2,
    NutritionalInfo: [
      { NutrientName: "Protein", NutrientAmount: 7, NutrientUnit: "g" },
      { NutrientName: "Fiber", NutrientAmount: 8, NutrientUnit: "g" },
      { NutrientName: "Iron", NutrientAmount: 2, NutrientUnit: "mg" },
    ],
  },
  {
    itemName: "Sriracha Hot Sauce",
    ServingUnit: "tsp",
    AmountPerServing: 1,
    TotalServings: 56,
    ItemCategory: "Condiments",
    CaloriesPerServing: 5,
    CalorieUnit: "kcal",
    ItemQuantity: 1,
    NutritionalInfo: [
      { NutrientName: "Sodium", NutrientAmount: 60, NutrientUnit: "mg" },
      { NutrientName: "Sugar", NutrientAmount: 1, NutrientUnit: "g" },
      { NutrientName: "Vitamin C", NutrientAmount: 1, NutrientUnit: "mg" },
    ],
  },
  {
    itemName: "Quinoa",
    ServingUnit: "cup",
    AmountPerServing: 0.25,
    TotalServings: 10,
    ItemCategory: "Grains",
    CaloriesPerServing: 156,
    CalorieUnit: "kcal",
    ItemQuantity: 1,
    NutritionalInfo: [
      { NutrientName: "Protein", NutrientAmount: 6, NutrientUnit: "g" },
      { NutrientName: "Fiber", NutrientAmount: 3, NutrientUnit: "g" },
      { NutrientName: "Magnesium", NutrientAmount: 78, NutrientUnit: "mg" },
    ],
  },
  {
    itemName: "Himalayan Pink Salt",
    ServingUnit: "tsp",
    AmountPerServing: 0.25,
    TotalServings: 152,
    ItemCategory: "Seasonings",
    CaloriesPerServing: 0,
    CalorieUnit: "kcal",
    ItemQuantity: 1,
    NutritionalInfo: [
      { NutrientName: "Sodium", NutrientAmount: 590, NutrientUnit: "mg" },
      { NutrientName: "Potassium", NutrientAmount: 5, NutrientUnit: "mg" },
      { NutrientName: "Calcium", NutrientAmount: 1, NutrientUnit: "mg" },
    ],
  },
  {
    itemName: "Dark Chocolate Bar (72%)",
    ServingUnit: "g",
    AmountPerServing: 40,
    TotalServings: 2.5,
    ItemCategory: "Snacks",
    CaloriesPerServing: 220,
    CalorieUnit: "kcal",
    ItemQuantity: 1,
    NutritionalInfo: [
      { NutrientName: "Iron", NutrientAmount: 4, NutrientUnit: "mg" },
      { NutrientName: "Fiber", NutrientAmount: 4, NutrientUnit: "g" },
      { NutrientName: "Fat", NutrientAmount: 18, NutrientUnit: "g" },
    ],
  },
];

export async function batchInsertItems() {
  console.log("Starting batch insert...");

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    console.error("User not authenticated. Aborting batch insert.");
    return;
  }
  const userId = session.user.id;

  for (const item of foodItems) {
    try {
      const itemToSave = {
        userid: userId,
        item_name: item.itemName,
        serving_unit: item.ServingUnit,
        amount_per_serving: item.AmountPerServing,
        total_servings: item.TotalServings,
        calories_per_serving: item.CaloriesPerServing,
        calorie_unit: item.CalorieUnit,
        item_category: item.ItemCategory,
        item_quantity: item.ItemQuantity,
      };

      const { data, error: insertError } = await supabase
        .from('nutritional_items')
        .insert([itemToSave])
        .select();

      if (insertError) throw insertError;

      if (data) {
        const itemId = data[0]?.itemid;
        if (itemId && item.NutritionalInfo.length > 0) {
          const nutrientsToInsert = item.NutritionalInfo.map(n => ({
            item_id: itemId,
            nutrient_name: n.NutrientName,
            nutrient_amount: n.NutrientAmount,
            nutrient_unit: n.NutrientUnit,
          }));
          const { error: nutrientError } = await supabase.from('nutritional_info').insert(nutrientsToInsert);
          if (nutrientError) throw nutrientError;
        }
        console.log(`Successfully inserted: ${item.itemName}`);
      }
    } catch (error) {
      console.error(`Failed to insert ${item.itemName}:`, error);
    }
  }

  console.log("Batch insert completed.");
}

// To run this script, you could expose it through a button in your UI
// or run it in a development environment. For example:
//
// 1. Add a button to one of your components:
//    <Button title="Add Sample Data" onPress={batchInsertItems} />
//
// 2. Or, if you have a way to run scripts in your environment,
//    you could execute it from there.

// Example of how to call it:
// batchInsertItems();
