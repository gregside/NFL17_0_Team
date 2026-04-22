import { Team, Coach, SlotKey } from '../types';
import './QuickPicks.css';

interface QuickPicksProps {
  team: Team;
  coach: Coach | undefined;
  openSlots: SlotKey[];
  onSelectDefense: () => void;
  onSelectCoach: () => void;
}

export default function QuickPicks({
  team,
  coach,
  openSlots,
  onSelectDefense,
  onSelectCoach,
}: QuickPicksProps) {
  const showDef = openSlots.includes('DEF');
  const showHC = openSlots.includes('HC');

  if (!showDef && !showHC) return null;

  return (
    <div className="quick-picks">
      {showDef && (
        <button
          className="quick-pick-card"
          style={{ borderColor: `#${team.color}` }}
          onClick={onSelectDefense}
        >
          <img src={team.logo} alt={team.displayName} className="quick-pick-logo" crossOrigin="anonymous" />
          <div className="quick-pick-info">
            <div className="quick-pick-name">{team.shortDisplayName} DS/T</div>
            <div className="quick-pick-label">TEAM DEFENSE</div>
          </div>
          <div className="quick-pick-slot" style={{ backgroundColor: `#${team.color}` }}>
            DS/T
          </div>
        </button>
      )}
      {showHC && coach && (
        <button
          className="quick-pick-card"
          style={{ borderColor: `#${team.color}` }}
          onClick={onSelectCoach}
        >
          <div className="quick-pick-coach-initials" style={{ backgroundColor: `#${team.color}` }}>
            {coach.firstName[0]}{coach.lastName[0]}
          </div>
          <div className="quick-pick-info">
            <div className="quick-pick-name">{coach.fullName}</div>
            <div className="quick-pick-label">HEAD COACH</div>
          </div>
          <div className="quick-pick-slot" style={{ backgroundColor: `#${team.color}` }}>
            HC
          </div>
        </button>
      )}
    </div>
  );
}
