import { useState } from 'react';
import { Player, Coach, Team, SlotKey, POSITION_MAP } from '../types';
import './PlayerCardGrid.css';

interface PlayerCardGridProps {
  players: Player[];
  team: Team;
  coach: Coach | undefined;
  openSlots: SlotKey[];
  onSelectPlayer: (player: Player, slot: SlotKey) => void;
  onSelectDefense: () => void;
  onSelectCoach: () => void;
}

type PositionGroup = {
  slot: SlotKey;
  label: string;
  items: CardItem[];
};

type CardItem =
  | { type: 'player'; player: Player; slot: SlotKey }
  | { type: 'defense'; team: Team }
  | { type: 'coach'; coach: Coach };

export default function PlayerCardGrid({
  players,
  team,
  coach,
  openSlots,
  onSelectPlayer,
  onSelectDefense,
  onSelectCoach,
}: PlayerCardGridProps) {
  const [activeFilter, setActiveFilter] = useState<SlotKey | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const groups: PositionGroup[] = [];

  // Build player groups for offensive positions
  const offensiveSlots: SlotKey[] = ['QB', 'RB', 'WR', 'TE'];
  for (const slot of offensiveSlots) {
    if (!openSlots.includes(slot)) continue;
    const slotPlayers = players.filter((p) => POSITION_MAP[p.position] === slot);
    if (slotPlayers.length === 0) continue;
    groups.push({
      slot,
      label: slot === 'QB' ? 'QUARTERBACKS' : slot === 'RB' ? 'RUNNING BACKS' : slot === 'WR' ? 'WIDE RECEIVERS' : 'TIGHT ENDS',
      items: slotPlayers.map((p) => ({ type: 'player', player: p, slot })),
    });
  }

  // DEF group
  if (openSlots.includes('DEF')) {
    groups.push({
      slot: 'DEF',
      label: 'DEFENSE',
      items: [{ type: 'defense', team }],
    });
  }

  // HC group
  if (openSlots.includes('HC') && coach) {
    groups.push({
      slot: 'HC',
      label: 'HEAD COACH',
      items: [{ type: 'coach', coach }],
    });
  }

  const filteredGroups = groups
    .filter((g) => activeFilter === 'ALL' || g.slot === activeFilter)
    .map((g) => {
      if (!searchQuery.trim()) return g;
      const q = searchQuery.toLowerCase();
      const filtered = g.items.filter((item) => {
        if (item.type === 'player') return item.player.fullName.toLowerCase().includes(q);
        if (item.type === 'coach') return item.coach.fullName.toLowerCase().includes(q);
        if (item.type === 'defense') return item.team.displayName.toLowerCase().includes(q);
        return true;
      });
      return { ...g, items: filtered };
    })
    .filter((g) => g.items.length > 0);

  const handleCardClick = (item: CardItem) => {
    if (item.type === 'player') onSelectPlayer(item.player, item.slot);
    else if (item.type === 'defense') onSelectDefense();
    else if (item.type === 'coach') onSelectCoach();
  };

  return (
    <div className="card-grid-container">
      <div className="card-grid-header">
        <div className="card-grid-title">
          SELECT FROM THE <span style={{ color: `#${team.color}` }}>{team.displayName.toUpperCase()}</span>
        </div>
        <div className="card-grid-search-wrap">
          <svg className="card-grid-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="card-grid-search"
            placeholder="Filter by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="card-grid-search-clear" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>
      </div>

      <div className="card-grid-filters">
        <button
          className={`card-grid-filter-chip ${activeFilter === 'ALL' ? 'active' : ''}`}
          onClick={() => setActiveFilter('ALL')}
        >
          ALL
        </button>
        {groups.map((g) => (
          <button
            key={g.slot}
            className={`card-grid-filter-chip ${activeFilter === g.slot ? 'active' : ''}`}
            style={activeFilter === g.slot ? { backgroundColor: `#${team.color}`, borderColor: `#${team.color}` } : undefined}
            onClick={() => setActiveFilter(g.slot)}
          >
            {g.slot === 'DEF' ? 'DS/T' : g.slot}
          </button>
        ))}
      </div>

      <div className="card-grid-body">
        {filteredGroups.length === 0 ? (
          <div className="card-grid-empty">No matching players found</div>
        ) : (
          filteredGroups.map((group) => (
            <div key={group.slot} className="card-grid-group">
              <div className="card-grid-group-label">
                <span className="card-grid-group-line" />
                <span className="card-grid-group-text">{group.label}</span>
                <span className="card-grid-group-count">{group.items.length}</span>
                <span className="card-grid-group-line" />
              </div>
              <div className="card-grid-cards">
                {group.items.map((item) => {
                  const key =
                    item.type === 'player' ? item.player.id
                    : item.type === 'defense' ? `def-${item.team.id}`
                    : `hc-${item.coach.id}`;

                  return (
                    <button
                      key={key}
                      className="player-card"
                      onClick={() => handleCardClick(item)}
                    >
                      <div className="player-card-img-area" style={{ backgroundColor: `#${team.color}15` }}>
                        {item.type === 'player' && item.player.headshot ? (
                          <img src={item.player.headshot} alt={item.player.fullName} className="player-card-headshot" crossOrigin="anonymous" />
                        ) : item.type === 'player' ? (
                          <div className="player-card-jersey" style={{ color: `#${team.color}` }}>
                            #{item.player.jersey || '?'}
                          </div>
                        ) : item.type === 'defense' ? (
                          <img src={item.team.logo} alt={item.team.displayName} className="player-card-team-logo" crossOrigin="anonymous" />
                        ) : (
                          <div className="player-card-initials" style={{ backgroundColor: `#${team.color}` }}>
                            {item.coach.firstName[0]}{item.coach.lastName[0]}
                          </div>
                        )}
                      </div>
                      <div className="player-card-info">
                        <div className="player-card-name">
                          {item.type === 'player' ? item.player.fullName
                            : item.type === 'defense' ? `${team.shortDisplayName} DS/T`
                            : item.coach.fullName}
                        </div>
                        <div className="player-card-meta">
                          {item.type === 'player' ? `${item.player.position} · #${item.player.jersey}`
                            : item.type === 'defense' ? 'TEAM DEFENSE'
                            : 'HEAD COACH'}
                        </div>
                      </div>
                      <div className="player-card-slot-badge" style={{ backgroundColor: `#${team.color}` }}>
                        {item.type === 'player' ? POSITION_MAP[item.player.position]
                          : item.type === 'defense' ? 'DEF'
                          : 'HC'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
