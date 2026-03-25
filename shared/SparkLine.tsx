import React, { memo } from 'react';

interface SparkLineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
}

export const SparkLine: React.FC<SparkLineProps> = memo(({ 
  data, 
  width = 100, 
  height = 30, 
  color = '#6366F1', 
  strokeWidth = 2 
}) => {
  if (data.length < 2) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="inline-block">
        <line 
          x1="0" 
          y1={height / 2} 
          x2={width} 
          y2={height / 2} 
          stroke={color} 
          strokeWidth={strokeWidth}
          strokeDasharray="2,2"
        />
      </svg>
    );
  }

  // Normalize data to fit within the height bounds
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; // Prevent division by zero
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    // Flip the y-axis: higher values appear higher
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

SparkLine.displayName = 'SparkLine';