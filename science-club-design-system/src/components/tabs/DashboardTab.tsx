import { Activity, Flame, Timer, Play, Calendar, Star, ChevronRight, BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';

export default function DashboardTab() {
  return (
    <div className="pb-24">
      {/* User Hello & Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
           <div>
             <p className="text-text-muted text-sm mb-0.5">Bom dia, Atleta</p>
             <h1 className="font-heading text-2xl font-semibold text-text-main tracking-tight">João Silva</h1>
           </div>
           <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-brand-primary to-brand-accent">
             <div className="w-full h-full rounded-full bg-bg-surface border-2 border-bg-base overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=João&backgroundColor=transparent" alt="Avatar" className="w-full h-full object-cover" />
             </div>
           </div>
        </div>
        
        {/* Weekly Progress */}
        <div className="flex gap-2 justify-between">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => {
            const isToday = i === 3;
            const isDone = i < 3;
            return (
              <div key={i} className="flex flex-col items-center gap-2">
                <span className={`text-xs font-medium ${isToday ? 'text-brand-primary' : 'text-text-muted'}`}>{day}</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  isToday ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 ring-2 ring-brand-primary ring-offset-2 ring-offset-bg-base' : 
                  isDone ? 'bg-brand-primary/20 text-brand-primary' : 'bg-bg-surface text-text-muted border border-border-subtle'
                }`}>
                  {12 + i}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Focus Card */}
      <div className="px-6 py-2">
        <div className="relative w-full rounded-3xl bg-bg-surface border border-border-subtle p-5 overflow-hidden">
          {/* subtle background accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          
          <div className="relative z-10 flex justify-between items-start mb-8">
            <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary text-xs font-semibold rounded-full border border-brand-primary/20">
              Treino A
            </span>
            <div className="flex items-center gap-1 text-text-muted text-xs font-medium">
              <Timer size={14} /> 55 min
            </div>
          </div>

          <div className="relative z-10">
            <h2 className="font-heading text-2xl font-bold text-text-main leading-tight mb-2">Peito e <br/>Tríceps</h2>
            <p className="text-sm text-text-muted mb-6">Foco em hipertrofia e progressão de carga.</p>
            
            <motion.button whileTap={{ scale: 0.96 }} className="w-full bg-brand-primary hover:bg-brand-accent text-white font-medium py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-brand-primary/30 flex justify-center items-center gap-2">
              <Play size={18} className="fill-current" /> Começar Treino
            </motion.button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-6 py-4 grid grid-cols-2 gap-4">
         <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 flex flex-col gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-secondary/10 text-brand-secondary flex items-center justify-center">
              <Flame size={18} />
            </div>
            <div>
              <p className="text-text-muted text-xs font-medium mb-1">Calorias (sem.)</p>
              <p className="font-sans font-bold text-xl text-text-main leading-none">2.450 <span className="text-xs font-normal text-text-muted">kcal</span></p>
            </div>
         </div>
         <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 flex flex-col gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-accent/10 text-brand-accent flex items-center justify-center">
              <BarChart3 size={18} />
            </div>
            <div>
              <p className="text-text-muted text-xs font-medium mb-1">Volume Total</p>
              <p className="font-sans font-bold text-xl text-text-main leading-none">12.5 <span className="text-xs font-normal text-text-muted">ton</span></p>
            </div>
         </div>
      </div>

      {/* Next Sessions */}
      <div className="px-6 py-4">
        <h3 className="font-heading text-lg font-semibold text-text-main mb-4">Próximos Treinos</h3>
        <div className="space-y-3">
          
          <div className="bg-bg-surface p-4 rounded-2xl border border-border-subtle flex flex-col gap-3 opacity-70">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-text-muted"></span>
                  <span className="text-xs font-semibold text-text-muted">Amanhã • Costas e Bíceps</span>
                </div>
                <ChevronRight size={16} className="text-text-muted" />
             </div>
             <p className="text-sm font-medium text-text-main">Treino B</p>
          </div>

          <div className="bg-bg-surface p-4 rounded-2xl border border-border-subtle flex flex-col gap-3 opacity-50">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-text-muted"></span>
                  <span className="text-xs font-semibold text-text-muted">Sexta • Pernas Completo</span>
                </div>
                <ChevronRight size={16} className="text-text-muted" />
             </div>
             <p className="text-sm font-medium text-text-main">Treino C</p>
          </div>

        </div>
      </div>

    </div>
  );
}
