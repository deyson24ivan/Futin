import type { ClubSnapshot } from '../domain/club';

const fallback: ClubSnapshot = {
  profile: { name: 'Jugador 01', club: 'FUTIN City', joinedAt: 0 },
  balance: 2450,
  notifications: [],
  season: { levelLabel: '01', currentXp: 0, requiredXp: 60, progress: 0, completed: false },
};

const events = ['futin:ready', 'futin:profilechange', 'futin:walletchange', 'futin:notificationschange', 'futin:seasonpasschange', 'storage'];
let current = fallback;

function read(): ClubSnapshot {
  return {
    profile: window.FutinProfile?.get() ?? fallback.profile,
    balance: window.FutinWallet?.get().balance ?? fallback.balance,
    notifications: window.FutinNotifications?.list() ?? fallback.notifications,
    season: window.FutinSeasonPass?.getState() ?? fallback.season,
  };
}

// React reads through the existing economy API. It never writes a second wallet
// or creates new save keys during the migration.
export const clubStore = {
  getSnapshot: () => current,
  getServerSnapshot: () => fallback,
  subscribe(listener: () => void) {
    const update = () => { current = read(); listener(); };
    events.forEach(event => window.addEventListener(event, update));
    update();
    return () => events.forEach(event => window.removeEventListener(event, update));
  },
  markRead(id?: string) { window.FutinNotifications?.markRead(id); },
};
