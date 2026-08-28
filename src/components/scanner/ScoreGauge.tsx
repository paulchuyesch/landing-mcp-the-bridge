import React from "react";

interface Props {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export function ScoreGauge({ score, size = 160, strokeWidth = 12 }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  // Arc calculation (270 degrees)
  const arcLength = circumference * 0.75;
  const offset = arcLength - (score / 100) * arcLength;

  let color = "var(--color-status-critical)"; // red (0-49)
  if (score >= 50 && score < 80) color = "var(--color-status-in-progress)"; // yellow
  if (score >= 80) color = "var(--color-status-stable)"; // green

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform rotate-135 drop-shadow-2xl">
        {/* Background Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
          transform={`rotate(135 ${size/2} ${size/2})`}
        />
        {/* Foreground Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={offset}
          transform={`rotate(135 ${size/2} ${size/2})`}
          style={{ transition: "stroke-dashoffset 1.5s ease-in-out, stroke 0.5s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-6xl font-extrabold tracking-tighter" style={{ color }}>{score}</span>
        <span className="text-xs font-bold text-[var(--color-foreground-subtle)] mt-2 uppercase tracking-widest font-mono">AEO Score</span>
      </div>
    </div>
  );
}
