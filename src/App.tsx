import { useState, useCallback } from 'react';
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
import PlayerSearch from './components/PlayerSearch';
import QuickPicks from './components/QuickPicks';
import ConfirmPick from './components/ConfirmPick';
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

  const [pendingSlot, setPendingSlot] = useState<SlotKey | null>(null);
  const [pendingPlayer, setPendingPlayer] = useState<Player | undefined>();
  const [pendingCoach, setPendingCoach] = useState<Coach | undefined>();
  const [pendingDefense, setPendingDefense] = useState<Team | undefined>();

  const openSlots = SLOT_KEYS.filter((k) => picks[k] === null);
  const isComplete = openSlots.length === 0;

  // Transition from loading to ready when data is loaded
  if (!isLoading && phase === 'loading') {
    setPhase('ready');
  }

  const handleTeamSelected = useCallback((team: Team) => {
    setCurrentTeam(team);
    setPhase('picking');
  }, []);

  const handlePlayerSelect = useCallback(
    (player: Player, slot: SlotKey) => {
      setPendingSlot(slot);
      setPendingPlayer(player);
      setPendingCoach(undefined);
      setPendingDefense(undefined);
      setPhase('confirming');
    },
    []
  );

  const handleDefenseSelect = useCallback(() => {
    if (!currentTeam) return;
    setPendingSlot('DEF');
    setPendingPlayer(undefined);
    setPendingCoach(undefined);
    setPendingDefense(currentTeam);
    setPhase('confirming');
  }, [currentTeam]);

  const handleCoachSelect = useCallback(() => {
    if (!currentTeam) return;
    const coach = coachesByTeam.get(currentTeam.id);
    if (!coach) return;
    setPendingSlot('HC');
    setPendingPlayer(undefined);
    setPendingCoach(coach);
    setPendingDefense(undefined);
    setPhase('confirming');
  }, [currentTeam, coachesByTeam]);

  const handleConfirm = useCallback(() => {
    if (!pendingSlot || !currentTeam) return;

    setPicks((prev) => ({
      ...prev,
      [pendingSlot]: {
        player: pendingPlayer,
        coach: pendingCoach,
        defense: pendingDefense,
      },
    }));
    setUsedTeamIds((prev) => [...prev, currentTeam.id]);

    setPendingSlot(null);
    setPendingPlayer(undefined);
    setPendingCoach(undefined);
    setPendingDefense(undefined);
    setCurrentTeam(null);

    const remainingSlots = openSlots.filter((s) => s !== pendingSlot);
    if (remainingSlots.length === 0) {
      setPhase('complete');
    } else {
      setPhase('ready');
    }
  }, [pendingSlot, pendingPlayer, pendingCoach, pendingDefense, currentTeam, openSlots]);

  const handleCancelConfirm = useCallback(() => {
    setPendingSlot(null);
    setPendingPlayer(undefined);
    setPendingCoach(undefined);
    setPendingDefense(undefined);
    setPhase('picking');
  }, []);

  const handleStartOver = useCallback(() => {
    setPicks({ ...INITIAL_PICKS });
    setUsedTeamIds([]);
    setCurrentTeam(null);
    setPendingSlot(null);
    setPendingPlayer(undefined);
    setPendingCoach(undefined);
    setPendingDefense(undefined);
    setPhase('ready');
  }, []);

  const currentPlayers = currentTeam
    ? (playersByTeam.get(currentTeam.id) ?? []).filter((p) => {
        const slot = POSITION_MAP[p.position];
        return slot && openSlots.includes(slot);
      })
    : [];

  const offensiveOpenSlots = openSlots.filter(
    (s) => s !== 'DEF' && s !== 'HC'
  );

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
          onTeamSelected={handleTeamSelected}
          disabled={false}
        />
      )}

      {phase === 'picking' && currentTeam && (
        <div className="picking-area">
          <QuickPicks
            team={currentTeam}
            coach={coachesByTeam.get(currentTeam.id)}
            openSlots={openSlots}
            onSelectDefense={handleDefenseSelect}
            onSelectCoach={handleCoachSelect}
          />
          {offensiveOpenSlots.length > 0 && (
            <PlayerSearch
              players={currentPlayers}
              openSlots={offensiveOpenSlots}
              onSelect={handlePlayerSelect}
              teamColor={currentTeam.color}
              teamName={currentTeam.displayName}
            />
          )}
        </div>
      )}

      {phase === 'confirming' && pendingSlot && currentTeam && (
        <ConfirmPick
          slot={pendingSlot}
          player={pendingPlayer}
          coach={pendingCoach}
          defense={pendingDefense}
          teamColor={currentTeam.color}
          onConfirm={handleConfirm}
          onCancel={handleCancelConfirm}
        />
      )}

      {phase === 'complete' && (
        <div className="complete-banner">
          <div className="complete-text">🏆 YOUR 17-0 ROSTER IS SET 🏆</div>
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
