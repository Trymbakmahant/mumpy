import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { initialCustomers } from '@/data/mockData';
import { CustomerAccount } from '@/types';
import { parseCoordinates } from '@/lib/geoUtils';

export const dynamic = 'force-dynamic';

let serverCustomers: CustomerAccount[] = [...initialCustomers];

function normalizePhone(p: string): string {
  return (p || '').replace(/[^0-9]/g, '');
}

function mapDbCustomerToAccount(c: any): CustomerAccount {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email || 'info@client.com',
    accountType: c.account_type || c.accountType || 'Residential',
    sector: c.sector || 'IT Corridor - Phase 2',
    hub: c.hub || 'Main Water Plant',
    assignedVanId: c.assigned_van_id || c.assignedVanId || 'van-02',
    assignedVanPlate: c.assigned_van_plate || c.assignedVanPlate || 'MH-12-BR-3042',
    assignedDriverName: c.assigned_driver_name || c.assignedDriverName || 'Rajesh Patil (Driver 1)',
    premises: c.premises || '',
    coordinates: c.coordinates || {
      lat: Number(c.latitude || 0),
      lng: Number(c.longitude || 0),
      formatted: c.formatted_coordinates || '',
    },
    productTier: c.product_tier || c.productTier || '20L Mineral Can',
    canQuota: c.can_quota ?? c.canQuota ?? 0,
    packQuota: c.pack_quota ?? c.packQuota ?? 0,
    cadence: c.cadence || 'Daily',
    deliveryDays: c.delivery_days || c.deliveryDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    balanceDue: Number(c.balance_due ?? c.balanceDue ?? 0),
    slot: c.slot || '07 - 10 AM',
    emptiesBalance: c.emptiesBalance || {
      clean: c.clean_empties ?? 0,
      held: c.held_empties ?? 0,
      status: (c.held_empties || 0) > 10 ? 'Deposit Alert' : 'Clean',
    },
    depositAmount: Number(c.deposit_amount ?? c.depositAmount ?? 0),
    whatsAppOptIn: c.whatsapp_opt_in ?? c.whatsAppOptIn ?? true,
    status: c.status || 'Active',
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sector = searchParams.get('sector');
    const search = searchParams.get('search');

    const supabase = createServerSupabaseClient();
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('demo')) {
      const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      if (data && !error && data.length > 0) {
        let mapped = data.map(mapDbCustomerToAccount);
        if (sector && sector !== 'All Sectors') {
          mapped = mapped.filter((c) => c.sector.includes(sector));
        }
        if (search) {
          const q = search.toLowerCase();
          mapped = mapped.filter(
            (c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.phone.includes(q)
          );
        }
        return NextResponse.json({
          success: true,
          customers: mapped,
          totalCount: mapped.length,
          source: 'supabase_db',
        });
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

    // DUPLICATE REGISTRATION PREVENTION
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
    const supabase = createServerSupabaseClient();
    if (!existingCustomer && process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('demo')) {
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
          existingCustomer = mapDbCustomerToAccount(dbMatch);
        }
      }
    }

    // If duplicate found, strictly reject registration
    if (existingCustomer) {
      return NextResponse.json(
        {
          success: false,
          duplicate: true,
          error: `Duplicate Registration Blocked: Customer "${existingCustomer.name}" is already registered under ID "${existingCustomer.id}" (Assigned to: ${existingCustomer.assignedDriverName || 'Assigned Driver'} on ${existingCustomer.assignedVanId || 'Van'}). Multiple registrations for the same person are prohibited.`,
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

    let lat = 22.556539;
    let lng = 83.465826;
    let formatted = '22.556539, 83.465826';
    if (body.coordinates) {
      if (typeof body.coordinates === 'string') {
        const parsed = parseCoordinates(body.coordinates);
        lat = parsed.lat;
        lng = parsed.lng;
        formatted = parsed.formatted;
      } else {
        lat = Number(body.coordinates.lat || 22.556539);
        lng = Number(body.coordinates.lng || 83.465826);
        formatted = body.coordinates.formatted || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      }
    }

    const newCustomer: CustomerAccount = {
      id: body.id || `MUM-${Math.floor(8900 + Math.random() * 900)}`,
      name: body.name.trim(),
      phone: body.phone.trim(),
      email: body.email?.trim() || 'info@client.com',
      accountType: body.accountType || 'Residential',
      sector: sector,
      hub: 'Main Water Plant',
      assignedVanId: assignedVanId,
      assignedVanPlate: assignedVanPlate,
      assignedDriverName: assignedDriverName,
      premises: body.premises || 'Town Premises',
      coordinates: {
        lat,
        lng,
        formatted,
      },
      productTier: body.productTier || body.product_tier || '20L Mineral Can',
      canQuota: Number(body.canQuota ?? body.can_quota ?? 2),
      packQuota: Number(body.packQuota ?? body.pack_quota ?? 0),
      cadence: body.cadence || 'Daily',
      deliveryDays: body.deliveryDays || body.delivery_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      balanceDue: Number(body.balanceDue ?? body.balance_due ?? 0),
      slot: body.slot || '07 - 10 AM',
      emptiesBalance: {
        clean: Number(body.canQuota ?? body.can_quota ?? 2),
        held: Number(body.canQuota ?? body.can_quota ?? 2),
        status: 'Clean',
      },
      depositAmount: Number(body.depositAmount ?? body.deposit_amount ?? 0),
      whatsAppOptIn: body.whatsAppOptIn ?? body.whatsapp_opt_in ?? true,
      status: 'Active',
    };

    serverCustomers = [newCustomer, ...serverCustomers];

    // Try Supabase persistence with all new schema columns
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('demo')) {
      try {
        await supabase.from('customers').insert({
          id: newCustomer.id,
          name: newCustomer.name,
          phone: newCustomer.phone,
          email: newCustomer.email,
          account_type: newCustomer.accountType,
          sector: newCustomer.sector,
          hub: newCustomer.hub,
          assigned_van_id: newCustomer.assignedVanId,
          premises: newCustomer.premises,
          latitude: newCustomer.coordinates.lat,
          longitude: newCustomer.coordinates.lng,
          formatted_coordinates: newCustomer.coordinates.formatted,
          product_tier: newCustomer.productTier,
          can_quota: newCustomer.canQuota,
          pack_quota: newCustomer.packQuota,
          cadence: newCustomer.cadence,
          delivery_days: newCustomer.deliveryDays,
          balance_due: newCustomer.balanceDue,
          slot: newCustomer.slot,
          clean_empties: newCustomer.emptiesBalance.clean,
          held_empties: newCustomer.emptiesBalance.held,
          deposit_amount: newCustomer.depositAmount,
          whatsapp_opt_in: newCustomer.whatsAppOptIn,
          status: 'Active',
        });
      } catch (dbErr) {
        console.warn('Supabase customer insert warning:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Customer ${newCustomer.name} onboarded successfully and exclusively assigned to ${newCustomer.assignedDriverName} (${newCustomer.assignedVanId})`,
      customer: {
        ...newCustomer,
        latitude: newCustomer.coordinates.lat,
        longitude: newCustomer.coordinates.lng,
        delivery_days: newCustomer.deliveryDays,
        balance_due: newCustomer.balanceDue,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, balanceDue, deliveryDays, status, heldEmpties, cleanEmpties } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Customer ID required' }, { status: 400 });
    }

    serverCustomers = serverCustomers.map((c) =>
      c.id === id
        ? {
            ...c,
            ...(balanceDue !== undefined && { balanceDue: Number(balanceDue) }),
            ...(deliveryDays && { deliveryDays }),
            ...(status && { status }),
            ...(heldEmpties !== undefined && {
              emptiesBalance: { ...c.emptiesBalance, held: Number(heldEmpties) },
            }),
            ...(cleanEmpties !== undefined && {
              emptiesBalance: { ...c.emptiesBalance, clean: Number(cleanEmpties) },
            }),
          }
        : c
    );

    const supabase = createServerSupabaseClient();
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('demo')) {
      const updateData: any = {};
      if (balanceDue !== undefined) updateData.balance_due = Number(balanceDue);
      if (deliveryDays) updateData.delivery_days = deliveryDays;
      if (status) updateData.status = status;
      if (heldEmpties !== undefined) updateData.held_empties = Number(heldEmpties);
      if (cleanEmpties !== undefined) updateData.clean_empties = Number(cleanEmpties);

      await supabase.from('customers').update(updateData).eq('id', id);
    }

    return NextResponse.json({ success: true, message: 'Customer updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
