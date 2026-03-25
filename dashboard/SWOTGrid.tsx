import React from 'react';
import { motion } from 'framer-motion';
import { ProactiveInsight, BlindSpot, UserProfile } from '@/data';
import { Collapsible } from '@/shared/Collapsible';
import { ShieldCheck, Sparkles, AlertTriangle, Siren, BrainCircuit } from 'lucide-react';

export interface SWOTGridProps {
  insights: ProactiveInsight[];
  blindSpots: BlindSpot[];
  profile: UserProfile;
}

export const SWOTGrid: React.FC<SWOTGridProps> = ({ insights, blindSpots, profile }) => {
  // Data Mapping
  const strengths = insights.filter((i) => i.feedback === 'like');
  // Opportunities are unvalidated insights (not liked, and not disliked)
  const opportunities = insights.filter((i) => i.feedback !== 'like' && i.feedback !== 'dislike');
  const concerns = blindSpots.filter((b) => b.severity !== 'high');
  const risks = blindSpots.filter((b) => b.severity === 'high');

  const hasData = insights.length > 0 || blindSpots.length > 0;

  const renderItem = (title: string, subtitle: string, key: string, index: number) => (
    <motion.div
      key={key}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="p-3 rounded-xl bg-white/5 hover:bg-white/[0.08] transition-all hover:-translate-y-0.5 border border-white/0 hover:border-white/5 group cursor-default"
    >
      <div className="text-xs font-bold text-slate-200 line-clamp-1 group-hover:text-white transition-colors">
        {title}
      </div>
      <div className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed group-hover:text-slate-300 transition-colors">
        {subtitle}
      </div>
    </motion.div>
  );

  const renderQuadrant = (
    title: string,
    items: Array<ProactiveInsight | BlindSpot>,
    colorClass: string,
    icon: React.ReactNode,
    type: 'insight' | 'blindspot'
  ) => {
    const displayItems = items.slice(0, 3);
    const remaining = items.length - 3;

    return (
      <div
        className={`flex flex-col h-full p-4 rounded-2xl bg-white/[0.02] border-l-2 ${colorClass}`}
      >
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            {title}
          </span>
          <span className="ml-auto text-[11px] font-mono font-bold opacity-40">{items.length}</span>
        </div>

        <div className="space-y-2 flex-1">
          {displayItems.map((item, index) => {
            if (type === 'insight') {
              const i = item as ProactiveInsight;
              return renderItem(i.title, i.description, i.id, index);
            } else {
              const b = item as BlindSpot;
              return renderItem(b.signal, b.why, b.id, index);
            }
          })}

          {items.length === 0 && (
            <div className="h-full flex items-center justify-center opacity-30 text-[11px] font-medium text-center px-4">
              None detected
            </div>
          )}
        </div>

        {remaining > 0 && (
          <button className="w-full mt-3 text-[11px] font-bold text-center opacity-40 hover:opacity-70 transition-opacity cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-lg py-1">
            +{remaining} more
          </button>
        )}
      </div>
    );
  };

  return (
    <Collapsible title="LIFE AT A GLANCE" defaultOpen={true}>
      {!hasData ? (
        <div className="p-8 text-center opacity-50 flex flex-col items-center">
          <BrainCircuit size={32} className="text-slate-500 mb-3" />
          <p className="text-xs max-w-sm text-slate-400">
            Analyzing {profile.identify.name}'s ecosystem... <br />
            Your {profile.personal.personalityType || 'cognitive'} profile and {profile.health.chronotype || 'energy'} data
            will drive these insights once you log more data.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderQuadrant(
            'STRENGTHS',
            strengths,
            'border-emerald-500/50 bg-emerald-500/0 hover:bg-emerald-500/[0.02] transition-colors',
            <ShieldCheck size={14} className="text-emerald-400" />,
            'insight'
          )}

          {renderQuadrant(
            'CONCERNS',
            concerns,
            'border-amber-500/50 bg-amber-500/0 hover:bg-amber-500/[0.02] transition-colors',
            <AlertTriangle size={14} className="text-amber-400" />,
            'blindspot'
          )}

          {renderQuadrant(
            'OPPORTUNITIES',
            opportunities,
            'border-cyan-500/50 bg-cyan-500/0 hover:bg-cyan-500/[0.02] transition-colors',
            <Sparkles size={14} className="text-cyan-400" />,
            'insight'
          )}

          {renderQuadrant(
            'RISKS',
            risks,
            'border-rose-500/50 bg-rose-500/0 hover:bg-rose-500/[0.02] transition-colors',
            <Siren size={14} className="text-rose-400" />,
            'blindspot'
          )}
        </div>
      )}
    </Collapsible>
  );
};
