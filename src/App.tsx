import { useState, useCallback, useRef } from 'react';
import { useGameData } from './hooks/useGameData';
import {
  Team,
  Player,
  Coach,
  SlotKey,
  TeamPicks,
  GamePhase,
  SLOT_KEYS,
  POSITION_MAP,
} from './types';
import TeamCard from './components/TeamCard';
import TeamSpinner from './components/TeamSpinner';
import PlayerCardGrid from './components/PlayerCardGrid';
import './App.css';

const INITIAL_PICKS: TeamPicks = {
  QB: null,
  RB: null,
  WR: null,
  TE: null,
  DEF: null,
  HC: null,
};

export default function App() {
  const { teams, playersByTeam, coachesByTeam, isLoading, loadingProgress } = useGameData();
  const [phase, setPhase] = useState<GamePhase>('loading');
  const [picks, setPicks] = useState<TeamPicks>({ ...INITIAL_PICKS });
  const [usedTeamIds, setUsedTeamIds] = useState<string[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const assetsReadyRef = useRef(false);

  const openSlots = SLOT_KEYS.filter((k) => picks[k] === null);
  const isComplete = openSlots.length === 0;

  // Transition from loading to ready when data is loaded
  if (!isLoading && phase === 'loading') {
    setPhase('ready');
  }

  const handleSpinStart = useCallback((team: Team) => {
    assetsReadyRef.current = false;
    // Only preload headshots for players in positions the user still needs
    const players = playersByTeam.get(team.id) ?? [];
    const eligible = players.filter((p) => {
      const slot = POSITION_MAP[p.position];
      return slot && openSlots.includes(slot);
    });
    const headshotUrls = eligible
      .map((p) => p.headshot)
      .filter((url): url is string => !!url);

    if (headshotUrls.length === 0) {
      assetsReadyRef.current = true;
      return;
    }

    let loaded = 0;
    for (const url of headshotUrls) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = img.onerror = () => {
        loaded++;
        if (loaded >= headshotUrls.length) {
          assetsReadyRef.current = true;
        }
      };
      img.src = url;
    }
  }, [playersByTeam, openSlots]);

  const checkAssetsReady = useCallback(() => assetsReadyRef.current, []);

  const handleTeamSelected = useCallback((team: Team) => {
    setCurrentTeam(team);
    setPhase('picking');
  }, []);

  const lockInPick = useCallback((slot: SlotKey, pick: { player?: Player; coach?: Coach; defense?: Team }) => {
    if (!currentTeam) return;
    const draftOrder = 6 - openSlots.length + 1;
    setPicks((prev) => ({ ...prev, [slot]: { ...pick, draftOrder } }));
    setUsedTeamIds((prev) => [...prev, currentTeam.id]);
    setCurrentTeam(null);
    const remaining = openSlots.filter((s) => s !== slot);
    setPhase(remaining.length === 0 ? 'complete' : 'ready');
  }, [currentTeam, openSlots]);

  const handlePlayerSelect = useCallback(
    (player: Player, slot: SlotKey) => {
      lockInPick(slot, { player });
    },
    [lockInPick]
  );

  const handleDefenseSelect = useCallback(() => {
    if (!currentTeam) return;
    lockInPick('DEF', { defense: currentTeam });
  }, [currentTeam, lockInPick]);

  const handleCoachSelect = useCallback(() => {
    if (!currentTeam) return;
    const coach = coachesByTeam.get(currentTeam.id);
    if (!coach) return;
    lockInPick('HC', { coach });
  }, [currentTeam, coachesByTeam, lockInPick]);

  const handleStartOver = useCallback(() => {
    setPicks({ ...INITIAL_PICKS });
    setUsedTeamIds([]);
    setCurrentTeam(null);
    setPhase('ready');
  }, []);

  if (phase === 'loading') {
    return (
      <div className="app">
        <div className="loading-screen">
          <div className="loading-logo">🏈</div>
          <h1 className="loading-title">BUILD YOUR 17-0 TEAM</h1>
          <div className="loading-bar-track">
            <div className="loading-bar-fill" />
          </div>
          <div className="loading-text">{loadingProgress}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">BUILD YOUR <span className="app-title-accent">17-0</span> TEAM</h1>
        {phase !== 'complete' && (
          <div className="app-round">
            PICK {6 - openSlots.length + 1} OF 6
          </div>
        )}
      </header>

      <TeamCard picks={picks} isComplete={isComplete} />

      {phase === 'ready' && (
        <TeamSpinner
          teams={teams}
          usedTeamIds={usedTeamIds}
          onSpinStart={handleSpinStart}
          onTeamSelected={handleTeamSelected}
          checkAssetsReady={checkAssetsReady}
          disabled={false}
          autoSpin
        />
      )}

      {phase === 'picking' && currentTeam && (
        <PlayerCardGrid
          players={playersByTeam.get(currentTeam.id) ?? []}
          team={currentTeam}
          coach={coachesByTeam.get(currentTeam.id)}
          openSlots={openSlots}
          onSelectPlayer={handlePlayerSelect}
          onSelectDefense={handleDefenseSelect}
          onSelectCoach={handleCoachSelect}
        />
      )}

      {phase === 'complete' && (
        <div className="complete-banner">
          <div className="complete-text">YOUR 17-0 ROSTER IS SET</div>
          <button className="new-game-btn" onClick={handleStartOver}>
            NEW GAME
          </button>
        </div>
      )}

      {phase !== 'complete' && (
        <button className="start-over-btn" onClick={handleStartOver}>
          START OVER
        </button>
      )}
    </div>
  );
}
