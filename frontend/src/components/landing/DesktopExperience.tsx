import React, { useState, useEffect, useRef, useCallback } from 'react';

const BASE = '/att/landing-screenshots/desktopexp';
const AR_BASE = '/att/landing-screenshots/ar';

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
  arPages?: string[];              // Arabic screenshot equivalents (same length as pages)
  caption: string | string[];
  captionAr?: string | string[];
  transitions?: PageTransition[];  // how to go from page[i] to page[i+1]
}

// Layout: Row 1 (1): Start Here | Row 2 (3): Observe, Decide, Deliver | Row 3 (2): Signals, Chat
// Row 4 (3): Tutorial, Reporting, Documents | Row 5 (3): Calendar, Settings, Observability
const ICONS: DesktopIcon[] = [
  // Row 1 — entry point
  {
    id: 'ontology', label: 'Start Here', icon: `${BASE}/ontology.jpg`,
    pages: [`${BASE}/ontology1.jpg`, `${BASE}/ontology2.jpg`, `${BASE}/ontology3.jpg`, `${BASE}/ontology4.jpg`],
    arPages: [`${AR_BASE}/23.jpg`, `${AR_BASE}/24.jpg`, `${AR_BASE}/21.jpg`, `${AR_BASE}/22.jpg`],
    caption: [
      'End-to-end strategy execution — our ontology unlocks many possibilities, starting with seeing everything in one view',
      'You don\'t just see it — risks with priorities surface right here, no deep dives needed. 66 of 131 need attention.',
      'Generate a report on the overall sector or the health of any specific node — instant insights for your decision making',
      'Now every node tells you what\'s wrong and what to do — STATUS, WHY, and ACTION — nothing stays hidden',
    ],
    captionAr: [
      'تنفيذ استراتيجي شامل — الأنطولوجيا تفتح إمكانيات عديدة، بدءًا من رؤية كل شيء في عرض واحد',
      'لا تكتفي بالمشاهدة — المخاطر والأولويات تظهر أمامك مباشرة، دون الحاجة لتعمّق. 66 من 131 تحتاج انتباهك.',
      'أنشئ تقريرًا عن القطاع ككل أو صحة أي عنصر محدد — رؤى فورية لدعم قراراتك',
      'الآن كل عنصر يخبرك بالمشكلة والحل — الحالة، السبب، والإجراء — لا شيء يبقى مخفيًا',
    ],
    transitions: [
      { clickX: 78, clickY: 40 },  // ontology1 → 2: click risk indicator on map
      { clickX: 8, clickY: 5 },    // ontology2 → 3: click AI report button
      { clickX: 74, clickY: 8 },   // ontology3 → 4: close modal, see risk overlay
    ],
  },
  // Row 2 — the three steps
  {
    id: 'observe', label: 'Observe', icon: `${BASE}/observe.jpg`,
    pages: [`${BASE}/observe1.png`, `${BASE}/observe2.jpg`, `${BASE}/observe3.jpg`],
    arPages: [`${AR_BASE}/20.jpg`, `${AR_BASE}/19.jpg`, `${AR_BASE}/18.jpg`],
    caption: [
      'Monitor the big picture — the cross-sector and Vision 2030 angle, with every KPI and operational footprint in one place',
      'Capture any specific program and instantly initiate a deep dive into your internal house and capabilities',
      'See delivery programs, linked capabilities, and progress — all connected, all in real time',
    ],
    captionAr: [
      'راقب الصورة الكبرى — البُعد القطاعي ورؤية 2030، مع كل مؤشر أداء وبصمة تشغيلية في مكان واحد',
      'التقط أي برنامج وابدأ فورًا بالغوص في تفاصيل منظومتك الداخلية وقدراتك',
      'شاهد برامج التنفيذ والقدرات المرتبطة والتقدم — كل شيء مترابط، كل شيء لحظي',
    ],
    transitions: [
      { clickX: 20, clickY: 8 },   // observe1 → 2
      { clickX: 55, clickY: 40 },  // observe2 → 3: click Digital Transformation item
    ],
  },
  {
    id: 'decide', label: 'Decide', icon: `${BASE}/decide.jpg`,
    pages: [`${BASE}/decide1.jpg`, `${BASE}/decide2.jpg`, `${BASE}/decide3.jpg`, `${BASE}/decide4.jpg`],
    arPages: [`${AR_BASE}/11.jpg`, `${AR_BASE}/13.jpg`, `${AR_BASE}/14.jpg`, `${AR_BASE}/12.jpg`],
    caption: [
      'Find the risks — assess capability health, maturity levels, and the scores behind each one',
      'Get an instant detailed analysis — the AI decomposes the risk with compliance trends and operational health',
      'See how each strategic option shifts your risk profile across all drivers before you act',
      'Receive options to action now — compare strategies and select the one that fits your context',
    ],
    captionAr: [
      'اكتشف المخاطر — قيّم صحة القدرات ومستويات النضج والدرجات خلف كل واحدة',
      'احصل على تحليل تفصيلي فوري — الذكاء الاصطناعي يفكك المخاطر مع اتجاهات الامتثال والصحة التشغيلية',
      'شاهد كيف يغيّر كل خيار استراتيجي ملف المخاطر عبر جميع المحركات قبل أن تتخذ قرارك',
      'استلم خيارات جاهزة للتنفيذ — قارن الاستراتيجيات واختر الأنسب لسياقك',
    ],
    transitions: [
      { clickX: 87, clickY: 10 },            // decide1 → 2: click Risk Advisory
      { clickX: 50, clickY: 50, auto: true }, // decide2 → 3: auto-scroll to radar chart
      { clickX: 50, clickY: 50, auto: true }, // decide3 → 4: auto-scroll to strategies
    ],
  },
  {
    id: 'deliver', label: 'Deliver', icon: `${BASE}/deliver.jpg`,
    pages: [`${BASE}/deliver1.jpg`, `${BASE}/deliver2.png`, `${BASE}/deliver4.jpg`, `${BASE}/deliver5.jpg`],
    arPages: [`${AR_BASE}/10.jpg`, `${AR_BASE}/9.jpg`, `${AR_BASE}/8.jpg`, `${AR_BASE}/7.jpg`],
    caption: [
      'Convert your decision instantly into a plan — the AI generates a tailored intervention based on the risk context',
      'Review every detail — objectives, milestones, timelines, and resources — before you commit',
      'The plan becomes a timeline — every task, owner, and deadline mapped out, ready to push to the teams',
      'Plan committed and pushed out — from objectives to tasks in one loop, all in minutes. Delivery at the speed of ambition.',
    ],
    captionAr: [
      'حوّل قرارك فورًا إلى خطة — الذكاء الاصطناعي يولّد تدخلًا مخصصًا بناءً على سياق المخاطر',
      'راجع كل التفاصيل — الأهداف، المراحل، الجداول الزمنية، والموارد — قبل الالتزام',
      'الخطة تتحول لجدول زمني — كل مهمة ومسؤول وموعد محددين، جاهزة للدفع إلى الفرق',
      'الخطة اعتُمدت ودُفعت — من الأهداف إلى المهام في دورة واحدة، في دقائق. تنفيذ بسرعة الطموح.',
    ],
    transitions: [
      { clickX: 50, clickY: 50, auto: true }, // deliver1 → 2: auto (loading → plan text)
      { clickX: 93, clickY: 7 },              // deliver2 → 4: click "Create Plan"
      { clickX: 93, clickY: 7 },              // deliver4 → 5: click "Commit Plan"
    ],
  },
  // Row 3 — two blocks
  {
    id: 'signal', label: 'Signals', icon: `${BASE}/signal.jpg`,
    pages: [`${BASE}/signal1.jpg`, `${BASE}/signal2.jpg`, `${BASE}/signal3.jpg`],
    arPages: [`${AR_BASE}/28.jpg`, `${AR_BASE}/26.jpg`, `${AR_BASE}/27.jpg`],
    caption: [
      'Ever wondered what "complex" looks like? This is your entire system as a living sphere',
      'Sankey flows — trace how entities connect and influence each other across the chain',
      'Multiple lenses to view the same data — discover patterns that tables and charts can\'t show',
    ],
    captionAr: [
      'هل تساءلت يومًا كيف يبدو "التعقيد"؟ هذا نظامك بالكامل ككرة حية',
      'تدفقات سانكي — تتبّع كيف تتصل الكيانات وتؤثر على بعضها عبر السلسلة',
      'عدسات متعددة لعرض نفس البيانات — اكتشف أنماطًا لا تظهرها الجداول والرسوم البيانية',
    ],
    transitions: [
      { clickX: 6, clickY: 39 },
      { clickX: 16, clickY: 33 },
    ],
  },
  { id: 'chatexpert', label: 'Expert Chat', icon: `${BASE}/chatexpert.jpg`, pages: [`${BASE}/chatexpert1.jpg`], arPages: [`${AR_BASE}/4.jpg`], caption: 'Ask your AI expert anything — with full context of your data', captionAr: 'اسأل خبيرك الذكي أي شيء — بسياق كامل من بياناتك' },
  // Row 4 — supporting tools
  { id: 'tutorial', label: 'Tutorials', icon: `${BASE}/tutorial.jpg`, pages: [`${BASE}/tutorial1.jpg`], arPages: [`${AR_BASE}/3.jpg`], caption: 'Step-by-step guides for every workflow and feature', captionAr: 'أدلة خطوة بخطوة لكل سير عمل وميزة' },
  {
    id: 'reporting', label: 'Reporting', icon: `${BASE}/reporting.jpg`,
    pages: [`${BASE}/reporting1.png`, `${BASE}/reporting2.png`],
    arPages: [`${AR_BASE}/1.jpg`, `${AR_BASE}/2.jpg`],
    caption: [
      'Control outcome tracking — monitor progress against committed plans',
      'Automated performance reports — standard reports generated from live data',
    ],
    captionAr: [
      'تتبّع المخرجات — راقب التقدم مقارنة بالخطط المعتمدة',
      'تقارير أداء آلية — تقارير معيارية تُولّد من البيانات الحية',
    ],
    transitions: [{ clickX: 78, clickY: 10 }],
  },
  { id: 'documents', label: 'Documents', icon: `${BASE}/Object.png`, pages: [], caption: '' },
  // Row 5 — utilities
  { id: 'calendar', label: 'Calendar', icon: `${BASE}/calendar.jpg`, pages: [], caption: '' },
  { id: 'settings', label: 'Settings', icon: `${BASE}/Setting.jpg`, pages: [], caption: '' },
  { id: 'observability', label: 'Observability', icon: `${BASE}/observability.jpg`, pages: [`${BASE}/observability1.jpg`], caption: 'Platform health, data quality monitoring, and system observability', captionAr: 'صحة المنصة ومراقبة جودة البيانات وقابلية مراقبة النظام' },
];

// Tour steps — manually defined, with decide+deliver merged into one seamless flow
const TOUR_STEPS: DesktopIcon[] = [
  ICONS[0], // ontology (4 pages)
  ICONS[1], // observe (3 pages)
  // Merged decide → deliver: continuous flow from analysis to commitment
  {
    id: 'decide', label: 'Decide', icon: `${BASE}/decide.jpg`,
    pages: [
      `${BASE}/decide1.jpg`, `${BASE}/decide2.jpg`, `${BASE}/decide3.jpg`, `${BASE}/decide4.jpg`, // Decide: capability → risk advisory → radar → strategies
      `${BASE}/deliver1.jpg`, `${BASE}/deliver2.png`, `${BASE}/deliver4.jpg`, `${BASE}/deliver5.jpg`, // Deliver: loading → plan → gantt → committed
    ],
    arPages: [
      `${AR_BASE}/11.jpg`, `${AR_BASE}/13.jpg`, `${AR_BASE}/14.jpg`, `${AR_BASE}/12.jpg`, // Decide AR
      `${AR_BASE}/10.jpg`, `${AR_BASE}/9.jpg`, `${AR_BASE}/8.jpg`, `${AR_BASE}/7.jpg`, // Deliver AR
    ],
    caption: [
      'Find the risks — assess capability health, maturity levels, and the scores behind each one',
      'Get an instant detailed analysis — the AI decomposes the risk with compliance trends and operational health',
      'See how each strategic option shifts your risk profile across all drivers before you act',
      'Receive options to action now — compare strategies and select the one that fits your context',
      'Convert your decision instantly into a plan — the AI generates a tailored intervention based on the risk context',
      'Review every detail — objectives, milestones, timelines, and resources — before you commit',
      'The plan becomes a timeline — every task, owner, and deadline mapped out, ready to push to the teams',
      'Plan committed and pushed out — from objectives to tasks in one loop, all in minutes. Delivery at the speed of ambition.',
    ],
    captionAr: [
      'اكتشف المخاطر — قيّم صحة القدرات ومستويات النضج والدرجات خلف كل واحدة',
      'احصل على تحليل تفصيلي فوري — الذكاء الاصطناعي يفكك المخاطر مع اتجاهات الامتثال والصحة التشغيلية',
      'شاهد كيف يغيّر كل خيار استراتيجي ملف المخاطر عبر جميع المحركات قبل أن تتخذ قرارك',
      'استلم خيارات جاهزة للتنفيذ — قارن الاستراتيجيات واختر الأنسب لسياقك',
      'حوّل قرارك فورًا إلى خطة — الذكاء الاصطناعي يولّد تدخلًا مخصصًا بناءً على سياق المخاطر',
      'راجع كل التفاصيل — الأهداف، المراحل، الجداول الزمنية، والموارد — قبل الالتزام',
      'الخطة تتحول لجدول زمني — كل مهمة ومسؤول وموعد محددين، جاهزة للدفع إلى الفرق',
      'الخطة اعتُمدت ودُفعت — من الأهداف إلى المهام في دورة واحدة، في دقائق. تنفيذ بسرعة الطموح.',
    ],
    transitions: [
      { clickX: 87, clickY: 10 },            // decide1 → decide2: click Risk Advisory
      { clickX: 50, clickY: 50, auto: true }, // decide2 → decide3: auto-scroll to radar chart
      { clickX: 50, clickY: 50, auto: true }, // decide3 → decide4: auto-scroll to strategies
      { clickX: 90, clickY: 40 },            // decide4 → deliver1: click "Select →" on strategy
      { clickX: 50, clickY: 50, auto: true }, // deliver1 → deliver2: auto (loading → plan text)
      { clickX: 93, clickY: 7 },             // deliver2 → deliver4: click "Create Plan"
      { clickX: 93, clickY: 7 },             // deliver4 → deliver5: click "Commit Plan"
    ],
  },
  ICONS[4], // signal
  ICONS[5], // chatexpert
  ICONS[6], // tutorial
  ICONS[7], // reporting
  ICONS[11], // observability
];

// Arabic labels for icons
// Arabic labels — matching the app's i18n exactly
const AR_LABELS: Record<string, string> = {
  ontology: 'ابدأ هنا',
  observe: 'رصد',
  decide: 'قرار',
  deliver: 'تنفيذ',
  signal: 'إشارات',
  chatexpert: 'محادثة الخبير',
  tutorial: 'الدروس',
  reporting: 'التقارير',
  documents: 'المستندات',
  calendar: 'التقويم',
  settings: 'الإعدادات',
  observability: 'المراقبة',
};

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

const SKIP_KEY = 'josoor_desktop_tour_seen';

export default function DesktopExperience({ language = 'ar' }: DesktopExperienceProps) {
  const isRTL = language === 'ar';

  // Check if user has seen the animation before
  const hasSeenTour = typeof window !== 'undefined' && localStorage.getItem(SKIP_KEY) === '1';

  const [phase, setPhase] = useState<Phase>(hasSeenTour ? 'free' : 'boot');
  const [isMobile, setIsMobile] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [iconsVisible, setIconsVisible] = useState(hasSeenTour);

  // Boot / logo state
  const [biosOpacity, setBiosOpacity] = useState(hasSeenTour ? 0 : 1);
  const [logoVisible, setLogoVisible] = useState(false);
  const [logoScale, setLogoScale] = useState(1);
  const [logoOpacity, setLogoOpacity] = useState(0);
  const [desktopOpacity, setDesktopOpacity] = useState(hasSeenTour ? 1 : 0);
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

  // Skip animation → jump to free mode
  const skipToFree = useCallback(() => {
    skippedRef.current = true;
    tourRunningRef.current = false;
    tourTimeoutsRef.current.forEach(clearTimeout);
    tourTimeoutsRef.current = [];
    setBiosOpacity(0);
    setLogoVisible(false);
    setDesktopOpacity(1);
    setIconsVisible(true);
    setWindowVisible(false);
    setWindow_(null);
    setDimmedIcons(false);
    setHighlightedId(null);
    setCursor({ x: 50, y: 50, visible: false, clicking: false });
    setPhase('free');
    localStorage.setItem(SKIP_KEY, '1');
  }, []);

  // Responsive
  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth <= 1024);
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
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

  const isLandscapeMobile = isMobile && !isPortrait;
  const iconSize = isLandscapeMobile ? 40 : (isMobile ? 48 : 68);
  const iconGap = isLandscapeMobile ? 12 : (isMobile ? 16 : 32);

  // Track if skip was triggered — survives across renders
  const skippedRef = useRef(hasSeenTour);

  // ── Phase machine ──────────────────────────────────────────────
  useEffect(() => {
    if (skippedRef.current) return; // Already skipped, don't start boot sequence
    // Phase 1: boot (2s)
    const t1 = setTimeout(() => {
      if (skippedRef.current) return;
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

  // Start tour after icons are visible (only if not already skipped/free)
  useEffect(() => {
    if (!iconsVisible || skippedRef.current) return;
    const t = setTimeout(() => {
      if (skippedRef.current) return;
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
        localStorage.setItem(SKIP_KEY, '1');
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
    const captionSource = isRTL && icon.captionAr ? icon.captionAr : icon.caption;
    const currentCaption = Array.isArray(captionSource) ? captionSource[pageIndex] : captionSource;
    const pages = isRTL && icon.arPages ? icon.arPages : icon.pages;
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
            <div style={{ position: 'relative', flex: 1, backgroundColor: '#000' }}>
              {pages.map((src, idx) => (
                <img
                  key={src}
                  src={src}
                  alt={`${icon.label} page ${idx + 1}`}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    opacity: idx === pageIndex ? 1 : 0,
                    transition: 'opacity 0.4s ease',
                    display: 'block',
                  }}
                  draggable={false}
                />
              ))}
            </div>

            {/* Caption strip — solid black bar overlaid on screenshot */}
            {currentCaption && (
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
                {pages.length > 1 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '10px',
                  }}>
                    {pages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={onPageChange ? (e) => { e.stopPropagation(); onPageChange(idx); } : undefined}
                        style={{
                          width: isLandscapeMobile ? 6 : (isMobile ? 8 : 12),
                          height: isLandscapeMobile ? 6 : (isMobile ? 8 : 12),
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
                  letterSpacing: isRTL ? undefined : '0.01em',
                  direction: isRTL ? 'rtl' : 'ltr',
                }}>
                  {currentCaption}
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
        {/* Rotate Device Overlay */}
        {isMobile && isPortrait && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 9999,
            background: 'rgba(10,10,26,0.95)', backdropFilter: 'blur(10px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: '#fff', textAlign: 'center', padding: 20
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16, animation: 'rotateIcon 2s infinite ease-in-out' }}>
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
              <line x1="12" y1="18" x2="12.01" y2="18"></line>
            </svg>
            <style>{`
              @keyframes rotateIcon {
                0% { transform: rotate(0deg); }
                50% { transform: rotate(-90deg); }
                100% { transform: rotate(-90deg); }
              }
            `}</style>
            <h3 style={{ fontSize: 20, marginBottom: 8, fontWeight: 600 }}>
              {isRTL ? 'يُرجى تدوير جهازك' : 'Please rotate your device'}
            </h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', maxWidth: 280 }}>
              {isRTL 
                ? 'للحصول على أفضل تجربة تفاعلية للجولة، يُرجى استخدام الوضع الأفقي.'
                : 'For the best interactive tour experience, please turn your device to landscape.'}
            </p>
          </div>
        )}

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
            top: 0,
            bottom: 0,
            left: isRTL ? 0 : undefined,
            right: isRTL ? undefined : 0,
            paddingTop: isMobile ? '12%' : '8%',
            paddingLeft: isMobile ? '8%' : '10%',
            paddingRight: isMobile ? '8%' : '10%',
            display: 'grid',
            gridTemplateColumns: `repeat(3, ${iconSize}px)`,
            gridAutoRows: `${iconSize + 24}px`,
            gap: `${iconGap}px`,
            alignContent: 'start',
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
                  title={isRTL ? (AR_LABELS[icon.id] || icon.label) : icon.label}
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
                    {isRTL ? (AR_LABELS[icon.id] || icon.label) : icon.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Replay tour button */}
          {phase === 'free' && (
            <button
              onClick={() => {
                tourRunningRef.current = false;
                clearAllTimeouts();
                setTourIconIndex(0);
                setDimmedIcons(false);
                setHighlightedId(null);
                setCursor({ x: 50, y: 50, visible: false, clicking: false });
                setPhase('tour');
              }}
              style={{
                position: 'absolute',
                top: isMobile ? 8 : 12,
                left: isRTL ? (isMobile ? 8 : 12) : undefined,
                right: isRTL ? undefined : (isMobile ? 8 : 12),
                zIndex: 20,
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(244,187,48,0.4)',
                borderRadius: 6,
                padding: isMobile ? '4px 8px' : '5px 10px',
                color: 'rgba(255,255,255,0.7)',
                fontSize: isMobile ? 9 : 11,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,187,48,0.2)'; e.currentTarget.style.color = '#F4BB30'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
            >
              <span style={{ fontSize: isMobile ? 10 : 12 }}>&#9654;</span>
              {isRTL ? 'إعادة' : 'Replay'}
            </button>
          )}
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

        {/* ── Skip button — visible during animation/tour ── */}
        {phase !== 'free' && (
          <button
            onClick={skipToFree}
            style={{
              position: 'absolute',
              bottom: isMobile ? 12 : 16,
              ...(isRTL ? { left: isMobile ? 12 : 16 } : { right: isMobile ? 12 : 16 }),
              zIndex: 70,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              padding: isMobile ? '6px 14px' : '8px 18px',
              color: 'rgba(255,255,255,0.8)',
              fontSize: isMobile ? 11 : 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s ease, color 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(244,187,48,0.3)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.6)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
            }}
          >
            {isRTL ? 'تخطي' : 'Skip'}
          </button>
        )}
      </div>
    </>
  );
}
