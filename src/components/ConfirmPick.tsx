import { Player, Coach, Team, SlotKey } from '../types';
import './ConfirmPick.css';

interface ConfirmPickProps {
  slot: SlotKey;
  player?: Player;
  coach?: Coach;
  defense?: Team;
  teamColor: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmPick({
  slot,
  player,
  coach,
  defense,
  teamColor,
  onConfirm,
  onCancel,
}: ConfirmPickProps) {
  let name = '';
  let image: string | undefined;
  let subtitle = '';

  if (slot === 'DEF' && defense) {
    name = `${defense.shortDisplayName} DS/T`;
    image = defense.logo;
    subtitle = 'TEAM DEFENSE / SPECIAL TEAMS';
  } else if (slot === 'HC' && coach) {
    name = coach.fullName;
    subtitle = `HEAD COACH · ${coach.teamName}`;
  } else if (player) {
    name = player.fullName;
    image = player.headshot;
    subtitle = `${player.position} · #${player.jersey} · ${player.teamName}`;
  }

  return (
    <div className="confirm-overlay">
      <div className="confirm-card" style={{ borderColor: `#${teamColor}` }}>
        <div className="confirm-label">CONFIRM PICK</div>
        <div className="confirm-slot" style={{ backgroundColor: `#${teamColor}` }}>
          {slot === 'DEF' ? 'DS/T' : slot}
        </div>
        <div className="confirm-image-wrap">
          {image ? (
            <img src={image} alt={name} className={`confirm-image ${slot === 'DEF' ? 'confirm-image--logo' : ''}`} crossOrigin="anonymous" />
          ) : (
            <div className="confirm-initials" style={{ backgroundColor: `#${teamColor}` }}>
              {coach ? coach.firstName[0] + coach.lastName[0] : '?'}
            </div>
          )}
        </div>
        <div className="confirm-name">{name}</div>
        <div className="confirm-subtitle">{subtitle}</div>
        <div className="confirm-actions">
          <button className="confirm-btn confirm-btn--yes" style={{ backgroundColor: `#${teamColor}` }} onClick={onConfirm}>
            LOCK IT IN
          </button>
          <button className="confirm-btn confirm-btn--no" onClick={onCancel}>
            GO BACK
          </button>
        </div>
      </div>
    </div>
  );
}
