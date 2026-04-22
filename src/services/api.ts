import { Team, Player, Coach } from '../types';

const TEAMS_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams';
const ROSTER_URL = (teamId: string) =>
  `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}/roster`;
const COACHES_URL = (year: number) =>
  `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/${year}/coaches?limit=50`;
const COACH_DETAIL_URL = (ref: string) => ref.replace('http://', 'https://');
const SEASON_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';

async function getCurrentSeason(): Promise<number> {
  try {
    const res = await fetch(SEASON_URL);
    const data = await res.json();
    return data.season?.year ?? new Date().getFullYear();
  } catch {
    return new Date().getFullYear();
  }
}

export async function fetchTeams(): Promise<Team[]> {
  const res = await fetch(TEAMS_URL);
  const data = await res.json();
  const teams: Team[] = [];

  for (const sport of data.sports) {
    for (const league of sport.leagues) {
      for (const t of league.teams) {
        const team = t.team;
        const logo = team.logos?.find(
          (l: { rel: string[] }) =>
            l.rel.includes('default') && l.rel.includes('full')
        );
        teams.push({
          id: team.id,
          abbreviation: team.abbreviation,
          displayName: team.displayName,
          shortDisplayName: team.shortDisplayName,
          color: team.color,
          alternateColor: team.alternateColor,
          logo: logo?.href ?? team.logos?.[0]?.href ?? '',
        });
      }
    }
  }

  return teams;
}

export async function fetchRoster(teamId: string, team: Team): Promise<Player[]> {
  const res = await fetch(ROSTER_URL(teamId));
  const data = await res.json();
  const players: Player[] = [];

  for (const group of data.athletes ?? []) {
    for (const item of group.items ?? []) {
      const pos = item.position?.abbreviation ?? '';
      players.push({
        id: item.id,
        fullName: item.fullName ?? `${item.firstName} ${item.lastName}`,
        position: pos,
        jersey: item.jersey ?? '',
        headshot: item.headshot?.href ?? undefined,
        teamId: team.id,
        teamName: team.displayName,
        teamAbbreviation: team.abbreviation,
        teamLogo: team.logo,
        teamColor: team.color,
      });
    }
  }

  return players;
}

export async function fetchAllPlayers(
  teams: Team[],
  onProgress?: (loaded: number, total: number) => void
): Promise<Map<string, Player[]>> {
  const map = new Map<string, Player[]>();
  const batchSize = 8;

  for (let i = 0; i < teams.length; i += batchSize) {
    const batch = teams.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (team) => {
        try {
          const players = await fetchRoster(team.id, team);
          return { teamId: team.id, players };
        } catch {
          return { teamId: team.id, players: [] };
        }
      })
    );
    for (const r of results) {
      map.set(r.teamId, r.players);
    }
    onProgress?.(Math.min(i + batchSize, teams.length), teams.length);
  }

  return map;
}

export async function fetchAllCoaches(teams: Team[]): Promise<Map<string, Coach>> {
  const year = await getCurrentSeason();
  const map = new Map<string, Coach>();

  try {
    const res = await fetch(COACHES_URL(year));
    const data = await res.json();

    const refs: string[] = (data.items ?? []).map(
      (item: { $ref: string }) => item.$ref
    );

    const batchSize = 8;
    for (let i = 0; i < refs.length; i += batchSize) {
      const batch = refs.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(async (ref) => {
          try {
            const r = await fetch(COACH_DETAIL_URL(ref));
            return await r.json();
          } catch {
            return null;
          }
        })
      );

      for (const coach of results) {
        if (!coach) continue;
        // Only include head coaches — they have an 'experience' field;
        // coordinators/assistants do not.
        if (coach.experience === undefined) continue;
        const teamRef: string = coach.team?.$ref ?? '';
        const teamIdMatch = teamRef.match(/teams\/(\d+)/);
        if (!teamIdMatch) continue;
        const teamId = teamIdMatch[1];
        // Don't overwrite if we already have an HC for this team
        if (map.has(teamId)) continue;
        const team = teams.find((t) => t.id === teamId);
        if (!team) continue;

        map.set(teamId, {
          id: coach.id,
          firstName: coach.firstName,
          lastName: coach.lastName,
          fullName: `${coach.firstName} ${coach.lastName}`,
          teamId,
          teamName: team.displayName,
          teamAbbreviation: team.abbreviation,
          teamLogo: team.logo,
          teamColor: team.color,
        });
      }
    }
  } catch (e) {
    console.error('Failed to fetch coaches:', e);
  }

  return map;
}
