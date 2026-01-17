import svgPaths from '@/components/desks/sector/data/svg-ydduxkvvhk';
import './GaugeCard.css';

interface GaugeCardProps {
  label: string;
  value: number;
  status: 'green' | 'amber' | 'red';
  delta: string;
  baseValue: number;
  qMinus1: number;
  qPlus1: number;
  endValue: number;
  scale?: number; // Optional scale factor (default: 1)
  family?: string; // Family for color differentiation
  level?: 1 | 2; // Card level (1 for main cards, 2 for sub-cards)
}

export function GaugeCard({ label, value, status, delta, baseValue, qMinus1, qPlus1, endValue, scale = 1, family = '1.0', level = 1 }: GaugeCardProps) {
  // Determine gradient colors based on status and family
  const gradientColors = family === '2.0'
    ? (status === 'amber'
      ? { start: '#fb923c', end: '#c2410c' } // Slightly different orange for 2.0 family
      : { start: '#2CC664', end: '#156031' })
    : (status === 'green'
      ? { start: '#2CC664', end: '#156031' }
      : status === 'amber'
        ? { start: '#f59e0b', end: '#b45309' }
        : { start: '#ef4444', end: '#991b1b' });

  // Background color (unified)
  const bgColor = '#314158';

  const deltaColor = delta.startsWith('+') ? '#00d492' : '#ef4444';

  // Labels based on level
  const labelMinus1 = level === 1 ? 'Y-1' : 'Q-1';
  const labelPlus1 = level === 1 ? 'Y+1' : 'Q+1';

  // Calculate arc angle for the value indicator (0-180 degrees for semi-circle)
  const rawPercentage = ((value - baseValue) / (endValue - baseValue)) * 100;
  const valuePercentage = Math.min(100, Math.max(0, rawPercentage));
  const arcAngle = (valuePercentage / 100) * 180; // 0 to 180 degrees

  // Scaling factors for L2 cards
  const isL2 = level === 2;
  const REDUCTION_FACTOR = 0.5; // User requested 50% reduction
  const heightScale = isL2 ? 0.6 : 1; // 60% height for L2
  const fontScale = (isL2 ? 0.6 : 1) * REDUCTION_FACTOR; // Apply global reduction

  return (
    <div className="gauge-card-container" style={{
      aspectRatio: `275/${190 * heightScale}`,
      transform: `scale(${scale})`,
      width: 'calc(50% - 0.25rem)'
    }}>
      {/* Background */}
      <div className="gauge-card-bg" style={{
        backgroundColor: bgColor,
        borderRadius: isL2 ? '13px' : '18px' // Reduced border radius slightly
      }}>
        <div aria-hidden="true" className="gauge-card-border" style={{
          borderRadius: isL2 ? '13.5px' : '18.5px'
        }} />
      </div>

      {/* Title */}
      <p
        className="gauge-card-label"
        style={{ fontSize: `clamp(${16 * fontScale}px, ${1.4 * fontScale}vw, ${20 * fontScale}px)` }}
      >
        {label}
      </p>

      {/* Main Value */}
      <p
        className="gauge-card-value"
        style={{ fontSize: `clamp(${20 * fontScale}px, ${2.3 * fontScale}vw, ${36 * fontScale}px)` }}
      >
        {Math.round(value)}%
      </p>

      {/* Semi-circular Gauge */}
      <div className="gauge-svg-container">
        <div className="gauge-svg-wrapper">
          <svg className="gauge-svg" fill="none" preserveAspectRatio="none" viewBox="0 0 275 85.7353">
            <defs>
              <linearGradient gradientUnits="userSpaceOnUse" id={`paint0_linear_gauge_${label.replace(/\s+/g, '_')}`} x1="0" x2="275" y1="85.7353" y2="85.7353">
                <stop stopColor={gradientColors.start} />
                <stop offset="1" stopColor={gradientColors.end} />
              </linearGradient>
              <linearGradient gradientUnits="userSpaceOnUse" id={`paint_green_gauge_${label.replace(/\s+/g, '_')}`} x1="0" x2="275" y1="85.7353" y2="85.7353">
                <stop stopColor="#2CC664" />
                <stop offset="1" stopColor="#156031" />
              </linearGradient>
            </defs>
            <g>
              <mask fill="white" id={`path-1-inside-gauge-${label.replace(/\s+/g, '_')}`}>
                <path d={svgPaths.p5e5a640} />
              </mask>
              {/* Main gauge background - Full Arc with Status Color */}
              <path
                d={svgPaths.p5e5a640}
                mask={`url(#path-1-inside-gauge-${label.replace(/\s+/g, '_')})`}
                stroke={`url(#paint0_linear_gauge_${label.replace(/\s+/g, '_')})`}
                strokeWidth="16"
                fill="none"
              />
              {/* NOTE: Value Arc (Progress Fill) explicitly removed per user requirement (Jan 16). 
                  Gauge acts as a colored status indicator ring only. */}
            </g>
          </svg>
        </div>
      </div>

      {/* Base Value (far left) */}
      <p
        className="tick-value tick-val-base"
        style={{ fontSize: `clamp(${8 * fontScale}px, ${0.83 * fontScale}vw, ${13 * fontScale}px)` }}
      >
        {baseValue}%
      </p>

      {/* Q-1 Value (second from left) */}
      <p
        className="tick-value tick-val-q-minus"
        style={{ fontSize: `clamp(${14 * fontScale}px, ${1.53 * fontScale}vw, ${24 * fontScale}px)` }}
      >
        {qMinus1}%
      </p>

      {/* Q+1 Value (second from right) */}
      <p
        className="tick-value tick-val-q-plus"
        style={{ fontSize: `clamp(${14 * fontScale}px, ${1.53 * fontScale}vw, ${24 * fontScale}px)` }}
      >
        {qPlus1}%
      </p>

      {/* End Value (far right) */}
      <p
        className="tick-value tick-val-end"
        style={{ fontSize: `clamp(${8 * fontScale}px, ${0.83 * fontScale}vw, ${13 * fontScale}px)` }}
      >
        {endValue}%
      </p>

      {/* Delta Badge */}
      <div className="delta-badge" />
      <p
        className="delta-value"
        style={{
          color: deltaColor,
          fontSize: `clamp(${10 * fontScale}px, ${0.96 * fontScale}vw, ${15 * fontScale}px)`
        }}
      >
        {delta}
      </p>

      {/* Bottom Label Bar */}
      <div className="bottom-bar">
        <div aria-hidden="true" className="bottom-bar-border" />
      </div>

      {/* Bottom Labels */}
      <div
        className="bottom-labels-container"
        style={{ fontSize: `clamp(${6 * fontScale}px, ${0.64 * fontScale}vw, ${10 * fontScale}px)` }}
      >
        <p className="bottom-label bl-base">base</p>
        <p className="bottom-label bl-minus">{labelMinus1}</p>
        <p className="bottom-label bl-actual">Actual</p>
        <p className="bottom-label bl-plus">{labelPlus1}</p>
        <p className="bottom-label bl-end">end</p>
      </div>
    </div>
  );
}