import type { ReactNode } from 'react';

const artwork = {
  home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z" /><path d="M8 7.5h.01M16 7.5h.01" /></>,
  team: <><path d="M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0M3 9h3v6H3V9m15 0h3v6h-3V9M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7M12 5v14" /></>,
  player: <><path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0-8 0M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /></>,
  store: <><path d="M6.331 8H17.67a2 2 0 0 1 1.977 2.304l-1.255 8.152a3 3 0 0 1-2.966 2.544H8.574a3 3 0 0 1-2.965-2.544l-1.255-8.152A2 2 0 0 1 6.331 8M9 11V6a3 3 0 0 1 6 0v5" /></>,
  season: <><circle cx="12" cy="8" r="6" /><path d="M8.6 13 8 21l4-2.6 4 2.6-.6-8m-3.4-8.2 1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3Z" /></>,
  career: <><circle cx="12" cy="12" r="9" /><path d="m12 7 4.76 3.45L15 16H9l-1.76-5.55L12 7m0 0V3m3 13 2.5 3m-.74-8.55 3.74-1.45M9.06 16.05 6.5 19m.74-8.55L3.5 9" /></>,
  bell: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 10h18c0-3-3-3-3-10M10 21h4" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  coins: <><circle cx="12" cy="12" r="9" /><path d="M15 7H9v10m0-5h5" /></>,
  pack: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M5 6h14M5 18h14m-7-9 1 2 2 .3-1.5 1.4.4 2.3-1.9-1-1.9 1 .4-2.3L9 11.3l2-.3Z" /></>,
  trophy: <path d="M8 3h8v7a4 4 0 0 1-8 0V3Zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 2v5m-4 2h8" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 2" /></>,
  shield: <path d="m12 2 8 3v6c0 5-4 8-8 11-4-3-8-6-8-11V5l8-3Z" />,
  game: <path d="M7 6h10c3 0 4 2 4 5l1 6c.4 3-2 4-4 2l-3-3H9l-3 3c-2 2-4 .7-4-2l1-6c0-3 1-5 4-5ZM6 10v4m-2-2h4m7-1h.01m3 2h.01" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof artwork;

export function Icon({ name, className = 'ui-icon' }: { name: string; className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true">{artwork[name as IconName] ?? artwork.bell}</svg>;
}
