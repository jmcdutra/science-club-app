import { Moon, Sun, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

type Props = {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
};

export default function PerfilTab({ theme, onToggleTheme }: Props) {
  return (
    <div className="pb-24 pt-16 flex flex-col h-full bg-bg-base overflow-y-auto mockup-scroll">
      
      {/* Title */}
      <div className="px-6 mb-10">
        <p className="text-text-muted text-[10px] font-bold tracking-[0.2em] uppercase mb-2">Identificação</p>
        <h1 className="font-heading text-4xl font-semibold text-text-main tracking-tight leading-tight">
          Sua<br/>Conta.
        </h1>
      </div>
      
      {/* Client ID Block */}
      <div className="px-6 mb-12">
        <div className="flex items-center gap-6 border-b border-border-subtle pb-8">
          <div className="w-24 h-24 rounded-full overflow-hidden shrink-0 border border-border-subtle bg-bg-surface">
             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Atleta&backgroundColor=transparent" alt="Avatar" className="w-full h-full object-cover opacity-90" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse"></span>
              <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">Plano Pro</span>
            </div>
            <h2 className="font-heading text-2xl font-bold text-text-main leading-none mb-2">João<br/>Silva</h2>
            <p className="font-mono text-xs text-text-muted">joao.silva@scienceclub.com</p>
          </div>
        </div>
      </div>

      <div className="px-6 flex-1 space-y-10">
        
        {/* System */}
        <section>
          <div className="flex items-end justify-between border-b border-border-subtle pb-2 mb-2">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">Sistema</h3>
          </div>
          <div className="space-y-0">
            <div className="flex items-center justify-between py-5 border-b border-border-subtle/50 group">
               <span className="font-medium text-sm text-text-main">Tema da Interface</span>
               <button 
                 onClick={onToggleTheme}
                 className="flex items-center gap-2 bg-bg-surface border border-border-subtle rounded-full p-1"
               >
                 <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${theme === 'light' ? 'bg-white shadow-sm text-black' : 'text-text-muted'}`}>
                   <Sun size={12} />
                 </div>
                 <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-neutral-800 shadow-sm text-white' : 'text-text-muted'}`}>
                   <Moon size={12} />
                 </div>
               </button>
            </div>
            
            <button className="w-full flex items-center justify-between py-5 border-b border-border-subtle/50 group hover:pr-2 transition-all">
               <span className="font-medium text-sm text-text-main">Notificações</span>
               <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                  Ativas <ChevronRight size={14} className="opacity-50" />
               </span>
            </button>
          </div>
        </section>

        {/* General */}
        <section>
          <div className="flex items-end justify-between border-b border-border-subtle pb-2 mb-2">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">Gestão</h3>
          </div>
          <div className="space-y-0">
            <button className="w-full flex items-center justify-between py-5 border-b border-border-subtle/50 group hover:pr-2 transition-all">
               <span className="font-medium text-sm text-text-main">Preferências de Treino</span>
               <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                  Configurar <ChevronRight size={14} className="opacity-50" />
               </span>
            </button>
            <button className="w-full flex items-center justify-between py-5 border-b border-border-subtle/50 group hover:pr-2 transition-all">
               <span className="font-medium text-sm text-text-main">Dados Médicos & Restrições</span>
               <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                  Revisar <ChevronRight size={14} className="opacity-50" />
               </span>
            </button>
            <button className="w-full flex items-center justify-between py-5 border-b border-border-subtle/50 group hover:pr-2 transition-all">
               <span className="font-medium text-sm text-text-main">Termos e Condições</span>
               <ChevronRight size={14} className="text-text-muted opacity-50" />
            </button>
          </div>
        </section>

      </div>

      {/* Action Footer */}
      <div className="px-6 pt-12">
        <motion.button 
          whileTap={{ scale: 0.98 }}
          className="w-full py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-red-500 border border-red-500/20 rounded-2xl hover:bg-red-500/5 transition-colors"
        >
          Desconectar Conta
        </motion.button>
      </div>
    </div>
  );
}
