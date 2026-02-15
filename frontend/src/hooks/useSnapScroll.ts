import { useEffect, useRef, useCallback } from 'react';

interface SnapPoint {
  id: string;
  top: number;
}

interface UseSnapScrollOptions {
  sections: string[];
  enabled?: boolean;
}

/**
 * Finds the element that actually scrolls (has overflow and content taller than its box).
 */
function findScrollContainer(): HTMLElement {
  const candidates = [
    document.querySelector('.landing-page'),
    document.getElementById('root'),
    document.documentElement,
  ];
  for (const el of candidates) {
    if (!el) continue;
    if ((el as HTMLElement).scrollHeight > (el as HTMLElement).clientHeight) {
      return el as HTMLElement;
    }
  }
  return document.documentElement;
}

/**
 * Calculates absolute scroll positions for each snap point.
 * AItoIA ('aitoia') produces TWO snap points: AI state and IA state.
 */
function calcSnapPoints(sections: string[], container: HTMLElement): SnapPoint[] {
  const points: SnapPoint[] = [];
  const vh = window.innerHeight;

  // Measure fixed header height so sections aren't hidden behind it
  const header = document.querySelector('header');
  const navH = header ? header.getBoundingClientRect().height : 0;

  for (const id of sections) {
    const el = document.getElementById(id);
    if (!el) continue;

    const elTop = el.getBoundingClientRect().top + container.scrollTop;

    if (id === 'aitoia') {
      // AItoIA fills full viewport — no nav offset needed (canvas sits behind nav)
      points.push({ id: 'aitoia-ai', top: elTop });
      points.push({ id: 'aitoia-ia', top: elTop + el.offsetHeight - vh });
    } else if (id === 'hero') {
      // Hero starts at page top — no offset
      points.push({ id, top: elTop });
    } else {
      // Regular sections: offset so content starts below the fixed nav
      points.push({ id, top: Math.max(0, elTop - navH) });
    }
  }
  return points;
}

/** Ease-in-out cubic: gentle acceleration AND deceleration */
function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const SCROLL_DURATION_MS = 1200;

export default function useSnapScroll({
  sections,
  enabled = true,
}: UseSnapScrollOptions) {
  const scrollingRef = useRef(false);
  const animFrameRef = useRef(0);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLElement | null>(null);
  const pointsRef = useRef<SnapPoint[]>([]);
  const currentRef = useRef(0);

  // Recalculate snap positions
  const recalc = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    pointsRef.current = calcSnapPoints(sections, container);
  }, [sections]);

  // Find the nearest snap index to the current scroll position
  const findNearest = useCallback((): number => {
    const container = containerRef.current;
    if (!container) return 0;
    const scrollY = container.scrollTop;
    const points = pointsRef.current;
    let nearest = 0;
    let minDist = Infinity;
    for (let i = 0; i < points.length; i++) {
      const dist = Math.abs(points[i].top - scrollY);
      if (dist < minDist) {
        minDist = dist;
        nearest = i;
      }
    }
    return nearest;
  }, []);

  // Clear cooldown lock
  const clearCooldown = useCallback(() => {
    scrollingRef.current = false;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  }, []);

  // Smooth scroll to a specific snap index using RAF animation
  const snapTo = useCallback((index: number) => {
    const container = containerRef.current;
    const points = pointsRef.current;
    if (!container || index < 0 || index >= points.length) return;

    // Cancel any in-progress animation
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    scrollingRef.current = true;
    currentRef.current = index;

    const startY = container.scrollTop;
    const targetY = points[index].top;
    const distance = targetY - startY;

    // If already at target, skip animation
    if (Math.abs(distance) < 1) {
      scrollingRef.current = false;
      return;
    }

    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / SCROLL_DURATION_MS, 1);
      const eased = easeInOutCubic(progress);

      container.scrollTop = startY + distance * eased;

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        // Animation complete — ensure we land exactly on target
        container.scrollTop = targetY;
        scrollingRef.current = false;
      }
    };

    animFrameRef.current = requestAnimationFrame(step);
  }, []);

  // Navigate by direction: +1 (down) or -1 (up)
  const snap = useCallback((direction: 1 | -1) => {
    if (scrollingRef.current) return;
    recalc(); // Refresh positions before snapping
    const nearest = findNearest();
    const next = nearest + direction;
    if (next < 0 || next >= pointsRef.current.length) return;
    snapTo(next);
  }, [recalc, findNearest, snapTo]);

  // Public: scroll to a section by ID (for nav links)
  const scrollToSection = useCallback((targetId: string) => {
    recalc();
    const points = pointsRef.current;
    // Match by id or aitoia prefix
    let idx = points.findIndex((p) => p.id === targetId);
    if (idx === -1 && targetId === 'aitoia') {
      idx = points.findIndex((p) => p.id === 'aitoia-ai');
    }
    if (idx !== -1) {
      clearCooldown();
      snapTo(idx);
    }
  }, [recalc, snapTo, clearCooldown]);

  useEffect(() => {
    if (!enabled) return;

    const container = findScrollContainer();
    containerRef.current = container;
    pointsRef.current = calcSnapPoints(sections, container);

    // ── Wheel ──
    const onWheel = (e: WheelEvent) => {
      if (scrollingRef.current) {
        e.preventDefault();
        return;
      }
      // Only snap on meaningful scroll (ignore tiny trackpad noise)
      if (Math.abs(e.deltaY) < 5) return;
      e.preventDefault();
      snap(e.deltaY > 0 ? 1 : -1);
    };

    // ── Keyboard ──
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      switch (e.key) {
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          snap(1);
          break;
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          snap(-1);
          break;
        case ' ':
          e.preventDefault();
          snap(e.shiftKey ? -1 : 1);
          break;
        case 'Home':
          e.preventDefault();
          clearCooldown();
          snapTo(0);
          break;
        case 'End':
          e.preventDefault();
          clearCooldown();
          snapTo(pointsRef.current.length - 1);
          break;
      }
    };

    // ── Touch (mobile swipe) ──
    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const dy = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(dy) < 50) return; // Minimum swipe distance
      snap(dy > 0 ? 1 : -1);
    };

    // ── Resize ──
    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        pointsRef.current = calcSnapPoints(sections, container);
      }, 150);
    };

    // Attach listeners
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);

    return () => {
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      clearTimeout(resizeTimer);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [sections, enabled, snap, snapTo, clearCooldown]);

  return { scrollToSection, resetCooldown: clearCooldown };
}
