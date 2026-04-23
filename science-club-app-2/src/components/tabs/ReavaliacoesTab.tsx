import { ClipboardList, Clock, CheckCircle2, FileText, AlertCircle, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

export default function ReavaliacoesTab() {
  return (
    <div className="pb-24 pt-16 flex flex-col h-full bg-bg-base overflow-y-auto mockup-scroll">
      
      {/* Title */}
      <div className="px-6 mb-12">
        <p className="text-text-muted text-[10px] font-bold tracking-[0.2em] uppercase mb-2">Ciclo 03</p>
        <h1 className="font-heading text-4xl font-semibold text-text-main tracking-tight leading-tight">
          Sua<br/>Avaliação.
        </h1>
      </div>

      {/* Action Block - Editorial Callout */}
      <div className="px-6 mb-10">
        <div className="bg-text-main text-bg-base rounded-[2rem] p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-4 -bottom-4 opacity-10">
             <ClipboardList size={120} />
          </div>
          
          <div className="flex items-center gap-2 mb-8 relative z-10">
            <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></span>
            <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">Ação Liberada</span>
          </div>
          
          <div className="relative z-10 mb-8">
            <h2 className="font-heading text-2xl font-bold leading-tight mb-2">
              Sintetize seus<br/>últimos 30 dias.
            </h2>
            <p className="text-sm opacity-80 pr-4">
              Compartilhe suas percepções para o desenvolvimento do próximo mesociclo.
            </p>
          </div>

          <motion.button 
            whileTap={{ scale: 0.96 }}
            className="w-full bg-bg-base text-text-main font-semibold py-4 rounded-xl flex justify-center items-center gap-2 shadow-lg relative z-10"
          >
            <FileText size={18} /> Iniciar Questionário
          </motion.button>
        </div>
      </div>

      {/* Editorial Details List (Replacing the square matrix) */}
      <div className="px-6 mb-10">
        <div className="flex items-end justify-between border-b border-border-subtle pb-2 mb-4">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">Mapeamento Atual</h3>
        </div>
        
        <div className="space-y-0">
          <div className="flex items-center justify-between py-4 border-b border-border-subtle/50">
             <div className="flex items-center gap-3">
               <Clock size={16} className="text-text-muted" />
               <span className="font-medium text-sm text-text-main">Semanas Desse Ciclo</span>
             </div>
             <span className="font-mono font-medium text-sm text-text-main">4 de 4</span>
          </div>

          <div className="flex items-center justify-between py-4 border-b border-border-subtle/50">
             <div className="flex items-center gap-3">
               <AlertCircle size={16} className="text-text-muted" />
               <span className="font-medium text-sm text-text-main">Status da Devolutiva</span>
             </div>
             <span className="font-medium text-xs text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-1 rounded-full">Pendente</span>
          </div>

          <div className="flex items-center justify-between py-4 border-b border-border-subtle/50">
             <div className="flex items-center gap-3">
               <Calendar size={16} className="text-text-muted" />
               <span className="font-medium text-sm text-text-main">Última Revisão</span>
             </div>
             <span className="font-mono font-medium text-sm text-text-muted">15/Março</span>
          </div>
        </div>
      </div>

      {/* History - Clean rows */}
      <div className="px-6">
        <div className="flex items-end justify-between border-b border-border-subtle pb-2 mb-4">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">Histórico Antigo</h3>
        </div>
        <div className="space-y-0">
          
          <div className="flex items-center justify-between py-4 border-b border-border-subtle/50 opacity-80 group">
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Meso 02</p>
              <h4 className="font-medium text-sm text-text-main">Volume e Densidade</h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Aprovado</span>
              <CheckCircle2 size={16} className="text-text-muted" />
            </div>
          </div>

          <div className="flex items-center justify-between py-4 border-b border-border-subtle/50 opacity-80 group">
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Meso 01</p>
              <h4 className="font-medium text-sm text-text-main">Adaptação Neurológica</h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Aprovado</span>
              <CheckCircle2 size={16} className="text-text-muted" />
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
