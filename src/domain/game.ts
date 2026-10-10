export type CardType = 'bronze' | 'silver' | 'gold' | 'elite' | 'special' | 'other';
export type StatLabel = 'RIT' | 'TIR' | 'PAS' | 'REG' | 'DEF' | 'FIS';
export type PlayerZone = 'starter' | 'bench' | 'reserve' | 'club' | 'transfer';
export interface Player {
  id: string; name: string; rating: number; position: string; rarity: string;
  stats: number[]; cardDesign: string; country: string; club: string; initials: string;
  baseId?: string; zone: PlayerZone; slot: number; countryCode?: string;
  photo?: string; portrait?: string; special?: boolean;
}
export type CardPlayer = Partial<Omit<Player, 'rating'>> & {
  rating?: number | string; overall?: number; cardStats?: Partial<Record<StatLabel, number | string>>;
  clubCrest?: string; crest?: string; tier?: string; category?: string; finish?: string;
  version?: string; isSpecial?: boolean;
};
export interface CardOptions { type?: string; special?: boolean; empty?: boolean }
export interface Roster { formation: string; activeInventory: string; players: Player[] }
export type CatalogPlayer = Omit<Player, 'zone' | 'slot'>;
export interface Movement { id: string; type: string; amount: number; label: string; date: number }
export interface Economy {
  balance: number; packs: Record<string, number>; ledger: Movement[];
  paid: Record<string, {amount: number; date: number}>; pendingCards: Player[];
}
export type AwardCategory = 'collection' | 'career' | 'minigame';
export interface DailyAwards {date: string; earned: Partial<Record<AwardCategory, number>>}
export interface DailyAttempts {date: string; attempts: number}
export interface GoalCell {index: number; safe: boolean; chosen: boolean}
export interface PenaltyRun {
 id: string; date: string; status: string; phase: string; round: number; securedRound: number;
 cells: GoalCell[]; revealed: boolean; payoutGems?: number; payoutXp?: number; outcome?: string; settledAt?: number;
}
export type GuessPlayer = Pick<Player, 'id' | 'name' | 'rating' | 'position' | 'rarity' | 'stats' | 'country' | 'club'> & Pick<Player, 'countryCode' | 'photo' | 'portrait'>;
export interface GuessRun {
 id: string; date: string; targetId: string; playerSnapshot: GuessPlayer; status: string; errors: number;
 guessed: string[]; lastMiss?: string; payoutGems?: number; payoutXp?: number;
}
export type ThemeMode = 'light' | 'dark' | 'auto';
