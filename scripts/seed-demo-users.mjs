/**
 * Provision plan demo users in Supabase Auth.
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 *
 * Usage: node scripts/seed-demo-users.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { PLAN_ACCOUNTS, PLAN_DEMO_PASSWORD } from '../src/data/demoAccount.js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

for (const account of PLAN_ACCOUNTS) {
  const { error } = await admin.auth.admin.createUser({
    email: account.email,
    password: PLAN_DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { name: account.name },
  });

  if (error) {
    if (error.message?.toLowerCase().includes('already')) {
      console.log(`✓ ${account.email} already exists`);
    } else {
      console.error(`✗ ${account.email}:`, error.message);
    }
  } else {
    console.log(`✓ Created ${account.email}`);
  }
}

console.log(`\nAll demo passwords: ${PLAN_DEMO_PASSWORD}`);
