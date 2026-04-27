import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Shield, 
  Bell, 
  Globe, 
  Database,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Settings() {
  const { profile, logout } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight italic font-serif">Account & Preferences</h2>
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-slate-400 italic">Manage your profile and app settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation */}
        <div className="md:col-span-1 space-y-1">
          <SettingsTab icon={<User size={18} />} label="Profile" active={true} />
          <SettingsTab icon={<Shield size={18} />} label="Security" />
          <SettingsTab icon={<Bell size={18} />} label="Notifications" />
          <SettingsTab icon={<Globe size={18} />} label="Regional" />
          <SettingsTab icon={<Database size={18} />} label="Log Data" />
        </div>

        {/* Content */}
        <div className="md:col-span-3 space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
             <section>
                <h3 className="text-sm font-mono uppercase tracking-widest font-bold text-slate-400 mb-6 italic border-b border-slate-100 pb-2">My Profile</h3>
                <div className="flex items-center gap-6">
                   <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center text-white text-2xl font-bold italic font-serif">
                      {profile?.displayName?.[0] || profile?.email?.[0] || 'U'}
                   </div>
                   <div className="flex-1">
                      <h4 className="text-xl font-bold tracking-tight">{profile?.displayName}</h4>
                      <p className="text-sm text-slate-500 mb-1">{profile?.email}</p>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-widest bg-slate-100 text-slate-500">
                         Standard Account
                      </span>
                   </div>
                   <button className="text-xs font-bold uppercase tracking-widest text-blue-600 hover:underline">Edit</button>
                </div>
             </section>

             <section className="space-y-4">
                <h3 className="text-sm font-mono uppercase tracking-widest font-bold text-slate-400 mb-6 italic border-b border-slate-100 pb-2">Account Security</h3>
                <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between group cursor-pointer hover:bg-slate-100 transition-colors">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg group-hover:scale-110 transition-transform">
                         <Shield size={18} className="text-slate-600" />
                      </div>
                      <div>
                         <p className="text-sm font-bold">Two-Factor Authentication</p>
                         <p className="text-xs text-slate-500">Add an extra layer of security to your account</p>
                      </div>
                   </div>
                   <ChevronRight size={18} className="text-slate-300" />
                </div>
                
                <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between group cursor-pointer hover:bg-slate-100 transition-colors">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg group-hover:scale-110 transition-transform">
                         <Bell size={18} className="text-slate-600" />
                      </div>
                      <div>
                         <p className="text-sm font-bold">Notifications</p>
                         <p className="text-xs text-slate-500">Manage how you receive alerts and reminders</p>
                      </div>
                   </div>
                   <ChevronRight size={18} className="text-slate-300" />
                </div>
             </section>

             <div className="pt-6 border-t border-slate-100">
                <button 
                  onClick={logout}
                  className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-widest hover:text-red-700 transition-colors"
                >
                  <LogOut size={16} /> Sign Out
                </button>
             </div>
          </div>
          
          <div className="p-6 bg-red-50 rounded-2xl border border-red-100">
             <h4 className="text-sm font-bold text-red-900 mb-1">Delete Account</h4>
             <p className="text-xs text-red-600 mb-4 font-medium">Permanently delete your account and all your vehicle data. This action cannot be undone.</p>
             <button className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-all">
                Delete Account
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={cn(
      "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
      active ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"
    )}>
      <span className={active ? "text-white" : "text-slate-300"}>{icon}</span>
      {label}
    </button>
  );
}
