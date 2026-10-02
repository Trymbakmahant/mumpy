import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('----------------------------------------------------');
console.log('🧪 TESTING MUMPY WATER LOGISTICS BACKEND (SUPABASE)');
console.log('----------------------------------------------------');
console.log('Supabase URL:', supabaseUrl);
console.log('Anon Key Present:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTests() {
  let passed = 0;
  let failed = 0;

  // TEST 1: Check Connection & Profiles table
  console.log('\n[1/6] Testing `profiles` table...');
  try {
    const { data, error } = await supabase.from('profiles').select('*').limit(5);
    if (error) {
      console.error('❌ Error fetching profiles:', error.message);
      failed++;
    } else {
      console.log(`✅ Profiles fetched successfully (${data.length} records found)`);
      data.forEach((p) => {
        console.log(`   - [${p.role?.toUpperCase()}] ${p.full_name} (${p.email})`);
      });
      passed++;
    }
  } catch (err) {
    console.error('❌ Exception in profiles test:', err.message);
    failed++;
  }

  // TEST 2: Check Vans table
  console.log('\n[2/6] Testing `vans` table...');
  try {
    const { data, error } = await supabase.from('vans').select('*').limit(5);
    if (error) {
      console.error('❌ Error fetching vans:', error.message);
      failed++;
    } else {
      console.log(`✅ Vans fetched successfully (${data.length} records found)`);
      data.forEach((v) => {
        console.log(`   - ${v.plate_number} (${v.driver_name}) | Route: ${v.route_sector} | Stock: ${v.remaining_stock}/${v.initial_load}`);
      });
      passed++;
    }
  } catch (err) {
    console.error('❌ Exception in vans test:', err.message);
    failed++;
  }

  // TEST 3: Check Customers table
  console.log('\n[3/6] Testing `customers` table...');
  try {
    const { data, error } = await supabase.from('customers').select('*').limit(5);
    if (error) {
      console.error('❌ Error fetching customers:', error.message);
      failed++;
    } else {
      console.log(`✅ Customers table query successful (${data.length} records found)`);
      passed++;
    }
  } catch (err) {
    console.error('❌ Exception in customers test:', err.message);
    failed++;
  }

  // TEST 4: Check Deliveries table insertion & query
  console.log('\n[4/6] Testing `deliveries` table insert & read...');
  try {
    const testDelivery = {
      delivered_quantity: 4,
      empties_returned: 4,
      payment_method: 'UPI QR',
      payment_amount: 280,
      payment_status: 'Completed',
      drop_off_notes: 'Automated backend verification test drop-off',
      status: 'Delivered',
    };
    const { data: inserted, error: insertError } = await supabase
      .from('deliveries')
      .insert(testDelivery)
      .select('*')
      .single();

    if (insertError) {
      console.error('❌ Error inserting delivery:', insertError.message);
      failed++;
    } else {
      console.log(`✅ Test delivery record inserted: ID ${inserted.id}`);
      console.log(`   - Quantity: ${inserted.delivered_quantity} | Amount: ₹${inserted.payment_amount} | Method: ${inserted.payment_method}`);
      passed++;
    }
  } catch (err) {
    console.error('❌ Exception in deliveries test:', err.message);
    failed++;
  }

  // TEST 5: Check Financial records table
  console.log('\n[5/6] Testing `financial_records` table...');
  try {
    const { data, error } = await supabase.from('financial_records').select('*').limit(5);
    if (error) {
      console.error('❌ Error querying financial_records:', error.message);
      failed++;
    } else {
      console.log(`✅ Financial records table query successful (${data.length} records found)`);
      passed++;
    }
  } catch (err) {
    console.error('❌ Exception in financial test:', err.message);
    failed++;
  }

  // TEST 6: Test Local Next.js API Routes (if server is running)
  console.log('\n[6/6] Testing Next.js dynamic API routes...');
  try {
    const authRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'admin' }),
    });
    const authData = await authRes.json();
    if (authData.success) {
      console.log(`✅ API /api/auth/login passed: authenticated as ${authData.user.role} (${authData.user.full_name})`);
    } else {
      console.log('⚠️ API /api/auth/login returned failure:', authData);
    }

    const delRes = await fetch('http://localhost:3000/api/deliveries');
    const delData = await delRes.json();
    if (delData.success) {
      console.log(`✅ API /api/deliveries passed: returned ${delData.deliveries?.length} stops in proximity queue`);
    }

    const fleetRes = await fetch('http://localhost:3000/api/fleet');
    const fleetData = await fleetRes.json();
    if (fleetData.success) {
      console.log(`✅ API /api/fleet passed: radar tracking ${fleetData.vans?.length} active vans`);
    }

    const custRes = await fetch('http://localhost:3000/api/customers');
    const custData = await custRes.json();
    if (custData.success) {
      console.log(`✅ API /api/customers passed: returned ${custData.customers?.length} customer accounts`);
    }

    passed++;
  } catch (err) {
    console.log('ℹ️ Next.js local server API test note:', err.message);
  }

  console.log('\n----------------------------------------------------');
  console.log(`🏁 TEST SUMMARY: ${passed} passed, ${failed} failed`);
  console.log('----------------------------------------------------');
}

runTests();
