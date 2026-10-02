import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seed() {
  const { data: existing } = await supabase.from('customers').select('id');
  if (existing && existing.length > 0) {
    console.log(`Customers already present (${existing.length} records), skipping seed.`);
    return;
  }

  const sampleCustomers = [
    {
      id: 'MUM-8902',
      name: 'CogniTech Solutions',
      phone: '+91 98450 12098',
      email: 'facilities@cognitech.io',
      account_type: 'Office / B2B',
      sector: 'IT Corridor - Phase 2',
      premises: 'Tower B, Suite 402, Quantum Heights',
      latitude: 18.5204,
      longitude: 73.8567,
      formatted_coordinates: '18.5204° N, 73.8567° E',
      product_tier: '20L Mineral Can',
      can_quota: 12,
      pack_quota: 0,
      cadence: 'Daily',
      slot: '07 - 10 AM',
      clean_empties: 12,
      held_empties: 12,
      deposit_amount: 1800,
      whatsapp_opt_in: true,
      status: 'Active',
    },
    {
      id: 'MUM-8903',
      name: 'Sunita Kulkarni',
      phone: '+91 99201 44812',
      email: 'sunita.kulkarni@gmail.com',
      account_type: 'Residential',
      sector: 'Lakeview Residential',
      premises: 'Flat 904, Ganga Skies, Balewadi',
      latitude: 18.5782,
      longitude: 73.7745,
      formatted_coordinates: '18.5782° N, 73.7745° E',
      product_tier: '20L Mineral Can',
      can_quota: 2,
      pack_quota: 0,
      cadence: 'Alternate Days',
      slot: '07 - 10 AM',
      clean_empties: 2,
      held_empties: 2,
      deposit_amount: 300,
      whatsapp_opt_in: true,
      status: 'Active',
    },
    {
      id: 'MUM-8904',
      name: 'Sahyadri Specialty Clinic',
      phone: '+91 98223 99100',
      email: 'admin@sahyadriclinic.org',
      account_type: 'Office / B2B',
      sector: 'Civil Lines & Hospitals',
      premises: 'Ground Floor Dispensing, Plot 18',
      latitude: 18.5124,
      longitude: 73.8341,
      formatted_coordinates: '18.5124° N, 73.8341° E',
      product_tier: '1L Case (12 Pcs)',
      can_quota: 0,
      pack_quota: 8,
      cadence: 'Weekly Mon',
      slot: '10 - 01 PM',
      clean_empties: 0,
      held_empties: 0,
      deposit_amount: 0,
      whatsapp_opt_in: true,
      status: 'Active',
    },
  ];

  const { data, error } = await supabase.from('customers').insert(sampleCustomers).select('*');
  if (error) {
    console.error('Error seeding customers:', error.message);
  } else {
    console.log(`Seeded ${data.length} sample customers into Supabase!`);
  }
}

seed();
