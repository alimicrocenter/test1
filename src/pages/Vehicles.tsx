import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  ChevronRight, 
  Car as CarIcon, 
  Calendar, 
  Navigation,
  Hash,
  Shield,
  Clock,
  Wrench,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Fuel,
  FileText,
  Droplets,
  DollarSign,
  Check
} from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, getDoc, orderBy } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Vehicle, ServiceRecord, Reminder, FuelLog, VehicleDocument } from '../types';
import { decodeVIN } from '../services/vinService';
import { cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export default function Vehicles() {
  return (
    <Routes>
      <Route path="/" element={<VehicleList />} />
      <Route path="/new" element={<AddVehicle />} />
      <Route path="/:id" element={<VehicleDetail />} />
    </Routes>
  );
}

function VehicleList() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const { user, profile } = useAuth();

  useEffect(() => {
    if (!user || !profile) return;

    const q = query(collection(db, 'vehicles'), where('ownerId', '==', user.uid), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setVehicles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'vehicles');
    });
    return () => unsubscribe();
  }, [user, profile]);

  const filteredVehicles = vehicles.filter(v => 
    v.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.plateNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight italic font-serif">My Garage</h2>
        <Link to="/vehicles/new" className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-xl hover:scale-[1.02] transition-all">
          <Plus size={18} /> Add Vehicle
        </Link>
      </div>

      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <Search size={20} className="text-slate-400 ml-2" />
        <input 
          type="text" 
          placeholder="Search by make, model, or plate..." 
          className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
          <Filter size={18} />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="animate-spin text-slate-300" size={40} />
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-slate-400">Loading Registry...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle) => (
            <Link key={vehicle.id} to={`/vehicles/${vehicle.id}`}>
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all group"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    <CarIcon size={24} />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-slate-400 italic">Plate</span>
                    <p className="font-bold text-slate-900 leading-none">{vehicle.plateNumber || 'N/A'}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">{vehicle.make}</p>
                  <h3 className="text-2xl font-bold tracking-tight italic font-serif">{vehicle.model} <span className="text-slate-400 text-lg not-italic font-sans font-normal">({vehicle.year})</span></h3>
                </div>

                <div className="flex items-center gap-4 py-4 border-t border-slate-50">
                   <div className="flex-1">
                     <p className="text-[10px] font-mono uppercase tracking-widest font-bold text-slate-400 mb-0.5">Mileage</p>
                     <p className="text-sm font-bold tracking-tight">{vehicle.currentMileage.toLocaleString()} km</p>
                   </div>
                   <div className="h-4 w-px bg-slate-100"></div>
                   <div className="flex-1">
                     <p className="text-[10px] font-mono uppercase tracking-widest font-bold text-slate-400 mb-0.5">Status</p>
                     <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                       Operational
                     </span>
                   </div>
                </div>
              </motion.div>
            </Link>
          ))}
          
          {filteredVehicles.length === 0 && (
            <div className="col-span-full py-24 bg-white border border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-400">
               <CarIcon size={48} className="opacity-20 mb-4" />
               <p className="text-sm font-mono uppercase tracking-widest font-bold">No vehicles registered</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AddVehicle() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [vin, setVin] = useState('');
  const [decoding, setDecoding] = useState(false);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    plateNumber: '',
    currentMileage: 0
  });

  const handleVinDecode = async () => {
    if (vin.length !== 17) return;
    setDecoding(true);
    const data = await decodeVIN(vin);
    if (data) {
      setFormData(prev => ({ ...prev, ...data }));
    }
    setDecoding(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      const vehicleData = JSON.parse(JSON.stringify({
        ...formData,
        vin,
        ownerId: profile.uid,
        createdAt: new Date().toISOString()
      }));
      await addDoc(collection(db, 'vehicles'), vehicleData);
      navigate('/vehicles');
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-3xl font-bold tracking-tight italic font-serif">Add New Vehicle</h2>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-slate-400 mb-2 italic">VIN Decoder (Automatic)</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={vin}
                onChange={(e) => setVin(e.target.value.toUpperCase())}
                placeholder="17-CHARACTER VIN..." 
                className="flex-1 bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-mono text-sm focus:ring-2 focus:ring-slate-900 transition-all uppercase"
                maxLength={17}
              />
              <button 
                type="button"
                onClick={handleVinDecode}
                disabled={decoding || vin.length !== 17}
                className="bg-slate-900 text-white px-6 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                {decoding ? '...' : 'Decode'}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-mono uppercase tracking-widest font-bold text-slate-400 italic">Make</label>
              <input 
                type="text" 
                value={formData.make}
                onChange={(e) => setFormData({...formData, make: e.target.value})}
                required
                className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-mono uppercase tracking-widest font-bold text-slate-400 italic">Model</label>
              <input 
                type="text" 
                value={formData.model}
                onChange={(e) => setFormData({...formData, model: e.target.value})}
                required
                className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
             <div className="space-y-2">
                <label className="block text-[10px] font-mono uppercase tracking-widest font-bold text-slate-400 italic">Year</label>
                <input 
                  type="number" 
                  value={formData.year}
                  onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                  className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-bold text-sm"
                />
             </div>
             <div className="space-y-2">
                <label className="block text-[10px] font-mono uppercase tracking-widest font-bold text-slate-400 italic">Plate Number</label>
                <input 
                  type="text" 
                  value={formData.plateNumber}
                  onChange={(e) => setFormData({...formData, plateNumber: e.target.value})}
                  className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-bold text-sm"
                />
             </div>
             <div className="space-y-2">
                <label className="block text-[10px] font-mono uppercase tracking-widest font-bold text-slate-400 italic">Current Km</label>
                <input 
                  type="number" 
                  value={formData.currentMileage}
                  onChange={(e) => setFormData({...formData, currentMileage: parseInt(e.target.value)})}
                  className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-bold text-sm"
                />
             </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold tracking-widest uppercase text-sm hover:scale-[1.01] transition-all shadow-xl active:scale-95 mt-4"
          >
            Add to My Garage
          </button>
        </form>
      </div>
    </div>
  );
}

function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [activeTab, setActiveTab] = useState<'history' | 'specs' | 'reminders' | 'fuel' | 'docs'>('history');
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [isSchedulingReminder, setIsSchedulingReminder] = useState(false);
  const [isLoggingFuel, setIsLoggingFuel] = useState(false);
  const [isAddingDoc, setIsAddingDoc] = useState(false);

  const [newRecord, setNewRecord] = useState({
    type: 'MAINTENANCE' as const,
    description: '',
    date: new Date().toISOString().split('T')[0],
    mileage: 0,
    cost: 0,
    notes: ''
  });
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    type: 'MAINTENANCE' as any,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dueMileage: undefined as number | undefined,
    status: 'PENDING' as const,
    isRepeatable: false,
    repeatMileage: 5000,
    repeatMonths: 6
  });
  const [newFuelLog, setNewFuelLog] = useState({
    date: new Date().toISOString().split('T')[0],
    mileage: 0,
    gallons: 0,
    pricePerGallon: 0,
    totalCost: 0,
    isFullTank: true,
    notes: ''
  });
  const [newDoc, setNewDoc] = useState({
    title: '',
    type: 'INSURANCE' as const,
    expiryDate: '',
    fileURL: ''
  });

  const { user, profile } = useAuth();

  const handleAddFuelLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user || !vehicle) return;

    try {
      const fuelLogData = JSON.parse(JSON.stringify({
        ...newFuelLog,
        vehicleId: id,
        ownerId: vehicle.ownerId,
        createdAt: new Date().toISOString()
      }));
      await addDoc(collection(db, 'fuelLogs'), fuelLogData);
      setIsLoggingFuel(false);
      setNewFuelLog({
        date: new Date().toISOString().split('T')[0],
        mileage: vehicle?.currentMileage || 0,
        gallons: 0,
        pricePerGallon: 0,
        totalCost: 0,
        isFullTank: true,
        notes: ''
      });
    } catch (err) {
      console.error("Fuel log error:", err);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user || !vehicle) return;

    try {
      const docData = JSON.parse(JSON.stringify({
        ...newDoc,
        vehicleId: id,
        ownerId: vehicle.ownerId,
        createdAt: new Date().toISOString()
      }));
      await addDoc(collection(db, 'documents'), docData);
      setIsAddingDoc(false);
      setNewDoc({
        title: '',
        type: 'INSURANCE',
        expiryDate: '',
        fileURL: ''
      });
    } catch (err) {
      console.error("Add document error:", err);
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user || !vehicle) return;

    try {
      const recordData = JSON.parse(JSON.stringify({
        ...newRecord,
        vehicleId: id,
        ownerId: vehicle.ownerId, // Master source of truth
        createdAt: new Date().toISOString()
      }));
      await addDoc(collection(db, 'serviceRecords'), recordData);
      setIsAddingRecord(false);
      setNewRecord({
        type: 'MAINTENANCE',
        description: '',
        date: new Date().toISOString().split('T')[0],
        mileage: vehicle?.currentMileage || 0,
        cost: 0,
        notes: ''
      });
    } catch (err) {
      console.error("Save record error:", err);
    }
  };

  const handleScheduleReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user || !vehicle) return;

    try {
      const reminderData = JSON.parse(JSON.stringify({
        ...newReminder,
        vehicleId: id,
        ownerId: vehicle.ownerId,
        createdAt: new Date().toISOString()
      }));

      await addDoc(collection(db, 'reminders'), reminderData);
      setIsSchedulingReminder(false);
      setNewReminder({
        title: '',
        description: '',
        type: 'MAINTENANCE' as any,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dueMileage: undefined,
        status: 'PENDING',
        isRepeatable: false,
        repeatMileage: 5000,
        repeatMonths: 6
      });
    } catch (err) {
      console.error("Schedule reminder error:", err);
    }
  };

  const handleCompleteReminder = async (reminder: Reminder) => {
    if (!id || !user || !vehicle) return;

    try {
      const reminderRef = doc(db, 'reminders', reminder.id);
      await updateDoc(reminderRef, {
        status: 'COMPLETED',
        lastCompletedDate: new Date().toISOString(),
        lastCompletedMileage: vehicle.currentMileage,
        updatedAt: new Date().toISOString()
      });

      if (reminder.isRepeatable) {
        // Create next reminder
        const nextDate = new Date();
        if (reminder.repeatMonths) {
          nextDate.setMonth(nextDate.getMonth() + reminder.repeatMonths);
        } else {
          nextDate.setMonth(nextDate.getMonth() + 6); // default 6 months
        }

        const nextReminderData = JSON.parse(JSON.stringify({
          ...reminder,
          id: undefined, // ensure it's removed for new doc
          status: 'PENDING',
          dueDate: nextDate.toISOString().split('T')[0],
          dueMileage: reminder.repeatMileage ? vehicle.currentMileage + reminder.repeatMileage : undefined,
          createdAt: new Date().toISOString()
        }));

        // Remove the id field completely
        delete nextReminderData.id;

        await addDoc(collection(db, 'reminders'), nextReminderData);
      }
    } catch (err) {
      console.error("Complete reminder error:", err);
    }
  };

  const calculateReminderPriority = (reminder: Reminder) => {
    if (reminder.status === 'COMPLETED') return 0;
    
    let mileagePct = 100;
    if (reminder.dueMileage) {
      const remaining = reminder.dueMileage - vehicle.currentMileage;
      mileagePct = Math.max(0, Math.min(100, (remaining / (reminder.repeatMileage || 5000)) * 100));
    }

    let datePct = 100;
    if (reminder.dueDate) {
      const due = new Date(reminder.dueDate).getTime();
      const now = Date.now();
      const diffDays = (due - now) / (1000 * 60 * 60 * 24);
      datePct = Math.max(0, Math.min(100, (diffDays / ( (reminder.repeatMonths || 6) * 30 )) * 100));
    }

    return Math.min(mileagePct, datePct);
  };

  useEffect(() => {
    if (!id || !user || !profile) return;
    const unsubVehicle = onSnapshot(doc(db, 'vehicles', id), (doc) => {
      if (doc.exists()) setVehicle({ id: doc.id, ...doc.data() } as Vehicle);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `vehicles/${id}`);
    });
    
    // Records Subscription
    const recordsQ = query(collection(db, 'serviceRecords'), where('vehicleId', '==', id), where('ownerId', '==', user.uid), orderBy('date', 'desc'));

    const unsubRecords = onSnapshot(recordsQ, (snapshot) => {
      setRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRecord)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'serviceRecords');
    });

    // Reminders Subscription
    const remindersQ = query(collection(db, 'reminders'), where('vehicleId', '==', id), where('ownerId', '==', user.uid), orderBy('dueDate', 'asc'));

    const unsubReminders = onSnapshot(remindersQ, (snapshot) => {
      setReminders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reminder)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reminders');
    });

    // Fuel Logs Subscription
    const fuelQ = query(collection(db, 'fuelLogs'), where('vehicleId', '==', id), where('ownerId', '==', user.uid), orderBy('date', 'desc'));
    const unsubFuel = onSnapshot(fuelQ, (snapshot) => {
      setFuelLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FuelLog)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'fuelLogs');
    });

    // Documents Subscription
    const docsQ = query(collection(db, 'documents'), where('vehicleId', '==', id), where('ownerId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubDocs = onSnapshot(docsQ, (snapshot) => {
      setDocuments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VehicleDocument)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'documents');
    });

    return () => {
      unsubVehicle();
      unsubRecords();
      unsubReminders();
      unsubFuel();
      unsubDocs();
    };
  }, [id, user, profile]);

  if (!vehicle) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/vehicles')} className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <p className="text-[10px] font-mono uppercase tracking-widest font-bold text-slate-400 italic leading-none mb-1">{vehicle.make} Registry</p>
          <h2 className="text-3xl font-bold tracking-tight italic font-serif">{vehicle.model}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
             <div className="aspect-video bg-slate-900 rounded-xl flex items-center justify-center text-white relative overflow-hidden">
                <CarIcon size={64} className="opacity-20" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1)_0%,transparent_70%)]"></div>
                <div className="absolute bottom-4 left-4">
                   <span className="text-[10px] font-mono uppercase tracking-widest font-bold opacity-60">Status</span>
                   <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Stable Condition</p>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl">
                   <p className="text-[10px] font-mono uppercase tracking-widest font-bold text-slate-400 mb-1">Mileage</p>
                   <p className="text-sm font-bold">{vehicle.currentMileage.toLocaleString()} km</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                   <p className="text-[10px] font-mono uppercase tracking-widest font-bold text-slate-400 mb-1">Year</p>
                   <p className="text-sm font-bold">{vehicle.year}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                   <p className="text-[10px] font-mono uppercase tracking-widest font-bold text-slate-400 mb-1">Plate</p>
                   <p className="text-sm font-bold">{vehicle.plateNumber}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                   <p className="text-[10px] font-mono uppercase tracking-widest font-bold text-slate-400 mb-1">VIN</p>
                   <p className="text-[10px] font-mono font-bold truncate">{vehicle.vin}</p>
                </div>
             </div>

             <div className="border-t border-slate-100 pt-6 space-y-4">
                <h4 className="text-[10px] font-mono uppercase tracking-widest font-bold text-slate-400 italic">Operating Efficiency</h4>
                <div className="space-y-3">
                   <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-600">Total Lifetime Spend</p>
                      <p className="text-sm font-bold font-serif italic">${(records.reduce((acc, r) => acc + r.cost, 0) + fuelLogs.reduce((acc, f) => acc + f.totalCost, 0)).toLocaleString()}</p>
                   </div>
                   <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-600">Avg Cost / Day</p>
                      <p className="text-sm font-bold font-serif italic">${((records.reduce((acc, r) => acc + r.cost, 0) + fuelLogs.reduce((acc, f) => acc + f.totalCost, 0)) / Math.max(1, (Date.now() - new Date(vehicle.createdAt).getTime()) / (1000 * 60 * 60 * 24))).toFixed(2)}</p>
                   </div>
                   <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-600">Fuel Efficiency</p>
                      <p className="text-sm font-bold font-serif italic">
                         {fuelLogs.length > 1 ? (
                            `${( (fuelLogs[0].mileage - fuelLogs[fuelLogs.length - 1].mileage) / fuelLogs.reduce((acc, f) => acc + f.gallons, 0) ).toFixed(1)} km/G`
                         ) : '---'}
                      </p>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
             <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} label="History" count={records.length} />
             <TabButton active={activeTab === 'fuel'} onClick={() => setActiveTab('fuel')} label="Fuel" count={fuelLogs.length} />
             <TabButton active={activeTab === 'reminders'} onClick={() => setActiveTab('reminders')} label="Reminders" count={reminders.length} />
             <TabButton active={activeTab === 'docs'} onClick={() => setActiveTab('docs')} label="Docs" count={documents.length} />
             <TabButton active={activeTab === 'specs'} onClick={() => setActiveTab('specs')} label="Info" />
          </div>

          <div className="bg-white min-h-[400px] rounded-2xl border border-slate-200 shadow-sm p-6">
             <AnimatePresence mode="wait">
                {activeTab === 'history' && (
                  <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                     <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-lg italic font-serif">Service Log</h3>
                        <button 
                          onClick={() => {
                            setNewRecord(prev => ({ ...prev, mileage: vehicle.currentMileage }));
                            setIsAddingRecord(true);
                          }}
                          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-slate-900 text-white px-3 py-1.5 rounded-lg active:scale-95 transition-all"
                        >
                           <Plus size={14} /> New Record
                        </button>
                      </div>

                      {isAddingRecord && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8"
                        >
                           <div className="flex items-center justify-between mb-6">
                              <h4 className="font-bold uppercase tracking-widest text-xs italic">Capture New Service Event</h4>
                              <button onClick={() => setIsAddingRecord(false)} className="text-slate-400 hover:text-slate-900">
                                 <AlertCircle size={16} />
                              </button>
                           </div>
                           <form onSubmit={handleAddRecord} className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                 <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Type</label>
                                 <select 
                                   value={newRecord.type}
                                   onChange={(e) => setNewRecord({...newRecord, type: e.target.value as any})}
                                   className="w-full bg-white border-slate-200 rounded-lg text-xs font-bold p-2"
                                 >
                                    <option value="MAINTENANCE">Maintenance</option>
                                    <option value="REPAIR">Repair</option>
                                    <option value="UPGRADE">Upgrade</option>
                                 </select>
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Description</label>
                                 <input 
                                   type="text" 
                                   required
                                   value={newRecord.description}
                                   onChange={(e) => setNewRecord({...newRecord, description: e.target.value})}
                                   className="w-full bg-white border-slate-200 rounded-lg text-xs font-bold p-2"
                                   placeholder="Oil Change, Tire Rotation..."
                                 />
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Date</label>
                                 <input 
                                   type="date" 
                                   required
                                   value={newRecord.date}
                                   onChange={(e) => setNewRecord({...newRecord, date: e.target.value})}
                                   className="w-full bg-white border-slate-200 rounded-lg text-xs font-bold p-2"
                                 />
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Mileage (km)</label>
                                 <input 
                                   type="number" 
                                   required
                                   value={newRecord.mileage || ''}
                                   onChange={(e) => setNewRecord({...newRecord, mileage: e.target.value === '' ? 0 : parseInt(e.target.value)})}
                                   className="w-full bg-white border-slate-200 rounded-lg text-xs font-bold p-2"
                                 />
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Cost ($)</label>
                                 <input 
                                   type="number" 
                                   required
                                   value={newRecord.cost || ''}
                                   onChange={(e) => setNewRecord({...newRecord, cost: e.target.value === '' ? 0 : parseInt(e.target.value)})}
                                   className="w-full bg-white border-slate-200 rounded-lg text-xs font-bold p-2"
                                 />
                              </div>
                              <div className="col-span-2 space-y-1">
                                 <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Notes</label>
                                 <textarea 
                                   value={newRecord.notes}
                                   onChange={(e) => setNewRecord({...newRecord, notes: e.target.value})}
                                   className="w-full bg-white border-slate-200 rounded-lg text-xs font-bold p-2"
                                   rows={2}
                                 />
                              </div>
                              <div className="col-span-2 pt-2">
                                 <button type="submit" className="w-full bg-slate-900 text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-lg">Save Record</button>
                              </div>
                           </form>
                        </motion.div>
                      )}
                     
                     <div className="space-y-4">
                        {records.map((record) => (
                          <div key={record.id} className="flex gap-6 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors group">
                             <div className="text-center min-w-[60px]">
                                <p className="text-[10px] font-mono uppercase tracking-widest font-bold text-slate-400">{new Date(record.date).toLocaleDateString('en-US', { month: 'short' })}</p>
                                <p className="text-2xl font-bold tracking-tighter leading-none italic font-serif">{new Date(record.date).getDate()}</p>
                                <p className="text-[10px] font-mono uppercase tracking-widest font-bold text-slate-300">{new Date(record.date).getFullYear()}</p>
                             </div>
                             <div className="flex-1">
                                <span className={cn(
                                   "inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest mb-2",
                                   record.type === 'MAINTENANCE' ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                                )}>
                                   {record.type}
                                </span>
                                <h4 className="font-bold text-slate-900 mb-1">{record.description}</h4>
                                <p className="text-sm text-slate-500 line-clamp-2">{record.notes}</p>
                             </div>
                             <div className="text-right">
                                <p className="text-lg font-bold italic font-serif mb-1">${record.cost}</p>
                                <p className="text-[10px] font-mono uppercase tracking-widest font-bold text-slate-400">{record.mileage.toLocaleString()} km</p>
                             </div>
                          </div>
                        ))}
                        {records.length === 0 && (
                          <div className="py-24 text-center">
                             <Wrench size={40} className="mx-auto text-slate-200 mb-4" />
                             <p className="text-xs font-mono uppercase tracking-widest font-bold text-slate-400 italic">No historical records found for this unit</p>
                          </div>
                        )}
                     </div>
                  </motion.div>
                )}
                 {activeTab === 'fuel' && (
                   <motion.div key="fuel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div className="flex items-center justify-between mb-6">
                         <h3 className="font-bold text-lg italic font-serif">Refueling Tracker</h3>
                         <button 
                           onClick={() => {
                             setNewFuelLog(prev => ({ ...prev, mileage: vehicle.currentMileage }));
                             setIsLoggingFuel(true);
                           }}
                           className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-slate-900 text-white px-3 py-1.5 rounded-lg active:scale-95 transition-all"
                         >
                            <Fuel size={14} /> Log Fuel
                         </button>
                      </div>

                      {isLoggingFuel && (
                         <motion.div 
                           initial={{ opacity: 0, scale: 0.95 }}
                           animate={{ opacity: 1, scale: 1 }}
                           className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8"
                         >
                            <form onSubmit={handleAddFuelLog} className="grid grid-cols-2 gap-4">
                               <div className="space-y-1">
                                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Date</label>
                                  <input 
                                    type="date" 
                                    required
                                    value={newFuelLog.date}
                                    onChange={(e) => setNewFuelLog({...newFuelLog, date: e.target.value})}
                                    className="w-full bg-white border-slate-200 rounded-lg text-xs font-bold p-2"
                                  />
                               </div>
                               <div className="space-y-1">
                                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Mileage (km)</label>
                                  <input 
                                    type="number" 
                                    required
                                    value={newFuelLog.mileage || ''}
                                    onChange={(e) => setNewFuelLog({...newFuelLog, mileage: parseInt(e.target.value) || 0})}
                                    className="w-full bg-white border-slate-200 rounded-lg text-xs font-bold p-2"
                                  />
                               </div>
                               <div className="space-y-1">
                                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Gallons</label>
                                  <input 
                                    type="number" 
                                    step="0.001"
                                    required
                                    value={newFuelLog.gallons || ''}
                                    onChange={(e) => setNewFuelLog({...newFuelLog, gallons: parseFloat(e.target.value) || 0})}
                                    className="w-full bg-white border-slate-200 rounded-lg text-xs font-bold p-2"
                                  />
                               </div>
                               <div className="space-y-1">
                                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Total Cost ($)</label>
                                  <input 
                                    type="number" 
                                    step="0.01"
                                    required
                                    value={newFuelLog.totalCost || ''}
                                    onChange={(e) => setNewFuelLog({...newFuelLog, totalCost: parseFloat(e.target.value) || 0})}
                                    className="w-full bg-white border-slate-200 rounded-lg text-xs font-bold p-2"
                                  />
                               </div>
                               <div className="col-span-2 pt-2">
                                  <div className="flex gap-2">
                                    <button type="submit" className="flex-1 bg-slate-900 text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-lg">Save Log</button>
                                    <button type="button" onClick={() => setIsLoggingFuel(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-[10px] font-bold uppercase">Cancel</button>
                                  </div>
                               </div>
                            </form>
                         </motion.div>
                      )}

                      <div className="space-y-3">
                         {fuelLogs.map(log => (
                            <div key={log.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                               <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                  <Droplets size={18} />
                               </div>
                               <div className="flex-1">
                                  <p className="text-sm font-bold text-slate-900">{log.gallons} Gallons</p>
                                  <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">{new Date(log.date).toLocaleDateString()}</p>
                               </div>
                               <div className="text-right">
                                  <p className="text-sm font-bold text-slate-900">${log.totalCost}</p>
                                  <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">{log.mileage.toLocaleString()} km</p>
                               </div>
                            </div>
                         ))}
                         {fuelLogs.length === 0 && (
                            <div className="py-24 text-center">
                               <Fuel size={40} className="mx-auto text-slate-200 mb-4" />
                               <p className="text-xs font-mono uppercase tracking-widest font-bold text-slate-400 italic">No fuel logs recorded</p>
                            </div>
                         )}
                      </div>
                   </motion.div>
                 )}

                 {activeTab === 'docs' && (
                   <motion.div key="docs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div className="flex items-center justify-between mb-6">
                         <h3 className="font-bold text-lg italic font-serif">Vehicle Documents</h3>
                         <button 
                           onClick={() => setIsAddingDoc(true)}
                           className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-slate-900 text-white px-3 py-1.5 rounded-lg active:scale-95 transition-all"
                         >
                            <Plus size={14} /> Add Document
                         </button>
                      </div>

                      {isAddingDoc && (
                         <motion.div 
                           initial={{ opacity: 0, scale: 0.95 }}
                           animate={{ opacity: 1, scale: 1 }}
                           className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8"
                         >
                            <form onSubmit={handleAddDocument} className="space-y-4">
                               <div className="space-y-1">
                                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Title</label>
                                  <input 
                                    type="text" 
                                    required
                                    value={newDoc.title}
                                    onChange={(e) => setNewDoc({...newDoc, title: e.target.value})}
                                    className="w-full bg-white border-slate-200 rounded-lg text-xs font-bold p-2"
                                    placeholder="Insurance Policy, Registration..."
                                  />
                               </div>
                               <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-1">
                                     <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Type</label>
                                     <select 
                                       value={newDoc.type}
                                       onChange={(e) => setNewDoc({...newDoc, type: e.target.value as any})}
                                       className="w-full bg-white border-slate-200 rounded-lg text-xs font-bold p-2"
                                     >
                                        <option value="INSURANCE">Insurance</option>
                                        <option value="REGISTRATION">Registration</option>
                                        <option value="OTHER">Other</option>
                                     </select>
                                 </div>
                                 <div className="space-y-1">
                                     <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Expiry Date</label>
                                     <input 
                                       type="date" 
                                       value={newDoc.expiryDate}
                                       onChange={(e) => setNewDoc({...newDoc, expiryDate: e.target.value})}
                                       className="w-full bg-white border-slate-200 rounded-lg text-xs font-bold p-2"
                                     />
                                 </div>
                               </div>
                               <button type="submit" className="w-full bg-slate-900 text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-lg">Save Document</button>
                            </form>
                         </motion.div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {documents.map(doc => (
                            <div key={doc.id} className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex items-start gap-4">
                               <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                                  <FileText size={18} />
                               </div>
                               <div className="flex-1">
                                  <h4 className="text-sm font-bold text-slate-900">{doc.title}</h4>
                                  <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">{doc.type}</p>
                                  {doc.expiryDate && (
                                     <p className="text-[10px] text-red-500 font-bold mt-2">Expires: {new Date(doc.expiryDate).toLocaleDateString()}</p>
                                  )}
                               </div>
                            </div>
                         ))}
                         {documents.length === 0 && (
                            <div className="col-span-full py-24 text-center">
                               <FileText size={40} className="mx-auto text-slate-200 mb-4" />
                               <p className="text-xs font-mono uppercase tracking-widest font-bold text-slate-400 italic">No documents found</p>
                            </div>
                         )}
                      </div>
                   </motion.div>
                 )}
                  {activeTab === 'specs' && (
                  <motion.div key="specs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                     <h3 className="font-bold text-lg italic font-serif mb-6">Vehicle Details</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SpecItem label="Manufacturer" value={vehicle.make} />
                        <SpecItem label="Model" value={vehicle.model} />
                        <SpecItem label="Year" value={vehicle.year.toString()} />
                        <SpecItem label="VIN" value={vehicle.vin} />
                        <SpecItem label="Current Odometer" value={`${vehicle.currentMileage.toLocaleString()} km`} />
                        <SpecItem label="Status" value="Active" />
                     </div>
                  </motion.div>
                )}

                {activeTab === 'reminders' && (
                  <motion.div key="reminders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                     <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-lg italic font-serif">Proactive Alerts</h3>
                        <button 
                          onClick={() => setIsSchedulingReminder(true)}
                          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-slate-100 text-slate-900 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
                        >
                           <Plus size={14} /> Schedule
                        </button>
                      </div>
                      
                      {isSchedulingReminder && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8"
                        >
                           <div className="flex items-center justify-between mb-6">
                              <h4 className="font-bold uppercase tracking-widest text-xs italic">Schedule New Alert</h4>
                              <button onClick={() => setIsSchedulingReminder(false)} className="text-slate-400 hover:text-slate-900">
                                 <AlertCircle size={16} />
                              </button>
                           </div>
                           <form onSubmit={handleScheduleReminder} className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                   <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Title</label>
                                   <input 
                                     type="text" 
                                     required
                                     value={newReminder.title}
                                     onChange={(e) => setNewReminder({...newReminder, title: e.target.value})}
                                     className="w-full bg-white border-slate-200 rounded-lg text-xs font-bold p-2"
                                     placeholder="Brake Inspection..."
                                   />
                                </div>
                                <div className="space-y-1">
                                   <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Type</label>
                                   <select 
                                     value={newReminder.type}
                                     onChange={(e) => setNewReminder({...newReminder, type: e.target.value as any})}
                                     className="w-full bg-white border-slate-200 rounded-lg text-xs font-bold p-2"
                                   >
                                      <option value="OIL_CHANGE">Oil Change</option>
                                      <option value="TIRE_ROTATION">Tire Rotation</option>
                                      <option value="INSPECTION">Inspection</option>
                                      <option value="REGISTRATION">Registration</option>
                                      <option value="INSURANCE">Insurance</option>
                                      <option value="MAINTENANCE">General Maintenance</option>
                                   </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Due Date</label>
                                    <input 
                                      type="date" 
                                      required
                                      value={newReminder.dueDate}
                                      onChange={(e) => setNewReminder({...newReminder, dueDate: e.target.value})}
                                      className="w-full bg-white border-slate-200 rounded-lg text-xs font-bold p-2"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Due Mileage (km)</label>
                                    <input 
                                      type="number" 
                                      value={newReminder.dueMileage || ''}
                                      onChange={(e) => setNewReminder({...newReminder, dueMileage: e.target.value === '' ? undefined : parseInt(e.target.value)})}
                                      className="w-full bg-white border-slate-200 rounded-lg text-xs font-bold p-2"
                                      placeholder="Schedule by km..."
                                    />
                                </div>
                              </div>

                              <div className="flex items-center gap-4 py-2 border-y border-slate-100">
                                 <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      checked={newReminder.isRepeatable}
                                      onChange={(e) => setNewReminder({...newReminder, isRepeatable: e.target.checked})}
                                      className="rounded text-slate-900 focus:ring-slate-900" 
                                    />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Repeat Service</span>
                                 </label>
                              </div>

                              {newReminder.isRepeatable && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  className="grid grid-cols-2 gap-4"
                                >
                                   <div className="space-y-1">
                                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Every (km)</label>
                                      <input 
                                        type="number" 
                                        value={newReminder.repeatMileage}
                                        onChange={(e) => setNewReminder({...newReminder, repeatMileage: parseInt(e.target.value) || 0})}
                                        className="w-full bg-white border-slate-200 rounded-lg text-xs font-bold p-2"
                                      />
                                   </div>
                                   <div className="space-y-1">
                                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Every (Months)</label>
                                      <input 
                                        type="number" 
                                        value={newReminder.repeatMonths}
                                        onChange={(e) => setNewReminder({...newReminder, repeatMonths: parseInt(e.target.value) || 0})}
                                        className="w-full bg-white border-slate-200 rounded-lg text-xs font-bold p-2"
                                      />
                                   </div>
                                </motion.div>
                              )}

                              <div className="space-y-1">
                                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Description</label>
                                  <input 
                                    type="text" 
                                    value={newReminder.description}
                                    onChange={(e) => setNewReminder({...newReminder, description: e.target.value})}
                                    className="w-full bg-white border-slate-200 rounded-lg text-xs font-bold p-2"
                                    placeholder="Optional context..."
                                  />
                              </div>
                              <button type="submit" className="w-full bg-slate-900 text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-lg">Schedule Alert</button>
                           </form>
                        </motion.div>
                      )}
                      
                      <div className="space-y-3">
                         {reminders.sort((a, b) => {
                            if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return 1;
                            if (a.status !== 'COMPLETED' && b.status === 'COMPLETED') return -1;
                            return calculateReminderPriority(a) - calculateReminderPriority(b);
                         }).map(reminder => {
                            const priority = calculateReminderPriority(reminder);
                            const isNearDue = priority < 20 && reminder.status !== 'COMPLETED';

                            return (
                               <div key={reminder.id} className={cn(
                                  "p-4 rounded-xl border border-slate-100 bg-white group relative overflow-hidden",
                                  isNearDue ? "border-amber-200 bg-amber-50/10" : ""
                               )}>
                                  <div className="flex items-start gap-4">
                                     <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                        reminder.status === 'OVERDUE' ? "bg-red-100 text-red-600" : 
                                        isNearDue ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-600"
                                     )}>
                                        <Clock size={18} />
                                     </div>
                                     <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                           <h4 className="text-sm font-bold text-slate-900 truncate">{reminder.title}</h4>
                                           {reminder.isRepeatable && (
                                              <span className="text-[8px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">Recurring</span>
                                           )}
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                           <p className={cn(
                                              "text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1",
                                              (new Date(reminder.dueDate || '').getTime() < Date.now() && reminder.status !== 'COMPLETED') ? "text-red-500" : "text-slate-400"
                                           )}>
                                              <Calendar size={10} /> {new Date(reminder.dueDate || '').toLocaleDateString()}
                                           </p>
                                           {reminder.dueMileage && (
                                              <p className={cn(
                                                 "text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1",
                                                 (reminder.dueMileage < vehicle.currentMileage && reminder.status !== 'COMPLETED') ? "text-red-500" : "text-slate-400"
                                              )}>
                                                 <Navigation size={10} /> {reminder.dueMileage.toLocaleString()} km
                                              </p>
                                           )}
                                        </div>
                                        {reminder.status !== 'COMPLETED' && (
                                          <div className="mt-3">
                                             <div className="flex items-center justify-between mb-1">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Remaining</span>
                                                <span className={cn(
                                                   "text-[9px] font-bold uppercase",
                                                   priority < 20 ? "text-amber-600" : "text-slate-600"
                                                )}>{priority.toFixed(0)}%</span>
                                             </div>
                                             <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <motion.div 
                                                   initial={{ width: 0 }}
                                                   animate={{ width: `${priority}%` }}
                                                   className={cn(
                                                      "h-full rounded-full transition-colors",
                                                      priority < 15 ? "bg-red-500" : priority < 30 ? "bg-amber-500" : "bg-emerald-500"
                                                   )}
                                                />
                                             </div>
                                          </div>
                                        )}
                                     </div>
                                     <div className="text-right shrink-0">
                                        {reminder.status === 'PENDING' || reminder.status === 'OVERDUE' ? (
                                           <button 
                                              onClick={() => handleCompleteReminder(reminder)}
                                              className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors group/btn"
                                              title="Mark as Complete"
                                           >
                                              <Check size={20} className="group-hover/btn:scale-110 transition-transform" />
                                           </button>
                                        ) : (
                                           <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                                              {reminder.status}
                                           </span>
                                        )}
                                     </div>
                                  </div>
                               </div>
                            );
                         })}
                         {reminders.length === 0 && (
                            <div className="py-24 text-center">
                               <AlertCircle size={40} className="mx-auto text-slate-200 mb-4" />
                               <p className="text-xs font-mono uppercase tracking-widest font-bold text-slate-400 italic">No active reminders</p>
                            </div>
                         )}
                      </div>
                  </motion.div>
                )}
             </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpecItem({ label, value }: { label: string, value: string }) {
   return (
      <div className="p-4 rounded-xl border border-slate-50 bg-slate-50/30">
         <p className="text-[10px] font-mono uppercase tracking-widest font-bold text-slate-400 mb-1">{label}</p>
         <p className="text-sm font-bold text-slate-900">{value}</p>
      </div>
   );
}

function TabButton({ active, onClick, label, count }: { active: boolean, onClick: () => void, label: string, count?: number }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 py-3 px-4 rounded-lg text-xs font-bold uppercase tracking-widest transition-all relative flex items-center justify-center gap-2",
        active ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
      )}
    >
      {label}
      {count !== undefined && (
        <span className={cn(
          "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
          active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
        )}>
          {count}
        </span>
      )}
    </button>
  );
}
