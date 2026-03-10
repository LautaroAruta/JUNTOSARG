import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'

const SUPABASE_URL = 'https://tkiajsktfguphfqndcmu.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRraWFqc2t0Zmd1cGhmcW5kY211Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzExMDY2NywiZXhwIjoyMDg4Njg2NjY3fQ.-kcWqtrEwrBetPasu0wwKBcMjAMCE4NVuUf6M13dxik'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function run() {
    const sql = fs.readFileSync('schema.sql', 'utf8')
    console.log("Read schema length: " + sql.length)
    
    // Attempting to run raw SQL
    // Supabase has no direct SQL exec without setting up a pg function first
    // So if the tables aren't created yet, we might need a direct postgres DSN connection
    
    console.log("Checking if users table exists");
    const { data: usersData, error: usersErr } = await supabase.from('users').select('id').limit(1);
    
    if (usersErr && usersErr.code === 'PGRST205') {
       console.error("USERS TABLE DOES NOT EXIST. Schema setup required via Postgres URI or Dashboard.");
       process.exit(1);
    } else if (usersErr) {
       console.error("UNKNOWN ERROR:", usersErr);
    } else {
       console.log("DB looks accessible, users table exists!");
    }
}
run();
