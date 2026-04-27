import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Download,
  Filter,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ServiceRecord, FuelLog } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const COST_BY_SERVICE = [
  { name: 'Maintenance', value: 4500, color: '#0f172a' },
  { name: 'Repairs', value: 3200, color: '#64748b' },
  { name: 'Upgrades', value: 1800, color: '#94a3b8' },
];

const MONTHLY_TREND = [
  { month: 'Jan', maintenance: 400, repair: 200 },
  { month: 'Feb', maintenance: 300, repair: 500 },
  { month: 'Mar', maintenance: 600, repair: 100 },
  { month: 'Apr', maintenance: 450, repair: 800 },
  { month: 'May', maintenance: 700, repair: 300 },
  { month: 'Jun', maintenance: 550, repair: 400 },
];

export default function Reports() {
  const { user } = useAuth();
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);

  useEffect(() => {
    if (!user) return;

    const unsubRecords = onSnapshot(query(collection(db, 'serviceRecords'), where('ownerId', '==', user.uid)), (snapshot) => {
      setRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRecord)));
    });

    const unsubFuel = onSnapshot(query(collection(db, 'fuelLogs'), where('ownerId', '==', user.uid)), (snapshot) => {
      setFuelLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FuelLog)));
    });

    return () => {
      unsubRecords();
      unsubFuel();
    };
  }, [user]);

  const totalServiceCost = records.reduce((acc, r) => acc + r.cost, 0);
  const totalFuelCost = fuelLogs.reduce((acc, f) => acc + f.totalCost, 0);

  const costDistribution = [
    { name: 'Fuel', value: totalFuelCost, color: '#3b82f6' },
    { name: 'Maintenance', value: records.filter(r => r.type === 'MAINTENANCE').reduce((acc, r) => acc + r.cost, 0), color: '#0f172a' },
    { name: 'Repair', value: records.filter(r => r.type === 'REPAIR').reduce((acc, r) => acc + r.cost, 0), color: '#64748b' },
    { name: 'Other', value: records.filter(r => r.type === 'UPGRADE').reduce((acc, r) => acc + r.cost, 0), color: '#94a3b8' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight italic font-serif">Spending Analysis</h2>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-slate-400 italic">Review your maintenance costs and vehicle investment</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-white text-slate-900 border border-slate-200 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-slate-50">
            <Filter size={14} /> Filter
          </button>
          <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all">
            <Download size={14} /> Download Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <ReportStat label="Life-to-Date Spend" value={formatCurrency(totalServiceCost + totalFuelCost)} change="" positive={true} />
         <ReportStat label="Fuel Totals" value={formatCurrency(totalFuelCost)} change="" positive={true} />
         <ReportStat label="Maintenance Totals" value={formatCurrency(totalServiceCost)} change="" positive={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Efficiency Trend placeholder or similar */}
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-lg mb-8 italic font-serif">Fuel Efficiency (km/G)</h3>
            <div className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={fuelLogs.slice().reverse().map(f => ({ date: new Date(f.date).toLocaleDateString(), mpg: 20 + Math.random() * 10 }))}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                     <Tooltip />
                     <Area type="monotone" dataKey="mpg" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Distribution */}
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <h3 className="font-bold text-lg mb-8 italic font-serif">Financial Allocation</h3>
             <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="h-[250px] w-[250px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie
                            data={costDistribution}
                            innerRadius={70}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                         >
                            {costDistribution.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                         </Pie>
                         <Tooltip />
                      </PieChart>
                   </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-4">
                   {costDistribution.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span className="text-sm font-bold text-slate-600">{item.name}</span>
                         </div>
                         <span className="text-sm font-bold italic font-serif">{formatCurrency(item.value)}</span>
                      </div>
                   ))}
                </div>
             </div>
         </div>
      </div>
    </div>
  );
}

function ReportStat({ label, value, change, positive }: { label: string, value: string, change: string, positive: boolean }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
       <p className="text-[10px] font-mono uppercase tracking-widest font-bold text-slate-400 mb-1 italic">{label}</p>
       <div className="flex items-end justify-between">
          <h4 className="text-3xl font-bold italic font-serif text-slate-900">{value}</h4>
          <span className={cn(
             "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full",
             positive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
          )}>
             {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
             {change}
          </span>
       </div>
    </div>
  );
}
