import { useMemo, useState } from 'react';
import { Category } from '@/data';

export interface SessionDelta {
  dimension: Category;
  previousScore: number;
  currentScore: number;
  delta: number;
}

export interface LifeContextSnapshot {
  dimension: Category;
  insight: string;
}

export interface ProfileGapItem {
  id: string;
  title: string;
  description: string;
}

export interface LifeContextController {
  sessionDeltas: SessionDelta[];
  currentSnapshots: LifeContextSnapshot[];
  currentNarrative: string;
  criticalPriorities: string[];
  profileGaps: ProfileGapItem[];
  dismissedProfileGaps: string[];
  selectedDimension: Category | null;
  isSnapshotExpanded: boolean;
  isRefreshingNarrative: boolean;
  refreshingDimensions: Category[];
  error: string | null;
  refreshAllDimensions: () => Promise<void>;
  refreshDimension: (dimension: Category) => Promise<void>;
  selectDimension: (dimension: Category) => void;
  toggleSnapshotExpanded: () => void;
  dismissProfileGap: (id: string) => void;
}

export interface UseLifeContextInput {
  [key: string]: unknown;
}

export const useLifeContext = (_input: UseLifeContextInput): LifeContextController => {
  const [selectedDimension, setSelectedDimension] = useState<Category | null>(null);
  const [dismissedProfileGaps, setDismissedProfileGaps] = useState<string[]>([]);
  const [isSnapshotExpanded, setIsSnapshotExpanded] = useState(true);

  return useMemo(
    () => ({
      sessionDeltas: [],
      currentSnapshots: [],
      currentNarrative: '',
      criticalPriorities: [],
      profileGaps: [],
      dismissedProfileGaps,
      selectedDimension,
      isSnapshotExpanded,
      isRefreshingNarrative: false,
      refreshingDimensions: [],
      error: null,
      refreshAllDimensions: async () => {},
      refreshDimension: async () => {},
      selectDimension: (dimension: Category) => setSelectedDimension(dimension),
      toggleSnapshotExpanded: () => setIsSnapshotExpanded((prev) => !prev),
      dismissProfileGap: (id: string) => {
        setDismissedProfileGaps((prev) => (prev.includes(id) ? prev : [...prev, id]));
      },
    }),
    [dismissedProfileGaps, selectedDimension, isSnapshotExpanded]
  );
};
