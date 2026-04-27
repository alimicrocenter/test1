import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  MoreVertical,
  History,
  TrendingDown
} from 'lucide-react';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Part } from '../types';
import { formatCurrency, cn } from '../lib/utils';

import { useAuth } from '../context/AuthContext';

export default function Inventory() {
  const [parts, setParts] = useState<Part[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    // Personal supply tracking
    const unsubscribe = onSnapshot(query(collection(db, 'inventory'), where('ownerId', '==', user.uid), orderBy('name')), (snapshot) => {
      setParts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Part)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'inventory');
    });
    return () => unsubscribe();
  }, [user]);

  const filteredParts = parts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight italic font-serif">Garage Supplies</h2>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-slate-400 italic">Track spare parts, tools, and consumables</p>
        </div>
        <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-xl hover:scale-[1.02] transition-all">
          <Plus size={18} /> Add Supply
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <InventoryStat label="Total Items" value={parts.length.toString()} icon={<Package size={20} />} />
         <InventoryStat label="Running Low" value={parts.filter(p => p.quantity <= p.minStockLevel).length.toString()} icon={<AlertCircle size={20} />} variant="warning" />
         <InventoryStat label="Total Value" value={formatCurrency(parts.reduce((acc, p) => acc + (p.quantity * p.unitCost), 0))} icon={<TrendingDown size={20} />} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center gap-4">
             <div className="flex-1 flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 transition-all focus-within:ring-2 focus-within:ring-slate-900">
                <Search size={16} className="text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Filter supplies..." 
                  className="bg-transparent border-none focus:ring-0 text-xs font-bold w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <Filter size={16} className="text-slate-600" />
             </button>
          </div>

          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50">
                   <tr>
                      <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold italic">Item / Info</th>
                      <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold italic">Category</th>
                      <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold italic text-center">Status</th>
                      <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold italic text-right">Qty</th>
                      <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold italic text-right">Cost</th>
                      <th className="px-6 py-4"></th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {filteredParts.map((part) => (
                      <tr key={part.id} className="hover:bg-slate-50/50 transition-colors group">
                         <td className="px-6 py-4">
                            <p className="text-xs font-mono font-bold text-slate-400 mb-0.5">{part.sku}</p>
                            <p className="text-sm font-bold text-slate-900">{part.name}</p>
                         </td>
                         <td className="px-6 py-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                               {part.category}
                            </span>
                         </td>
                         <td className="px-6 py-4 text-center">
                            {part.quantity <= part.minStockLevel ? (
                               <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                                  <AlertCircle size={12} /> Low
                               </span>
                            ) : (
                               <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                  Stocked
                               </span>
                            )}
                         </td>
                         <td className="px-6 py-4 text-right">
                            <p className={cn(
                               "text-sm font-bold font-mono",
                               part.quantity <= part.minStockLevel ? "text-amber-600" : "text-slate-900"
                            )}>
                               {part.quantity}
                            </p>
                         </td>
                         <td className="px-6 py-4 text-right">
                            <p className="text-sm font-bold italic font-serif">{formatCurrency(part.unitCost)}</p>
                         </td>
                         <td className="px-6 py-4 text-right">
                            <button className="p-1 text-slate-400 hover:text-slate-900 transition-colors">
                               <MoreVertical size={16} />
                            </button>
                         </td>
                      </tr>
                   ))}
                   {filteredParts.length === 0 && (
                      <tr>
                         <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                            <History size={32} className="mx-auto mb-2 opacity-20" />
                            <p className="text-[10px] font-mono uppercase tracking-widest font-bold italic">No matching supplies found</p>
                         </td>
                      </tr>
                   )}
                </tbody>
             </table>
          </div>
      </div>
    </div>
  );
}

function InventoryStat({ label, value, icon, variant = 'default' }: { label: string, value: string, icon: React.ReactNode, variant?: 'default' | 'warning' }) {
  return (
    <div className={cn(
      "p-6 rounded-2xl border transition-all shadow-sm",
      variant === 'warning' ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"
    )}>
       <div className={cn(
          "p-2 rounded-lg inline-block mb-3",
          variant === 'warning' ? "bg-amber-200 text-amber-700" : "bg-slate-100 text-slate-600"
       )}>
          {icon}
       </div>
       <p className="text-[10px] font-mono uppercase tracking-widest font-bold text-slate-400 mb-1 italic">{label}</p>
       <h4 className="text-2xl font-bold italic font-serif text-slate-900">{value}</h4>
    </div>
  );
}
