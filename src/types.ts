export type UserRole = 'ADMIN' | 'MANAGER' | 'TECHNICIAN' | 'OWNER';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  ownerId: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  plateNumber: string;
  currentMileage: number;
  lastServiceDate?: string;
  imageURL?: string;
  createdAt: string;
}

export interface ServiceRecord {
  id: string;
  vehicleId: string;
  date: string;
  mileage: number;
  type: 'MAINTENANCE' | 'REPAIR' | 'UPGRADE';
  description: string;
  cost: number;
  technicianId: string;
  technicianName?: string;
  partsUsed: Array<{
    partId: string;
    name: string;
    quantity: number;
    cost: number;
  }>;
  notes?: string;
}

export interface Part {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unitCost: number;
  minStockLevel: number;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  ownerId: string;
  date: string;
  mileage: number;
  gallons: number;
  pricePerGallon: number;
  totalCost: number;
  isFullTank: boolean;
  notes?: string;
}

export interface VehicleDocument {
  id: string;
  vehicleId: string;
  ownerId: string;
  title: string;
  type: 'INSURANCE' | 'REGISTRATION' | 'OTHER';
  expiryDate?: string;
  fileURL?: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  vehicleId: string;
  ownerId: string;
  title: string;
  description?: string;
  dueDate?: string;
  dueMileage?: number;
  type: 'OIL_CHANGE' | 'TIRE_ROTATION' | 'INSPECTION' | 'REGISTRATION' | 'INSURANCE' | 'OTHER';
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE';
  isRepeatable?: boolean;
  repeatMileage?: number;
  repeatMonths?: number;
  lastCompletedDate?: string;
  lastCompletedMileage?: number;
}
