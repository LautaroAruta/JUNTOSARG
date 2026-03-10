import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://tkiajsktfguphfqndcmu.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRraWFqc2t0Zmd1cGhmcW5kY211Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzExMDY2NywiZXhwIjoyMDg4Njg2NjY3fQ.-kcWqtrEwrBetPasu0wwKBcMjAMCE4NVuUf6M13dxik'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function run() {
    console.log("== 1. Checking / Creating products bucket");
    // Get buckets
    const { data: buckets, error: bucketsErr } = await supabase.storage.listBuckets();
    if (bucketsErr) {
        console.error("Error listing buckets:", bucketsErr);
        return;
    }
    
    if (!buckets.find(b => b.name === 'products')) {
        console.log("Creating bucket 'products'");
        const { data, error } = await supabase.storage.createBucket('products', {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
            fileSizeLimit: 5242880 // 5MB
        });
        if (error) {
            console.error("Error creating bucket:", error);
        } else {
            console.log("Bucket created successfully");
        }
    } else {
        console.log("Bucket 'products' already exists, ensuring it is public");
        await supabase.storage.updateBucket('products', { public: true });
    }

    console.log("\n== 2. Checking / Creating roberto@junto.ar user");
    let userId = null;
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
        console.error("Error listing users:", usersError);
        return;
    }

    const roberto = usersData.users.find(u => u.email === 'roberto@junto.ar');
    if (roberto) {
        console.log("roberto@junto.ar already exists");
        userId = roberto.id;
    } else {
        console.log("Creating roberto@junto.ar");
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: 'roberto@junto.ar',
            password: 'password123',
            email_confirm: true,
            user_metadata: { name: 'Roberto Almacén' }
        });
        if (createError) {
            console.error("Error creating user:", createError);
            return;
        }
        userId = newUser.user.id;
        console.log("User created with ID:", userId);
    }

    console.log("\n== 3. Linking Roberto to Almacén Don Roberto (Store ID: 111...1)");
    // Small delay to allow the trigger to create the public.users record
    await new Promise(r => setTimeout(r, 1000));
    
    const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({
            role: 'provider',
            store_id: '11111111-0001-0001-0001-000000000001'
        })
        .eq('id', userId);

    if (updateError) {
        console.error("Error linking user to store:", updateError);
    } else {
        console.log("User linked successfully to store!");
    }
    
    console.log("\nDone!");
}

run();
