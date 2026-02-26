// Replace these with your Supabase project credentials
const SUPABASE_URL = 'https://ptngkwsyqhrjfkernyws.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0bmdrd3N5cWhyamZrZXJueXdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMzY0NTAsImV4cCI6MjA4NzYxMjQ1MH0.J7mxtfZoFahdzdHCq01hjAABt-GXXfnEPd4W3QNAATY';

// Create Supabase client and attach to window
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);