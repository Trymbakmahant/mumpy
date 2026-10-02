import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export interface AuthorizedAccount {
  id: string;
  email: string;
  aliases: string[];
  password: string;
  profile: {
    id: string;
    email: string;
    full_name: string;
    role: 'admin' | 'driver';
    phone: string;
    avatar_url: string;
    assigned_van_id: string | null;
    van_plate?: string;
    van_sector?: string;
    status: 'active';
  };
}

export const PRECONFIGURED_ACCOUNTS: AuthorizedAccount[] = [
  {
    id: 'admin-01',
    email: 'admin@mumpywater.com',
    aliases: ['admin', 'admin@mumpywater.com', 'admin01'],
    password: 'Admin@123',
    profile: {
      id: 'admin-hub-04',
      email: 'admin@mumpywater.com',
      full_name: 'Operations Hub Admin',
      role: 'admin',
      phone: '+91 98220 11990',
      avatar_url: '/images/avatar-rajesh.png',
      assigned_van_id: null,
      status: 'active',
    },
  },
  {
    id: 'driver-01',
    email: 'driver1@mumpywater.com',
    aliases: ['driver1', 'driver1@mumpywater.com', 'rajesh.patil@mumpywater.com', 'rajesh'],
    password: 'Driver1@123',
    profile: {
      id: 'driver-rajesh-02',
      email: 'driver1@mumpywater.com',
      full_name: 'Rajesh Patil (Driver 1)',
      role: 'driver',
      phone: '+91 98230 45892',
      avatar_url: '/images/avatar-rajesh.png',
      assigned_van_id: 'van-02',
      van_plate: 'MH-12-BR-3042',
      van_sector: 'IT Corridor - Phase 2',
      status: 'active',
    },
  },
  {
    id: 'driver-02',
    email: 'driver2@mumpywater.com',
    aliases: ['driver2', 'driver2@mumpywater.com', 'suresh.kumar@mumpywater.com', 'suresh'],
    password: 'Driver2@123',
    profile: {
      id: 'driver-suresh-01',
      email: 'driver2@mumpywater.com',
      full_name: 'Suresh Kumar (Driver 2)',
      role: 'driver',
      phone: '+91 98901 12345',
      avatar_url: '/images/avatar-rajesh.png',
      assigned_van_id: 'van-01',
      van_plate: 'MH-12-BR-3041',
      van_sector: 'Sector 14 & 15',
      status: 'active',
    },
  },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, role } = body;
    const normalizedInput = (email || '').trim().toLowerCase();

    // 1. Check against preconfigured official accounts
    const account = PRECONFIGURED_ACCOUNTS.find(
      (acc) =>
        acc.email.toLowerCase() === normalizedInput ||
        acc.aliases.some((alias) => alias.toLowerCase() === normalizedInput)
    );

    if (account) {
      // Validate password strictly
      if (!password || password.trim() === '' || password !== account.password) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid password for ${account.email}. Expected correct password.`,
          },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Authenticated successfully as ${account.profile.full_name}`,
        user: account.profile,
        token: `mumpy_jwt_${Date.now()}`,
      });
    }

    // 2. Query Supabase database for other registered accounts
    const supabase = createServerSupabaseClient();
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('demo')) {
      const { data: dbUser, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`email.eq.${normalizedInput},phone.eq.${normalizedInput}`)
        .single();

      if (dbUser && !error) {
        return NextResponse.json({
          success: true,
          message: `Authenticated successfully as ${dbUser.role}`,
          user: dbUser,
          token: `mumpy_jwt_${Date.now()}`,
        });
      }
    }

    // 3. Fallback matching by role if clicked via quick role selector
    if (role === 'driver') {
      const defaultDriver = PRECONFIGURED_ACCOUNTS[1];
      return NextResponse.json({
        success: true,
        message: `Authenticated as default Driver 1 (${defaultDriver.profile.full_name})`,
        user: defaultDriver.profile,
        token: `mumpy_jwt_${Date.now()}`,
      });
    } else if (role === 'admin') {
      const defaultAdmin = PRECONFIGURED_ACCOUNTS[0];
      return NextResponse.json({
        success: true,
        message: `Authenticated as Admin (${defaultAdmin.profile.full_name})`,
        user: defaultAdmin.profile,
        token: `mumpy_jwt_${Date.now()}`,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: `Account "${email}" not found. Valid IDs: admin@mumpywater.com, driver1@mumpywater.com, driver2@mumpywater.com`,
      },
      { status: 404 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Authentication error' },
      { status: 500 }
    );
  }
}
