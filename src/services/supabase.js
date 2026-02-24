import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO SUPABASE ---
// Você pegará esses dados no painel do Supabase (Project Settings > API)
const SUPABASE_URL = 'https://qdgwrpnitkbolnktspjy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkZ3dycG5pdGtib2xua3RzcGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MzkwNTIsImV4cCI6MjA4NzMxNTA1Mn0.UxKZD4SyCRbM0zHAGNk8Zo9ckGLA4cN1tKhTa_x_Khw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
