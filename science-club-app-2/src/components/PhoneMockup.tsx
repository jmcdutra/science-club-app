import { useState } from 'react';
import { Sun, Moon, Home, Dumbbell, Utensils, ClipboardSignature, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AuthFlow from './auth/AuthFlow';
import HomeTab from './tabs/HomeTab';
import TreinosTab from './tabs/TreinosTab';
import DietaTab from './tabs/DietaTab';
import ReavaliacoesTab from './tabs/ReavaliacoesTab';
import PerfilTab from './tabs/PerfilTab';

type TabId = 'home' | 'treinos' | 'dieta' | 'reavaliacoes' | 'perfil';

const tabs = [
  { id: 'home', label: 'Início', icon: Home },
  { id: 'treinos', label: 'Treinos', icon: Dumbbell },
  { id: 'dieta', label: 'Dieta', icon: Utensils },
  { id: 'reavaliacoes', label: 'Reavaliação', icon: ClipboardSignature },
  { id: 'perfil', label: 'Perfil', icon: User },
];

export default function PhoneMockup() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [appState, setAppState] = useState<'auth' | 'app'>('auth');

  return (
    <div className="flex flex-col items-center gap-8 py-8 h-full w-full max-w-full">
      {/* Device wrapper */}
      <div className="relative w-[360px] h-[780px] rounded-[3rem] border-8 border-neutral-900 bg-neutral-950 p-2 shadow-2xl overflow-hidden ring-1 ring-white/10 shrink-0">
        
        {/* Hardware details (notch / camera) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-neutral-900 rounded-b-xl z-50 flex justify-center items-end pb-1 pointer-events-none">
          <div className="w-16 h-1.5 rounded-full bg-neutral-950/50"></div>
        </div>

          {/* Screen Content Wrapper */}
        <div 
          className="w-full h-full rounded-[2.2rem] overflow-hidden relative flex flex-col bg-bg-base"
          data-theme={theme}
          style={{ transition: 'background-color 0.3s ease', transform: 'translateZ(0)' }}
        >
          
          <AnimatePresence mode="wait">
            {appState === 'auth' && (
              <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-bg-base">
                <AuthFlow onComplete={() => setAppState('app')} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto mockup-scroll relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {activeTab === 'home' && <HomeTab />}
                {activeTab === 'treinos' && <TreinosTab />}
                {activeTab === 'dieta' && <DietaTab />}
                {activeTab === 'reavaliacoes' && <ReavaliacoesTab />}
                {activeTab === 'perfil' && <PerfilTab theme={theme} onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Navigation */}
          <div className="absolute bottom-0 w-full bg-bg-surface/90 backdrop-blur-lg border-t border-border-subtle z-40 pb-5 pt-2 px-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
            <div className="flex justify-between items-center">
              {tabs.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabId)}
                    className="flex flex-col items-center gap-1 flex-1 relative py-2"
                  >
                    <tab.icon 
                      size={20} 
                      className={`transition-colors duration-300 ${isActive ? 'text-brand-primary' : 'text-text-muted hover:text-text-main'}`} 
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span 
                      className={`text-[10px] font-medium transition-colors duration-300 ${isActive ? 'text-brand-primary' : 'text-text-muted'}`}
                    >
                      {tab.label}
                    </span>
                    {isActive && (
                      <motion.div 
                        layoutId="nav-indicator"
                        className="absolute -top-2 w-1/2 h-0.5 bg-brand-primary rounded-full blur-[1px]"
                      />
                    )}
                  </button>
                );
              })}
            </div>
            {/* Real Home Indicator Line */}
            <div className="w-1/3 h-1 rounded-full bg-border-subtle mx-auto absolute bottom-2 left-1/2 -translate-x-1/2"></div>
          </div>

        </div>
      </div>
    </div>
  );
}
