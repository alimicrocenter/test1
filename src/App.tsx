import React from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  Car, 
  LayoutDashboard, 
  History, 
  Package, 
  BarChart3, 
  Settings, 
  LogOut,
  Bell,
  Menu,
  X,
  User as UserIcon,
  Plus,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';
import Login from './pages/Login';
import { cn } from './lib/utils';

export default function App() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#f1f5f9]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-[#f1f5f9] font-sans text-slate-800 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-[#0f172a] text-slate-300 border-r border-slate-800">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-blue-600 rounded text-white group-hover:scale-110 transition-transform">
              <Car size={18} />
            </div>
            <span className="font-bold text-white tracking-tight uppercase text-sm">AutoLog</span>
          </Link>
        </div>

        <nav className="flex-1 py-4 space-y-0.5">
          <div className="px-6 py-2 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Collections</div>
          <NavLink to="/" icon={<LayoutDashboard size={14} />} label="My Dashboard" active={location.pathname === '/'} />
          <NavLink to="/vehicles" icon={<Car size={14} />} label="My Vehicles" active={location.pathname.startsWith('/vehicles')} />
          <NavLink to="/inventory" icon={<Package size={14} />} label="Garage Storage" active={location.pathname === '/inventory'} />
          
          <div className="px-6 mt-6 py-2 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Analysis</div>
          <NavLink to="/reports" icon={<BarChart3 size={14} />} label="Spending Log" active={location.pathname === '/reports'} />
          <NavLink to="/settings" icon={<Settings size={14} />} label="Settings" active={location.pathname === '/settings'} />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-lg border border-slate-700/30">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border border-slate-600">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={14} className="text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-white truncate">{user.displayName}</p>
              <p className="text-[9px] text-slate-500 truncate uppercase tracking-widest font-mono">Personal Account</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-200 z-10 shrink-0">
          <div className="md:hidden flex items-center gap-3">
             <div className="p-1.5 bg-[#0f172a] rounded text-white"><Car size={16} /></div>
             <span className="font-bold text-sm tracking-tight text-slate-900">AutoLog</span>
          </div>
          
          <div className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Search history, vehicles..." 
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-100 border-transparent rounded-md focus:bg-white focus:ring-1 focus:ring-blue-600 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors relative">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            <button className="px-4 py-1.5 text-[10px] uppercase font-bold tracking-widest bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700 transition-colors">
              + Quick Entry
            </button>
          </div>
        </header>

        {/* Scrollable Viewport */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="h-full"
            >
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/vehicles/*" element={<Vehicles />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      
      {/* Mobile Nav Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around px-2 z-50">
        <MobileNavLink to="/" icon={<LayoutDashboard size={20} />} active={location.pathname === '/'} />
        <MobileNavLink to="/vehicles" icon={<Car size={20} />} active={location.pathname.startsWith('/vehicles')} />
        <MobileNavLink to="/inventory" icon={<Package size={20} />} active={location.pathname === '/inventory'} />
        <MobileNavLink to="/reports" icon={<BarChart3 size={20} />} active={location.pathname === '/reports'} />
        <MobileNavLink to="/settings" icon={<Settings size={20} />} active={location.pathname === '/settings'} />
      </div>
    </div>
  );
}

function NavLink({ to, icon, label, active }: { to: string, icon: React.ReactNode, label: string, active: boolean }) {
  return (
    <Link 
      to={to} 
      className={cn(
        "flex items-center gap-3 px-6 py-2.5 text-[13px] font-medium transition-all group border-r-4",
        active 
          ? "bg-blue-600/10 text-blue-400 border-blue-600" 
          : "text-slate-400 hover:bg-slate-800 hover:text-white border-transparent"
      )}
    >
      <span className={cn(
        "transition-transform",
        active ? "text-blue-500" : "text-slate-500 group-hover:text-slate-300"
      )}>
        {icon}
      </span>
      {label}
    </Link>
  );
}

function MobileNavLink({ to, icon, active }: { to: string, icon: React.ReactNode, active: boolean }) {
  return (
    <Link 
      to={to} 
      className={cn(
        "flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all",
        active ? "bg-slate-900 text-white" : "text-slate-400"
      )}
    >
      {icon}
    </Link>
  );
}
