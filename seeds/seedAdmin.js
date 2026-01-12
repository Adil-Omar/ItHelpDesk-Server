import supabase from '../lib/supabase.js';

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_NAME = 'Admin';
const ADMIN_ROLE_ID = 1;

// Basic environment checks
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY in environment. Please add them to a .env file at the project root.');
  process.exit(1);
}

async function checkSupabaseReachable() {
  try {
    const res = await fetch(process.env.SUPABASE_URL, { method: 'HEAD' });
    if (!res.ok) {
      throw new Error(`Unexpected status ${res.status}`);
    }
  } catch (err) {
    console.error('Unable to reach SUPABASE_URL. Check network/proxy and that the URL is correct:', process.env.SUPABASE_URL);
    process.exit(1);
  }
}

async function seed() {
  try {
    await checkSupabaseReachable();
    // Ensure the admin role exists (id = 1)
    const { error: roleError } = await supabase
      .from('roles')
      .upsert([{ id: ADMIN_ROLE_ID, name: 'admin' }], { onConflict: 'id' });

    if (roleError) {
      console.error('Error upserting role:', roleError);
      process.exit(1);
    }

    // Check if admin user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', ADMIN_EMAIL)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: No rows found in PostgREST
      console.error('Error checking existing user:', fetchError);
      process.exit(1);
    }

    if (existingUser) {
      console.log('Admin user already exists:', existingUser.email);
      process.exit(0);
    }

    // Insert admin user
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          name: ADMIN_NAME,
          role_id: ADMIN_ROLE_ID,
        },
      ])
      .select('id, email')
      .single();

    if (error) {
      console.error('Error inserting admin user:', error);
      process.exit(1);
    }

    console.log('Admin user seeded:', data.email);
    process.exit(0);
  } catch (err) {
    console.error('Seed script failed:', err);
    process.exit(1);
  }
}

seed();
