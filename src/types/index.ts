export type TabType = 'admin-insights' | 'driver-delivery' | 'customer-directory' | 'delivery-history';

export interface CustomerAccount {
  id: string;
  name: string;
  phone: string;
  email: string;
  accountType: 'Residential' | 'Commercial' | 'Office / B2B' | 'Hospital' | 'Retail';
  sector: string;
  hub: string;
  assignedVanId: string;
  assignedVanPlate?: string;
  assignedDriverName?: string;
  premises: string;
  coordinates: {
    lat: number;
    lng: number;
    formatted: string;
  };
  productTier: '20L Mineral Can' | '1L Case (12 Pcs)' | 'Combo 20L + 1L';
  canQuota: number;
  packQuota: number;
  cadence: 'Daily' | 'Alternate Days' | 'Weekly Mon' | 'Weekly Thu' | 'Weekly Sat' | string;
  deliveryDays?: string[];
  balanceDue?: number;
  slot: '07 - 10 AM' | '10 - 01 PM' | '02 - 05 PM' | '05 - 08 PM';
  emptiesBalance: {
    clean: number;
    held: number;
    status: 'Clean' | 'Pending' | 'Deposit Alert';
  };
  depositAmount: number;
  whatsAppOptIn: boolean;
  status: 'Active' | 'Paused' | 'New Intake';
}

export interface VanTelemetry {
  id: string;
  pickupNumber: string;
  plateNumber: string;
  driverName: string;
  driverPhone: string;
  route: string;
  speedKmh: number;
  status: 'Active Delivery' | 'Moving Next Drop' | 'Needs Refill' | 'Unloading Stop' | 'Returning to Plant';
  bottlesRemaining: number;
  initialLoad: number;
  capacity: number;
  dropsCompleted: number;
  totalDrops: number;
  coordinates: {
    x: number; // % in map
    y: number; // % in map
    lat: number;
    lng: number;
  };
  departedTime: string;
  yardName: string;
  fuelPercentage: number;
  cargoTemp: string;
  manifestStops: RouteStop[];
}

export interface RouteStop {
  id: string;
  customerName: string;
  address: string;
  distance: string;
  distanceMeters: number;
  priority: 'High Priority' | 'Standard' | 'Commercial' | 'Enterprise' | 'Retail';
  orderSummary: string;
  cansToDeliver: number;
  packsToDeliver: number;
  expectedEmpties: number;
  balanceDue: number;
  status: 'Completed' | 'In Transit' | 'Pending' | 'Parked';
  etaOrCompletedTime: string;
  gateNotes?: string;
  phone?: string;
  deliveryDays?: string[];
}

export interface PaymentSettlement {
  id: string;
  clientName: string;
  location: string;
  amount: number;
  method: 'UPI Auto' | 'UPI QR' | 'Cash' | 'Credit Net-7';
  status: 'Cleared' | 'Collected' | 'Due in 5d' | 'Pending';
  time: string;
  units: string;
  invoiceNo: string;
}

export interface AreaHotspot {
  id: string;
  rank: string;
  areaName: string;
  routeTag: string;
  bottlesCount: number;
  percentage: number;
  statusTag: string;
  statusType: 'alert' | 'success' | 'warning' | 'info';
  actionNote?: string;
}
