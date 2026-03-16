import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Ticket, Equipment, TicketStatus, Priority, Role, Location, RolePermissions, Permission, Invite, OfflineReport } from '../types';
import { createToken, saveToken, getSavedAuth, removeToken, generateInviteToken } from '../lib/auth';
import { cacheTickets, getCachedTickets, saveOfflineReport, getUnsyncedReports, markReportSynced, isOnline, registerServiceWorker } from '../lib/offlineStore';

interface AppState {
  currentUser: User | null;
  users: User[];
  tickets: Ticket[];
  equipments: Equipment[];
  locations: Location[];
  invites: Invite[];
  rolePermissions: RolePermissions;
  online: boolean;
  setCurrentUser: (user: User | null) => void;
  loginUser: (user: User) => void;
  logoutUser: () => void;
  addTicket: (ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'history'>) => void;
  updateTicketStatus: (ticketId: string, status: TicketStatus, note?: string) => void;
  assignEngineer: (ticketId: string, engineerId: string) => void;
  addPartsUsed: (ticketId: string, parts: { name: string; quantity: number }[], resolution: string) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  addEquipment: (equipment: Omit<Equipment, 'id'>) => void;
  addLocation: (location: Omit<Location, 'id'>) => void;
  addComment: (ticketId: string, text: string) => void;
  updateRolePermissions: (role: Role, permissions: Permission[]) => void;
  createInvite: (role: Role) => Invite | null;
  revokeInvite: (inviteId: string) => void;
  useInvite: (token: string, user: Omit<User, 'id' | 'role'>) => User | null;
  saveReportOffline: (ticketId: string, resolution: string, parts: { name: string; quantity: number }[]) => void;
  syncOfflineReports: () => void;
}

const MOCK_USERS: User[] = [
  { id: 'spec1', name: 'Иван (Специалист)', email: 'ivan@example.com', role: 'specialist', locationId: 'loc1', networkId: 'net1' },
  { id: 'locman1', name: 'Анна (Управляющий)', email: 'anna@example.com', role: 'location_manager', locationId: 'loc1', networkId: 'net1' },
  { id: 'netman1', name: 'Сергей (Руководитель сети)', email: 'sergey@example.com', role: 'network_manager', networkId: 'net1' },
  { id: 'op1', name: 'Мария (Оператор)', email: 'maria@example.com', role: 'operator' },
  { id: 'eng1', name: 'Алексей (Инженер)', email: 'alexey@example.com', role: 'engineer', regionId: 'reg1', lat: 55.751244, lng: 37.618423 },
  { id: 'eng2', name: 'Дмитрий (Инженер)', email: 'dmitry@example.com', role: 'engineer', regionId: 'reg1', lat: 55.760000, lng: 37.640000 },
  { id: 'regman1', name: 'Елена (Менеджер региона)', email: 'elena@example.com', role: 'region_manager', regionId: 'reg1' },
  { id: 'admin1', name: 'Виктор (Админ)', email: 'admin@example.com', role: 'admin' },
];

const MOCK_LOCATIONS: Location[] = [
  { id: 'loc1', name: 'Кофейня на Ленина', address: 'ул. Ленина, 10', legalEntity: 'ООО КофеКорп', networkId: 'net1', lat: 55.7558, lng: 37.6173 },
  { id: 'loc2', name: 'Кофейня на Пушкина', address: 'ул. Пушкина, 15', legalEntity: 'ООО КофеКорп', networkId: 'net1', lat: 55.7600, lng: 37.6200 },
];

const DEFAULT_PERMISSIONS: RolePermissions = {
  admin: ['view_dashboard', 'view_tickets', 'create_ticket', 'edit_ticket', 'delete_ticket', 'view_equipment', 'manage_equipment', 'view_clients', 'manage_clients', 'view_employees', 'manage_employees', 'view_statistics', 'manage_settings', 'view_map', 'manage_invites'],
  network_manager: ['view_dashboard', 'view_tickets', 'create_ticket', 'edit_ticket', 'view_equipment', 'manage_equipment', 'view_clients', 'manage_clients', 'view_employees', 'manage_employees', 'view_statistics', 'manage_settings', 'view_map'],
  region_manager: ['view_dashboard', 'view_tickets', 'edit_ticket', 'view_equipment', 'view_clients', 'view_employees', 'view_statistics', 'view_map', 'manage_invites'],
  operator: ['view_dashboard', 'view_tickets', 'edit_ticket', 'view_equipment', 'view_clients', 'view_map', 'view_statistics'],
  engineer: ['view_dashboard', 'view_tickets', 'edit_ticket', 'view_equipment', 'view_map', 'view_statistics'],
  location_manager: ['view_dashboard', 'view_tickets', 'create_ticket', 'view_equipment', 'view_statistics'],
  specialist: ['view_dashboard', 'view_tickets', 'create_ticket', 'view_equipment'],
};

const MOCK_EQUIPMENTS: Equipment[] = [
  { id: 'eq1', serialNumber: 'LM-12345', model: 'La Marzocco Linea PB', locationId: 'loc1', locationName: 'Кофейня на Ленина', legalEntity: 'ООО КофеКорп' },
  { id: 'eq2', serialNumber: 'NS-98765', model: 'Nuova Simonelli Aurelia', locationId: 'loc2', locationName: 'Кофейня на Пушкина', legalEntity: 'ООО КофеКорп' },
];

const MOCK_TICKETS: Ticket[] = [
  {
    id: 't1',
    equipmentId: 'eq1',
    equipmentDetails: MOCK_EQUIPMENTS[0],
    description: 'Не греет воду',
    photos: [],
    status: 'created',
    priority: 'high',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    createdBy: 'spec1',
    history: [
      { status: 'created', timestamp: new Date(Date.now() - 3600000).toISOString(), userId: 'spec1' }
    ]
  },
  {
    id: 't2',
    equipmentId: 'eq2',
    equipmentDetails: MOCK_EQUIPMENTS[1],
    description: 'Плохой пролив',
    photos: [],
    status: 'assigned',
    priority: 'medium',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 80000000).toISOString(),
    createdBy: 'spec1',
    assignedTo: 'eng1',
    history: [
      { status: 'created', timestamp: new Date(Date.now() - 86400000).toISOString(), userId: 'spec1' },
      { status: 'opened', timestamp: new Date(Date.now() - 85000000).toISOString(), userId: 'op1' },
      { status: 'assigned', timestamp: new Date(Date.now() - 80000000).toISOString(), userId: 'regman1' }
    ]
  }
];

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [equipments, setEquipments] = useState<Equipment[]>(MOCK_EQUIPMENTS);
  const [locations, setLocations] = useState<Location[]>(MOCK_LOCATIONS);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>(DEFAULT_PERMISSIONS);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [online, setOnline] = useState<boolean>(navigator.onLine);

  // Register SW on mount
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Track online/offline
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cache tickets when they change (for offline engineers)
  useEffect(() => {
    if (currentUser?.role === 'engineer') {
      const engineerTickets = tickets.filter(t => t.assignedTo === currentUser.id);
      cacheTickets(engineerTickets);
    }
  }, [tickets, currentUser]);

  // Restore session from JWT
  useEffect(() => {
    const auth = getSavedAuth();
    if (auth) {
      const user = MOCK_USERS.find(u => u.id === auth.userId);
      if (user) {
        setCurrentUser(user);
      }
    }
  }, []);

  // Auto-sync when online
  useEffect(() => {
    if (online && currentUser?.role === 'engineer') {
      syncOfflineReports();
    }
  }, [online, currentUser]);

  // Listen for SW sync events
  useEffect(() => {
    const handler = () => syncOfflineReports();
    window.addEventListener('sync-offline-reports', handler);
    return () => window.removeEventListener('sync-offline-reports', handler);
  }, []);

  const loginUser = (user: User) => {
    const token = createToken(user);
    saveToken(token);
    setCurrentUser(user);
  };

  const logoutUser = () => {
    removeToken();
    setCurrentUser(null);
  };

  const addTicket = (ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'history'>) => {
    const newTicket: Ticket = {
      ...ticketData,
      id: `t${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [{ status: ticketData.status, timestamp: new Date().toISOString(), userId: currentUser?.id || 'system' }]
    };
    setTickets(prev => [newTicket, ...prev]);
  };

  const updateTicketStatus = (ticketId: string, status: TicketStatus, note?: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status,
          updatedAt: new Date().toISOString(),
          history: [...t.history, { status, timestamp: new Date().toISOString(), userId: currentUser?.id || 'system', note }]
        };
      }
      return t;
    }));
  };

  const assignEngineer = (ticketId: string, engineerId: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'assigned' as TicketStatus,
          assignedTo: engineerId,
          updatedAt: new Date().toISOString(),
          history: [...t.history, { status: 'assigned' as TicketStatus, timestamp: new Date().toISOString(), userId: currentUser?.id || 'system', note: `Назначен инженер ${users.find(u => u.id === engineerId)?.name}` }]
        };
      }
      return t;
    }));
  };

  const addPartsUsed = (ticketId: string, parts: { name: string; quantity: number }[], resolution: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'completed' as TicketStatus,
          partsUsed: parts,
          resolution,
          updatedAt: new Date().toISOString(),
          history: [...t.history, { status: 'completed' as TicketStatus, timestamp: new Date().toISOString(), userId: currentUser?.id || 'system', note: resolution }]
        };
      }
      return t;
    }));
  };

  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: `u${Date.now()}`
    };
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const addEquipment = (equipmentData: Omit<Equipment, 'id'>) => {
    const newEquipment: Equipment = {
      ...equipmentData,
      id: `eq${Date.now()}`
    };
    setEquipments(prev => [...prev, newEquipment]);
  };

  const addLocation = (locationData: Omit<Location, 'id'>) => {
    const newLocation: Location = {
      ...locationData,
      id: `loc${Date.now()}`
    };
    setLocations(prev => [...prev, newLocation]);
  };

  const addComment = (ticketId: string, text: string) => {
    if (!currentUser) return;
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        const newComment = {
          id: `c${Date.now()}`,
          userId: currentUser.id,
          text,
          timestamp: new Date().toISOString()
        };
        return {
          ...t,
          comments: [...(t.comments || []), newComment]
        };
      }
      return t;
    }));
  };

  const updateRolePermissions = (role: Role, permissions: Permission[]) => {
    setRolePermissions(prev => ({ ...prev, [role]: permissions }));
  };

  // Invite management
  const createInvite = (role: Role): Invite | null => {
    if (!currentUser) return null;
    const canManage = rolePermissions[currentUser.role]?.includes('manage_invites');
    if (!canManage) return null;

    const invite: Invite = {
      id: `inv${Date.now()}`,
      token: generateInviteToken(),
      role,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      isActive: true,
    };
    setInvites(prev => [...prev, invite]);
    return invite;
  };

  const revokeInvite = (inviteId: string) => {
    if (!currentUser) return;
    const canManage = rolePermissions[currentUser.role]?.includes('manage_invites');
    if (!canManage) return;

    setInvites(prev => prev.map(inv =>
      inv.id === inviteId ? { ...inv, isActive: false } : inv
    ));
  };

  const useInvite = (token: string, userData: Omit<User, 'id' | 'role'>): User | null => {
    const invite = invites.find(inv =>
      inv.token === token &&
      inv.isActive &&
      !inv.usedBy &&
      new Date(inv.expiresAt) > new Date()
    );

    if (!invite) return null;

    const newUser: User = {
      ...userData,
      id: `u${Date.now()}`,
      role: invite.role,
    };

    setUsers(prev => [...prev, newUser]);
    setInvites(prev => prev.map(inv =>
      inv.id === invite.id ? { ...inv, usedBy: newUser.id, usedAt: new Date().toISOString(), isActive: false } : inv
    ));

    return newUser;
  };

  // Offline report management
  const saveReportOffline = (ticketId: string, resolution: string, parts: { name: string; quantity: number }[]) => {
    const report: OfflineReport = {
      id: `or${Date.now()}`,
      ticketId,
      resolution,
      parts,
      createdAt: new Date().toISOString(),
      synced: false,
    };
    saveOfflineReport(report);

    if (isOnline()) {
      syncOfflineReports();
    }
  };

  const syncOfflineReports = useCallback(() => {
    const unsynced = getUnsyncedReports();
    unsynced.forEach(report => {
      // Apply report to tickets
      addPartsUsed(report.ticketId, report.parts, report.resolution);
      markReportSynced(report.id);
    });
    if (unsynced.length > 0) {
      console.log(`[Sync] Synced ${unsynced.length} offline reports`);
    }
  }, []);

  return (
    <AppContext.Provider value={{
      currentUser, users, tickets, equipments, locations, invites, rolePermissions, online,
      setCurrentUser, loginUser, logoutUser,
      addTicket, updateTicketStatus, assignEngineer, addPartsUsed,
      addUser, addEquipment, addLocation, addComment, updateRolePermissions,
      createInvite, revokeInvite, useInvite,
      saveReportOffline, syncOfflineReports
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
