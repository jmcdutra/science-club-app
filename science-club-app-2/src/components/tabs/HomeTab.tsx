import { Timer, Play, ChevronRight, BarChart3, ClipboardList } from 'lucide-react';
import { motion } from 'motion/react';

export default function HomeTab() {
  return (
    <div className="pb-24 pt-16 overflow-y-auto mockup-scroll h-full bg-bg-base">
      
      {/* Editorial Briefing Header */}
      <div className="px-6 mb-12">
        <p className="text-text-muted text-[10px] font-bold tracking-[0.2em] uppercase mb-2">23 de Abril</p>
        <h1 className="font-heading text-4xl font-semibold text-text-main tracking-tight leading-tight">
          Bom dia,<br/>João Silva.
        </h1>
      </div>

      {/* Extreme Priority Action - Edge to Edge feel */}
      <div className="px-6 mb-10">
        <div className="bg-text-main text-bg-base rounded-[2rem] p-6 flex flex-col justify-between items-start h-48 relative overflow-hidden shadow-2xl shadow-black/10">
          <div className="absolute -right-4 -bottom-4 opacity-10">
             <ClipboardList size={120} />
          </div>
          
          <div className="flex justify-between w-full relative z-10">
            <span className="bg-bg-base/20 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest backdrop-blur-sm border border-bg-base/10">Ação Urgente</span>
            <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse mt-1"></span>
          </div>
          
          <div className="relative z-10">
            <p className="text-sm opacity-80 font-medium mb-1">Semana 4 de 4</p>
            <h3 className="font-heading text-2xl font-bold leading-tight">Questionário<br/>Liberado</h3>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-8">
        
        {/* Workout - Clean border-bottom style */}
        <section>
          <div className="flex items-end justify-between border-b border-border-subtle pb-2 mb-4">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">Treino do Dia</h3>
            <span className="text-text-main font-medium text-sm flex items-center gap-1"><Timer size={14}/> 55m</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-xl font-bold text-text-main">Costas & Bíceps</h2>
              <p className="text-sm text-text-muted">6 Exercícios • Foco Extremo</p>
            </div>
            <motion.button whileTap={{ scale: 0.9 }} className="w-12 h-12 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-lg shadow-brand-primary/20">
               <Play size={20} className="fill-current ml-1" />
            </motion.button>
          </div>
        </section>

        {/* Minimalist Stats */}
        <section>
           <div className="flex items-end justify-between border-b border-border-subtle pb-2 mb-4">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">Métricas Semanais</h3>
            <BarChart3 size={16} className="text-text-muted" />
          </div>
          
          <div className="flex gap-8">
             <div>
                <p className="font-mono text-3xl font-bold text-text-main tracking-tighter">2.4k</p>
                <p className="text-xs font-medium text-text-muted uppercase tracking-wider mt-1">Kcal Gastas</p>
             </div>
             <div>
                <p className="font-mono text-3xl font-bold text-text-main tracking-tighter">12.5</p>
                <p className="text-xs font-medium text-text-muted uppercase tracking-wider mt-1">Ton Movidas</p>
             </div>
          </div>
        </section>

      </div>

    </div>
  );
}
