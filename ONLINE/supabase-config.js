// These are public client settings. Never put a Supabase service-role key here.
window.SUPABASE_URL = "https://ucmrgglzatapqiorbeqp.supabase.co";
window.SUPABASE_ANON_KEY = "sb_publishable_krXZCdcuz4HRx7q6BfcG-g_Bj4RGqz8";

window.supabaseClient = window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY
);

console.log("Supabase connected successfully!");
