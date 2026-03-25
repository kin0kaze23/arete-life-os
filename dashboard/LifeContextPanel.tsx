import React from 'react';
import {
  ContributionFeedback,
  CriticalPriority,
  DimensionContextSnapshot,
  LIFE_DIMENSIONS,
  LifeDimension,
  ProfileGap,
  createEmptySnapshot,
} from '@/data';
import { ContributionCard } from './ContributionCard';
import { DimensionMissionControl } from './DimensionMissionControl';
import { LifeSnapshotCard } from './LifeSnapshotCard';
import { ProfileGapNudge } from './ProfileGapNudge';

type SnapshotMap = Record<LifeDimension, DimensionContextSnapshot>;

interface LifeContextPanelProps {
  snapshots: SnapshotMap;
  narrative: string | null;
  priorities: CriticalPriority[];
  profileGaps: ProfileGap[];
  dismissedProfileGaps: Record<string, number>;
  selectedDimension: LifeDimension;
  isSnapshotExpanded: boolean;
  isRefreshingNarrative: boolean;
  refreshingDimensions: Set<LifeDimension>;
  error?: string | null;
  contribution: ContributionFeedback | null;
  showContribution: boolean;
  onCloseContribution: () => void;
  onRefreshAll: () => void;
  onRefreshDimension: (dimension: LifeDimension) => void;
  onSelectDimension: (dimension: LifeDimension) => void;
  onToggleExpanded: () => void;
  onDismissGap: (key: string) => void;
  onOpenProfile?: () => void;
  onViewHistory?: () => void;
  onInsertTemplate?: (template: string) => void;
}

export const LifeContextPanel: React.FC<LifeContextPanelProps> = ({
  snapshots,
  narrative,
  priorities,
  profileGaps,
  dismissedProfileGaps,
  selectedDimension,
  isSnapshotExpanded,
  isRefreshingNarrative,
  refreshingDimensions,
  error,
  contribution,
  showContribution,
  onCloseContribution,
  onRefreshAll,
  onRefreshDimension,
  onSelectDimension,
  onToggleExpanded,
  onDismissGap,
  onOpenProfile,
  onViewHistory,
  onInsertTemplate,
}) => {
  const safeSnapshots = LIFE_DIMENSIONS.reduce((acc, dimension) => {
    acc[dimension] = snapshots[dimension] || createEmptySnapshot(dimension);
    return acc;
  }, {} as SnapshotMap);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Life Context
          </p>
          <p className="text-sm text-slate-300">
            Grounded analysis across health, finance, relationships, spiritual, and personal.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefreshAll}
          className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-slate-200 hover:border-indigo-400/40"
        >
          Refresh all
        </button>
      </div>

      <LifeSnapshotCard
        narrative={narrative}
        priorities={priorities}
        isExpanded={isSnapshotExpanded}
        isLoading={isRefreshingNarrative}
        onToggleExpanded={onToggleExpanded}
        onRefresh={onRefreshAll}
        onViewHistory={onViewHistory}
      />

      <DimensionMissionControl
        snapshots={safeSnapshots}
        selectedDimension={selectedDimension}
        refreshingDimensions={refreshingDimensions}
        error={error}
        onSelectDimension={onSelectDimension}
        onRefreshDimension={onRefreshDimension}
        onInsertTemplate={onInsertTemplate}
      />

      <ProfileGapNudge
        profileGaps={profileGaps}
        dismissed={dismissedProfileGaps}
        onDismiss={onDismissGap}
        onOpenProfile={onOpenProfile}
      />

      <ContributionCard
        contribution={contribution}
        visible={showContribution}
        onClose={onCloseContribution}
      />
    </section>
  );
};
