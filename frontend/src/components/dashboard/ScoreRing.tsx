'use client';

import { useEffect, useRef } from 'react';
import clsx from 'clsx';

interface ScoreRingProps {
  score: number;           // 0-100
  size?: number;
  strokeWidth?: number;
  verified?: boolean;
  premium?: boolean;
  animated?: boolean;
}

export function ScoreRing({
  score,
  size = 180,
  strokeWidth = 10,
  verified = false,
  premium = false,
  animated = true,
}: ScoreRingProps) {
  const circleRef = useRef<SVGCircleElement>(null);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Offset: 0 score = full circumference (empty), 100 = 0 (full)
  const targetOffset = circumference - (score / 100) * circumference;

  const trackColor = '#1f1f1f';
  const fillColor = premium ? '#cafd00' : verified ? '#cafd00' : score >= 70 ? '#F7931A' : score >= 40 ? '#F59E0B' : '#555';

  useEffect(() => {
    if (!animated || !circleRef.current) return;
    const el = circleRef.current;
    el.style.strokeDashoffset = String(circumference);
    const raf = requestAnimationFrame(() => {
      el.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
      el.style.strokeDashoffset = String(targetOffset);
    });
    return () => cancelAnimationFrame(raf);
  }, [score, circumference, targetOffset, animated]);

  const label = premium ? 'PREMIUM' : verified ? 'VERIFIED' : score >= 85 ? 'NEAR' : 'BUILDING';
  const labelColor = premium || verified ? '#cafd00' : '#555';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
        <circle
          ref={circleRef}
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={fillColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? circumference : targetOffset}
          style={!animated ? { strokeDashoffset: targetOffset } : undefined}
        />
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
        <span
          className="font-bold leading-none"
          style={{ fontSize: size * 0.22, color: fillColor }}
        >
          {score}
        </span>
        <span className="text-xs font-mono mt-1" style={{ color: labelColor }}>
          {label}
        </span>
      </div>
    </div>
  );
}

