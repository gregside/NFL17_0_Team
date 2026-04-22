import { useState, useEffect } from 'react';
import { fetchTeams, fetchAllPlayers, fetchAllCoaches } from '../services/api';
import { Team, Player, Coach } from '../types';

interface GameData {
  teams: Team[];
  playersByTeam: Map<string, Player[]>;
  coachesByTeam: Map<string, Coach>;
  isLoading: boolean;
  loadingProgress: string;
}

export function useGameData(): GameData {
  const [teams, setTeams] = useState<Team[]>([]);
  const [playersByTeam, setPlayersByTeam] = useState<Map<string, Player[]>>(new Map());
  const [coachesByTeam, setCoachesByTeam] = useState<Map<string, Coach>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState('Loading teams...');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoadingProgress('Fetching teams...');
        const t = await fetchTeams();
        if (cancelled) return;
        setTeams(t);

        setLoadingProgress('Fetching rosters...');
        const players = await fetchAllPlayers(t, (loaded, total) => {
          if (!cancelled) {
            setLoadingProgress(`Fetching rosters (${loaded}/${total})...`);
          }
        });
        if (cancelled) return;
        setPlayersByTeam(players);

        setLoadingProgress('Fetching coaches...');
        const coaches = await fetchAllCoaches(t);
        if (cancelled) return;
        setCoachesByTeam(coaches);

        setIsLoading(false);
      } catch (e) {
        console.error('Failed to load data:', e);
        setLoadingProgress('Failed to load data. Please refresh.');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { teams, playersByTeam, coachesByTeam, isLoading, loadingProgress };
}
