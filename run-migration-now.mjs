// Direct SQL execution via Supabase
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const sql = readFileSync('./supabase/migrations/001_initial_schema.sql', 'utf8');

const supabase = createClient(
  'https://bsbgjdhepqjbjixfkcad.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzYmdqZGhlcHFqYmppeGZrY2FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODUwNDU5NCwiZXhwIjoyMDg0MDgwNTk0fQ.szNfg8KJ424tvZLJ-d3yMBXpJyB-3hGcUBt-7_lhldc'
);

console.log('🚀 Running migration...\n');

// Split SQL into individual statements and execute
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`📊 Found ${statements.length} SQL statements to execute\n`);

let executed = 0;
let failed = 0;

for (const statement of statements) {
  if (statement.includes('-- ====')) continue; // Skip comment lines

  try {
    const { data, error } = await supabase.rpc('exec', { sql: statement + ';' });
    if (error) {
      console.error(`❌ Error:`, error.message);
      failed++;
    } else {
      executed++;
      if (executed % 10 === 0) {
        console.log(`✅ Executed ${executed}/${statements.length} statements...`);
      }
    }
  } catch (err) {
    console.error(`❌ Failed:`, err.message);
    failed++;
  }
}

console.log(`\n✅ Migration complete: ${executed} executed, ${failed} failed`);
