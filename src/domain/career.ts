export type Tactic = 'balanced' | 'defensive' | 'attack';
export interface CareerPlayer {
  id: string; name: string; teamId: string | null; position: string;
  overall: number; potential: number; age: number; xp: number; value: number;
  pace: number; shooting: number; passing: number; defending: number;
  physical: number; goalkeeping: number; appearances: number; goals: number; assists: number;
  squadSlot?: number; countryCode?: string; country?: string; nationality?: string;
  portrait?: string; photo?: string; dribbling?: number;
}
export interface CareerTeam {id: string; name: string; shortName: string; rating: number; players: CareerPlayer[]}
export interface CareerLeague {id: string; name: string; country: string; teams: CareerTeam[]}
export interface MatchEvent {
  minute: number; type: string; side?: string; assistName?: string | null; text?: string; teamId?: string; playerId?: string;
  playerName?: string; assistId?: string; possessionTeamId?: string;
  homeTactic?: Tactic; awayTactic?: Tactic;
}
export interface Fixture {
  id: string; round: number; homeId: string; awayId: string; status: string;
  homeGoals: number | null; awayGoals: number | null; events: MatchEvent[];
  homeXg?: number; awayXg?: number;
}
export interface CareerSettings {matchSpeed: string}
export interface Academy {month: number; candidates: CareerPlayer[]; signedThisMonth: boolean}
export interface CareerState {
  version: number; league: CareerLeague; season: number; currentRound: number;
  selectedClubId: string; teamFormation: string; fixtures: Fixture[];
  lastRoundSummary: Fixture[]; settings: CareerSettings; academy: Academy; updatedAt: number;
}
export interface CareerSlot {
  id: string; state: CareerState | null; name?: string; teamName?: string;
  leagueName?: string; season?: number; currentRound?: number;
}
export interface Chance {
  id: string; teamId: string; opponentId: string; shooterId: string; shooterName: string;
  shooterPosition: string; keeperId: string; keeperName: string; userIsAttacking: boolean;
  isGreatChance: boolean; probability: number; goalChance: number; type: string; minute: number;
  outcome?: string; success?: boolean; teamName?: string;
}
export interface MatchStats {
  homeShots: number; awayShots: number; homeOnTarget: number; awayOnTarget: number;
  homePossession: number; awayPossession: number; homePossessionTicks: number; awayPossessionTicks: number;
}
export interface MatchSession {
  round: number; fixtureId: string; homeId: string; awayId: string; homeName: string;
  awayName: string; homeShortName: string; awayShortName: string; homeRating: number;
  awayRating: number; userTeamId: string; minute: number; homeGoals: number; awayGoals: number;
  finished: boolean; homeTactic: Tactic; awayTactic: Tactic; possessionTeamId: string;
  stats: MatchStats; events: MatchEvent[]; pendingChance: Chance | null; cpuResults: Fixture[];
}
export interface ByeRound {round: number; bye: true; cpuResults: Fixture[]}
export type DemoClub = [id: string, name: string, shortName: string, rating: number];
export interface DemoLeague {id: string; name: string; country: string; clubs: DemoClub[]}
