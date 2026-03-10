const SUPABASE_URL = 'https://tkiajsktfguphfqndcmu.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRraWFqc2t0Zmd1cGhmcW5kY211Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzExMDY2NywiZXhwIjoyMDg4Njg2NjY3fQ.-kcWqtrEwrBetPasu0wwKBcMjAMCE4NVuUf6M13dxik';

async function fetchSupabase(path) {
    const res = await fetch(`${SUPABASE_URL}${path}`, {
        method: 'GET',
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json'
        }
    });
    return res.json();
}

async function run() {
    console.log("Fetching auth.users...");
    const usersRoute = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'GET',
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json'
        }
    });
    const users = await usersRoute.json();
    if (users.users) {
        console.log("Users:", users.users.map(u => ({ id: u.id, email: u.email })));
    } else {
        console.log("Users API error/response:", users);
    }

    console.log("\nChecking stores...");
    const stores = await fetchSupabase('/rest/v1/stores?select=*');
    if (stores.message) {
        console.log("Table 'stores' fail:", stores.message);
        const viveres = await fetchSupabase('/rest/v1/v%C3%ADveres?select=*');
        console.log("Víveres:", viveres);
    } else {
        console.log("Stores:", stores);
    }

    console.log("\nChecking perfiles...");
    const perfiles = await fetchSupabase('/rest/v1/perfiles?select=*');
    console.log("Perfiles:", perfiles);

    const usersTable = await fetchSupabase('/rest/v1/users?select=*');
    if (!usersTable.message) console.log("Public.Users:", usersTable);
}

run();
