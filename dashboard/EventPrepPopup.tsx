import React from 'react';
import { MemoryEntry, Recommendation, TimelineEvent, UserProfile } from '@/data';
import { PrepPlanModal } from '@/command/PrepPlanModal';

interface EventPrepPopupProps {
  event: TimelineEvent | null;
  profile: UserProfile;
  memory: MemoryEntry[];
  onClose: () => void;
  onActivate: (plan: Recommendation) => void;
}

export const EventPrepPopup: React.FC<EventPrepPopupProps> = ({
  event,
  profile,
  memory,
  onClose,
  onActivate,
}) => {
  if (!event) return null;
  return (
    <PrepPlanModal
      event={event}
      profile={profile}
      history={memory}
      onClose={onClose}
      onActivate={onActivate}
    />
  );
};
