import { useState, useEffect, useCallback, useRef } from 'react';
import { Team } from '../types';
import './TeamSpinner.css';

interface TeamSpinnerProps {
  teams: Team[];
  usedTeamIds: string[];
  onTeamSelected: (team: Team) => void;
  disabled: boolean;
}

export default function TeamSpinner({
  teams,
  usedTeamIds,
  onTeamSelected,
  disabled,
}: TeamSpinnerProps) {
  const [spinning, setSpinning] = useState(false);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [landed, setLanded] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadCountRef = useRef(0);

  const availableTeams = teams.filter((t) => !usedTeamIds.includes(t.id));
  const activeTeam = teams.find((t) => t.id === activeTeamId) ?? null;

  // Preload all team logos into browser cache
  useEffect(() => {
    if (teams.length === 0) return;
    loadCountRef.current = 0;
    teams.forEach((team) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = img.onerror = () => {
        loadCountRef.current++;
        if (loadCountRef.current >= teams.length) {
          setImagesLoaded(true);
        }
      };
      img.src = team.logo;
    });
  }, [teams]);

  const spin = useCallback(() => {
    if (spinning || availableTeams.length === 0) return;

    setLanded(false);
    setSpinning(true);

    const selectedTeam =
      availableTeams[Math.floor(Math.random() * availableTeams.length)];

    // Build a deterministic sequence of teams to cycle through,
    // ending with the selected team
    const sequence: Team[] = [];
    const totalTicks = 22;
    for (let i = 0; i < totalTicks - 1; i++) {
      let candidate: Team;
      do {
        candidate = teams[Math.floor(Math.random() * teams.length)];
      } while (sequence.length > 0 && candidate.id === sequence[sequence.length - 1].id);
      sequence.push(candidate);
    }
    sequence.push(selectedTeam);

    let tick = 0;
    let delay = 50;

    const doTick = () => {
      setActiveTeamId(sequence[tick].id);
      tick++;

      if (tick >= sequence.length) {
        setSpinning(false);
        setLanded(true);
        timeoutRef.current = setTimeout(() => {
          onTeamSelected(selectedTeam);
        }, 800);
        return;
      }

      // Accelerate for first few ticks, then decelerate
      if (tick < 6) {
        delay = 50;
      } else {
        delay = 50 + (tick - 6) * 18;
      }
      intervalRef.current = setTimeout(doTick, delay);
    };

    intervalRef.current = setTimeout(doTick, delay);
  }, [spinning, availableTeams, teams, onTeamSelected]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="spinner-container">
      <div className={`spinner-display ${spinning ? 'spinner-display--active' : ''} ${landed ? 'spinner-display--landed' : ''}`}>
        {/* Render ALL team logos stacked, toggling visibility via class */}
        <div className="spinner-logos-stack">
          {teams.map((team) => (
            <img
              key={team.id}
              src={team.logo}
              alt={team.displayName}
              crossOrigin="anonymous"
              className={`spinner-logo-item ${team.id === activeTeamId ? 'spinner-logo-item--active' : ''} ${team.id === activeTeamId && landed ? 'spinner-logo-item--landed' : ''}`}
            />
          ))}
        </div>

        {!activeTeam && (
          <div className="spinner-placeholder">
            <div className="spinner-nfl-shield">🏈</div>
          </div>
        )}

        {landed && activeTeam && (
          <div className="spinner-team-name" style={{ color: `#${activeTeam.color}` }}>
            {activeTeam.displayName.toUpperCase()}
          </div>
        )}
      </div>

      {!spinning && !landed && (
        <button
          className="spin-btn"
          onClick={spin}
          disabled={disabled || availableTeams.length === 0 || !imagesLoaded}
        >
          {!imagesLoaded
            ? 'LOADING...'
            : availableTeams.length === 0
              ? 'NO TEAMS LEFT'
              : 'SPIN FOR TEAM'}
        </button>
      )}
    </div>
  );
}
