import React from 'react';
import {
  DimensionContextSnapshot,
  LIFE_DIMENSIONS,
  LifeDimension,
  createEmptySnapshot,
} from '@/data';
import { DimensionCard } from './DimensionCard';

type SnapshotMap = Record<LifeDimension, DimensionContextSnapshot>;

interface DimensionMissionControlProps {
  snapshots: SnapshotMap;
  selectedDimension: LifeDimension;
  refreshingDimensions: Set<LifeDimension>;
  error?: string | null;
  onSelectDimension: (dimension: LifeDimension) => void;
  onRefreshDimension: (dimension: LifeDimension) => void;
  onInsertTemplate?: (template: string) => void;
}

export const DimensionMissionControl: React.FC<DimensionMissionControlProps> = ({
  snapshots,
  selectedDimension,
  refreshingDimensions,
  error,
  onSelectDimension,
  onRefreshDimension,
  onInsertTemplate,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {LIFE_DIMENSIONS.map((dimension) => {
        const snapshot = snapshots[dimension] || createEmptySnapshot(dimension);
        return (
          <DimensionCard
            key={dimension}
            dimension={dimension}
            snapshot={snapshot}
            selected={selectedDimension === dimension}
            isLoading={refreshingDimensions.has(dimension)}
            error={error}
            onSelect={onSelectDimension}
            onRefresh={onRefreshDimension}
            onInsertTemplate={onInsertTemplate}
          />
        );
      })}
    </div>
  );
};
