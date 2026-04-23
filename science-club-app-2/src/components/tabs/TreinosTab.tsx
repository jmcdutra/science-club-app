import { Play, CheckCircle2, RotateCcw, MessageSquare, Info, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

export default function TreinosTab() {
  const [activeScreen, setActiveScreen] = useState<'list' | 'active'>('list');

  const treinos = [
    { id: 'A', name: 'Peito e Tríceps', name2: 'Foco Hipertrofia', time: '55 min', active: true },
    { id: 'B', name: 'Costas e Bíceps', name2: 'Densidade', time: '60 min', active: false },
    { id: 'C', name: 'Pernas Completo', name2: 'Força e Eixo', time: '70 min', active: false },
  ];

  return (
    <div className="pb-24 pt-16 flex flex-col h-full bg-bg-base overflow-y-auto mockup-scroll relative">
      <AnimatePresence mode="wait">
        
        {/* LISTA DE TREINOS */}
        {activeScreen === 'list' && (
          <motion.div 
            key="list" 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col flex-1"
          >
            {/* Title Header */}
            <div className="px-6 mb-10">
              <p className="text-text-muted text-[10px] font-bold tracking-[0.2em] uppercase mb-2">Semana 4/4</p>
              <h1 className="font-heading text-4xl font-semibold text-text-main tracking-tight leading-tight">
                Meus<br/>Treinos.
              </h1>
            </div>

            {/* List */}
            <div className="px-6 flex-1">
              <div className="flex items-end justify-between border-b border-border-subtle pb-2 mb-2">
                <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Sessões do Microciclo</h3>
              </div>
              
              <div className="space-y-0">
                {treinos.map((t) => (
                  <div 
                    key={t.id}
                    className="py-6 border-b border-border-subtle group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-mono font-bold text-xl ${
                          t.active ? 'bg-text-main text-bg-base' : 'bg-bg-surface text-text-muted border border-border-subtle'
                        }`}>
                          {t.id}
                        </div>
                        <div>
                          <h3 className={`font-heading text-xl font-bold ${t.active ? 'text-text-main' : 'text-text-muted'}`}>{t.name}</h3>
                          <p className="text-xs text-text-muted font-medium mt-0.5">{t.name2} • {t.time}</p>
                        </div>
                      </div>
                    </div>

                    {t.active ? (
                      <motion.button 
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveScreen('active')}
                        className="w-full bg-brand-primary text-white font-semibold py-3.5 rounded-xl flex justify-center items-center gap-2 shadow-lg shadow-brand-primary/20"
                      >
                        <Play size={18} className="fill-current" /> Iniciar Treino A
                      </motion.button>
                    ) : (
                      <button className="w-full bg-bg-surface text-text-muted font-semibold py-3.5 rounded-xl flex justify-center items-center gap-2 border border-border-subtle hover:text-text-main transition-colors">
                        Detalhes da Sessão
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button className="flex items-center gap-2 mt-8 text-xs font-bold text-text-muted uppercase tracking-widest hover:text-text-main transition-colors">
                <RotateCcw size={14} /> Ver Histórico Completo
              </button>
            </div>
          </motion.div>
        )}

        {/* TREINO ATIVO (EXECUÇÃO) */}
        {activeScreen === 'active' && (
          <motion.div 
            key="active"
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 20 }}
            className="absolute inset-0 bg-bg-base z-50 flex flex-col h-[calc(100%+6rem)] -mt-16 overflow-y-auto mockup-scroll"
          >
            {/* Header Execution */}
            <div className="sticky top-0 z-50 bg-bg-base/90 backdrop-blur-md px-6 py-4 flex items-center gap-4 border-b border-border-subtle">
               <button onClick={() => setActiveScreen('list')} className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-surface">
                 <ChevronLeft size={20} className="text-text-main" />
               </button>
               <div>
                 <div className="flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                   <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Treinamento em Foco</span>
                 </div>
               </div>
            </div>

            {/* Edge to Edge Video */}
            <div className="w-full h-64 bg-neutral-900 relative shrink-0">
               <img src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2670&auto=format&fit=crop" className="w-full h-full object-cover opacity-60" alt="Supino" />
               <div className="absolute inset-0 flex flex-col justify-between p-6">
                  <div className="flex justify-between">
                     <span className="bg-black/40 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/10">Exercício 1/6</span>
                     <span className="bg-black/40 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1"><Info size={12}/> Detalhes Técnicos</span>
                  </div>
                  <div className="flex items-center justify-center">
                     <button className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 shadow-2xl">
                       <Play size={28} className="fill-current ml-1" />
                     </button>
                  </div>
               </div>
            </div>

            <div className="px-6 py-8 flex-1">
               <h3 className="font-heading text-2xl font-bold text-text-main mb-2">Supino Reto com Barra</h3>
               <p className="text-sm text-text-muted font-medium mb-8">3 Séries • Descanso 90s • 3010</p>
               
               {/* Elegant Series Table */}
               <div className="space-y-0">
                 {/* Aquecimento */}
                 <div className="flex items-center py-4 border-b border-border-subtle group">
                    <span className="w-10 text-xs font-bold text-text-muted uppercase tracking-widest">Aq.</span>
                    <div className="flex-1 flex gap-4 items-center justify-center font-mono">
                       <div className="flex items-baseline gap-1">
                         <span className="text-text-main">20</span><span className="text-[10px] text-text-muted">kg</span>
                       </div>
                       <span className="text-border-subtle">×</span>
                       <div className="flex items-baseline gap-1">
                         <span className="text-text-main">15</span><span className="text-[10px] text-text-muted">reps</span>
                       </div>
                    </div>
                    <button className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:bg-bg-surface"><CheckCircle2 size={24}/></button>
                 </div>
                 
                 {/* Preparatória */}
                 <div className="flex items-center py-4 border-b border-border-subtle group">
                    <span className="w-10 text-xs font-bold text-amber-500 uppercase tracking-widest">Pr.</span>
                    <div className="flex-1 flex gap-4 items-center justify-center font-mono">
                       <div className="flex items-baseline gap-1">
                         <span className="text-text-main">40</span><span className="text-[10px] text-text-muted">kg</span>
                       </div>
                       <span className="text-border-subtle">×</span>
                       <div className="flex items-baseline gap-1">
                         <span className="text-text-main">8</span><span className="text-[10px] text-text-muted">reps</span>
                       </div>
                    </div>
                    <button className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:bg-bg-surface"><CheckCircle2 size={24}/></button>
                 </div>

                 {/* Válida 1 - Clean Inputs */}
                 <div className="flex items-center py-4 border-b border-border-subtle group bg-brand-primary/5 -mx-6 px-6 relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary"></div>
                    <span className="w-10 text-xs font-black text-brand-primary uppercase tracking-widest">01</span>
                    <div className="flex-1 flex gap-6 items-center justify-center">
                       <div className="flex flex-col items-center">
                         <input type="number" className="w-16 bg-transparent border-b-2 border-brand-primary/50 text-center text-2xl font-mono font-bold text-text-main py-1 focus:outline-none focus:border-brand-primary rounded-none transition-colors" defaultValue="60" />
                         <span className="text-[10px] text-text-muted font-medium mt-1 uppercase tracking-widest">Kg</span>
                       </div>
                       <span className="text-text-muted/50 mb-4">×</span>
                       <div className="flex flex-col items-center">
                         <input type="number" className="w-16 bg-transparent border-b-2 border-brand-primary/50 text-center text-2xl font-mono font-bold text-text-main py-1 focus:outline-none focus:border-brand-primary rounded-none transition-colors" defaultValue="10" />
                         <span className="text-[10px] text-text-muted font-medium mt-1 uppercase tracking-widest">Reps</span>
                       </div>
                    </div>
                    <button className="w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-lg"><CheckCircle2 size={20} strokeWidth={2.5}/></button>
                 </div>

                 {/* Válida 2 */}
                 <div className="flex items-center py-4 border-b border-border-subtle group">
                    <span className="w-10 text-xs font-black text-text-main uppercase tracking-widest">02</span>
                    <div className="flex-1 flex gap-6 items-center justify-center opacity-75">
                       <div className="flex flex-col items-center">
                         <input type="number" className="w-16 bg-transparent border-b border-border-subtle text-center text-2xl font-mono font-bold text-text-main py-1 focus:outline-none focus:border-brand-primary rounded-none transition-colors" placeholder="--" />
                         <span className="text-[10px] text-text-muted font-medium mt-1 uppercase tracking-widest">Kg</span>
                       </div>
                       <span className="text-border-subtle mb-4">×</span>
                       <div className="flex flex-col items-center">
                         <input type="number" className="w-16 bg-transparent border-b border-border-subtle text-center text-2xl font-mono font-bold text-text-main py-1 focus:outline-none focus:border-brand-primary rounded-none transition-colors" placeholder="--" />
                         <span className="text-[10px] text-text-muted font-medium mt-1 uppercase tracking-widest">Reps</span>
                       </div>
                    </div>
                    <button className="w-10 h-10 rounded-full border border-border-subtle text-border-subtle flex items-center justify-center hover:bg-bg-surface"><CheckCircle2 size={20}/></button>
                 </div>
               </div>
               
               <div className="mt-8">
                 <button className="w-full py-4 rounded-xl border border-border-subtle text-xs font-bold text-text-main uppercase tracking-widest bg-bg-surface hover:bg-border-subtle/50 transition-colors flex items-center justify-center gap-2">
                   <MessageSquare size={16}/> Adicionar Observação
                 </button>
               </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
