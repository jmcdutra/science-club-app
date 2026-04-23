import { CheckCircle2, ChevronRight, Activity, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function ComponentsTab({ theme }: { theme: 'dark' | 'light' }) {
  return (
    <div className="p-6 space-y-10 pb-20">
      
      {/* Botões */}
      <div>
        <h2 className="font-heading text-lg font-semibold text-text-main mb-4 flex items-center gap-2">
          <div className="w-1.5 h-4 bg-brand-primary rounded-full"></div>
          Botões
        </h2>
        <div className="space-y-4">
          <motion.button whileTap={{ scale: 0.96 }} className="w-full bg-brand-primary hover:bg-brand-accent text-white font-medium py-3.5 px-4 rounded-xl transition-colors shadow-lg shadow-brand-primary/20 flex justify-center items-center gap-2">
            Iniciar Treino <ArrowRight size={18} />
          </motion.button>
          
          <motion.button whileTap={{ scale: 0.96 }} className="w-full bg-bg-surface border border-border-subtle hover:border-brand-primary text-text-main font-medium py-3.5 px-4 rounded-xl transition-all flex justify-center items-center gap-2">
            Ver Histórico
          </motion.button>

          <motion.button whileTap={{ scale: 0.96 }} className="w-full bg-brand-secondary/10 text-brand-primary font-medium py-3.5 px-4 rounded-xl transition-colors hover:bg-brand-secondary/20">
            Adicionar Série
          </motion.button>
        </div>
      </div>

      {/* Inputs & Form */}
      <div>
        <h2 className="font-heading text-lg font-semibold text-text-main mb-4 flex items-center gap-2">
          <div className="w-1.5 h-4 bg-brand-accent rounded-full"></div>
          Inputs
        </h2>
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Carga (kg)</label>
            <div className="relative">
              <input 
                type="number" 
                defaultValue="45"
                className="w-full bg-bg-surface border border-border-subtle rounded-xl py-3 px-4 text-text-main font-medium focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all" 
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted font-medium">kg</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Músculo Alvo</label>
            <div className="w-full bg-bg-surface border border-border-subtle rounded-xl py-3 px-4 flex justify-between items-center cursor-pointer hover:border-brand-secondary transition-all">
              <span className="text-text-main font-medium">Peitoral Maior</span>
              <ChevronRight size={18} className="text-text-muted" />
            </div>
          </div>
        </div>
      </div>

      {/* Cards & Items */}
      <div>
        <h2 className="font-heading text-lg font-semibold text-text-main mb-4 flex items-center gap-2">
          <div className="w-1.5 h-4 bg-brand-secondary rounded-full"></div>
          List Items
        </h2>
        
        <div className="space-y-3">
          <div className="bg-bg-surface p-4 rounded-2xl border border-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                <Activity size={20} />
              </div>
              <div>
                <p className="font-medium text-text-main text-sm">Supino Inclinado</p>
                <p className="text-xs text-text-muted mt-0.5">3 séries x 10 a 12 reps</p>
              </div>
            </div>
            <button className="w-8 h-8 rounded-full border border-border-subtle flex items-center justify-center text-text-muted hover:text-brand-primary hover:border-brand-primary transition-all">
               <ChevronRight size={16} />
            </button>
          </div>

          <div className="bg-bg-surface p-4 rounded-2xl border border-brand-primary ring-1 ring-brand-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-lg shadow-brand-primary/30">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="font-medium text-brand-primary text-sm">Crucifixo Completo</p>
                <p className="text-xs text-text-muted mt-0.5">Finalizado • 45kg</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Badges */}
      <div>
        <h2 className="font-heading text-lg font-semibold text-text-main mb-4 flex items-center gap-2">
          <div className="w-1.5 h-4 bg-brand-primary rounded-full"></div>
          Badges & Status
        </h2>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-semibold">
            Hipertrofia
          </span>
          <span className="px-3 py-1 rounded-full bg-brand-accent/10 text-brand-accent text-xs font-semibold">
            Avançado
          </span>
          <span className="px-3 py-1 rounded-full bg-bg-surface border border-border-subtle text-text-muted text-xs font-semibold">
            Descanso 60s
          </span>
        </div>
      </div>

    </div>
  );
}
