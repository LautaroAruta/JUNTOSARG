import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://tkiajsktfguphfqndcmu.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRraWFqc2t0Zmd1cGhmcW5kY211Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzExMDY2NywiZXhwIjoyMDg4Njg2NjY3fQ.-kcWqtrEwrBetPasu0wwKBcMjAMCE4NVuUf6M13dxik'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function run() {
    console.log("Fetching users from auth.users...");
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error("Auth Error:", authError);
        return;
    }

    console.log("Users:", users.map(u => ({ id: u.id, email: u.email })));

    // Buscamos las tablas
    const { data: tables, error: tablesError } = await supabase
        .from('pg_tables') // Supabase REST API doesn't expose pg_catalog easily by default, but we can try
        .select('*')
        .limit(1)
        .catch(() => ({}));

    console.log("Getting stores...");
    const { data: stores, error: storesError } = await supabase.from('stores').select('*');
    if (storesError) {
        console.log("Error finding 'stores', trying 'víveres'...");
        const { data: viveres } = await supabase.from('víveres').select('*');
        console.log("Viveres:", viveres);
    } else {
        console.log("Stores:", stores);
    }

    console.log("Getting profiles/users...");
    const { data: userProfiles, error: pError } = await supabase.from('users').select('*');
    if (pError) {
        console.log("Error finding 'users', trying 'perfiles'...");
        const { data: perfiles } = await supabase.from('perfiles').select('*');
        console.log("Perfiles:", perfiles);
    } else {
        console.log("Profiles (users):", userProfiles);
    }
}

run();
