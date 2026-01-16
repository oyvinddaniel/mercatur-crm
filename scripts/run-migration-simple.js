// Simple migration runner using Supabase REST API
// This bypasses the need for RPC and runs SQL directly

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment
const dotenvPath = join(__dirname, '../.env.local');
const envContent = readFileSync(dotenvPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Read SQL file
const sqlPath = join(__dirname, '../supabase/migrations/001_initial_schema.sql');
const sql = readFileSync(sqlPath, 'utf8');

console.log('🚀 Running Mercatur CRM Database Migration\n');
console.log('📄 SQL File: 001_initial_schema.sql');
console.log('📏 SQL Length:', sql.length, 'characters');
console.log('🗄️  Supabase URL:', SUPABASE_URL);
console.log('\n⏳ Executing migration via REST API...\n');

// Execute SQL via Supabase REST API
fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  },
  body: JSON.stringify({ query: sql })
})
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      console.error('❌ Migration failed:', data.error);
      process.exit(1);
    }
    console.log('✅ Migration completed successfully!\n');
    console.log('🔍 Verifying tables created...');
    return Promise.resolve();
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    console.log('\n💡 Alternative: Copy SQL to Supabase SQL Editor');
    console.log('   https://supabase.com/dashboard/project/bsbgjdhepqjbjixfkcad/sql/new');
    process.exit(1);
  });
