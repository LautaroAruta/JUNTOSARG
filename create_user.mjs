const SUPABASE_URL = 'https://tkiajsktfguphfqndcmu.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRraWFqc2t0Zmd1cGhmcW5kY211Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzExMDY2NywiZXhwIjoyMDg4Njg2NjY3fQ.-kcWqtrEwrBetPasu0wwKBcMjAMCE4NVuUf6M13dxik'

const email = 'roberto@junto.ar';
const password = 'password123';
const storeId = '11111111-1111-1111-1111-111111111111';

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
    if (res.status === 204) return null;
    return res.json();
}

async function run() {
    console.log("== Creando usuario en Auth...");
    const authRes = await fetchSupabase('/auth/v1/admin/users', 'POST', {
        email,
        password,
        email_confirm: true,
        user_metadata: { name: 'Don Roberto' }
    });

    let userId = authRes?.id;
    if (!userId) {
        const users = await fetchSupabase('/auth/v1/admin/users', 'GET');
        const r = users?.users?.find(u => u.email === email);
        if (r) {
            userId = r.id;
            console.log("User already exists with ID:", userId);
            await fetchSupabase(`/auth/v1/admin/users/${userId}`, 'PUT', { password });
        } else {
            console.log("Could not create or find user.");
            return;
        }
    } else {
        console.log("Created User ID:", userId);
    }

    let tableName = 'users';
    let check = await fetchSupabase('/rest/v1/users?select=id&limit=1');
    if (check && check.message) {
        tableName = 'profiles';
        check = await fetchSupabase('/rest/v1/profiles?select=id&limit=1');
        if (check && check.message) {
            tableName = 'perfiles';
        }
    }
    console.log(`Usando tabla de perfiles: ${tableName}`);

    const profileData = {
        id: userId,
        name: 'Don Roberto',
        email: email,
        role: 'provider',
        store_id: storeId
    };

    try {
        const pRes = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}`, {
            method: 'POST',
            headers: {
                'apikey': SERVICE_KEY,
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(profileData)
        });
        console.log("Perfil status:", pRes.status);
    } catch (e) {
        console.error(e);
    }

    console.log("\n== Vinculando tienda con el usuario...");
    const sRes = await fetch(`${SUPABASE_URL}/rest/v1/stores?id=eq.${storeId}`, {
        method: 'PATCH',
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ owner_id: userId })
    });
    console.log("Store update status:", sRes.status);

    console.log("\nTODO LISTO. Ya podés loguear con roberto@junto.ar y password123");
}

run();
