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
    if (res.status === 204) return null;
    return res.json();
}

async function run() {
    console.log("== Check buckets...");
    const buckets = await fetchSupabase('/storage/v1/bucket');
    console.log("Buckets:", buckets.map(b => b.name));
}

run();
