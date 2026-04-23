import { LineChart, Camera, ChevronRight, Weight } from 'lucide-react';
import { motion } from 'motion/react';

export default function AvaliacoesTab() {
  return (
    <div className="pb-24 px-6 pt-6 flex flex-col h-full">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="font-heading text-2xl font-bold text-text-main">Evolução</h1>
        <button className="text-brand-primary p-2 bg-brand-primary/10 rounded-full">
          <LineChart size={20} />
        </button>
      </div>

      {/* Weight Chart Mockup */}
      <div className="bg-bg-surface border border-border-subtle rounded-3xl p-6 mb-6">
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Peso Atual</p>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-3xl font-bold text-text-main">74.5</span>
              <span className="text-text-muted font-medium">kg</span>
            </div>
          </div>
          <span className="bg-green-500/10 text-green-500 text-xs font-bold px-2 py-1 rounded-md">
            -2.1 kg
          </span>
        </div>

        {/* CSS Chart lines placeholder */}
        <div className="h-32 w-full flex items-end justify-between gap-2 border-b border-border-subtle relative pb-2">
          {/* Trend line SVG mockup */}
          <svg className="absolute inset-0 w-full h-full pb-2" preserveAspectRatio="none">
             <path d="M0,100 Q40,90 80,60 T150,50 T220,70 T300,20" fill="none" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div className="flex w-full justify-between mt-auto opacity-50 text-[10px] font-mono text-text-muted absolute -bottom-5">
            <span>Jan</span>
            <span>Fev</span>
            <span>Mar</span>
            <span>Abr</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 mt-6">
         <motion.button whileTap={{ scale: 0.98 }} className="w-full bg-bg-base border border-border-subtle rounded-2xl p-4 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-bg-surface flex items-center justify-center text-text-muted">
               <Camera size={20} />
             </div>
             <div className="text-left">
               <span className="block font-semibold text-sm text-text-main">Fotos de Progresso</span>
               <span className="block text-xs text-text-muted mt-0.5">Última foto há 12 dias</span>
             </div>
           </div>
           <ChevronRight size={18} className="text-text-muted" />
         </motion.button>
         
         <motion.button whileTap={{ scale: 0.98 }} className="w-full bg-bg-base border border-border-subtle rounded-2xl p-4 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-bg-surface flex items-center justify-center text-text-muted">
               <Weight size={20} />
             </div>
             <div className="text-left">
               <span className="block font-semibold text-sm text-text-main">Composição Corporal</span>
               <span className="block text-xs text-text-muted mt-0.5">14.2% BF • 38kg MM</span>
             </div>
           </div>
           <ChevronRight size={18} className="text-text-muted" />
         </motion.button>
      </div>

    </div>
  );
}
