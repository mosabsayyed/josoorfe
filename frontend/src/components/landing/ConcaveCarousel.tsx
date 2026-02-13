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
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const total = children.length;
  const trackRef = useRef<HTMLDivElement>(null);

  // Auto-rotation effect
  useEffect(() => {
    if (isPaused || !autoRotateInterval) return;

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
        style={{ height }}
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

      <div className="cc-controls">
        <button
          className="cc-btn"
          onClick={() => rotate(-1)}
          aria-label="Previous"
        >
          &#8592;
        </button>
        <div className="cc-dots">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`cc-dot ${i === current ? 'active' : ''}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
        <button
          className="cc-btn"
          onClick={() => rotate(1)}
          aria-label="Next"
        >
          &#8594;
        </button>
      </div>
    </div>
  );
}
