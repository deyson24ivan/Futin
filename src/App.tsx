import { useEffect, useSyncExternalStore } from 'react';
import { clubStore } from './compat/club-store';
import { notificationStore } from './compat/notification-store';
import type { PageName } from './compat/runtime';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Notifications } from './components/Notifications';
import { Toast } from './components/Toast';

interface AppProps { page: PageName; onHydrated?(): void }

const useClub = () => useSyncExternalStore(clubStore.subscribe, clubStore.getSnapshot, clubStore.getServerSnapshot);
function useHydrated(onHydrated?: () => void) {
  useEffect(() => { onHydrated?.(); }, [onHydrated]);
}

export function SidebarApp({ page, onHydrated }: AppProps) {
  const club = useClub();
  useHydrated(onHydrated);
  return <Sidebar page={page} club={club} />;
}

export function TopbarApp({ page, onHydrated }: AppProps) {
  const club = useClub();
  useHydrated(onHydrated);
  return <Topbar page={page} club={club} onNotifications={() => notificationStore.setOpen(true)} />;
}

export function OverlaysApp({ onHydrated }: Pick<AppProps, 'onHydrated'>) {
  const club = useClub();
  const open = useSyncExternalStore(notificationStore.subscribe, notificationStore.getSnapshot, notificationStore.getServerSnapshot);
  useHydrated(onHydrated);
  return <>
    <Notifications open={open} items={club.notifications} onClose={() => notificationStore.setOpen(false)} />
    <Toast />
  </>;
}
