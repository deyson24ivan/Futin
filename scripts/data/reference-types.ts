/** Contracts for source provenance; these records are separate from game ratings. */
export interface LeagueReference {
 id: string; name: string; country: string; page: string; expectedTeams: number;
 sourceUrl?: string; sourceRevision?: number; teamCount?: number;
}
export interface NamedId {id: string; name: string}
export interface Source {provider: string; url: string; revision: number | null; license: string}
export interface ClubReference {
 id: string; name: string; leagueId: string; country: string; season: string;
 wikipediaTitle: string; sourceUrl: string; sourceRevision: number; license: string;
 firstTeamCount: number; totalListedCount: number; wikidataId?: string | null;
 stadiums?: NamedId[]; headquarters?: NamedId[]; inception?: string | null; biographicalLicense?: string | null;
}
export interface SquadPlayer {
 name: string; title: string | null; shirtNumber: number | null; position: string;
 positionSource: string; sportingNationality: string; status: string; section: string;
}
export interface CollectedPlayer extends SquadPlayer {provisionalId: string; club: ClubReference}
export interface Registration {
 playerId: string; clubId: string; leagueId: string; season: string; status: string;
 shirtNumber: number | null; rosterSection: string; sourceUrl: string; sourceRevision: number; license: string;
}
export interface ReferencePlayer {
 id: string; originalName: string; futinName: string; birthDate: string | null;
 birthYear: number | null; birthDateCandidates: string[]; age: number | null; ageReferenceDate: string;
 sportingNationality: string; citizenshipIds: string[]; citizenships: NamedId[];
 position: string; positionIds: string[]; detailedPositions: NamedId[]; heightCm: number | null;
 wikipediaUrl: string | null; wikidataId: string | null; wikidataRevision: number | null;
 biographicalLicense: string | null; rosterLicense: string; birthDateSource?: Source | null;
 overall: number | null; potential: number | null; pace: number | null; shooting: number | null;
 passing: number | null; dribbling: number | null; defending: number | null; physical: number | null;
 goalkeeping: number | null; value: number | null; cardDesign: string | null; portrait: string | null;
}
export interface CollectionIssue {
 type: string; club?: string; count?: number; sourceUrl?: string; playerId?: string;
 name?: string; candidates?: string[]; sourceUrls?: string[];
}
export interface TimeValue {time: string; precision: number; before: number; after: number; calendarmodel: string}
export interface QuantityValue {amount: string; unit: string}
export interface EntityValue {id: string}
export interface ClaimValueMap {P569: TimeValue; P571: TimeValue; P2048: QuantityValue; P27: EntityValue; P413: EntityValue; P115: EntityValue; P159: EntityValue}
export interface WikidataClaim {
 rank: string; mainsnak: {snaktype: string; datavalue?: {value: TimeValue | QuantityValue | EntityValue}};
}
export interface WikidataEntity {
 lastrevid?: number; labels?: {es?: {value: string}; en?: {value: string}};
 claims?: Record<string, WikidataClaim[]>;
}
export interface WikiPage {
 title: string; pageprops?: {wikibase_item?: string};
 revisions?: {revid: number; slots?: {main?: {'*'?: string}}}[];
}
export interface ApiResponse {
 error?: {code: string; info: string};
 parse?: {title: string; text: {'*': string}; revid: number};
 query?: {pages: Record<string, WikiPage>; normalized?: {from: string; to: string}[]; redirects?: {from: string; to: string}[]};
 entities?: Record<string, WikidataEntity>;
}
