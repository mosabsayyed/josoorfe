import React, { useState, useEffect, useRef, useCallback } from 'react';

const BASE = '/att/landing-screenshots/desktopexp';

interface PageTransition {
  // Click position as % within the WINDOW content area (not the full container)
  clickX: number;  // % from left of window content
  clickY: number;  // % from top of window content (below title bar)
  auto?: boolean;  // if true, auto-advance without cursor click
}

interface DesktopIcon {
  id: string;
  label: string;
  icon: string;
  pages: string[];
  caption: string;
  transitions?: PageTransition[];  // how to go from page[i] to page[i+1]
}

// Layout: Row 1 (1): Start Here | Row 2 (3): Observe, Decide, Deliver | Row 3 (2): Signals, Chat
// Row 4 (3): Tutorial, Reporting, Documents | Row 5 (3): Calendar, Settings, Observability
const ICONS: DesktopIcon[] = [
  // Row 1 — entry point
  { id: 'ontology', label: 'Start Here', icon: `${BASE}/ontology.jpg`, pages: [`${BASE}/ontology1.jpg`], caption: "End-to-end strategy execution — our ontology unlocks it all, starting with everything in one view" },
  // Row 2 — the three steps
  {
    id: 'observe', label: 'Observe', icon: `${BASE}/observe.jpg`,
    pages: [`${BASE}/observe1.png`, `${BASE}/observe2.jpg`],
    caption: 'Sector-level monitoring — KPIs, assets, and operational footprint on the map',
    transitions: [{ clickX: 20, clickY: 8 }],
  },
  {
    id: 'decide', label: 'Decide', icon: `${BASE}/decide.jpg`,
    pages: [`${BASE}/decide1.jpg`, `${BASE}/decide2.jpg`],
    caption: 'Capability health analysis with AI-powered risk advisory and intervention strategies',
    transitions: [{ clickX: 87, clickY: 10 }],
  },
  {
    id: 'deliver', label: 'Deliver', icon: `${BASE}/deliver.jpg`,
    pages: [`${BASE}/deliver1.jpg`, `${BASE}/deliver2.jpg`, `${BASE}/deliver3.jpg`, `${BASE}/delliver4.png`, `${BASE}/deliver5.png`],
    caption: 'Execute Desk — intervention planning, strategic reset, and scenario simulation',
    transitions: [
      { clickX: 50, clickY: 50, auto: true },
      { clickX: 93, clickY: 33 },
      { clickX: 50, clickY: 9 },
      { clickX: 80, clickY: 9 },
    ],
  },
  // Row 3 — two blocks
  {
    id: 'signal', label: 'Signals', icon: `${BASE}/signal.jpg`,
    pages: [`${BASE}/signal1.jpg`, `${BASE}/signal2.jpg`, `${BASE}/signal3.jpg`],
    caption: 'Interactive knowledge graph — explore 468 nodes across sphere, sankey, and circular views',
    transitions: [
      { clickX: 6, clickY: 39 },
      { clickX: 16, clickY: 33 },
    ],
  },
  { id: 'chatexpert', label: 'Expert Chat', icon: `${BASE}/chatexpert.jpg`, pages: [`${BASE}/chatexpert1.jpg`], caption: 'Ask your AI expert anything — with full context of your data' },
  // Row 4 — supporting tools
  { id: 'tutorial', label: 'Tutorials', icon: `${BASE}/tutorial.jpg`, pages: [`${BASE}/tutorial1.jpg`], caption: 'Step-by-step guides for every workflow and feature' },
  {
    id: 'reporting', label: 'Reporting', icon: `${BASE}/reporting.jpg`,
    pages: [`${BASE}/reporting1.png`, `${BASE}/reporting2.png`],
    caption: 'Control outcome tracking and automated performance report generation',
    transitions: [{ clickX: 78, clickY: 10 }],
  },
  { id: 'documents', label: 'Documents', icon: `${BASE}/Object.png`, pages: [], caption: '' },
  // Row 5 — utilities
  { id: 'calendar', label: 'Calendar', icon: `${BASE}/calendar.jpg`, pages: [], caption: '' },
  { id: 'settings', label: 'Settings', icon: `${BASE}/Setting.jpg`, pages: [], caption: '' },
  { id: 'observability', label: 'Observability', icon: `${BASE}/observability.jpg`, pages: [`${BASE}/observability1.jpg`], caption: 'Platform health, data quality monitoring, and system observability' },
];

// Tour steps — manually defined, with decide+deliver merged into one seamless flow
const TOUR_STEPS: DesktopIcon[] = [
  ICONS[0], // ontology
  ICONS[1], // observe
  // Merged decide → deliver: continuous flow through all Execute Desk tabs
  {
    id: 'decide', label: 'Decide', icon: `${BASE}/decide.jpg`,
    pages: [
      `${BASE}/decide1.jpg`, `${BASE}/decide2.jpg`,       // Decide screens
      `${BASE}/deliver1.jpg`, `${BASE}/deliver2.jpg`, `${BASE}/deliver3.jpg`, // Deliver: plan → gantt → commit
      `${BASE}/delliver4.png`, `${BASE}/deliver5.png`,     // Deliver: strategic reset → scenario simulation
    ],
    caption: 'From risk analysis through intervention planning to strategic reset and scenario simulation',
    transitions: [
      { clickX: 87, clickY: 10 },            // decide1 → decide2: click "AI Risk Analysis" button
      { clickX: 83, clickY: 41 },            // decide2 → deliver1: click "Select →" on first strategy
      { clickX: 50, clickY: 50, auto: true }, // deliver1 → deliver2: auto (loading → Gantt plan)
      { clickX: 93, clickY: 33 },            // deliver2 → deliver3: click "Commit Plan" button
      { clickX: 50, clickY: 9 },             // deliver3 → delliver4: click "Strategic Reset" tab
      { clickX: 80, clickY: 9 },             // delliver4 → deliver5: click "Scenario Simulation" tab
    ],
  },
  ICONS[4], // signal
  ICONS[7], // reporting
];

// All image paths for preloading
const ALL_IMAGES = [
  `${BASE}/biosboot.jpg`,
  `${BASE}/josoor_art.png`,
  `${BASE}/desktop.jpg`,
  ...ICONS.map(i => i.icon),
  ...ICONS.flatMap(i => i.pages),
];

type Phase = 'boot' | 'logo' | 'desktop' | 'tour' | 'free';

interface WindowState {
  icon: DesktopIcon;
  pageIndex: number;
  visible: boolean;
}

interface CursorState {
  x: number;
  y: number;
  visible: boolean;
  clicking: boolean;
}

interface DesktopExperienceProps {
  language?: string;
}

const CursorSVG = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="1">
    <path d="M5 3l14 10-6 1-4 6z" />
  </svg>
);

export default function DesktopExperience({ language = 'ar' }: DesktopExperienceProps) {
  const isRTL = language === 'ar';

  const [phase, setPhase] = useState<Phase>('boot');
  const [isMobile, setIsMobile] = useState(false);
  const [iconsVisible, setIconsVisible] = useState(false);

  // Boot / logo state
  const [biosOpacity, setBiosOpacity] = useState(1);
  const [logoVisible, setLogoVisible] = useState(false);
  const [logoScale, setLogoScale] = useState(1);
  const [logoOpacity, setLogoOpacity] = useState(0);
  const [desktopOpacity, setDesktopOpacity] = useState(0);
  const [sparkRunning, setSparkRunning] = useState(false);
  const [sparkFlash, setSparkFlash] = useState(false);

  // Tour state
  const [tourIconIndex, setTourIconIndex] = useState(0);
  const [dimmedIcons, setDimmedIcons] = useState<boolean>(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [cursor, setCursor] = useState<CursorState>({ x: 50, y: 50, visible: false, clicking: false });
  const [window_, setWindow_] = useState<WindowState | null>(null);
  const [windowVisible, setWindowVisible] = useState(false);
  const [windowOrigin, setWindowOrigin] = useState('50% 50%');

  // Free mode state
  const [freeWindow, setFreeWindow] = useState<WindowState | null>(null);
  const [freeWindowVisible, setFreeWindowVisible] = useState(false);
  const [freeWindowOrigin, setFreeWindowOrigin] = useState('50% 50%');

  const containerRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tourTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const tourRunningRef = useRef(false);

  // Responsive
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Preload all images
  useEffect(() => {
    ALL_IMAGES.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  const iconSize = isMobile ? 52 : 68;
  const iconGap = isMobile ? 20 : 32;

  // ── Phase machine ──────────────────────────────────────────────
  useEffect(() => {
    // Phase 1: boot (2s)
    const t1 = setTimeout(() => {
      // Transition to logo phase
      setBiosOpacity(0);
      setLogoVisible(true);
      setTimeout(() => setLogoOpacity(1), 50);
      setSparkRunning(true);
      setPhase('logo');
    }, 2000);

    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (phase !== 'logo') return;

    // Spark runs for ~2s, then flashes for 0.4s, then logo shrinks
    const tFlash = setTimeout(() => {
      setSparkRunning(false);
      setSparkFlash(true);
    }, 2000);

    const tShrink = setTimeout(() => {
      setSparkFlash(false);
      setDesktopOpacity(1);
      setLogoScale(0.15);
      setLogoOpacity(0);
    }, 2400);

    const tDesktop = setTimeout(() => {
      setLogoVisible(false);
      setPhase('desktop');
    }, 3900);

    return () => {
      clearTimeout(tFlash);
      clearTimeout(tShrink);
      clearTimeout(tDesktop);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'desktop') return;
    const t = setTimeout(() => {
      setIconsVisible(true);
    }, 400);
    return () => clearTimeout(t);
  }, [phase]);

  // Start tour after icons are visible
  useEffect(() => {
    if (!iconsVisible) return;
    const t = setTimeout(() => {
      setPhase('tour');
    }, 1200);
    return () => clearTimeout(t);
  }, [iconsVisible]);

  // ── Tour orchestration ─────────────────────────────────────────
  const addTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    tourTimeoutsRef.current.push(id);
    return id;
  }, []);

  const clearAllTimeouts = useCallback(() => {
    tourTimeoutsRef.current.forEach(clearTimeout);
    tourTimeoutsRef.current = [];
  }, []);

  const getIconCenter = useCallback((iconIndex: number): { x: number; y: number } => {
    const container = containerRef.current;
    const btn = iconRefs.current[iconIndex];
    if (!container || !btn) return { x: 50, y: 50 };
    const cr = container.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    return {
      x: ((br.left - cr.left + br.width / 2) / cr.width) * 100,
      y: ((br.top - cr.top + br.height / 2) / cr.height) * 100,
    };
  }, []);

  const getWindowClickPosition = useCallback((clickX: number, clickY: number): { x: number; y: number } => {
    // Window is now full-screen (inset: 0), so click positions map directly
    return { x: clickX, y: clickY };
  }, []);

  const runTourStep = useCallback((tourIndex: number) => {
    if (!tourRunningRef.current) return;
    const icon = TOUR_STEPS[tourIndex];
    const globalIconIndex = ICONS.findIndex(i => i.id === icon.id);
    let elapsed = 0;

    // Step 1: Dim all icons, highlight current (0.5s)
    setDimmedIcons(true);
    setHighlightedId(icon.id);

    elapsed += 500;

    // Step 2: Move cursor to icon (0.8s)
    addTimeout(() => {
      if (!tourRunningRef.current) return;
      const pos = getIconCenter(globalIconIndex);
      setCursor({ x: pos.x, y: pos.y, visible: true, clicking: false });
    }, elapsed);
    elapsed += 800;

    // Step 3: Click animation (0.3s), then open window
    addTimeout(() => {
      if (!tourRunningRef.current) return;
      setCursor(prev => ({ ...prev, clicking: true }));
    }, elapsed);
    elapsed += 150;

    addTimeout(() => {
      if (!tourRunningRef.current) return;
      setCursor(prev => ({ ...prev, clicking: false }));
      // Set origin to icon position for grow animation
      const pos = getIconCenter(globalIconIndex);
      setWindowOrigin(`${pos.x}% ${pos.y}%`);
      // Open window
      setWindow_({ icon, pageIndex: 0, visible: false });
    }, elapsed);
    elapsed += 150;

    addTimeout(() => {
      if (!tourRunningRef.current) return;
      setWindowVisible(true);
    }, elapsed);
    elapsed += 50;

    // Step 4: Show each page
    const showPage = (pageIdx: number, startElapsed: number): number => {
      let e = startElapsed;

      if (pageIdx > 0) {
        const transition = icon.transitions?.[pageIdx - 1];

        if (transition?.auto) {
          // Auto-advance: hide cursor, wait 2s, advance page
          addTimeout(() => {
            if (!tourRunningRef.current) return;
            setCursor(prev => ({ ...prev, visible: false }));
          }, e);
          e += 2000;
          addTimeout(() => {
            if (!tourRunningRef.current) return;
            setWindow_(prev => prev ? { ...prev, pageIndex: pageIdx } : null);
            setCursor(prev => ({ ...prev, visible: true }));
          }, e);
          e += 100;
        } else {
          // Move cursor to the click position within the window (0.8s)
          const clickX = transition?.clickX ?? 50;
          const clickY = transition?.clickY ?? 5;
          addTimeout(() => {
            if (!tourRunningRef.current) return;
            const pos = getWindowClickPosition(clickX, clickY);
            setCursor(prev => ({ ...prev, x: pos.x, y: pos.y }));
          }, e);
          e += 800;

          // Click
          addTimeout(() => {
            if (!tourRunningRef.current) return;
            setCursor(prev => ({ ...prev, clicking: true }));
          }, e);
          e += 150;
          addTimeout(() => {
            if (!tourRunningRef.current) return;
            setCursor(prev => ({ ...prev, clicking: false }));
            setWindow_(prev => prev ? { ...prev, pageIndex: pageIdx } : null);
          }, e);
          e += 150;
        }
      }

      // Show page for 3s
      e += 3000;
      return e;
    };

    for (let p = 0; p < icon.pages.length; p++) {
      elapsed = showPage(p, elapsed);
    }

    // Step 5: Close window (0.5s)
    addTimeout(() => {
      if (!tourRunningRef.current) return;
      setWindowVisible(false);
      setCursor(prev => ({ ...prev, visible: false }));
    }, elapsed);
    elapsed += 500;

    addTimeout(() => {
      if (!tourRunningRef.current) return;
      setWindow_(null);
    }, elapsed);
    elapsed += 50;

    // Step 6: Restore icons (0.3s)
    addTimeout(() => {
      if (!tourRunningRef.current) return;
      setDimmedIcons(false);
      setHighlightedId(null);
    }, elapsed);
    elapsed += 300;

    // Step 7: Pause (0.5s)
    elapsed += 500;

    // Next icon or free mode
    addTimeout(() => {
      if (!tourRunningRef.current) return;
      const nextIndex = tourIndex + 1;
      if (nextIndex < TOUR_STEPS.length) {
        setTourIconIndex(nextIndex);
        runTourStep(nextIndex);
      } else {
        // Tour complete → free mode
        tourRunningRef.current = false;
        setDimmedIcons(false);
        setHighlightedId(null);
        setCursor({ x: 50, y: 50, visible: false, clicking: false });
        setPhase('free');
      }
    }, elapsed);
  }, [addTimeout, getIconCenter, getWindowClickPosition]);

  useEffect(() => {
    if (phase !== 'tour') return;
    if (tourRunningRef.current) return;
    tourRunningRef.current = true;
    setTourIconIndex(0);
    // Small delay to ensure refs are attached
    const startId = setTimeout(() => runTourStep(0), 300);
    tourTimeoutsRef.current.push(startId);

    return () => {
      tourRunningRef.current = false;
      clearAllTimeouts();
    };
  }, [phase, runTourStep, clearAllTimeouts]);

  // ── Free mode icon click ───────────────────────────────────────
  const openFreeWindow = useCallback((icon: DesktopIcon) => {
    if (icon.pages.length === 0 || phase !== 'free') return;
    const globalIdx = ICONS.findIndex(i => i.id === icon.id);
    const pos = getIconCenter(globalIdx);
    setFreeWindowOrigin(`${pos.x}% ${pos.y}%`);
    setFreeWindow({ icon, pageIndex: 0, visible: false });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setFreeWindowVisible(true));
    });
  }, [phase, getIconCenter]);

  const closeFreeWindow = useCallback(() => {
    setFreeWindowVisible(false);
    setTimeout(() => setFreeWindow(null), 350);
  }, []);

  const setFreePage = useCallback((pageIndex: number) => {
    setFreeWindow(prev => prev ? { ...prev, pageIndex } : null);
  }, []);

  // ── Render helpers ─────────────────────────────────────────────

  const renderWindow = (
    win: WindowState,
    visible: boolean,
    onClose: () => void,
    onPageChange?: (idx: number) => void,
    isTour = false,
    origin = '50% 50%',
  ) => {
    const { icon, pageIndex } = win;
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: isTour ? 55 : 55,
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.15)',
          transformOrigin: origin,
          transition: 'opacity 0.35s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          pointerEvents: isTour ? 'none' : 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={isTour ? undefined : onClose}
      >
          {/* Screenshot area — screenshots already include their own title bar */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Images with crossfade */}
            <div style={{ position: 'relative', flex: 1 }}>
              {icon.pages.map((src, idx) => (
                <img
                  key={src}
                  src={src}
                  alt={`${icon.label} page ${idx + 1}`}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: idx === pageIndex ? 1 : 0,
                    transition: 'opacity 0.4s ease',
                    display: 'block',
                  }}
                  draggable={false}
                />
              ))}
            </div>

            {/* Caption strip — solid black bar overlaid on screenshot */}
            {icon.caption && (
              <div
                onClick={e => e.stopPropagation()}
                style={{
                position: 'absolute',
                bottom: '15%',
                left: '5%',
                right: '5%',
                borderRadius: '10px',
                background: 'rgba(0, 0, 0, 0.92)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                padding: isMobile ? '10px 16px 12px' : '14px 32px 16px',
                zIndex: 5,
              }}>
                {/* Page dots */}
                {icon.pages.length > 1 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '10px',
                  }}>
                    {icon.pages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={onPageChange ? (e) => { e.stopPropagation(); onPageChange(idx); } : undefined}
                        style={{
                          width: isMobile ? 10 : 14,
                          height: isMobile ? 10 : 14,
                          borderRadius: '50%',
                          border: '2px solid rgba(255,255,255,0.3)',
                          padding: 0,
                          background: idx === pageIndex ? '#F4BB30' : 'rgba(255,255,255,0.15)',
                          cursor: onPageChange ? 'pointer' : 'default',
                          transition: 'background 0.3s ease, border-color 0.3s ease',
                          flexShrink: 0,
                        }}
                      />
                    ))}
                  </div>
                )}
                {/* Caption text */}
                <span style={{
                  color: '#fff',
                  fontSize: isMobile ? 14 : 18,
                  fontWeight: 600,
                  textAlign: 'center',
                  lineHeight: 1.4,
                  letterSpacing: '0.01em',
                }}>
                  {icon.caption}
                </span>
              </div>
            )}
          </div>
      </div>
    );
  };

  // ── Main render ────────────────────────────────────────────────
  return (
    <>
      {/* Spark keyframes injected via style tag */}
      <style>{`
        @keyframes sparkTravel {
          0% { bottom: 5%; opacity: 1; width: 8px; height: 8px; margin-left: -4px; }
          85% { bottom: 88%; opacity: 1; width: 8px; height: 8px; margin-left: -4px; }
          90% { bottom: 90%; opacity: 1; width: 20px; height: 20px; margin-left: -10px; }
          100% { bottom: 90%; opacity: 0; width: 20px; height: 20px; margin-left: -10px; }
        }
        @keyframes sparkFlash {
          0% { opacity: 0; width: 6px; height: 6px; margin-left: -3px; }
          30% { opacity: 1; width: 24px; height: 24px; margin-left: -12px; }
          100% { opacity: 0; width: 24px; height: 24px; margin-left: -12px; }
        }
        @keyframes cursorClick {
          0% { transform: scale(1); }
          50% { transform: scale(0.85); }
          100% { transform: scale(1); }
        }
        @keyframes iconEntrance {
          from { opacity: 0; transform: translateY(12px) scale(0.8); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 8px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)',
          background: '#0a0a1a',
        }}
      >
        {/* ── BIOS Boot ── */}
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 15,
          opacity: biosOpacity,
          transition: 'opacity 0.8s ease',
          pointerEvents: 'none',
        }}>
          <img
            src={`${BASE}/biosboot.jpg`}
            alt="Booting"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            draggable={false}
          />
        </div>

        {/* ── Logo phase ── */}
        {logoVisible && (
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{
              position: 'relative',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <img
                src={`${BASE}/josoor_art.png`}
                alt="Josoor"
                style={{
                  height: '100%',
                  objectFit: 'contain',
                  opacity: logoOpacity,
                  transform: `scale(${logoScale})`,
                  transformOrigin: 'center center',
                  transition: logoScale < 1
                    ? 'transform 1.5s cubic-bezier(0.4,0,0.2,1), opacity 1.5s ease'
                    : 'opacity 0.8s ease',
                }}
                draggable={false}
              />
              {/* Spark dot */}
              {sparkRunning && (
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  bottom: '5%',
                  width: 8,
                  height: 8,
                  marginLeft: -4,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #fff 0%, #f4bb30 50%, rgba(244,187,48,0) 100%)',
                  boxShadow: '0 0 12px 4px rgba(244,187,48,0.8)',
                  animation: 'sparkTravel 2s ease-in-out forwards',
                  pointerEvents: 'none',
                }} />
              )}
              {sparkFlash && (
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  bottom: '90%',
                  width: 6,
                  height: 6,
                  marginLeft: -3,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #fff 0%, #f4bb30 40%, rgba(244,187,48,0) 100%)',
                  boxShadow: '0 0 20px 8px rgba(244,187,48,0.9)',
                  animation: 'sparkFlash 0.4s ease-out forwards',
                  pointerEvents: 'none',
                }} />
              )}
            </div>
          </div>
        )}

        {/* ── Desktop wallpaper ── */}
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 5,
          opacity: desktopOpacity,
          transition: 'opacity 0.8s ease',
        }}>
          <img
            src={`${BASE}/desktop.jpg`}
            alt="Josoor Desktop"
            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
            draggable={false}
          />

          {/* Icon grid */}
          <div style={{
            position: 'absolute',
            inset: 0,
            padding: isMobile ? '12% 8% 0' : '8% 10% 0',
            display: 'grid',
            gridTemplateColumns: `repeat(3, ${iconSize}px)`,
            gridAutoRows: `${iconSize + 24}px`,
            gap: `${iconGap}px`,
            alignContent: 'start',
            justifyContent: isRTL ? 'end' : 'start',
          }}>
            {ICONS.map((icon, i) => {
              const isHighlighted = highlightedId === icon.id;
              const isDimmed = dimmedIcons && !isHighlighted;
              const isDecorative = icon.pages.length === 0;
              const isClickable = icon.pages.length > 0 && phase === 'free';

              // Grid placement: index 0 (Start Here) alone centered, then force new row
              const gridStyle: React.CSSProperties = i === 0
                ? { gridColumn: '1 / -1', justifySelf: 'center' }
                : {};

              return (
                <button
                  key={icon.id}
                  ref={el => { iconRefs.current[i] = el; }}
                  onClick={() => openFreeWindow(icon)}
                  style={{
                    ...gridStyle,
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: isClickable ? 'pointer' : 'default',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    opacity: iconsVisible
                      ? isDimmed ? 0.2 : 1
                      : 0,
                    transform: iconsVisible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.8)',
                    transition: `opacity 0.5s ease, transform 0.4s ease ${i * 0.06}s, box-shadow 0.3s ease`,
                  }}
                  title={icon.label}
                >
                  <div style={{
                    width: iconSize,
                    height: iconSize,
                    borderRadius: isMobile ? 12 : 16,
                    overflow: 'hidden',
                    boxShadow: isHighlighted
                      ? '0 0 16px rgba(244,187,48,0.5), 0 2px 12px rgba(0,0,0,0.4)'
                      : '0 2px 12px rgba(0,0,0,0.4)',
                    transition: 'transform 0.2s ease, box-shadow 0.3s ease',
                    outline: isHighlighted ? '2px solid rgba(244,187,48,0.7)' : '2px solid transparent',
                  }}
                    onMouseEnter={e => {
                      if (isClickable) {
                        e.currentTarget.style.transform = 'scale(1.12)';
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(244,187,48,0.3)';
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = isHighlighted
                        ? '0 0 16px rgba(244,187,48,0.5), 0 2px 12px rgba(0,0,0,0.4)'
                        : '0 2px 12px rgba(0,0,0,0.4)';
                    }}
                  >
                    <img
                      src={icon.icon}
                      alt={icon.label}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      draggable={false}
                    />
                  </div>
                  <span style={{
                    fontSize: isMobile ? 9 : 11,
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.9)',
                    textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                    textAlign: 'center',
                    lineHeight: 1.2,
                    maxWidth: iconSize + 8,
                  }}>
                    {icon.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tour cursor ── */}
        {(phase === 'tour') && (
          <div style={{
            position: 'absolute',
            left: `${cursor.x}%`,
            top: `${cursor.y}%`,
            zIndex: 60,
            pointerEvents: 'none',
            opacity: cursor.visible ? 1 : 0,
            transition: 'left 0.8s ease, top 0.8s ease, opacity 0.3s ease',
            transform: cursor.clicking ? 'scale(0.85)' : 'scale(1)',
            animation: cursor.clicking ? 'cursorClick 0.3s ease' : 'none',
            transformOrigin: '0 0',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))',
          }}>
            <CursorSVG />
          </div>
        )}

        {/* ── Tour window ── */}
        {window_ && renderWindow(window_, windowVisible, () => {}, undefined, true, windowOrigin)}

        {/* ── Free mode window ── */}
        {freeWindow && renderWindow(freeWindow, freeWindowVisible, closeFreeWindow, setFreePage, false, freeWindowOrigin)}
      </div>
    </>
  );
}
