import { Category } from '@/data';

/**
 * Get emoji for event category
 */
export const getCategoryEmoji = (category: Category): string => {
  switch (category) {
    case Category.HEALTH:
      return '🏃';
    case Category.FINANCE:
      return '💰';
    case Category.RELATIONSHIPS:
      return '👥';
    case Category.SPIRITUAL:
      return '🙏';
    case Category.GENERAL:
      return '📌';
    default:
      return '📌';
  }
};

/**
 * Get emoji for specific event types (more specific than category)
 */
export const getEventEmoji = (title: string, category: Category): string => {
  const lower = title.toLowerCase();

  // Sports & Fitness
  if (lower.includes('tennis')) return '🎾';
  if (lower.includes('gym') || lower.includes('workout')) return '💪';
  if (lower.includes('run') || lower.includes('jog')) return '🏃';
  if (lower.includes('swim')) return '🏊';
  if (lower.includes('yoga')) return '🧘';
  if (lower.includes('basketball')) return '🏀';
  if (lower.includes('football') || lower.includes('soccer')) return '⚽';

  // Food & Dining
  if (lower.includes('dinner') || lower.includes('lunch') || lower.includes('breakfast'))
    return '🍽️';
  if (lower.includes('coffee')) return '☕';
  if (lower.includes('drink')) return '🍹';

  // Travel
  if (lower.includes('flight') || lower.includes('travel')) return '✈️';
  if (lower.includes('hotel')) return '🏨';

  // Medical
  if (lower.includes('doctor') || lower.includes('appointment') || lower.includes('clinic'))
    return '🏥';
  if (lower.includes('dentist')) return '🦷';

  // Work & Career
  if (lower.includes('meeting')) return '💼';
  if (lower.includes('presentation')) return '📊';
  if (lower.includes('interview')) return '👔';

  // Social
  if (lower.includes('party') || lower.includes('celebration')) return '🎉';
  if (lower.includes('birthday')) return '🎂';
  if (lower.includes('wedding')) return '💒';

  // Spiritual
  if (lower.includes('church') || lower.includes('service')) return '⛪';
  if (lower.includes('pray') || lower.includes('devotion')) return '🙏';

  // Education
  if (lower.includes('class') || lower.includes('lesson')) return '📚';
  if (lower.includes('exam') || lower.includes('test')) return '📝';

  // Default to category emoji
  return getCategoryEmoji(category);
};
