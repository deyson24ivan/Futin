import type { ClubSnapshot } from '../domain/club';
import type { PageName } from '../compat/runtime';
import { Icon } from './Icon';
import { formatNumber, initials } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';

const titles: Record<PageName, string> = {
  index: 'CENTRO DE MANDO', plantilla: 'MI EQUIPO', cartas: 'JUGADORES', tienda: 'TIENDA',
  pase: 'PASE DE TEMPORADA', carrera: 'MODO CARRERA', minijuegos: 'MINIJUEGOS', monedas: 'MONEDERO', perfil: 'MI PERFIL',
};

export function Topbar({ page, club, onNotifications }: { page: PageName; club: ClubSnapshot; onNotifications(): void }) {
  const unread = club.notifications.filter(item => !item.read).length;
  return <>
    <div className="breadcrumb"><span>CLUB</span><span className="crumb-slash">/</span> {titles[page]}</div>
    <div className="topbar-actions">
      <ThemeToggle />
      <a className={`coin-pill${page === 'tienda' ? ' wallet-gems' : ''}`} href="monedas.html" aria-label="Ver monedero y comprar monedas">
        <span className="gem-icon" aria-hidden="true" /><strong>{formatNumber(club.balance)}</strong><span className="coin-plus">+</span>
      </a>
      <button type="button" className="icon-button notification-button" aria-label={`Notificaciones, ${unread ? `${unread} sin leer` : 'al día'}`} aria-haspopup="dialog" onClick={onNotifications}>
        <Icon name="bell" /><i hidden={!unread} />
      </button>
      <a className="avatar top-avatar" href="perfil.html" aria-label={`Abrir perfil de ${club.profile.name}`}>{initials(club.profile.name)}</a>
    </div>
  </>;
}
