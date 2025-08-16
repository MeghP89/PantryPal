import { Type } from '@google/genai';
import { supabase } from './supabase'; // Assuming supabase client is exported from here

/**
 * Type definition for the parameters of the shoppingListControl function.
 */
type ShoppingListData = {
  item_name?: string;
  quantity?: number;
  unit?: 'pieces' | 'lbs' | 'oz' | 'cups' | 'tbsp' | 'tsp' | 'gallons' | 'liters' | 'packages' | 'unit' | 'carton';
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
    conversationHistory.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    const { data, error } = await supabase.functions.invoke("shoppingListControlAgent", {
      body: { conversationHistory },
    });
    console.log(data)

    let assistantResponse = '';

    if (error) {
      console.error("Error:", error);
    } else if (data) {
      const { purpose } = data;
      if ( purpose == 'function') {
        const { functionCall } = data;
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
      } else if ( purpose == 'text' ) {
        const { resp } = data;
        assistantResponse = resp.text;
      } else {
        assistantResponse = "I'm not sure how to help with that. Could you please rephrase your request?";
      }
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