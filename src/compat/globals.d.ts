import type { ClubNotification, Profile, SeasonProgress } from '../domain/club';

declare global {
  interface Window {
    FutinProfile?: { get(): Profile };
    FutinWallet?: { get(): { balance: number } };
    FutinNotifications?: { list(): ClubNotification[]; markRead(id?: string): void };
    FutinSeasonPass?: { getState(): SeasonProgress };
    FutinToast?: (message: string, error?: boolean) => void;
    FutinTheme?: { getMode(): 'light' | 'dark' | 'auto'; setMode(mode: 'light' | 'dark' | 'auto'): void };
  }
}

export {};
