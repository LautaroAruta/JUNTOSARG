const SUPABASE_URL = 'https://tkiajsktfguphfqndcmu.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRraWFqc2t0Zmd1cGhmcW5kY211Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzExMDY2NywiZXhwIjoyMDg4Njg2NjY3fQ.-kcWqtrEwrBetPasu0wwKBcMjAMCE4NVuUf6M13dxik';

async function fetchSupabase(path, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json'
        }
    };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`${SUPABASE_URL}${path}`, options);
    const text = await res.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

async function run() {
    console.log("== 1. Checking / Creating products bucket");
    const buckets = await fetchSupabase('/storage/v1/bucket');
    if (!buckets.find(b => b.name === 'products')) {
        console.log("Creating bucket 'products'");
        await fetchSupabase('/storage/v1/bucket', 'POST', {
            id: 'products',
            name: 'products',
            public: true,
            allowed_mime_types: ['image/png', 'image/jpeg', 'image/webp'],
            file_size_limit: 5242880
        });
        console.log("Bucket created!");
    } else {
        console.log("Bucket 'products' exists.");
        await fetchSupabase('/storage/v1/bucket/products', 'PUT', {
            public: true,
            allowed_mime_types: ['image/png', 'image/jpeg', 'image/webp'],
            file_size_limit: 5242880
        });
        console.log("Bucket products updated to public!");
    }

    console.log("\n== 2. Checking / Creating roberto@junto.ar user");
    let userId = null;
    const authData = await fetchSupabase('/auth/v1/admin/users');
    let users = [];
    if (authData && authData.users) users = authData.users;
    else if (Array.isArray(authData)) users = authData;

    const roberto = users.find(u => u.email === 'roberto@junto.ar');
    if (roberto) {
        console.log("roberto@junto.ar already exists");
        userId = roberto.id;
    } else {
        console.log("Creating roberto@junto.ar");
        const newUser = await fetchSupabase('/auth/v1/admin/users', 'POST', {
            email: 'roberto@junto.ar',
            password: 'password123',
            email_confirm: true,
            user_metadata: { name: 'Roberto Almacén' }
        });
        userId = newUser.id;
        console.log("User created with ID:", userId);
    }

    console.log("\n== 3. Linking Roberto to Almacén Don Roberto (Store ID: 111...1)");
    await new Promise(r => setTimeout(r, 1000));
    const updateRes = await fetchSupabase(`/rest/v1/users?id=eq.${userId}`, 'PATCH', {
        role: 'provider',
        store_id: '11111111-0001-0001-0001-000000000001'
    });
    console.log("User link response:", updateRes);

    console.log("\nDone!");
}

run();
