import { ChevronRight, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

export default function DietaTab() {
  const macros = [
    { label: 'Proteína', value: '140g', max: '160g', p: 85, color: 'bg-text-main' },
    { label: 'Carbo', value: '210g', max: '300g', p: 70, color: 'bg-brand-primary' },
    { label: 'Gordura', value: '45g', max: '65g', p: 60, color: 'bg-border-subtle' },
  ];

  return (
    <div className="pb-24 pt-16 h-full overflow-y-auto mockup-scroll bg-bg-base">
      
      {/* Title */}
      <div className="px-6 mb-12">
        <p className="text-text-muted text-[10px] font-bold tracking-[0.2em] uppercase mb-2">Meta Diária</p>
        <h1 className="font-heading text-4xl font-semibold text-text-main tracking-tight leading-tight">
          Nutrição<br/>Ativa.
        </h1>
      </div>

      {/* Macro Summary - Progress Linear Minimalist */}
      <div className="px-6 mb-12">
        <div className="flex items-end gap-2 mb-6 border-b border-border-subtle pb-4">
          <span className="font-mono text-5xl font-bold text-text-main tracking-tighter">1.840</span>
          <span className="text-sm font-bold text-text-muted uppercase tracking-widest pb-1">/ 2.450 kcal</span>
        </div>

        <div className="space-y-6">
          {macros.map((m) => (
            <div key={m.label}>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{m.label}</span>
                <span className="text-text-main font-mono text-sm font-bold">{m.value} <span className="opacity-40 text-xs">/ {m.max}</span></span>
              </div>
              <div className="h-2 w-full bg-bg-surface rounded-full overflow-hidden border border-border-subtle/50">
                <div className={`h-full ${m.color} rounded-full transition-all`} style={{ width: `${m.p}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Meals */}
      <div className="px-6">
        <div className="flex items-end justify-between border-b border-border-subtle pb-2 mb-6">
          <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest">Plano Alimentar</h2>
        </div>

        <div className="space-y-6">
          
          {/* Active Meal (Almoço) */}
          <div>
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-heading text-xl font-bold text-text-main">Almoço</h3>
               <span className="text-xs font-bold text-text-muted uppercase tracking-widest">650 Kcal</span>
             </div>
             
             <div className="pl-4 border-l-2 border-brand-primary space-y-4">
                <div className="flex justify-between items-start group">
                   <div>
                     <p className="font-medium text-text-main text-sm">Arroz Branco Cozido</p>
                     <p className="text-xs text-text-muted font-mono mt-0.5">150g</p>
                   </div>
                   <button className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1 hover:text-brand-primary transition-colors py-1">
                      <RefreshCw size={12}/> Trocar
                   </button>
                </div>
                
                <div className="flex justify-between items-start group">
                   <div>
                     <p className="font-medium text-text-main text-sm">Peito de Frango Grelhado</p>
                     <p className="text-xs text-text-muted font-mono mt-0.5">120g</p>
                   </div>
                   <button className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1 hover:text-brand-primary transition-colors py-1">
                      <RefreshCw size={12}/> Trocar
                   </button>
                </div>
             </div>
             
             <motion.button whileTap={{ scale: 0.98 }} className="mt-6 w-full py-3.5 bg-text-main text-bg-base font-semibold rounded-xl flex justify-center items-center gap-2">
                Marcar como consumido
             </motion.button>
          </div>

          <div className="w-full h-px bg-border-subtle my-2"></div>

          {/* Collapsed meal */}
          <div className="flex justify-between items-center py-2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer group">
             <div>
               <h3 className="font-heading text-lg font-bold text-text-main group-hover:text-brand-primary transition-colors">Café da Manhã</h3>
               <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">Concluído • 320 kcal</p>
             </div>
             <ChevronRight size={20} className="text-text-muted" />
          </div>

        </div>
      </div>
    </div>
  );
}
