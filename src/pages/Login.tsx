import React from 'react';
import { Car, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { signIn } = useAuth();

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-[#f1f5f9] font-sans overflow-hidden">
      {/* Left Pane - Brand/Visual */}
      <div className="flex-1 bg-[#0f172a] flex flex-col justify-center p-12 md:p-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[150%] h-full bg-[radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.1)_0%,transparent_50%)] pointer-events-none"></div>
        <div className="z-10">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-3 text-white mb-12"
          >
            <div className="p-3 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
              <Car size={32} />
            </div>
            <span className="text-2xl font-bold tracking-tighter uppercase">AutoKeep Pro</span>
          </motion.div>
          
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold text-white mb-6 leading-[0.9] tracking-tighter uppercase"
          >
            PRECISION <br /> 
            <span className="text-blue-500">FLEET OPS.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-md text-slate-400 text-base mb-12 font-medium"
          >
            The enterprise-grade command center for vehicle maintenance and telemetry. 
            Designed for high-density information management.
          </motion.p>
        </div>
      </div>

      {/* Right Pane - Auth */}
      <div className="md:w-[450px] bg-white flex flex-col justify-center p-8 md:p-16 border-l border-slate-200">
        <div className="max-w-sm mx-auto w-full">
          <div className="mb-12">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-2">Service Authentication</h2>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">System Login</p>
          </div>

          <button 
            onClick={signIn}
            className="w-full bg-[#0f172a] text-white rounded-lg p-4 font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 group group active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google Authorized Login
          </button>

          <div className="mt-12 pt-12 border-t border-slate-100">
             <div className="flex gap-8 text-[9px] font-mono uppercase tracking-[0.2em] text-slate-400 font-bold">
               <span>Ver 4.1.0</span>
               <span className="text-blue-600">Encrypted Channel</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
