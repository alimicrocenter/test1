import React, { useEffect, useState } from 'react';
import { 
  Car, 
  Wrench, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp,
  Clock,
  ArrowRight,
  Fuel,
  Droplets
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { collection, query, where, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Vehicle, ServiceRecord, Reminder, Part, FuelLog } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MOCK_DATA = [
  { name: 'Jan', cost: 400 },
  { name: 'Feb', cost: 300 },
  { name: 'Mar', cost: 200 },
  { name: 'Apr', cost: 900 },
  { name: 'May', cost: 500 },
  { name: 'Jun', cost: 650 },
];

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [recentRecords, setRecentRecords] = useState<ServiceRecord[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [stats, setStats] = useState({
    totalVehicles: 0,
    totalSpent: 0,
    fuelSpent: 0,
    pendingReminders: 0,
    avgMaintenanceScore: 92
  });

  useEffect(() => {
    if (!user || !profile) return;

    // 1. Vehicles Subscription
    const vehiclesQuery = query(collection(db, 'vehicles'), where('ownerId', '==', user.uid));

    const unsubscribeVehicles = onSnapshot(vehiclesQuery, (snapshot) => {
      const vData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
      setVehicles(vData);
      setStats(prev => ({ ...prev, totalVehicles: vData.length }));
    }, (error) => {
       handleFirestoreError(error, OperationType.LIST, 'vehicles');
    });

    // 2. Service Records Subscription
    const recordsQuery = query(collection(db, 'serviceRecords'), where('ownerId', '==', user.uid), orderBy('date', 'desc'));

    const unsubscribeRecords = onSnapshot(recordsQuery, (snapshot) => {
      const allRecords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRecord));
      setRecentRecords(allRecords.slice(0, 5));
      
      const total = allRecords.reduce((acc, rec) => acc + (rec.cost || 0), 0);
      setStats(prev => ({ ...prev, totalSpent: total }));
    }, (error) => {
       handleFirestoreError(error, OperationType.LIST, 'serviceRecords');
    });

    // 3. Fuel Logs Subscription
    const fuelQuery = query(collection(db, 'fuelLogs'), where('ownerId', '==', user.uid), orderBy('date', 'desc'));
    const unsubscribeFuel = onSnapshot(fuelQuery, (snapshot) => {
      const allFuel = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FuelLog));
      setFuelLogs(allFuel);
      const fuelTotal = allFuel.reduce((acc, log) => acc + (log.totalCost || 0), 0);
      setStats(prev => ({ ...prev, fuelSpent: fuelTotal }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'fuelLogs');
    });

    // 4. Reminders Subscription
    const remindersQuery = query(collection(db, 'reminders'), where('ownerId', '==', user.uid));

    const unsubscribeReminders = onSnapshot(remindersQuery, (snapshot) => {
      const rData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reminder));
      setReminders(rData);
      const pending = rData.filter(r => r.status === 'PENDING').length;
      setStats(prev => ({ ...prev, pendingReminders: pending }));
    }, (error) => {
       handleFirestoreError(error, OperationType.LIST, 'reminders');
    });

    return () => {
      unsubscribeVehicles();
      unsubscribeRecords();
      unsubscribeFuel();
      unsubscribeReminders();
    };
  }, [user, profile]);

  const chartData = [
    { name: 'Service', cost: stats.totalSpent },
    { name: 'Fuel', cost: stats.fuelSpent },
  ];

  return (
    <div className="grid grid-cols-12 gap-6 pb-12">
      {/* Key Metrics Row */}
      <div className="col-span-12 md:col-span-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Total Investment</p>
        <h3 className="text-2xl font-bold mt-2 tracking-tight">{formatCurrency(stats.totalSpent + stats.fuelSpent)}</h3>
        <div className="mt-2 flex items-center text-[10px] text-emerald-600 font-bold">
          <TrendingUp size={12} className="mr-1" />
          <span>Fuel & Maintenance</span>
        </div>
      </div>
      
      <div className="col-span-12 md:col-span-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Fuel Expense</p>
        <h3 className="text-2xl font-bold mt-2 tracking-tight">{formatCurrency(stats.fuelSpent)}</h3>
        <div className="mt-2 flex items-center text-[10px] text-blue-600 font-bold">
          <Fuel size={12} className="mr-1" />
          <span>{fuelLogs.length} Refuel events</span>
        </div>
      </div>

      <div className="col-span-12 md:col-span-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Service Items</p>
        <h3 className="text-2xl font-bold mt-2 tracking-tight">{stats.pendingReminders} Reminders</h3>
        <div className="mt-2 flex items-center text-[10px] text-amber-600 font-bold">
          <AlertTriangle size={12} className="mr-1" />
          <span>Next service tracked</span>
        </div>
      </div>

      <div className="col-span-12 md:col-span-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Fleet Health</p>
        <div className="flex items-end justify-between mt-2">
          <h3 className="text-2xl font-bold tracking-tight">{stats.avgMaintenanceScore}%</h3>
          <div className="w-24 h-1.5 bg-slate-100 rounded-full mb-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${stats.avgMaintenanceScore}%` }}></div>
          </div>
        </div>
      </div>

      {/* Charts and Lists Section */}
      <div className="col-span-12 lg:col-span-8 space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Expense Distribution</h4>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '10px', fontWeight: 'bold' }}
                />
                <Bar dataKey="cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Recent History</h4>
            <Link to="/vehicles" className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline">View My Garage</Link>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[9px] uppercase text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3 font-mono">Date</th>
                <th className="px-5 py-3">Vehicle</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3 text-right">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-[11px] font-bold">
              {recentRecords.length > 0 ? recentRecords.map(record => (
                <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3 text-slate-400 font-mono">{new Date(record.date).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-slate-700">Vehicle #{record.vehicleId.slice(-4)}</td>
                  <td className="px-5 py-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[9px]",
                      record.type === 'MAINTENANCE' ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {record.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-mono">{formatCurrency(record.cost)}</td>
                </tr>
              )) : (
                <tr>
                   <td colSpan={4} className="px-5 py-8 text-center text-slate-400 font-mono uppercase tracking-widest text-[10px]">No recent data recorded</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Column: Alerts & Reminders */}
      <div className="col-span-12 lg:col-span-4 space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h4 className="text-xs font-bold mb-4 flex items-center gap-2 uppercase tracking-widest text-slate-400">
            <AlertTriangle size={14} className="text-amber-500" />
            Upcoming Maintenance
          </h4>
          <div className="space-y-4">
            {reminders.filter(r => r.status === 'PENDING').slice(0, 4).length > 0 ? reminders.filter(r => r.status === 'PENDING').slice(0, 4).map(reminder => (
              <div key={reminder.id} className="flex items-center justify-between group">
                <div>
                  <p className="text-[11px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{reminder.title}</p>
                  <p className="text-[9px] text-slate-400 font-mono font-bold tracking-tight">Due: {reminder.dueDate}</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full font-bold uppercase tracking-widest">Pending</span>
                </div>
              </div>
            )) : (
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest text-center py-4">All caught up!</p>
            )}
          </div>
          <Link to="/vehicles" className="block w-full mt-6 py-2 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold text-center uppercase tracking-widest hover:bg-slate-100 transition-colors">
            Manage Reminders
          </Link>
        </div>

        <div className="flex-1 bg-[#0f172a] rounded-xl border border-slate-800 shadow-xl p-6 text-slate-300">
          <h4 className="text-xs font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
            <Clock size={14} /> My Garage Notes
          </h4>
          <div className="space-y-6">
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
               <p className="text-[10px] font-mono text-slate-500 uppercase mb-2">Pro Tip</p>
               <p className="text-[11px] leading-relaxed text-slate-300 italic">
                 "Check your tire pressure monthly to improve fuel efficiency and ensure safety during longer trips."
               </p>
            </div>
            <div className="h-px bg-slate-800"></div>
            <div className="flex items-center gap-4">
               <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
                  <Wrench size={16} />
               </div>
               <div>
                  <p className="text-[11px] font-bold text-white">Next Inspection</p>
                  <p className="text-[9px] text-slate-500 font-mono italic">Recommended in 3,200 miles</p>
               </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-800">
             <button className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition-all active:scale-95">
                Add New Record
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, trend }: { label: string, value: string, icon: React.ReactNode, trend: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
        {icon}
      </div>
      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400 font-bold mb-1 italic">{label}</p>
      <h4 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">{value}</h4>
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{trend}</span>
      </div>
    </div>
  );
}
