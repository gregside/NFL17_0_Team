import { Team, Player, Coach } from '../types';

const TEAMS_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams';
const ROSTER_URL = (teamId: string) =>
  `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}/roster`;

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

interface RosterResult {
  players: Player[];
  coach: Coach | null;
}

export async function fetchRoster(teamId: string, team: Team): Promise<RosterResult> {
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

  const coachData = data.coach?.[0] ?? null;
  const coach: Coach | null = coachData
    ? {
        id: coachData.id,
        firstName: coachData.firstName,
        lastName: coachData.lastName,
        fullName: `${coachData.firstName} ${coachData.lastName}`,
        teamId: team.id,
        teamName: team.displayName,
        teamAbbreviation: team.abbreviation,
        teamLogo: team.logo,
        teamColor: team.color,
      }
    : null;

  return { players, coach };
}

export async function fetchAllRosters(
  teams: Team[],
  onProgress?: (loaded: number, total: number) => void
): Promise<{ playersByTeam: Map<string, Player[]>; coachesByTeam: Map<string, Coach> }> {
  const playersByTeam = new Map<string, Player[]>();
  const coachesByTeam = new Map<string, Coach>();
  const batchSize = 8;

  for (let i = 0; i < teams.length; i += batchSize) {
    const batch = teams.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (team) => {
        try {
          const roster = await fetchRoster(team.id, team);
          return { teamId: team.id, ...roster };
        } catch {
          return { teamId: team.id, players: [], coach: null };
        }
      })
    );
    for (const r of results) {
      playersByTeam.set(r.teamId, r.players);
      if (r.coach) {
        coachesByTeam.set(r.teamId, r.coach);
      }
    }
    onProgress?.(Math.min(i + batchSize, teams.length), teams.length);
  }

  return { playersByTeam, coachesByTeam };
}
