import { useState, useRef, useEffect } from 'react';
import { Player, SlotKey, POSITION_MAP } from '../types';
import './PlayerSearch.css';

interface PlayerSearchProps {
  players: Player[];
  openSlots: SlotKey[];
  onSelect: (player: Player, slot: SlotKey) => void;
  teamColor: string;
  teamName: string;
}

export default function PlayerSearch({
  players,
  openSlots,
  onSelect,
  teamColor,
  teamName,
}: PlayerSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const eligiblePlayers = players.filter((p) => {
    const slot = POSITION_MAP[p.position];
    return slot && openSlots.includes(slot);
  });

  const filtered = query.trim()
    ? eligiblePlayers.filter((p) =>
        p.fullName.toLowerCase().includes(query.toLowerCase())
      )
    : eligiblePlayers;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (player: Player) => {
    const slot = POSITION_MAP[player.position];
    if (slot) {
      onSelect(player, slot);
      setQuery('');
      setIsOpen(false);
    }
  };

  return (
    <div className="player-search" ref={wrapperRef}>
      <div className="search-header">
        SELECT A PLAYER FROM THE {teamName.toUpperCase()}
      </div>
      <div className="search-slots">
        {openSlots.map((s) => (
          <span key={s} className="search-slot-chip">
            {s === 'DEF' ? 'DS/T' : s}
          </span>
        ))}
        <span className="search-slots-label">OPEN SLOTS</span>
      </div>
      <div className="search-input-wrap" style={{ borderColor: `#${teamColor}` }}>
        <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Search players..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {query && (
          <button className="search-clear" onClick={() => { setQuery(''); setIsOpen(false); }}>
            ×
          </button>
        )}
      </div>
      {isOpen && (
        <div className="search-dropdown">
          {filtered.length === 0 ? (
            <div className="search-empty">No eligible players found</div>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                className="search-result"
                onClick={() => handleSelect(p)}
              >
                <div className="search-result-img">
                  {p.headshot ? (
                    <img src={p.headshot} alt={p.fullName} crossOrigin="anonymous" />
                  ) : (
                    <div className="search-result-placeholder">
                      #{p.jersey}
                    </div>
                  )}
                </div>
                <div className="search-result-info">
                  <div className="search-result-name">{p.fullName}</div>
                  <div className="search-result-meta">
                    {p.position} · #{p.jersey}
                  </div>
                </div>
                <div className="search-result-slot" style={{ backgroundColor: `#${teamColor}` }}>
                  {POSITION_MAP[p.position]}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
