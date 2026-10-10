// Automated End-to-End API Test Suite for Mumpy
const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('====================================================');
  console.log('🚀 STARTING COMPREHENSIVE MUMPY BACKEND & API TESTS');
  console.log('====================================================\n');

  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      testsPassed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      testsFailed++;
    }
  }

  // TEST 1: GET /api/customers
  console.log('▶ Test 1: GET /api/customers');
  try {
    const res = await fetch(`${BASE_URL}/api/customers`);
    const data = await res.json();
    assert(res.status === 200, 'GET /api/customers returned 200 OK');
    assert(data.success === true, 'Response has success: true');
    assert(Array.isArray(data.customers), `Received ${data.customers?.length} customers`);
  } catch (err) {
    assert(false, `GET /api/customers threw error: ${err.message}`);
  }

  // Unique phone for this test run
  const testPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const testEmail = `test.client.${Date.now()}@example.com`;
  let createdCustomerId = null;

  // TEST 2: POST /api/customers - Register Customer with Custom Delivery Days (No Sunday) and exact GPS
  console.log('\n▶ Test 2: POST /api/customers (New Registration)');
  try {
    const payload = {
      name: 'Aditi Verma Solutions',
      phone: `+91 ${testPhone}`,
      email: testEmail,
      account_type: 'Office / B2B',
      sector: 'IT Corridor - Phase 2',
      premises: 'Tower B, 4th Floor, Tech Park',
      coordinates: '22°33\'23.6"N 83°27\'56.2"E', // Test DMS coordinates parsing
      product_tier: '20L Mineral Can',
      can_quota: 10,
      cadence: 'Except Sunday (Mon - Sat)',
      delivery_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      balance_due: 300.0,
      slot: '07 - 10 AM',
    };

    const res = await fetch(`${BASE_URL}/api/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    assert(res.status === 201 || res.status === 200, `POST /api/customers returned ${res.status}`);
    assert(data.success === true, 'Registration succeeded');
    assert(data.customer && data.customer.name === payload.name, 'Customer name matches');
    assert(Math.abs(data.customer.latitude - 22.556539) < 0.001, `Latitude correctly parsed: ${data.customer.latitude}`);
    assert(Math.abs(data.customer.longitude - 83.465826) < 0.001, `Longitude correctly parsed: ${data.customer.longitude}`);
    assert(Array.isArray(data.customer.delivery_days) && data.customer.delivery_days.length === 6, 'Custom 6 delivery days (No Sunday) saved');
    assert(data.customer.balance_due === 300.0, 'Balance due initialized to ₹300.00');

    createdCustomerId = data.customer.id;
  } catch (err) {
    assert(false, `POST /api/customers threw error: ${err.message}`);
  }

  // TEST 3: Anti-Duplication Enforcement (Duplicate Phone)
  console.log('\n▶ Test 3: Anti-Duplication Check (409 Conflict)');
  try {
    const dupPayload = {
      name: 'Duplicate Test',
      phone: `+91 ${testPhone}`,
      sector: 'IT Corridor - Phase 2',
      premises: 'Another Flat',
    };

    const res = await fetch(`${BASE_URL}/api/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dupPayload),
    });
    const data = await res.json();

    assert(res.status === 409, `Duplicate phone correctly returned 409 Conflict (got ${res.status})`);
    assert(data.success === false, 'Duplicate registration rejected');
  } catch (err) {
    assert(false, `Anti-Duplication test threw error: ${err.message}`);
  }

  // TEST 4: POST /api/deliveries - Log Drop-Off & Collect Past Balance
  console.log('\n▶ Test 4: POST /api/deliveries (Log Drop-off with Old Balance Settlement)');
  try {
    const deliveryPayload = {
      customer_id: createdCustomerId || 'MUM-8921',
      customer_name: 'Aditi Verma Solutions',
      van_id: 'van-02',
      delivered_quantity: 3,
      empties_returned: 3,
      payment_method: 'UPI QR',
      payment_amount: 350.0, // ₹150 for 3 cans + ₹200 towards old balance
      old_balance_collected: 200.0,
      current_delivery_paid: true,
      credit_applied: 0,
      remaining_balance: 100.0, // ₹300 original - ₹200 paid = ₹100 remaining
      payment_status: 'Completed',
      drop_off_notes: 'Delivered to 4th floor reception. Received UPI settlement.',
    };

    const res = await fetch(`${BASE_URL}/api/deliveries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deliveryPayload),
    });
    const data = await res.json();

    assert(res.status === 201 || res.status === 200, `POST /api/deliveries returned ${res.status}`);
    assert(data.success === true, 'Delivery logged successfully');
    assert(data.delivery && data.delivery.old_balance_collected === 200.0, 'Old balance collected recorded as ₹200.00');
    assert(data.delivery && data.delivery.remaining_balance === 100.0, 'Remaining balance recorded as ₹100.00');
    assert(data.settlement && data.settlement.amount === 350.0, 'Settlement record created with full payment');
  } catch (err) {
    assert(false, `POST /api/deliveries threw error: ${err.message}`);
  }

  // TEST 5: GET /api/settlements & POST /api/settlements
  console.log('\n▶ Test 5: GET & POST /api/settlements (Live Ledger & Invoice Settlement)');
  try {
    const resGet = await fetch(`${BASE_URL}/api/settlements`);
    const dataGet = await resGet.json();

    assert(resGet.status === 200, 'GET /api/settlements returned 200 OK');
    assert(Array.isArray(dataGet.settlements), `Settlements ledger returned ${dataGet.settlements?.length} records`);

    // Settle a pending invoice
    const pendingItem = dataGet.settlements.find((s) => s.status === 'Pending' || s.status === 'Due in 5d');
    const targetInvoice = pendingItem ? (pendingItem.invoiceNo || pendingItem.invoice_no) : 'INV-9818';

    const resPost = await fetch(`${BASE_URL}/api/settlements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'settle_invoice',
        invoice_no: targetInvoice,
        amount: 3000,
        method: 'UPI QR',
      }),
    });
    const dataPost = await resPost.json();

    assert(resPost.status === 200, `POST /api/settlements settle_invoice returned ${resPost.status}`);
    assert(dataPost.success === true, `Invoice ${targetInvoice} successfully settled`);
  } catch (err) {
    assert(false, `/api/settlements test threw error: ${err.message}`);
  }

  // TEST 6: GET /api/analytics
  console.log('\n▶ Test 6: GET /api/analytics (Telemetry & Financial Metrics)');
  try {
    const res = await fetch(`${BASE_URL}/api/analytics`);
    const data = await res.json();

    assert(res.status === 200, 'GET /api/analytics returned 200 OK');
    assert(data.success === true, 'Analytics returned success: true');
    assert(data.analytics && typeof data.analytics.total_revenue === 'number', `Total revenue calculated: ₹${data.analytics.total_revenue}`);
    assert(data.analytics && Array.isArray(data.analytics.sector_hotspots), `Sector hotspots count: ${data.analytics.sector_hotspots?.length}`);
    assert(data.analytics && Array.isArray(data.analytics.recent_settlements), `Recent settlements feed count: ${data.analytics.recent_settlements?.length}`);
  } catch (err) {
    assert(false, `GET /api/analytics threw error: ${err.message}`);
  }

  console.log('\n====================================================');
  console.log(`🏁 TEST SUITE COMPLETED: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('====================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests();
