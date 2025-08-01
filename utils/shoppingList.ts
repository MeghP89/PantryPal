import { supabase } from './supabase';

export const addToShoppingList = async (itemName: string, category: string) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    const { data: existingItem, error: fetchError } = await supabase
      .from('shopping_list')
      .select('id, quantity')
      .eq('user_id', session.user.id)
      .eq('item_name', itemName)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: 'exact-one-row-not-found'
      console.error('Error checking for existing item:', fetchError);
      return;
    }

    if (existingItem) {
      // Item exists, update quantity
      const { error: updateError } = await supabase
        .from('shopping_list')
        .update({ quantity: existingItem.quantity + 1 })
        .eq('id', existingItem.id);
      if (updateError) {
        console.error('Error updating shopping list item quantity:', updateError);
      }
    } else {
      // Item does not exist, insert new
      const { error: insertError } = await supabase.from('shopping_list').insert([
        {
          user_id: session.user.id,
          item_name: itemName,
          quantity: 1,
          unit: 'units',
          category: category,
          priority: 'medium',
          is_completed: false,
        },
      ]);
      if (insertError) {
        console.error('Error adding new item to shopping list:', insertError);
      }
    }
  }
};
