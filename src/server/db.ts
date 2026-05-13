import { v4 as uuidv4 } from 'uuid';

export enum UserRole {
  CITIZEN = 'citizen',
  DRIVER = 'driver',
  ADMIN = 'admin'
}

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  password?: string; // In a demo, we might just use phone as ID
  zoneId?: string;
}

export interface Zone {
  id: string;
  name: string;
  boundary: any[]; // Lat/Lng points
}

export interface Truck {
  id: string;
  numberPlate: string;
  driverId: string;
  zoneId: string;
  location: { lat: number; lng: number };
  status: 'idle' | 'on-route' | 'full' | 'maintenance';
}

export interface Complaint {
  id: string;
  citizenId: string;
  type: 'missed-pickup' | 'bulk-pickup' | 'new-service' | 'complaint';
  description: string;
  status: 'pending' | 'in-progress' | 'resolved' | 'rejected';
  location?: { lat: number; lng: number };
  address?: string;
  preferredDate?: string;
  preferredTime?: string;
  notes?: string;
  attachmentUrl?: string;
  referenceNumber: string;
  zoneId?: string;
  adminRemarks?: string;
  createdAt: string;
}

export interface RouteStop {
  id: string;
  truckId: string;
  address: string;
  location: { lat: number; lng: number };
  status: 'pending' | 'in-progress' | 'verified' | 'completed';
  completedAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  type: 'request-update' | 'system' | 'alert';
  createdAt: string;
}

export interface Attendance {
  id: string;
  driverId: string;
  checkIn: string;
  checkOut?: string;
  status: 'present' | 'absent';
}

// Simple in-memory DB
export const db = {
  users: [] as User[],
  zones: [] as Zone[],
  trucks: [] as Truck[],
  complaints: [] as Complaint[],
  notifications: [] as Notification[],
  attendance: [] as Attendance[],
  routeStops: [] as RouteStop[],
};

// Initial Demo Data
export const initDemoData = () => {
  // Clear if needed
  db.users = [];
  db.zones = [];
  db.trucks = [];
  db.complaints = [];
  db.notifications = [];
  db.attendance = [];
  db.routeStops = [];

  // Zones
  const zones: Zone[] = [
    { id: 'zone-1', name: 'Downtown (Ward 01)', boundary: [] },
    { id: 'zone-2', name: 'West End (Ward 02)', boundary: [] },
    { id: 'zone-3', name: 'Market Street (Ward 05)', boundary: [] },
  ];
  db.zones.push(...zones);

  // Users
  const users: User[] = [
    { id: 'u1', name: 'Gurpinder Singh', phone: '9876543210', role: UserRole.CITIZEN, zoneId: 'zone-1' },
    { id: 'u2', name: 'Jane Citizen', phone: '9000000001', role: UserRole.CITIZEN, zoneId: 'zone-2' },
    { id: 'd1', name: 'Ravi Kumar', phone: '8000000001', role: UserRole.DRIVER },
    { id: 'd2', name: 'Suresh Raina', phone: '8000000002', role: UserRole.DRIVER },
    { id: 'a1', name: 'Admin User', phone: '100', role: UserRole.ADMIN },
  ];
  db.users.push(...users);

  // Trucks
  const trucks: Truck[] = [
    { id: 't1', numberPlate: 'PB-01-AX-1234', driverId: 'd1', zoneId: 'zone-1', location: { lat: 30.7333, lng: 76.7794 }, status: 'on-route' },
    { id: 't2', numberPlate: 'PB-01-BY-5678', driverId: 'd2', zoneId: 'zone-2', location: { lat: 30.7444, lng: 76.7894 }, status: 'idle' },
  ];
  db.trucks.push(...trucks);

  // Route Stops
  db.routeStops.push(
    { id: 'rs1', truckId: 't1', address: 'Sector 17 Market Gate', location: { lat: 30.7330, lng: 76.7790 }, status: 'completed', completedAt: new Date().toISOString() },
    { id: 'rs2', truckId: 't1', address: 'Residential Area Block A', location: { lat: 30.7350, lng: 76.7810 }, status: 'verified' },
    { id: 'rs3', truckId: 't1', address: 'Central Park North', location: { lat: 30.7370, lng: 76.7830 }, status: 'in-progress' },
    { id: 'rs4', truckId: 't1', address: 'Main Street Bank', location: { lat: 30.7390, lng: 76.7850 }, status: 'pending' },
  );

  // Complaints
  db.complaints.push({
    id: 'c1',
    citizenId: 'u1',
    type: 'complaint',
    description: 'The bin near Sector 17 main market is overflowing.',
    status: 'pending',
    referenceNumber: 'CMP-1001',
    address: 'Near Sector 17 Main Market',
    zoneId: 'zone-1',
    createdAt: new Date().toISOString(),
  });

  db.complaints.push({
    id: 'c2',
    citizenId: 'u1',
    type: 'bulk-pickup',
    description: 'Request for bulk pickup of old furniture.',
    status: 'in-progress',
    referenceNumber: 'REQ-2002',
    address: 'House No 123, Street 5',
    preferredDate: '2026-05-15',
    preferredTime: '10:00 AM',
    zoneId: 'zone-1',
    createdAt: new Date().toISOString(),
  });

  // Notifications
  db.notifications.push({
    id: 'n1',
    userId: 'u1',
    title: 'Truck Arriving',
    message: 'Your assigned truck PB-01-AX-1234 is 200m away.',
    read: false,
    type: 'system',
    createdAt: new Date().toISOString(),
  });

  db.notifications.push({
    id: 'n2',
    userId: 'u1',
    title: 'Request Updated',
    message: 'Your bulk pickup request REQ-2002 is now in progress.',
    read: false,
    type: 'request-update',
    createdAt: new Date().toISOString(),
  });
};

initDemoData();
