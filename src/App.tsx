import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import { AppLayout } from './components/layout/AppLayout';

// Lazy-loaded pages for code splitting
const RoleSelector = lazy(() => import('./pages/RoleSelector').then(m => ({ default: m.RoleSelector })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const InviteRegister = lazy(() => import('./pages/InviteRegister').then(m => ({ default: m.InviteRegister })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Tickets = lazy(() => import('./pages/Tickets').then(m => ({ default: m.Tickets })));
const TicketDetails = lazy(() => import('./pages/TicketDetails').then(m => ({ default: m.TicketDetails })));
const CreateTicket = lazy(() => import('./pages/CreateTicket').then(m => ({ default: m.CreateTicket })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const EquipmentDetails = lazy(() => import('./pages/EquipmentDetails').then(m => ({ default: m.EquipmentDetails })));
const Clients = lazy(() => import('./pages/Clients').then(m => ({ default: m.Clients })));
const Equipment = lazy(() => import('./pages/Equipment').then(m => ({ default: m.Equipment })));
const Employees = lazy(() => import('./pages/Employees').then(m => ({ default: m.Employees })));
const Statistics = lazy(() => import('./pages/Statistics').then(m => ({ default: m.Statistics })));
const MapPage = lazy(() => import('./pages/MapPage').then(m => ({ default: m.MapPage })));
const InviteManagement = lazy(() => import('./pages/InviteManagement').then(m => ({ default: m.InviteManagement })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const MaintenancePage = lazy(() => import('./pages/MaintenancePage').then(m => ({ default: m.MaintenancePage })));

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center h-full min-h-[200px]">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500">Загрузка...</p>
    </div>
  </div>
);

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Auth pages (no layout) */}
            <Route path="/" element={<RoleSelector />} />
            <Route path="/register" element={<Register />} />
            <Route path="/invite" element={<InviteRegister />} />

            {/* App pages (with layout) */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tickets" element={<Tickets />} />
              <Route path="/tickets/:id" element={<TicketDetails />} />
              <Route path="/equipment/:id" element={<EquipmentDetails />} />
              <Route path="/create-ticket" element={<CreateTicket />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/equipment" element={<Equipment />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/maintenance" element={<MaintenancePage />} />
              <Route path="/invites" element={<InviteManagement />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppProvider>
  );
}
