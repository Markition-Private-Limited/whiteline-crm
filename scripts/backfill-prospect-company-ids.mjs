import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv(f) {
  const env = {};
  for (const line of readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

const env = loadEnv('.env.local');
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// 1. Fetch all prospects with no company_id but a company_name
const { data: prospects, error: fetchErr } = await sb
  .from('prospects')
  .select('id, company_name')
  .is('company_id', null)
  .not('company_name', 'is', null);

if (fetchErr) { console.error('Failed to fetch prospects:', fetchErr.message); process.exit(1); }
if (!prospects?.length) { console.log('No prospects with null company_id — nothing to do.'); process.exit(0); }

console.log(`Found ${prospects.length} prospect(s) with null company_id. Backfilling…\n`);

let fixed = 0, skipped = 0;

for (const p of prospects) {
  const name = p.company_name.trim();

  // Try to find an existing company by name (case-insensitive)
  const { data: existing } = await sb
    .from('companies')
    .select('id, name')
    .ilike('name', name)
    .limit(1)
    .single();

  let companyId;
  if (existing) {
    companyId = existing.id;
    console.log(`  [match]  "${name}" → company ${companyId}`);
  } else {
    // Create a new company from the prospect's name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') +
      '-' + Math.random().toString(36).slice(2, 6);
    const { data: created, error: createErr } = await sb
      .from('companies')
      .insert({ name, slug })
      .select('id')
      .single();
    if (createErr) {
      console.warn(`  [skip]   "${name}" — could not create company: ${createErr.message}`);
      skipped++;
      continue;
    }
    companyId = created.id;
    console.log(`  [create] "${name}" → new company ${companyId}`);
  }

  // Update the prospect
  const { error: updateErr } = await sb
    .from('prospects')
    .update({ company_id: companyId })
    .eq('id', p.id);

  if (updateErr) {
    console.warn(`  [error]  prospect ${p.id} — ${updateErr.message}`);
    skipped++;
  } else {
    fixed++;
  }
}

console.log(`\nDone. Fixed: ${fixed}, Skipped: ${skipped}`);
