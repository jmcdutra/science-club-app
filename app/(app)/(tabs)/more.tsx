import { AppShell } from '@/src/shared/components/layout/AppShell';
import { AppText } from '@/src/shared/components/ui/AppText';

export default function MoreRoute() {
  return (
    <AppShell title="Mais" subtitle="Atalhos">
      <AppText className="text-text-muted">
        Use o menu Mais na barra inferior para acessar Ranking, Avaliação e Perfil.
      </AppText>
    </AppShell>
  );
}
