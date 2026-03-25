import React from 'react';
import {
  ClipboardCheck,
  CalendarPlus,
  DollarSign,
  Dumbbell,
  Heart,
  Briefcase,
  Stethoscope,
  UploadCloud,
} from 'lucide-react';

interface CommandStripProps {
  onInsertTemplate?: (template: string) => void;
}

const TEMPLATES = [
  { id: 'DAILY_CHECKIN', label: 'Daily Check-In', icon: ClipboardCheck },
  { id: 'SCHEDULE_EVENT', label: 'Schedule Event', icon: CalendarPlus },
  { id: 'EXPENSE_LOG', label: 'Expense Log', icon: DollarSign },
  { id: 'WORKOUT_LOG', label: 'Workout', icon: Dumbbell },
  { id: 'RELATIONSHIP_TOUCHPOINT', label: 'Relationship', icon: Heart },
  { id: 'WORK_PROGRESS', label: 'Work Progress', icon: Briefcase },
  { id: 'HEALTH_SYMPTOM', label: 'Health Symptom', icon: Stethoscope },
  { id: 'UPLOAD_SUMMARY', label: 'Upload Summary', icon: UploadCloud },
];

export const CommandStrip: React.FC<CommandStripProps> = ({ onInsertTemplate }) => {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Command Strip
        </p>
        <p className="text-sm text-slate-300 text-pretty">Log a signal to update your life system.</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onInsertTemplate?.(template.id)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-[12px] font-semibold text-slate-300 transition-all hover:border-indigo-500/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <template.icon size={14} className="text-slate-400" />
            {template.label}
          </button>
        ))}
      </div>
    </div>
  );
};
