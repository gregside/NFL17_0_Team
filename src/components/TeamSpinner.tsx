import { useState, useEffect, useCallback, useRef } from 'react';
import { Team } from '../types';
import './TeamSpinner.css';

interface TeamSpinnerProps {
  teams: Team[];
  usedTeamIds: string[];
  onSpinStart: (team: Team) => void;
  onTeamSelected: (team: Team) => void;
  checkAssetsReady: () => boolean;
  disabled: boolean;
  autoSpin?: boolean;
}

export default function TeamSpinner({
  teams,
  usedTeamIds,
  onSpinStart,
  onTeamSelected,
  checkAssetsReady,
  disabled,
  autoSpin = false,
}: TeamSpinnerProps) {
  const [spinning, setSpinning] = useState(false);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [landed, setLanded] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadCountRef = useRef(0);
  const selectedTeamRef = useRef<Team | null>(null);
  const minTicksDoneRef = useRef(false);
  const loadedLogoIds = useRef<Set<string>>(new Set());

  const availableTeams = teams.filter((t) => !usedTeamIds.includes(t.id));
  const activeTeam = teams.find((t) => t.id === activeTeamId) ?? null;

  // Preload all team logos into browser cache
  useEffect(() => {
    if (teams.length === 0) return;
    loadCountRef.current = 0;
    loadedLogoIds.current.clear();
    teams.forEach((team) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        loadedLogoIds.current.add(team.id);
        loadCountRef.current++;
        if (loadCountRef.current >= teams.length) {
          setImagesLoaded(true);
        }
      };
      img.onerror = () => {
        loadCountRef.current++;
        if (loadCountRef.current >= teams.length) {
          setImagesLoaded(true);
        }
      };
      img.src = team.logo;
    });
  }, [teams]);

  const land = useCallback((selectedTeam: Team) => {
    setActiveTeamId(selectedTeam.id);
    setSpinning(false);
    setLanded(true);
    timeoutRef.current = setTimeout(() => {
      onTeamSelected(selectedTeam);
    }, 800);
  }, [onTeamSelected]);

  const spin = useCallback(() => {
    if (spinning || availableTeams.length === 0) return;

    setLanded(false);
    setSpinning(true);
    minTicksDoneRef.current = false;

    const selectedTeam =
      availableTeams[Math.floor(Math.random() * availableTeams.length)];
    selectedTeamRef.current = selectedTeam;

    // Notify parent to start preloading assets
    onSpinStart(selectedTeam);

    const minTicks = 18;
    const delay = 50;
    let tick = 0;

    const doTick = () => {
      // Pick a random team whose logo has loaded (avoid repeating the previous)
      const loadedTeams = teams.filter((t) => loadedLogoIds.current.has(t.id) && t.id !== activeTeamId);
      if (loadedTeams.length > 0) {
        const candidate = loadedTeams[Math.floor(Math.random() * loadedTeams.length)];
        setActiveTeamId(candidate.id);
      }
      tick++;

      if (tick >= minTicks) {
        minTicksDoneRef.current = true;
      }

      // Land when min ticks done and assets are loaded
      if (minTicksDoneRef.current && checkAssetsReady()) {
        land(selectedTeam);
        return;
      }

      intervalRef.current = setTimeout(doTick, delay);
    };

    intervalRef.current = setTimeout(doTick, delay);
  }, [spinning, availableTeams, teams, onSpinStart, activeTeamId, land, checkAssetsReady]);

  // Auto-spin when enabled and images are loaded
  const autoSpinFired = useRef(false);
  useEffect(() => {
    if (autoSpin && imagesLoaded && !autoSpinFired.current && !spinning && !landed) {
      autoSpinFired.current = true;
      spin();
    }
  }, [autoSpin, imagesLoaded, spinning, landed, spin]);

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
              alt=""
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
