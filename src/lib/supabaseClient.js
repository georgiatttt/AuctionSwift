// Supabase client setup - handles authentication and database connection
import { createClient } from '@supabase/supabase-js';

// Supabase project credentials (these are public keys, not secrets)
const supabaseUrl = 'https://eupvkesgchaanbatzpuo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1cHZrZXNnY2hhYW5iYXR6cHVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NTg1ODcsImV4cCI6MjA3NTEzNDU4N30.dkiBmXaN9zhXkS52Fld0a_OeJkcQTMOy7rqQHjATR_I';

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
