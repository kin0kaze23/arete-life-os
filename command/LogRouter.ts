import { UserProfile, IntentType, Category } from '../data/types';

/**
 * LogRouter handles the semantic mapping of raw input to specific users or shared spaces.
 */
export class LogRouter {
  /**
   * Resolves who a piece of data belongs to based on linguistic markers.
   */
  static resolveTargetUser(
    input: string,
    activeUserId: string,
    familyMembers: UserProfile[]
  ): string | 'FAMILY_SHARED' {
    const text = input.toLowerCase();

    // 1. Explicit Collective Markers (Shared)
    const collectiveMarkers = [
      'we ',
      'us ',
      'our ',
      'family ',
      'everyone ',
      'shared ',
      'together ',
    ];
    if (collectiveMarkers.some((m) => text.includes(m))) {
      return 'FAMILY_SHARED';
    }

    // 2. Direct Name Lookup (prioritize active user name first for clarity)
    const activeMember = familyMembers.find((m) => m.id === activeUserId);
    if (activeMember) {
      const activeName = (activeMember.identify.name || '').toLowerCase();
      if (activeName.length >= 3 && text.includes(activeName)) {
        return activeUserId;
      }
    }

    // 3. General Member Name Lookup
    for (const member of familyMembers) {
      if (member.id === activeUserId) continue; // Checked already
      const name = (member.identify.name || '').toLowerCase();
      // Requirement: At least 3 chars to prevent collisions with short common words
      if (name.length >= 3 && text.includes(name)) {
        return member.id;
      }
    }

    // 4. Relationship Alias Lookup (e.g., "My Dad")
    if (activeMember) {
      for (const rel of activeMember.relationships) {
        const targetMember = familyMembers.find((m) => m.id === rel.relatedToUserId);
        if (targetMember) {
          const type = rel.type.toLowerCase();
          if (
            text.includes(`my ${type}`) ||
            text.includes(`${targetMember.identify.name.toLowerCase()}`)
          ) {
            return targetMember.id;
          }
        }
      }
    }

    // 5. Default to Self (I/My/Me) - high priority indicators of current user
    const selfMarkers = ['i ', ' my ', ' me ', "i'm ", 'myself '];
    if (selfMarkers.some((m) => text.includes(m) || text.startsWith(m.trim()))) {
      return activeUserId;
    }

    // Fallback: Default to Active User
    return activeUserId;
  }

  /**
   * Classifies the primary intent of the input.
   */
  static classifyIntent(input: string): IntentType {
    const text = input.toLowerCase();
    if (
      text.startsWith('/ask') ||
      text.includes('?') ||
      text.startsWith('what') ||
      text.startsWith('how')
    )
      return 'QUERY';
    if (
      text.includes('need to') ||
      text.includes('remind') ||
      text.includes('todo') ||
      text.includes('task')
    )
      return 'TASK';
    if (
      text.includes('change') ||
      text.includes('update') ||
      text.includes('set') ||
      text.includes('refine')
    )
      return 'CONFIG';
    return 'MEMORY';
  }
}
