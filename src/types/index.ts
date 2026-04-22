export interface Team {
  id: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  color: string;
  alternateColor: string;
  logo: string;
}

export interface Player {
  id: string;
  fullName: string;
  position: string;
  jersey: string;
  headshot?: string;
  teamId: string;
  teamName: string;
  teamAbbreviation: string;
  teamLogo: string;
  teamColor: string;
}

export interface Coach {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  teamId: string;
  teamName: string;
  teamAbbreviation: string;
  teamLogo: string;
  teamColor: string;
}

export type SlotKey = 'QB' | 'RB' | 'WR' | 'TE' | 'DEF' | 'HC';

export interface SlotPick {
  player?: Player;
  coach?: Coach;
  defense?: Team;
  draftOrder?: number;
}

export type TeamPicks = Record<SlotKey, SlotPick | null>;

export type GamePhase = 'loading' | 'ready' | 'spinning' | 'picking' | 'complete';

export const SLOT_KEYS: SlotKey[] = ['QB', 'RB', 'WR', 'TE', 'DEF', 'HC'];

export const POSITION_MAP: Record<string, SlotKey> = {
  QB: 'QB',
  RB: 'RB',
  HB: 'RB',
  FB: 'RB',
  WR: 'WR',
  TE: 'TE',
};
