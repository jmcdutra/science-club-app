export default function TypographyTab() {
  return (
    <div className="p-6 space-y-10 pb-20">
      <div>
        <h2 className="font-heading text-xl font-semibold text-brand-primary mb-6">Tipografia</h2>
        
        <div className="space-y-6">
          <div className="border-b border-border-subtle pb-6">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-2">Display / Headings (Outfit)</p>
            <h1 className="font-heading text-4xl font-semibold text-text-main leading-tight">Treino de Hoje</h1>
          </div>

          <div className="border-b border-border-subtle pb-6">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-2">H2 Section (Outfit)</p>
            <h2 className="font-heading text-2xl font-medium text-text-main">Metas da Semana</h2>
          </div>

          <div className="border-b border-border-subtle pb-6">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-2">H3 Card Title (Outfit)</p>
            <h3 className="font-heading text-lg font-medium text-text-main">Supino Reto</h3>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-heading text-lg font-semibold text-brand-primary mb-6">Interface / Dados</h3>
        
        <div className="space-y-6">
          <div className="border-b border-border-subtle pb-6">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-2">Body Regular (Inter)</p>
            <p className="font-sans text-base text-text-main leading-relaxed">
              O design deve transmitir tecnologia, organização e performance, com uma estética limpa e altamente funcional.
            </p>
          </div>

          <div className="border-b border-border-subtle pb-6">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-2">Caption / Muted (Inter)</p>
            <p className="font-sans text-sm text-text-muted">
              Última atualização há 2 minutos
            </p>
          </div>

          <div className="border-b border-border-subtle pb-6">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-2">Dados / Numbers (Inter)</p>
            <div className="flex items-baseline gap-1">
              <span className="font-sans font-bold text-3xl text-text-main tracking-tight">85</span>
              <span className="font-sans font-medium text-sm text-brand-primary">kg</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
