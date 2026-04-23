import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, ChevronRight, Settings, Trash2, ArrowRight } from 'lucide-react';

export default function InteractionsTab() {
  const [activeOverlay, setActiveOverlay] = useState<'modal' | 'drawer' | 'toast' | null>(null);

  // Auto-hide Toast
  useEffect(() => {
    if (activeOverlay === 'toast') {
      const t = setTimeout(() => setActiveOverlay(null), 3500);
      return () => clearTimeout(t);
    }
  }, [activeOverlay]);

  return (
    <div className="p-6 space-y-10 pb-20 overflow-x-hidden">
      
      {/* Dynamic Overlays triggers */}
      <div>
        <h2 className="font-heading text-lg font-semibold text-text-main mb-4 flex items-center gap-2">
          <div className="w-1.5 h-4 bg-brand-accent rounded-full"></div>
          Overlays e Modais
        </h2>
        <p className="text-xs text-text-muted mb-4 leading-relaxed">
          Elementos que flutuam sobre a interface principal, utilizando o Z-index hierárquico.
        </p>
        <div className="space-y-4">
          <motion.button 
            whileTap={{ scale: 0.96 }} 
            onClick={() => setActiveOverlay('drawer')}
            className="w-full bg-bg-surface border border-border-subtle text-text-main py-3.5 px-4 rounded-xl flex items-center justify-between shadow-sm"
          >
            <span className="font-medium">Drawers (Bottom Sheet)</span>
            <ChevronRight size={18} className="text-text-muted" />
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.96 }} 
            onClick={() => setActiveOverlay('modal')}
            className="w-full bg-bg-surface border border-border-subtle text-text-main py-3.5 px-4 rounded-xl flex items-center justify-between shadow-sm"
          >
            <span className="font-medium">Modal (Dialog Box)</span>
            <ChevronRight size={18} className="text-text-muted" />
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.96 }} 
            onClick={() => setActiveOverlay('toast')}
            className="w-full bg-bg-surface border border-border-subtle text-text-main py-3.5 px-4 rounded-xl flex items-center justify-between shadow-sm"
          >
            <span className="font-medium">Toast (Snackbar)</span>
            <ChevronRight size={18} className="text-text-muted" />
          </motion.button>
        </div>
      </div>

      {/* Swipe Gestures */}
      <div>
        <h2 className="font-heading text-lg font-semibold text-text-main mb-4 flex items-center gap-2">
          <div className="w-1.5 h-4 bg-brand-primary rounded-full"></div>
          Gestos Físicos (Swipe)
        </h2>
        <p className="text-xs text-text-muted mb-4 leading-relaxed">
          Arraste o card abaixo para a esquerda.
        </p>

        <div className="relative rounded-[1.2rem] bg-red-500 overflow-hidden group shadow-sm border border-red-500/30">
          <div className="absolute inset-0 flex items-center justify-end px-6 text-white font-medium text-sm">
            <Trash2 size={20} />
          </div>
          
          <motion.div
            drag="x"
            dragConstraints={{ left: -80, right: 0 }}
            dragElastic={0.2}
            className="relative z-10 bg-bg-surface p-4 rounded-[1.2rem] border border-border-subtle flex items-center justify-between h-full w-full"
          >
            <div className="flex flex-col text-left">
              <span className="font-medium text-text-main text-sm">Treino B (Costas)</span>
              <span className="text-xs text-text-muted">Deslize rápido para a esquerda &larr;</span>
            </div>
            <ChevronRight size={18} className="text-text-muted opacity-50" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {activeOverlay === 'modal' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setActiveOverlay(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
              className="relative z-10 w-full bg-bg-surface rounded-[2rem] p-6 border border-border-subtle shadow-2xl flex flex-col items-center text-center gap-2"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-2 ring-4 ring-red-500/5">
                <Trash2 size={28} />
              </div>
              <h3 className="font-heading text-xl font-bold text-text-main">Finalizar Treino?</h3>
              <p className="text-sm text-text-muted mb-4">Tem certeza que deseja finalizar agora?</p>
              
              <div className="flex gap-3 w-full mt-2">
                <button 
                  onClick={() => setActiveOverlay(null)} 
                  className="flex-1 py-3.5 px-4 rounded-xl font-medium text-text-main bg-bg-base border border-border-subtle hover:bg-border-subtle transition-colors"
                >
                  Continuar
                </button>
                <button 
                  onClick={() => setActiveOverlay(null)} 
                  className="flex-1 py-3.5 px-4 rounded-xl font-medium text-white bg-brand-primary hover:bg-brand-accent shadow-lg shadow-brand-primary/20"
                >
                  Finalizar
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* DRAWER / BOTTOM SHEET OVERLAY */}
        {activeOverlay === 'drawer' && (
          <div className="fixed inset-0 z-50 flex items-end">
            <motion.div
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setActiveOverlay(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.y > 100 || velocity.y > 500) {
                  setActiveOverlay(null);
                }
              }}
              className="relative z-10 w-full bg-bg-surface rounded-t-[2.5rem] border-t border-border-subtle shadow-[0_-10px_40px_rgba(0,0,0,0.3)] pb-10 pt-4 px-6 flex flex-col"
            >
              <div className="w-12 h-1.5 rounded-full bg-border-subtle mx-auto mb-8" />
              <h3 className="font-heading text-xl font-bold text-text-main mb-6 px-2">Opções do Exercício</h3>
              <div className="space-y-1">
                <button className="w-full flex items-center gap-4 py-4 px-3 hover:bg-bg-base rounded-xl transition-colors text-text-main font-medium">
                  <Settings size={20} className="text-text-muted" /> Configurar
                </button>
                <div className="h-px w-full bg-border-subtle my-2" />
                <button 
                  onClick={() => setActiveOverlay(null)} 
                  className="w-full flex items-center gap-4 py-4 px-3 text-text-muted font-medium hover:text-text-main transition-colors"
                >
                  <X size={20} className="text-text-muted" /> Fechar Menu
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* TOAST / SNACKBAR */}
        {activeOverlay === 'toast' && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.5 }}
            className="fixed bottom-8 left-6 right-6 z-50 pointer-events-none"
          >
            <div className="bg-text-main text-bg-surface py-3.5 px-5 rounded-2xl shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-brand-primary" />
                <span className="font-medium text-sm">Ação efetuada com sucesso!</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
