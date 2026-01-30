import React from 'react';
import { ZoomIn, ZoomOut, Calendar, Maximize } from 'lucide-react';

export type ZoomLevel = 'year' | 'month' | 'week';

interface TimelineZoomControlsProps {
  zoomLevel: ZoomLevel;
  onZoomChange: (level: ZoomLevel) => void;
  onCenterToday: () => void;
  onResetView: () => void;
}

export const TimelineZoomControls: React.FC<TimelineZoomControlsProps> = ({
  zoomLevel,
  onZoomChange,
  onCenterToday,
  onResetView,
}) => {
  const zoomButtons: { level: ZoomLevel; label: string; description: string }[] = [
    { level: 'year', label: 'Year', description: 'Yearly overview' },
    { level: 'month', label: 'Month', description: 'Monthly timeline' },
    { level: 'week', label: 'Week', description: 'Weekly detail' },
  ];

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center bg-slate-900/60 p-1 rounded-xl border border-slate-800">
        {zoomButtons.map(({ level, label }) => (
          <button
            key={level}
            onClick={() => onZoomChange(level)}
            className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${
              zoomLevel === level
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title={
              level === 'year'
                ? 'Yearly overview'
                : level === 'month'
                  ? 'Monthly timeline'
                  : 'Weekly detail'
            }
          >
            {label}
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-slate-800 hidden sm:block" />

      <button
        onClick={onCenterToday}
        className="flex items-center gap-2 px-4 py-2 bg-slate-900/40 border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all"
      >
        <Calendar size={14} />
        Today
      </button>

      <button
        onClick={onResetView}
        className="flex items-center gap-2 px-4 py-2 bg-slate-900/40 border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all"
        title="Reset view"
      >
        <Maximize size={14} />
      </button>
    </div>
  );
};
