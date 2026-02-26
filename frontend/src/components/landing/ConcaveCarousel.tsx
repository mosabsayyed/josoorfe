import React, { useEffect, useRef, useState } from 'react';

interface ConcaveCarouselProps {
  children: React.ReactElement[];
  autoRotateInterval?: number; // milliseconds
  height?: string;
}

export default function ConcaveCarousel({
  children,
  autoRotateInterval = 6000,
  height = '580px'
}: ConcaveCarouselProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const total = children.length;
  const trackRef = useRef<HTMLDivElement>(null);

  // Auto-rotation effect (respects reduced-motion)
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isPaused || !autoRotateInterval || prefersReducedMotion) return;

    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % total);
    }, autoRotateInterval);

    return () => clearInterval(interval);
  }, [isPaused, total, autoRotateInterval]);

  const rotate = (direction: number) => {
    setCurrent((prev) => (prev + direction + total) % total);
  };

  const goTo = (index: number) => {
    setCurrent(index);
  };

  const getPosition = (childIndex: number): number | 'hidden' => {
    let pos = childIndex - current;
    // Wrap around
    if (pos > Math.floor(total / 2)) pos -= total;
    if (pos < -Math.floor(total / 2)) pos += total;
    if (pos < -2 || pos > 2) return 'hidden';
    return pos;
  };

  const handleCardClick = (position: number | 'hidden') => {
    if (position === -1 || position === -2) {
      rotate(-1);
    } else if (position === 1 || position === 2) {
      rotate(1);
    }
  };

  return (
    <div
      className="cc-wrap"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className="cc-track"
        ref={trackRef}
        style={{ height: isMobile ? '400px' : height }}
      >
        {React.Children.map(children, (child, index) => {
          const position = getPosition(index);
          return React.cloneElement(child, {
            'data-pos': position,
            'data-idx': index,
            onClick: () => handleCardClick(position),
            style: { cursor: position === 0 ? 'default' : 'pointer' }
          });
        })}
      </div>

      <div className="cc-controls" dir="ltr">
        <button
          className="cc-btn"
          onClick={() => rotate(-1)}
          aria-label="Previous"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ direction: 'ltr' }}><path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div className="cc-dots" role="tablist" aria-label="Carousel slides">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              className={`cc-dot ${i === current ? 'active' : ''}`}
              onClick={() => goTo(i)}
              role="tab"
              aria-selected={i === current}
              aria-label={`Slide ${i + 1} of ${total}`}
            />
          ))}
        </div>
        <button
          className="cc-btn"
          onClick={() => rotate(1)}
          aria-label="Next"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ direction: 'ltr' }}><path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  );
}
