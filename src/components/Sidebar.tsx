import type { ClubSnapshot } from '../domain/club';
import type { PageName } from '../compat/runtime';
import { Icon, type IconName } from './Icon';

const navigation: { page: PageName; label: string; icon?: IconName }[] = [
  { page: 'index', label: 'Inicio', icon: 'home' },
  { page: 'plantilla', label: 'Mi equipo', icon: 'team' },
  { page: 'cartas', label: 'Jugadores', icon: 'player' },
  { page: 'tienda', label: 'Tienda', icon: 'store' },
  { page: 'pase', label: 'Pase de temporada', icon: 'season' },
  { page: 'carrera', label: 'Modo carrera', icon: 'career' },
  { page: 'minijuegos', label: 'Minijuegos' },
];

export const initials = (name: string) => name.trim().split(/\s+/).map(part => part[0]).slice(0, 2).join('').toLocaleUpperCase('es');
export const formatNumber = (value: number) => new Intl.NumberFormat('es-CO').format(value);

export function Sidebar({ page, club }: { page: PageName; club: ClubSnapshot }) {
  return <>
    <a className="brand" href="index.html" aria-label="FUTIN, inicio">
      <img className="brand-mark" src="futin-mark.svg?v=10" alt="" />
      <span>FUTIN<span className="brand-period">.</span></span>
    </a>
    <div className="nav-label">MENÚ</div>
    <nav className="main-nav">
      {navigation.map(item => <a key={item.page} className={`nav-link${page === item.page ? ' is-active' : ''}`} href={`${item.page}.html`} aria-current={page === item.page ? 'page' : undefined}>
        <span className="nav-icon">{item.icon ? <Icon name={item.icon} className="" /> : <img src="assets/ui/controller-premium.svg?v=10" alt="" />}</span>{item.label}
      </a>)}
    </nav>
    <div className="sidebar-bottom">
      <a className="season-card" href="pase.html" aria-label="Ver pase de temporada">
        <div className="season-top"><span className="live-dot" /> TEMPORADA 01</div>
        <strong>El camino<br />a la gloria</strong>
        <div className="season-progress"><span style={{ width: `${club.season.progress * 100}%` }} /></div>
        <div className="season-meta"><span>Nivel <b>{club.season.levelLabel}</b></span><span><b>{formatNumber(club.season.currentXp)}</b>/<b>{club.season.completed ? '—' : formatNumber(club.season.requiredXp)}</b> XP</span></div>
        <img className="sidebar-season-crest" src="assets/premium/glory-crest.png?v=10" alt="" decoding="async" draggable={false} />
      </a>
      <a className="profile-mini" href="perfil.html">
        <span className="avatar">{initials(club.profile.name)}</span>
        <span className="profile-copy"><strong>{club.profile.name}</strong><small>{club.profile.club}</small></span>
        <span className="profile-more">···</span>
      </a>
    </div>
  </>;
}
