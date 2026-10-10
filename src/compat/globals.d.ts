import type { Player } from '../domain/game';

declare global {
  interface Window {
    FutinToast?: (message: string, error?: boolean) => void;
  }
  interface WindowEventMap {
    'futin:playerunlocked': CustomEvent<{player: Partial<Player>; playerId: string}>;
    'futin:penaltyshot': CustomEvent<{index: number; safe: boolean}>;
    'futin:rosterchange': CustomEvent;
  }
}

export {};
