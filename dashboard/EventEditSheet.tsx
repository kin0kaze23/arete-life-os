import React, { useState } from 'react';
import { TimelineEvent } from '@/data';
import { X, Calendar, MapPin, Clock, Check } from 'lucide-react';

interface EventEditSheetProps {
  event: TimelineEvent;
  onSave: (id: string, updates: Partial<TimelineEvent>) => void;
  onClose: () => void;
}

export const EventEditSheet: React.FC<EventEditSheetProps> = ({ event, onSave, onClose }) => {
  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState(event.date.split('T')[0] || '');
  const [time, setTime] = useState(
    event.date.includes('T') ? event.date.split('T')[1]?.slice(0, 5) || '' : ''
  );
  const [location, setLocation] = useState(event.fields?.location || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newDate = time ? `${date}T${time}:00` : date;
    onSave(event.id, {
      title,
      date: newDate,
      fields: { ...event.fields, location: location || undefined },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-[#0A0C10] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Edit Event</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Event Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
              placeholder="Meeting with John"
              required
            />
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
                <Calendar size={10} /> Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                required
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
                <Clock size={10} /> Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
              <MapPin size={10} /> Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
              placeholder="Office, Starbucks, Zoom..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#08090C] border-t border-white/5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Check size={14} />
            Save
          </button>
        </div>
      </form>
    </div>
  );
};
