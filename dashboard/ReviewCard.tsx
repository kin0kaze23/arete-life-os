import React, { useState } from 'react';
import { Recommendation, UserProfile } from '../data/types';
import {
  AlertTriangle,
  Sparkles,
  Send,
  Loader2,
  Info,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { getCategoryColor } from '../shared/SharedUI';

interface ReviewCardProps {
  recommendation: Recommendation;
  profile: UserProfile;
  onFinalize: (recId: string, data: Record<string, string>) => Promise<void>;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ recommendation, profile, onFinalize }) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const missingFields = recommendation.missingFields || [];

  const handleFinalize = async () => {
    setIsProcessing(true);
    try {
      await onFinalize(recommendation.id, formData);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative group p-10 rounded-[3rem] bg-amber-500/5 border border-amber-500/20 shadow-2xl overflow-hidden transition-all duration-500 hover:border-amber-500/40">
      {/* Background Pulse Effect */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>

      <div className="flex justify-between items-start mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <span
            className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${getCategoryColor(recommendation.category)}`}
          >
            {recommendation.category}
          </span>
          <span className="text-[8px] font-black uppercase px-2 py-1 rounded border border-amber-500/30 text-amber-400 bg-amber-500/10 flex items-center gap-1.5">
            <AlertTriangle size={12} /> Calibration Required
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] font-black uppercase text-amber-500 tracking-[0.2em] mb-1">
            Impact Signal
          </span>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 rounded-lg text-amber-400 border border-amber-500/30">
            <Sparkles size={12} />
            <span className="text-[11px] font-black">{recommendation.impactScore}/10</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-10 relative z-10">
        <h4 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">
          {recommendation.title}
        </h4>
        <p className="text-sm text-slate-400 font-medium leading-relaxed italic pr-12">
          "{recommendation.description}"
        </p>
      </div>

      <div className="p-8 bg-[#0D1117]/80 backdrop-blur-xl rounded-[2.5rem] border border-amber-500/10 space-y-8 relative z-10 shadow-inner">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
            <Info size={20} />
          </div>
          <div className="space-y-1">
            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">
              Contextual Friction
            </h5>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-sm">
              High-value strategy identified, but safety parameters cannot be verified without
              specific profile nodes.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {missingFields.map((field) => (
            <div key={field} className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                {field.replace(/([A-Z])/g, ' $1')}
              </label>
              <input
                type="text"
                placeholder={`Provide current ${field.toLowerCase()}...`}
                value={formData[field] || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, [field]: e.target.value }))}
                className="w-full bg-slate-950/80 border border-white/5 rounded-2xl px-6 py-5 focus:outline-none focus:border-amber-500/50 transition-all text-sm text-slate-200 placeholder-slate-800 shadow-inner"
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleFinalize}
          disabled={isProcessing || missingFields.some((f) => !formData[f]?.trim())}
          className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-20 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-amber-600/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
        >
          {isProcessing ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <ShieldCheck size={18} />
          )}
          Internalize & Verify Strategy
        </button>
      </div>

      <div className="mt-8 flex items-center justify-between px-2 opacity-40">
        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2">
          <ArrowRight size={10} /> Neural Calibration Active
        </span>
        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">
          v3.1 Oracle
        </span>
      </div>
    </div>
  );
};
