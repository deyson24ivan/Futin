import { useEffect, useRef } from 'react';
import type { ClubNotification } from '../domain/club';
import { clubStore } from '../compat/club-store';
import { Icon } from './Icon';

const notificationDate = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const safeHref = (href: string) => /^(perfil|monedas|tienda|plantilla|pase|carrera|minijuegos)\.html(?:#[\w-]+)?$/.test(href) ? href : 'perfil.html';

export function Notifications({ open, items, onClose }: { open: boolean; items: ClubNotification[]; onClose(): void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const unread = items.filter(item => !item.read).length;

  useEffect(() => {
    const element = dialog.current;
    if (open && element && !element.open) element.showModal();
    if (!open && element?.open) element.close();
  }, [open]);

  return <dialog ref={dialog} className="club-dialog activity-dialog" aria-labelledby="activity-title" onClose={onClose} onClick={event => {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
  }}>
    <header className="dialog-heading"><div><p className="eyebrow">TU CLUB AL DÍA</p><h2 id="activity-title">NOTIFICACIONES</h2></div><button type="button" className="ui-icon-button" aria-label="Cerrar notificaciones" onClick={onClose}><Icon name="close" /></button></header>
    <div className="activity-toolbar"><span>{unread ? `${unread} sin leer` : 'Todo al día'}</span><button type="button" className="text-link" disabled={!unread} onClick={() => clubStore.markRead()}>Marcar todas como leídas</button></div>
    <div>{items.length ? items.map(item => <a key={item.id} className={`activity-item${item.read ? '' : ' is-unread'}`} href={safeHref(item.href)} onClick={() => clubStore.markRead(item.id)}>
      <span className="activity-icon"><Icon name={item.type} /></span>
      <span><strong>{item.title}</strong><p>{item.text}</p><small>{Number.isFinite(item.date) ? notificationDate.format(new Date(item.date)) : ''}</small></span>
    </a>) : <div className="club-empty"><Icon name="bell" /><h3>Estás al día</h3><p>Tus compras, recompensas y avances aparecerán aquí.</p></div>}</div>
  </dialog>;
}
