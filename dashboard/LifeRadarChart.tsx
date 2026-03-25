import React, { memo } from 'react';

interface LifeRadarChartProps {
  data: Array<{
    subject: string;
    A: number;
  }>;
  onScoreUpdate?: (prevValue: number, newValue: number) => void;
  width?: number;
  height?: number;
}

const POLYGON_COLORS = ['#6366F1', '#f43f5e', '#10b981', '#f59e0b', '#06b6d4']; // indigo, rose, emerald, amber, cyan from design tokens

export const LifeRadarChart: React.FC<LifeRadarChartProps> = memo(({ 
  data, 
  onScoreUpdate, 
  width = 300, 
  height = 300 
}) => {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 30; // Leave some margin
  
  // Calculate points for the polygon
  const points: Array<{x: number, y: number}> = [];
  const angles: number[] = [];
  const labels: Array<{x: number, y: number, text: string}> = [];
  
  // Pre-calculate angles to evenly spread subjects around the circle
  for (let i = 0; i < data.length; i++) {
    const angle = (Math.PI / 2) + (2 * Math.PI * i) / data.length; // Start at top and go clockwise
    angles.push(angle);
    
    const dataValue = data[i].A;
    const scoreRadius = (dataValue / 100) * radius;
    
    // Calculate coordinates for radar point
    const x = centerX + scoreRadius * Math.cos(angle);
    const y = centerY - scoreRadius * Math.sin(angle);
    points.push({x, y});
    
    // Calculate label position (slightly outside the radar point)
    const labelDistance = radius + 20;
    const labelX = centerX + labelDistance * Math.cos(angle);
    const labelY = centerY - labelDistance * Math.sin(angle);
    labels.push({x: labelX, y: labelY, text: data[i].subject});
  }
  
  // Convert points array to SVG polygon string
  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');
  
  // Calculate the grid circles (for levels)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0]; // 20%, 40%, 60%, 80%, 100%
  
  // Calculate grid lines connecting center to each angle
  const gridLines = angles.map(angle => {
    const outerX = centerX + radius * Math.cos(angle);
    const outerY = centerY - radius * Math.sin(angle);
    return {
      x1: centerX,
      y1: centerY, 
      x2: outerX,
      y2: outerY
    };
  });

  return (
    <div className="relative w-full flex justify-center">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full h-full max-h-64 sm:max-h-80 md:max-h-96">
        {/* Grid circles */}
        {gridLevels.map(level => {
          const levelRadius = level * radius;
          return (
            <circle
              key={`grid-circle-${level}`}
              cx={centerX}
              cy={centerY}
              r={levelRadius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1"
            />
          );
        })}
        
        {/* Grid lines from center to each direction */}
        {gridLines.map((line, i) => (
          <line
            key={`grid-line-${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1"
          />
        ))}
        
        {/* Data polygon */}
        <polygon
          points={polygonPoints}
          fill="url(#gradientOverlay)"
          stroke="#6366F1"
          strokeWidth="2"
          fillOpacity="0.25"
        />
        
        {/* Points on the data polygon */}
        {points.map((point, i) => (
          <circle
            key={`point-${i}`}
            cx={point.x}
            cy={point.y}
            r="5"
            fill="#6366F1"
            stroke="#fff"
            strokeWidth="2"
          />
        ))}
        
        {/* Labels */}
        {labels.map((label, i) => (
          <text
            key={`label-${i}`}
            x={label.x}
            y={label.y}
            fill="#8b949e"
            fontSize="10"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="central"
          >
            {label.text}
          </text>
        ))}
        
        {/* Gradient definition */}  
        <defs>
          <linearGradient id="gradientOverlay" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366F1" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#6366F1" stopOpacity={0.1} />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
});

LifeRadarChart.displayName = 'LifeRadarChart';