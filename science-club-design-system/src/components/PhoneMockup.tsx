import { useState, useRef, MouseEvent as ReactMouseEvent } from 'react';
import { Sun, Moon, Palette, Type, Layers, LayoutDashboard, MousePointerClick } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ColorsTab from './tabs/ColorsTab';
import TypographyTab from './tabs/TypographyTab';
import ComponentsTab from './tabs/ComponentsTab';
import DashboardTab from './tabs/DashboardTab';
import InteractionsTab from './tabs/InteractionsTab';

type TabId = 'cores' | 'tipografia' | 'componentes' | 'interacao' | 'layout';

const tabs = [
  { id: 'cores', label: 'Cores', icon: Palette },
  { id: 'tipografia', label: 'Tipografia', icon: Type },
  { id: 'componentes', label: 'Componentes', icon: Layers },
  { id: 'interacao', label: 'Interação', icon: MousePointerClick },
  { id: 'layout', label: 'Layout', icon: LayoutDashboard },
];

export default function PhoneMockup() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeTab, setActiveTab] = useState<TabId>('layout');

  // Drag Scroll Logic
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDrag, setIsDrag] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [dragDistance, setDragDistance] = useState(0);

  const handleMouseDown = (e: ReactMouseEvent) => {
    if (!scrollRef.current) return;
    setIsDrag(true);
    setDragDistance(0);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeaveOrUp = () => {
    setIsDrag(false);
  };

  const handleMouseMove = (e: ReactMouseEvent) => {
    if (!isDrag || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    setDragDistance(prev => prev + Math.abs(walk));
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTabClick = (tabId: TabId) => {
    if (dragDistance > 10) return; // Prevent click if user was dragging
    setActiveTab(tabId);
  };

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
          
          {/* Header */}
          <header className="pt-12 pb-4 px-6 sticky top-0 z-40 border-b border-border-subtle flex justify-between items-center" style={{ backgroundColor: 'inherit' }}>
            <h1 className="font-heading font-semibold text-lg text-text-main flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-brand-primary flex items-center justify-center shrink-0">
                <div className="w-2 h-2 rounded-sm bg-white" />
              </div>
              Science Club
            </h1>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full bg-bg-surface text-text-muted hover:text-brand-primary transition-colors border border-border-subtle"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </motion.button>
          </header>

          {/* Tab Navigation (Draggable) */}
          <div className="px-4 py-3 shrink-0 border-b border-border-subtle/50" style={{ backgroundColor: 'inherit' }}>
            <div 
              ref={scrollRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeaveOrUp}
              onMouseUp={handleMouseLeaveOrUp}
              onMouseMove={handleMouseMove}
              className={`flex gap-2 overflow-x-auto mockup-scroll pb-2 ${isDrag ? 'cursor-grabbing' : 'cursor-grab'}`}
              style={{ paddingRight: '20px' }}
            >
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => handleTabClick(tab.id as TabId)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all select-none ${
                    activeTab === tab.id 
                      ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                      : 'bg-bg-surface text-text-muted hover:text-text-main border border-border-subtle'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto mockup-scroll relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {activeTab === 'cores' && <ColorsTab />}
                {activeTab === 'tipografia' && <TypographyTab />}
                {activeTab === 'componentes' && <ComponentsTab />}
                {activeTab === 'interacao' && <InteractionsTab />}
                {activeTab === 'layout' && <DashboardTab />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Bar Indicator */}
          <div className="h-6 w-full absolute bottom-0 left-0 bg-gradient-to-t from-bg-base/90 to-transparent flex justify-center items-center pointer-events-none z-40">
            <div className="w-32 h-1.5 rounded-full bg-text-muted/40 mb-2"></div>
          </div>

        </div>
      </div>
    </div>
  );
}
