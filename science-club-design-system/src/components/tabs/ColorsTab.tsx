export default function ColorsTab() {
  const colors = [
    {
      title: 'Brand Primary',
      description: 'Ação principal, energia.',
      bgClass: 'bg-brand-primary',
      hex: '#8B5CF6'
    },
    {
      title: 'Brand Secondary',
      description: 'Apoio, estados suaves.',
      bgClass: 'bg-brand-secondary',
      hex: '#A78BFA'
    },
    {
      title: 'Brand Accent',
      description: 'Destaque, foco.',
      bgClass: 'bg-brand-accent',
      hex: '#6366F1'
    }
  ];

  const neutralsDark = [
    { name: 'Dark Base', hex: '#000000', varName: 'bg-base' },
    { name: 'Dark Surface', hex: '#111111', varName: 'bg-surface' },
    { name: 'Dark Border', hex: '#222222', varName: 'border-subtle' },
    { name: 'Muted Text', hex: '#888888', varName: 'text-muted' },
    { name: 'Main Text', hex: '#FFFFFF', varName: 'text-main' },
  ];

  return (
    <div className="p-6 space-y-8 pb-20">
      <div>
        <h2 className="font-heading text-xl font-semibold text-text-main mb-1">Cores Principais</h2>
        <p className="text-text-muted text-sm mb-6">Paleta principal voltada para energia e foco.</p>
        
        <div className="space-y-4">
          {colors.map((color, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className={`h-24 rounded-2xl ${color.bgClass} shadow-inner flex items-end p-4`}>
                <span className="text-white font-mono text-sm opacity-90 drop-shadow-md">{color.hex}</span>
              </div>
              <div>
                <div className="font-medium text-text-main text-sm">{color.title}</div>
                <div className="text-text-muted text-xs">{color.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-heading text-xl font-semibold text-text-main mb-1">Paleta Neutra</h2>
        <p className="text-text-muted text-sm mb-4">Hierarquia e fundos no modo escuro.</p>
        
        <div className="grid grid-cols-5 gap-2">
          {neutralsDark.map((color, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div 
                className="w-full aspect-square rounded-xl border border-border-subtle"
                style={{ backgroundColor: color.hex }}
              />
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          {neutralsDark.map((color, i) => (
             <div key={i} className="flex justify-between items-center text-xs">
               <span className="text-text-main font-medium">{color.name}</span>
               <span className="text-text-muted font-mono">{color.hex}</span>
             </div>
          ))}
        </div>
      </div>
      
      <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center h-32 relative overflow-hidden group">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <span className="font-heading font-semibold text-white relative z-10 text-lg">Gradiente Ativo</span>
      </div>
    </div>
  );
}
