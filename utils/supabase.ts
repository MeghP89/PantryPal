import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fsbnyddoflwaihgzsiwm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzYm55ZGRvZmx3YWloZ3pzaXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MzkyMjYsImV4cCI6MjA2ODAxNTIyNn0.X28ZfS3QTdDEohpWl39XBxhq5_Q5lu-nqi8ltlSYsmU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
