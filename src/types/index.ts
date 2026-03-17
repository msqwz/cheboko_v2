export type Role =
  | 'specialist'
  | 'location_manager'
  | 'network_manager'
  | 'operator'
  | 'engineer'
  | 'region_manager'
  | 'admin';

export type TicketStatus =
  | 'created'
  | 'opened'
  | 'assigned'
  | 'enroute'
  | 'in_work'
  | 'completed'
  | 'on_hold'
  | 'canceled';

export type Priority = 'high' | 'medium' | 'low';

export interface User {
  id: string;
  name: string;
  email?: string;
  role: Role;
  locationId?: string;
  networkId?: string;
  regionId?: string;
  lat?: number;
  lng?: number;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  legalEntity: string;
  networkId?: string;
  lat?: number;
  lng?: number;
}

export type Permission =
  | 'view_dashboard'
  | 'view_tickets'
  | 'create_ticket'
  | 'edit_ticket'
  | 'delete_ticket'
  | 'view_equipment'
  | 'manage_equipment'
  | 'view_clients'
  | 'manage_clients'
  | 'view_employees'
  | 'manage_employees'
  | 'view_statistics'
  | 'manage_settings'
  | 'view_map'
  | 'manage_invites'
  | 'view_maintenance';

export type RolePermissions = Record<Role, Permission[]>;

export interface Equipment {
  id: string;
  serialNumber: string;
  model: string;
  locationId: string;
  locationName: string;
  legalEntity: string;
}

export interface TicketHistoryEntry {
  status: TicketStatus;
  timestamp: string;
  userId: string;
  note?: string;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  timestamp: string;
}

export interface Ticket {
  id: string;
  equipmentId: string;
  equipmentDetails: Equipment;
  description: string;
  photos: string[];
  status: TicketStatus;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  assignedTo?: string;
  partsUsed?: { name: string; quantity: number }[];
  resolution?: string;
  history: TicketHistoryEntry[];
  comments?: Comment[];
}

export interface Invite {
  id: string;
  token: string;
  role: Role;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  usedBy?: string;
  usedAt?: string;
  isActive: boolean;
}

export interface AuthToken {
  userId: string;
  role: Role;
  exp: number;
  iat: number;
}

export interface OfflineReport {
  id: string;
  ticketId: string;
  resolution: string;
  parts: { name: string; quantity: number }[];
  createdAt: string;
  synced: boolean;
}

export type MaintenanceStatus = 'completed' | 'recommended';

export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  equipmentDetails: Equipment;
  clientName: string;
  locationName: string;
  address: string;
  description: string;
  completedAt: string;
  drinksCount: number;
  cleaningCount: number;
  status: MaintenanceStatus;
  performedBy?: string;
  createdAt: string;
}
