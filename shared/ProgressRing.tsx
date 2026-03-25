import React, { memo } from 'react';

interface ProgressRingProps {
  percentage: number; // 0-100
  size?: number;     // diameter in pixels (default 40)
  strokeWidth?: number; // stroke width (default 4)
  color?: string;    // color of the progress arc
  backgroundColor?: string; // background ring color
  children?: React.ReactNode; // center content
  className?: string; // additional css classes
}

export const ProgressRing: React.FC<ProgressRingProps> = memo(({ 
  percentage = 0, 
  size = 40, 
  strokeWidth = 4, 
  color = '#6366F1', 
  backgroundColor = 'rgba(255,255,255,0.1)', 
  children,
  className = ''
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  
  const containerStyles = {
    width: size,
    height: size,
  };

  return (
    <div 
      className={`relative inline-flex items-center justify-center ${className}`}
      style={containerStyles}
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progress: ${percentage}%`}
    >
      <svg 
        width={size} 
        height={size}
        className="absolute inset-0"
      >
        {/* Background Ring */}
        <circle
          stroke={backgroundColor}
          fill="none"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress Arc */}
        <circle
          stroke={color}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      
      {/* Center Content - e.g., the percentage value */}
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
});

ProgressRing.displayName = 'ProgressRing';