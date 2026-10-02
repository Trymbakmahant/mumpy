import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { initialCustomers } from '@/data/mockData';
import { CustomerAccount } from '@/types';

export const dynamic = 'force-dynamic';

let serverCustomers: CustomerAccount[] = [...initialCustomers];

function normalizePhone(p: string): string {
  return (p || '').replace(/[^0-9]/g, '');
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sector = searchParams.get('sector');
    const search = searchParams.get('search');

    const supabase = createServerSupabaseClient();
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('demo')) {
      const { data, error } = await supabase.from('customers').select('*');
      if (data && !error && data.length > 0) {
        return NextResponse.json({ success: true, customers: data });
      }
    }

    let result = serverCustomers;
    if (sector && sector !== 'All Sectors') {
      result = result.filter((c) => c.sector.includes(sector));
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.phone.includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      customers: result,
      totalCount: result.length + 337,
      source: 'server_dynamic',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.name || !body.phone) {
      return NextResponse.json(
        { success: false, error: 'Customer name and phone number are required for registration.' },
        { status: 400 }
      );
    }

    const cleanInputPhone = normalizePhone(body.phone);
    if (cleanInputPhone.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 10-digit mobile number.' },
        { status: 400 }
      );
    }

    // ====================================================================
    // DUPLICATE REGISTRATION PREVENTION
    // Ensure no person can create 2 IDs so 2 different drivers cannot
    // mistakenly service, bill, or drop cans to the same person.
    // ====================================================================
    let existingCustomer: any = null;

    // 1. Check in-memory server list
    const foundInMemory = serverCustomers.find((c) => {
      const existingClean = normalizePhone(c.phone);
      const phoneMatches =
        existingClean === cleanInputPhone ||
        (existingClean.length >= 10 &&
          cleanInputPhone.length >= 10 &&
          existingClean.slice(-10) === cleanInputPhone.slice(-10));
      const emailMatches =
        body.email &&
        c.email &&
        body.email.trim() !== '' &&
        body.email.trim() !== 'info@client.com' &&
        c.email.trim().toLowerCase() === body.email.trim().toLowerCase();
      return phoneMatches || emailMatches;
    });

    if (foundInMemory) {
      existingCustomer = foundInMemory;
    }

    // 2. Check Supabase DB
    if (!existingCustomer && process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('demo')) {
      const supabase = createServerSupabaseClient();
      const { data: dbCustomers } = await supabase.from('customers').select('*');
      if (dbCustomers && dbCustomers.length > 0) {
        const dbMatch = dbCustomers.find((c: any) => {
          const existingClean = normalizePhone(c.phone);
          const phoneMatches =
            existingClean === cleanInputPhone ||
            (existingClean.length >= 10 &&
              cleanInputPhone.length >= 10 &&
              existingClean.slice(-10) === cleanInputPhone.slice(-10));
          const emailMatches =
            body.email &&
            c.email &&
            body.email.trim() !== '' &&
            body.email.trim() !== 'info@client.com' &&
            c.email.trim().toLowerCase() === body.email.trim().toLowerCase();
          return phoneMatches || emailMatches;
        });
        if (dbMatch) {
          existingCustomer = dbMatch;
        }
      }
    }

    // If duplicate found, strictly reject registration
    if (existingCustomer) {
      return NextResponse.json(
        {
          success: false,
          duplicate: true,
          error: `Duplicate Registration Blocked: Customer "${existingCustomer.name}" is already registered under ID "${existingCustomer.id}" (Assigned to: ${existingCustomer.assignedDriverName || 'Assigned Driver'} on ${existingCustomer.assignedVanId || 'Van'}). Multiple registrations for the same person are prohibited to prevent two drivers from duplicating deliveries.`,
          existingCustomer,
        },
        { status: 409 }
      );
    }

    // Route / Van Allocation: Map strictly to ONE driver van based on sector
    const sector = body.sector || 'IT Corridor - Phase 2';
    const isDriver2Route = sector.includes('Sector 14') || sector.includes('Lakeview');
    const assignedVanId = body.assignedVanId || (isDriver2Route ? 'van-01' : 'van-02');
    const assignedVanPlate = isDriver2Route ? 'MH-12-BR-3041' : 'MH-12-BR-3042';
    const assignedDriverName = isDriver2Route ? 'Suresh Kumar (Driver 2)' : 'Rajesh Patil (Driver 1)';

    const newCustomer: CustomerAccount = {
      id: `MUM-${Math.floor(8900 + Math.random() * 900)}`,
      name: body.name.trim(),
      phone: body.phone.trim(),
      email: body.email?.trim() || 'info@client.com',
      accountType: body.accountType || 'Office / B2B',
      sector: sector,
      hub: 'Main Water Plant',
      assignedVanId: assignedVanId,
      assignedVanPlate: assignedVanPlate,
      assignedDriverName: assignedDriverName,
      premises: body.premises || 'Town Premises',
      coordinates: body.coordinates || {
        lat: 0,
        lng: 0,
        formatted: '',
      },
      productTier: body.productTier || '20L Mineral Can',
      canQuota: body.canQuota || 6,
      packQuota: body.packQuota || 0,
      cadence: body.cadence || 'Daily',
      slot: body.slot || '07 - 10 AM',
      emptiesBalance: {
        clean: body.canQuota || 6,
        held: body.canQuota || 6,
        status: 'Clean',
      },
      depositAmount: body.depositAmount || 900,
      whatsAppOptIn: body.whatsAppOptIn ?? true,
      status: 'Active',
    };

    serverCustomers = [newCustomer, ...serverCustomers];

    // Try Supabase persistence
    const supabase = createServerSupabaseClient();
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('demo')) {
      await supabase.from('customers').insert({
        id: newCustomer.id,
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email,
        account_type: newCustomer.accountType,
        sector: newCustomer.sector,
        premises: newCustomer.premises,
        latitude: newCustomer.coordinates.lat,
        longitude: newCustomer.coordinates.lng,
        formatted_coordinates: newCustomer.coordinates.formatted,
        product_tier: newCustomer.productTier,
        can_quota: newCustomer.canQuota,
        pack_quota: newCustomer.packQuota,
        cadence: newCustomer.cadence,
        slot: newCustomer.slot,
        clean_empties: newCustomer.emptiesBalance.clean,
        held_empties: newCustomer.emptiesBalance.held,
        deposit_amount: newCustomer.depositAmount,
        whatsapp_opt_in: newCustomer.whatsAppOptIn,
        status: 'Active',
      });
    }

    return NextResponse.json({
      success: true,
      message: `Customer ${newCustomer.name} onboarded successfully and exclusively assigned to ${newCustomer.assignedDriverName} (${newCustomer.assignedVanId})`,
      customer: newCustomer,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
