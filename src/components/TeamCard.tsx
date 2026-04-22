import { useRef } from 'react';
import html2canvas from 'html2canvas';
import { TeamPicks, SLOT_KEYS, SlotKey } from '../types';
import './TeamCard.css';

interface TeamCardProps {
  picks: TeamPicks;
  isComplete: boolean;
}

function getSlotLabel(key: SlotKey): string {
  if (key === 'DEF') return 'DS/T';
  return key;
}

function getSlotDisplay(picks: TeamPicks, key: SlotKey) {
  const pick = picks[key];
  if (!pick) return null;

  if (key === 'DEF' && pick.defense) {
    return {
      name: `${pick.defense.shortDisplayName} DS/T`,
      image: pick.defense.logo,
      teamColor: pick.defense.color,
      isLogo: true,
    };
  }
  if (key === 'HC' && pick.coach) {
    return {
      name: pick.coach.fullName,
      image: undefined,
      teamColor: pick.coach.teamColor,
      isLogo: false,
      initials: pick.coach.firstName[0] + pick.coach.lastName[0],
    };
  }
  if (pick.player) {
    return {
      name: pick.player.fullName,
      image: pick.player.headshot,
      teamColor: pick.player.teamColor,
      isLogo: false,
      jersey: pick.player.jersey,
      position: pick.player.position,
    };
  }
  return null;
}

export default function TeamCard({ picks, isComplete }: TeamCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a0a12',
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });
      const link = document.createElement('a');
      link.download = 'my-17-0-team.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Download failed:', e);
    }
  };

  return (
    <div className="team-card-wrapper">
      <div className="team-card" ref={cardRef}>
        <div className="team-card-header">
          <div className="team-card-title">MY 17-0 TEAM</div>
          <div className="team-card-subtitle">UNDEFEATED ROSTER</div>
        </div>
        <div className="team-card-slots">
          {SLOT_KEYS.map((key) => {
            const display = getSlotDisplay(picks, key);
            return (
              <div
                key={key}
                className={`slot ${display ? 'slot--filled' : 'slot--empty'}`}
                style={
                  display
                    ? { borderColor: `#${display.teamColor}` }
                    : undefined
                }
              >
                <div className="slot-position">{getSlotLabel(key)}</div>
                {display ? (
                  <div className="slot-content">
                    <div className="slot-image-wrap">
                      {display.image ? (
                        <img
                          src={display.image}
                          alt={display.name}
                          className={`slot-image ${display.isLogo ? 'slot-image--logo' : ''}`}
                          crossOrigin="anonymous"
                        />
                      ) : display.initials ? (
                        <div
                          className="slot-initials"
                          style={{ backgroundColor: `#${display.teamColor}` }}
                        >
                          {display.initials}
                        </div>
                      ) : null}
                    </div>
                    <div className="slot-name">{display.name}</div>
                  </div>
                ) : (
                  <div className="slot-empty-label">—</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {isComplete && (
        <button className="download-btn" onClick={handleDownload}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          DOWNLOAD TEAM CARD
        </button>
      )}
    </div>
  );
}
