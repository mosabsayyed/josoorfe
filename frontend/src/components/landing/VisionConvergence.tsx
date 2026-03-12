import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import './VisionConvergence.css';

/* ═══════════════════════════════════════════════════════════════
   VisionConvergence — Hybrid: Coded Docs + Generated Graph + Coded Chat
   RIGHT → CENTER → LEFT  (RTL data flow)
   ═══════════════════════════════════════════════════════════════ */

interface VisionConvergenceProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── Document Data ─────────────────────────────────────────────

const DOCUMENTS = [
  { name: 'MoF Budget FY2025', source: 0 },
  { name: 'DGA Meta Study 2024', source: 1 },
  { name: 'V2030 Annual Report', source: 2 },
  { name: 'SAMA Financial Stability', source: 3 },
  { name: 'IMF Article IV 2025', source: 4 },
  { name: 'NDP Annual Report', source: 5 },
  { name: 'Human Capital Strategy', source: 0 },
  { name: 'Tourism Strategy 2030', source: 2 },
  { name: 'Digital Gov Strategy', source: 1 },
  { name: 'National Data Strategy', source: 1 },
  { name: 'Logistics Strategy', source: 5 },
  { name: 'Energy Transition Plan', source: 3 },
  { name: 'Industrial Strategy 2035', source: 0 },
  { name: 'Privatization Program', source: 2 },
  { name: 'Quality of Life Program', source: 2 },
  { name: 'Housing Program', source: 4 },
  { name: 'Financial Sector Dev', source: 3 },
  { name: 'Health Sector Transform', source: 5 },
  { name: 'Education Reform Plan', source: 0 },
  { name: 'Municipal Strategy', source: 4 },
  { name: 'Transport & Logistics', source: 5 },
  { name: 'Water Sector Strategy', source: 1 },
  { name: 'Agriculture Strategy', source: 0 },
  { name: 'Mining & Minerals', source: 3 },
  { name: 'Entertainment Strategy', source: 2 },
  { name: 'Sports Strategy 2030', source: 4 },
  { name: 'Cultural Development', source: 5 },
  { name: 'Environmental Strategy', source: 1 },
  { name: 'Social Development', source: 0 },
  { name: 'Justice System Reform', source: 4 },
  { name: 'Labor Market Strategy', source: 3 },
  { name: 'SME Development Plan', source: 2 },
  { name: 'Fiscal Balance Program', source: 3 },
  { name: 'Public Investment Fund', source: 0 },
  { name: 'NEOM Blueprint', source: 5 },
  { name: 'Royal Commission Reports', source: 4 },
  { name: 'Adaa Performance Framework', source: 1 },
  { name: 'CoG KPI Cascade', source: 2 },
];

const SOURCE_STYLES = [
  { header: '#003366', accent: '#0a4a7a' },
  { header: '#006d3c', accent: '#00894a' },
  { header: '#5c1a8c', accent: '#7b2fb5' },
  { header: '#8b1a1a', accent: '#a82d2d' },
  { header: '#1a5c5c', accent: '#1f7a7a' },
  { header: '#4a3728', accent: '#6b5040' },
];

// ── Helpers ───────────────────────────────────────────────────

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface DocCard {
  name: string;
  source: number;
  x: number;
  y: number;
  rotation: number;
  delay: number;
  scale: number;
}

// ── Component ─────────────────────────────────────────────────

export default function VisionConvergence({ isOpen, onClose }: VisionConvergenceProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';
  const [stage, setStage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [showReplay, setShowReplay] = useState(false);

  // Chat states
  const [typedQuery, setTypedQuery] = useState('');
  const [querySubmitted, setQuerySubmitted] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [typedFollowUp, setTypedFollowUp] = useState('');
  const [cursorInInput, setCursorInInput] = useState(false);
  const [cursorInFollowUp, setCursorInFollowUp] = useState(false);

  // Graph states
  const [graphLit, setGraphLit] = useState(false);

  const timerRefs = useRef<number[]>([]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const docCount = isMobile ? 18 : 38;

  // Doc positions — right zone (55%-95% horizontal)
  const docCards: DocCard[] = useMemo(() => {
    const rand = seededRandom(42);
    return DOCUMENTS.slice(0, docCount).map((doc) => ({
      name: doc.name,
      source: doc.source,
      x: 55 + rand() * 40,
      y: 3 + rand() * 88,
      rotation: -18 + rand() * 36,
      delay: rand() * 2.5,
      scale: 0.65 + rand() * 0.55,
    }));
  }, [docCount]);

  // ── Timer Management ──────────────────────────────────────

  const clearTimers = useCallback(() => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
  }, []);

  const addTimer = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timerRefs.current.push(id);
    return id;
  }, []);

  // ── Typewriter ────────────────────────────────────────────

  const typeText = useCallback((
    text: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
    cursorSetter: React.Dispatch<React.SetStateAction<boolean>>,
    speed: number,
    onDone: () => void,
  ) => {
    let i = 0;
    cursorSetter(true);
    const tick = () => {
      if (i <= text.length) {
        setter(text.slice(0, i));
        i++;
        addTimer(tick, speed);
      } else {
        cursorSetter(false);
        onDone();
      }
    };
    tick();
  }, [addTimer]);

  // ── Animation Sequence ────────────────────────────────────

  const runSequence = useCallback(() => {
    // Reset all state
    setStage(0);
    setShowReplay(false);
    setTypedQuery('');
    setQuerySubmitted(false);
    setShowThinking(false);
    setShowResponse(false);
    setTypedFollowUp('');
    setCursorInInput(false);
    setCursorInFollowUp(false);
    setGraphLit(false);
    clearTimers();

    // Stage 1: Docs scatter in (right zone)
    addTimer(() => setStage(1), 200);

    // Stage 2: Graph box appears (unlit) + docs fly into it
    addTimer(() => setStage(2), 2500);

    // Stage 3: Graph ignites (swap to lit image)
    addTimer(() => {
      setStage(3);
      addTimer(() => setGraphLit(true), 600);
    }, 5000);

    // Stage 4: Chat panel appears + typing sequence
    addTimer(() => {
      setStage(4);
      const queryText = t('visionMemory.convergence.query');

      // Start typing query in input
      addTimer(() => {
        typeText(queryText, setTypedQuery, setCursorInInput, 16, () => {
          // Submit: query moves to chat bubble
          addTimer(() => {
            setQuerySubmitted(true);
            setTypedQuery('');

            // Thinking dots
            addTimer(() => {
              setShowThinking(true);

              // Noor responds
              addTimer(() => {
                setShowThinking(false);
                setShowResponse(true);

                // Follow-up types in input
                const followUp = t('visionMemory.convergence.followUp');
                addTimer(() => {
                  typeText(followUp, setTypedFollowUp, setCursorInFollowUp, 28, () => {
                    addTimer(() => setShowReplay(true), 1000);
                  });
                }, 1500);
              }, 2200);
            }, 600);
          }, 500);
        });
      }, 700);
    }, 7000);
  }, [t, typeText, addTimer, clearTimers]);

  // ── Lifecycle ─────────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      runSequence();
      document.body.style.overflow = 'hidden';
    } else {
      clearTimers();
      setStage(0);
      document.body.style.overflow = '';
    }
    return () => {
      clearTimers();
      document.body.style.overflow = '';
    };
  }, [isOpen, runSequence, clearTimers]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const queryText = t('visionMemory.convergence.query');

  // Fly target: center of graph (percentage-based)
  const flyX = isMobile ? 50 : 50;
  const flyY = isMobile ? 30 : 42;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="vc-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <button className="vc-close" onClick={onClose} aria-label="Close">&times;</button>

          <div className="vc-canvas">

            {/* ═══ DOCUMENT CARDS — Right Zone ═══ */}
            <AnimatePresence>
              {(stage === 1 || stage === 2) && docCards.map((doc, i) => {
                const flying = stage === 2;
                const stagger = i * 0.04;
                const src = SOURCE_STYLES[doc.source];

                return (
                  <motion.div
                    key={doc.name}
                    className="vc-doc"
                    style={{ ['--doc-hdr' as string]: src.header }}
                    initial={{
                      left: `${doc.x}%`,
                      top: `${doc.y}%`,
                      rotate: doc.rotation,
                      opacity: 0,
                      scale: doc.scale,
                    }}
                    animate={flying ? {
                      left: `${flyX}%`,
                      top: `${flyY}%`,
                      rotate: 0,
                      opacity: 0,
                      scale: 0.08,
                    } : {
                      left: `${doc.x}%`,
                      top: `${doc.y}%`,
                      rotate: doc.rotation,
                      opacity: 1,
                      scale: doc.scale,
                    }}
                    exit={{ opacity: 0, scale: 0.05 }}
                    transition={flying ? {
                      duration: 1.6,
                      delay: stagger,
                      ease: [0.55, 0, 1, 0.45],
                    } : {
                      duration: 0.5,
                      delay: stagger * 0.7,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <div className="vc-doc-hdr">
                      <div className="vc-doc-seal" />
                    </div>
                    <div className="vc-doc-body">
                      <div className="vc-doc-title">{doc.name}</div>
                      <div className="vc-doc-lines">
                        <span /><span /><span /><span />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* ═══ GRAPH IMAGE — Center ═══ */}
            {stage >= 2 && (
              <motion.div
                className="vc-graph-container"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Unlit layer — always visible, fades out when lit */}
                <img
                  src="/att/landing-screenshots/3_carousel/1.jpg"
                  alt=""
                  className={`vc-graph-img vc-graph-img--unlit ${graphLit ? 'vc-graph-img--hidden' : ''}`}
                />
                {/* Lit layer — fades in */}
                <img
                  src="/att/landing-screenshots/3_carousel/2.jpg"
                  alt=""
                  className={`vc-graph-img vc-graph-img--lit ${graphLit ? 'vc-graph-img--visible' : ''}`}
                />
              </motion.div>
            )}

            {/* ═══ CHAT PANEL — Left Zone ═══ */}
            {stage >= 4 && (
              <motion.div
                className="vc-chat"
                initial={{ opacity: 0, x: isRtl ? 50 : -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Header */}
                <div className="vc-chat-hdr">
                  <div className="vc-chat-avatar">N</div>
                  <div className="vc-chat-hdr-info">
                    <span className="vc-chat-name">{t('visionMemory.convergence.noorName')}</span>
                    <span className="vc-chat-online" />
                  </div>
                </div>

                {/* Messages */}
                <div className="vc-chat-msgs">
                  {querySubmitted && (
                    <motion.div
                      className="vc-msg vc-msg--user"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {queryText}
                    </motion.div>
                  )}

                  {showThinking && (
                    <motion.div
                      className="vc-msg vc-msg--thinking"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <span className="vc-dots"><i /><i /><i /></span>
                      <span>{t('visionMemory.convergence.thinking')}</span>
                    </motion.div>
                  )}

                  {showResponse && (
                    <motion.div
                      className="vc-msg vc-msg--noor"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                    >
                      <div className="vc-msg-title">{t('visionMemory.convergence.resultTitle')}</div>
                      <div className="vc-msg-item">{t('visionMemory.convergence.result1')}</div>
                      <div className="vc-msg-item">{t('visionMemory.convergence.result2')}</div>
                      <div className="vc-msg-item">{t('visionMemory.convergence.result3')}</div>
                      <div className="vc-msg-footer">{t('visionMemory.convergence.resultFooter')}</div>
                    </motion.div>
                  )}
                </div>

                {/* Input */}
                <div className="vc-chat-input-wrap">
                  <div className="vc-chat-input">
                    <span className="vc-chat-input-text">
                      {typedQuery || typedFollowUp || (
                        <span className="vc-placeholder">{t('visionMemory.convergence.chatPlaceholder')}</span>
                      )}
                      {(cursorInInput || cursorInFollowUp) && <span className="vc-cursor" />}
                    </span>
                    <button className="vc-send">&uarr;</button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Discovery note */}
          {showResponse && (
            <motion.p
              className="vc-note"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              {t('visionMemory.convergence.discoveryNote')}
            </motion.p>
          )}

          {/* Replay */}
          {showReplay && (
            <motion.button
              className="vc-replay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={runSequence}
            >
              {t('visionMemory.convergence.replay')}
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
