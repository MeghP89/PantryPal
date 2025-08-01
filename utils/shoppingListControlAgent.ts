import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from './supabase'; // Assuming supabase client is exported from here

// Configure the client
const ai = new GoogleGenAI({apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY});

/**
 * Function declaration for the 'shopping_list_control' tool.
 * This tool enables the AI to perform CRUD operations on the shopping list.
 */
const shoppingListControlFunctionDeclaration = {
  name: 'shopping_list_control',
  description: 'Performs create, update, or delete operations on the shopping list. The required parameters change based on the selected action.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        enum: ['create', 'update', 'delete'],
        description: 'The action to perform on the shopping list.',
      },
      id: {
        type: Type.STRING,
        description: "The unique ID of the shopping list item to update or delete. Required for 'update' and single-item 'delete' actions.",
      },
      ids: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "An array of unique IDs for bulk deletion of shopping list items. Used only with the 'delete' action.",
      },
      data: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          description: "A JSON object containing the data for a shopping list item. Required for 'create' and 'update' actions. When updating, only include the fields that need to be changed.",
          properties: {
              item_name: { type: Type.STRING, description: "The name of the item. First letter of each word should be uppercase" },
              quantity: { type: Type.NUMBER, description: "The quantity of the item." },
              unit: { type: Type.STRING, enum: ['pieces', 'lbs', 'oz', 'cups', 'tbsp', 'tsp', 'gallons', 'liters', 'packages'], description: "The unit of measurement for the item." },
              category: { type: Type.STRING, enum: ["Produce", "Dairy", "Meat", "Bakery", "Frozen", "Beverages", "Snacks", "Canned Goods", "Condiments", "Grains", "Seasonings", "Misc"], description: "The category of the item. Determine based on item" },
              priority: { type: Type.STRING, enum: ["low", "medium", "high"], description: "The priority of the item." },
              notes: { type: Type.STRING, description: "Additional notes about the item." },
              estimated_price: { type: Type.NUMBER, description: "The estimated price of the item." },
          }
        },
        description: 'Items to be updated or inserted'
      },
    },
    required: ['action'],
  },
};

/**
 * Type definition for the parameters of the shoppingListControl function.
 */
type ShoppingListData = {
  item_name?: string;
  quantity?: number;
  unit?: 'pieces' | 'lbs' | 'oz' | 'cups' | 'tbsp' | 'tsp' | 'gallons' | 'liters' | 'packages';
  category?: "Produce" | "Dairy" | "Meat" | "Bakery" | "Frozen" | "Beverages" | "Snacks" | "Canned Goods" | "Condiments" | "Grains" | "Seasonings" | "Misc";
  priority?: "low" | "medium" | "high";
  notes?: string;
  estimated_price?: number;
};

type ShoppingListControlParams = {
  action: 'create' | 'update' | 'delete';
  id?: string;
  ids?: string[];
  data?: ShoppingListData[];
};

/**
 * Executes shopping list operations based on the provided parameters.
 * This is the implementation of the 'shopping_list_control' tool.
 */
const shoppingListControl = async ({ action, id, ids, data }: ShoppingListControlParams) => {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return { error: "User not logged in." };
  const database = 'shopping_list'; // Hardcoded for this specific tool

  try {
    let response;
    switch (action) {
      case 'create':
        if (!data || !Array.isArray(data) || data.length === 0) {
          return { error: "Data must be a non-empty array for create action." };
        }
        const recordsToCreate = data.map(item => ({ ...item, user_id: userId }));
        response = await supabase.from(database).insert(recordsToCreate).select();
        break;

      case 'update':
        if (!id || !data || !Array.isArray(data) || data.length !== 1) {
          return { error: "A single data object and record ID are required for update action." };
        }
        response = await supabase.from(database).update(data[0]).eq('id', id).eq('user_id', userId).select();
        break;

      case 'delete':
        if (ids && ids.length > 0) {
          response = await supabase.from(database).delete().in('id', ids).eq('user_id', userId);
        } else if (id) {
          response = await supabase.from(database).delete().eq('id', id).eq('user_id', userId);
        } else {
          return { error: "Record ID or an array of Record IDs is required for delete action." };
        }
        break;

      default:
        return { error: `Invalid action: ${action}` };
    }

    if (response.error) {
      console.error("Supabase error:", response.error);
      return { error: response.error.message };
    }

    return { success: true, data: response.data };

  } catch (error) {
    console.error("Database control error:", error);
    return { error: error.message || "An unexpected error occurred." };
  }
};

// Conversation history to maintain context
let conversationHistory: any[] = [];

export async function processUserMessage(userMessage: string) {
  try {
    // Add user message to history
    conversationHistory.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    // Send request with function declarations and conversation history
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{
            text: `You are an intelligent assistant for managing a user's shopping list.
            Your role is to understand the user's request and use the available tools
            to perform actions like adding, updating, or deleting items from their shopping list.
            Be precise and only use the functions when the user's intent is clear.
            If the user's request is ambiguous, ask for clarification, but be specific in your clarification ask.
            Always respond in a conversational and helpful manner.`
          }]
        },
        ...conversationHistory
      ],
      config: {
        tools: [{
          functionDeclarations: [shoppingListControlFunctionDeclaration]
        }],
      },
    });

    let assistantResponse = '';

    // Check for function calls in the response
    if (response.functionCalls && response.functionCalls.length > 0) {
      const functionCall = response.functionCalls[0];
      console.log(`\n🔧 Executing: ${functionCall.name}`);
      console.log(`📋 Parameters: ${JSON.stringify(functionCall.args, null, 2)}`);
      
      // Execute the function
      const result = await shoppingListControl(functionCall.args);
      
      if (result.success) {
        assistantResponse = `✅ Successfully ${functionCall.args.action}d shopping list item(s)!`;
        if (result.data && result.data.length > 0) {
          assistantResponse += `\n📝 Details: ${JSON.stringify(result.data, null, 2)}`;
        }
      } else {
        assistantResponse = `❌ Error: ${result.error}`;
      }
    } else if (response.text) {
      assistantResponse = response.text;
    } else {
      assistantResponse = "I'm not sure how to help with that. Could you please rephrase your request?";
    }

    // Add assistant response to history
    conversationHistory.push({
      role: 'model',
      parts: [{ text: assistantResponse }]
    });

    return assistantResponse;

  } catch (error) {
    console.error("Error processing message:", error);
    return `❌ Sorry, I encountered an error: ${error.message}`;
  }
}

// For backwards compatibility
export async function controlShoppingList(userMessage: string) {
  return await processUserMessage(userMessage);
}