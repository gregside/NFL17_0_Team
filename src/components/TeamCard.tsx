import { useRef, useState, useEffect } from 'react';
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

  const draftOrder = pick.draftOrder;

  if (key === 'DEF' && pick.defense) {
    return {
      name: `${pick.defense.shortDisplayName} DS/T`,
      image: pick.defense.logo,
      teamColor: pick.defense.color,
      teamLogo: pick.defense.logo,
      isLogo: true,
      draftOrder,
    };
  }
  if (key === 'HC' && pick.coach) {
    return {
      name: pick.coach.fullName,
      image: undefined,
      teamColor: pick.coach.teamColor,
      teamLogo: pick.coach.teamLogo,
      isLogo: false,
      initials: pick.coach.firstName[0] + pick.coach.lastName[0],
      draftOrder,
    };
  }
  if (pick.player) {
    return {
      name: pick.player.fullName,
      image: pick.player.headshot,
      teamColor: pick.player.teamColor,
      teamLogo: pick.player.teamLogo,
      isLogo: false,
      jersey: pick.player.jersey,
      position: pick.player.position,
      draftOrder,
    };
  }
  return null;
}

export default function TeamCard({ picks, isComplete }: TeamCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (isComplete) { setCollapsed(false); return; }
    const el = sentinelRef.current;
    const wrapper = wrapperRef.current;
    if (!el || !wrapper) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          // Lock the wrapper's flow height before collapsing
          wrapper.style.height = `${wrapper.getBoundingClientRect().height}px`;
          setCollapsed(true);
        } else {
          // Start expanding, then clear locked height after transition
          setCollapsed(false);
          setTimeout(() => { wrapper.style.height = ''; }, 350);
        }
      },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isComplete]);

  // Keep --roster-h in sync with visible card height throughout transitions
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    let raf: number;
    const update = () => {
      const h = card.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--roster-h', `${h}px`);
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    // Stop polling after transition settles
    const stop = () => cancelAnimationFrame(raf);
    const timer = setTimeout(stop, 400);
    return () => { cancelAnimationFrame(raf); clearTimeout(timer); };
  }, [collapsed]);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a0a12',
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );
      if (!blob) return;

      const file = new File([blob], 'my-17-0-team.png', { type: 'image/png' });

      // Use native share sheet on mobile (lets user save to photos)
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        // Fallback: direct download for desktop
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'my-17-0-team.png';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      // User cancelled share sheet — not an error
      if (e instanceof Error && e.name === 'AbortError') return;
      console.error('Share/download failed:', e);
    }
  };

  return (
    <>
      {/* Sentinel sits outside sticky wrapper so it scrolls away */}
      {!isComplete && <div ref={sentinelRef} className="team-card-sentinel" />}

      <div className={`team-card-wrapper ${!isComplete ? 'team-card-wrapper--sticky' : ''} ${collapsed ? 'team-card-wrapper--collapsed' : ''}`} ref={wrapperRef}>
        <div className="team-card" ref={cardRef}>
          <div className="team-card-header">
            <div className="team-card-title">ROSTER</div>
          </div>

        {isComplete ? (
          <div className="team-card-list">
            {SLOT_KEYS.map((key) => {
              const display = getSlotDisplay(picks, key);
              if (!display) return null;
              return (
                <div
                  key={key}
                  className="roster-row"
                  style={{ borderLeftColor: `#${display.teamColor}` }}
                >
                  <div className="roster-row-pos">{getSlotLabel(key)}</div>
                  <div className="roster-row-img-wrap">
                    {display.image ? (
                      <img
                        src={display.image}
                        alt={display.name}
                        className={`roster-row-img ${display.isLogo ? 'roster-row-img--logo' : ''}`}
                        crossOrigin="anonymous"
                      />
                    ) : display.initials ? (
                      <div
                        className="roster-row-initials"
                        style={{ backgroundColor: `#${display.teamColor}` }}
                      >
                        {display.initials}
                      </div>
                    ) : null}
                  </div>
                  <div className="roster-row-name">{display.name}</div>
                  <img
                    src={display.teamLogo}
                    alt=""
                    className="roster-row-team-logo"
                    crossOrigin="anonymous"
                  />
                  <div className="roster-row-draft-num">{display.draftOrder}</div>
                </div>
              );
            })}
          </div>
        ) : (
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
        )}
      </div>
      {isComplete && (
        <button className="download-btn" onClick={handleDownload}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          SHARE TEAM CARD
        </button>
      )}
    </div>
    </>
  );
}
