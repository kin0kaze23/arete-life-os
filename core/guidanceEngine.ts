import {
  BlindSpot,
  Category,
  DailyTask,
  GuidancePreferences,
  GuidanceQuestion,
  MemoryEntry,
  Recommendation,
  TimelineEvent,
  UserProfile,
} from '@/data';

const DAY_MS = 24 * 60 * 60 * 1000;

const toTimestamp = (value: string) => {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const recentlyLogged = (memory: MemoryEntry[], category: Category, windowDays: number) =>
  memory.some(
    (item) => item.category === category && Date.now() - item.timestamp <= windowDays * DAY_MS
  );

const recentFeedback = (memory: MemoryEntry[], questionId: string) =>
  memory.find(
    (item) =>
      item.metadata?.type === 'guidance_question_answer' &&
      (item.metadata?.payload as { questionId?: string } | undefined)?.questionId === questionId
  );

const taskToRecommendation = (task: DailyTask): Recommendation => ({
  id: `guide-task-${task.id}`,
  ownerId: task.ownerId,
  category: task.category,
  horizon:
    task.due_at && task.due_at > Date.now() + 2 * DAY_MS
      ? 'soon'
      : task.due_at && task.due_at > Date.now()
        ? 'now'
        : 'now',
  kind: 'do',
  title: task.title,
  description: task.description || task.title,
  impactScore: task.priority === 'high' ? 9 : task.priority === 'medium' ? 7 : 5,
  rationale: task.why || task.reasoning || 'This is already on your board and should move forward.',
  steps: task.steps || [],
  estimatedTime: task.estimate_min ? `${task.estimate_min}m` : '20m',
  inputs: task.inputs || [],
  definitionOfDone: task.definitionOfDone || 'The task is marked complete.',
  risks: task.risks || [],
  status: 'ACTIVE',
  needsReview: false,
  missingFields: [],
  createdAt: task.createdAt,
  confidence: 0.85,
  trigger: 'task',
  evidenceLinks: {
    claims: task.links?.claims || [],
    sources: task.links?.sources || [],
  },
});

const createQuestion = (
  ownerId: string,
  category: Category,
  prompt: string,
  reason: string,
  sourceType: GuidanceQuestion['sourceType'],
  sourceId?: string
): GuidanceQuestion => ({
  id: `gq-${category.toLowerCase()}-${prompt.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48)}`,
  ownerId,
  category,
  prompt,
  reason,
  sourceType,
  sourceId,
  urgency: sourceType === 'profile_gap' ? 'medium' : 'low',
  channel: 'dashboard',
  answerType: 'text',
  status: 'open',
});

export const DEFAULT_GUIDANCE_PREFERENCES: GuidancePreferences = {
  telegramMode: 'digest',
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  dailyTelegramLimit: 2,
  externalScanEnabled: true,
  externalScanCategories: [
    Category.HEALTH,
    Category.FINANCE,
    Category.RELATIONSHIPS,
    Category.SPIRITUAL,
    Category.PERSONAL,
  ],
};

export const buildDeterministicGuidanceQuestions = ({
  memory,
  profile,
  missingProfileFields,
  recommendations,
  blindSpots,
}: {
  memory: MemoryEntry[];
  profile: UserProfile;
  missingProfileFields: string[];
  recommendations: Recommendation[];
  blindSpots: BlindSpot[];
}) => {
  const questions: GuidanceQuestion[] = [];
  const ownerId = profile.id;

  if (missingProfileFields.includes('monthly_income')) {
    questions.push(
      createQuestion(
        ownerId,
        Category.FINANCE,
        'What is your current monthly income range?',
        'Income data sharpens finance guidance and opportunity sizing.',
        'profile_gap'
      )
    );
  }

  if (missingProfileFields.includes('health_weight')) {
    questions.push(
      createQuestion(
        ownerId,
        Category.HEALTH,
        'What is your current weight or a recent health baseline you trust?',
        'A current baseline improves health drift detection.',
        'profile_gap'
      )
    );
  }

  if (!recentlyLogged(memory, Category.RELATIONSHIPS, 14)) {
    questions.push(
      createQuestion(
        ownerId,
        Category.RELATIONSHIPS,
        'Who needs intentional attention from you this week?',
        'There have been few recent relationship signals.',
        'pattern'
      )
    );
  }

  if (!recentlyLogged(memory, Category.HEALTH, 7)) {
    questions.push(
      createQuestion(
        ownerId,
        Category.HEALTH,
        'How have your sleep, movement, and energy felt this week?',
        'Health logging has been quiet, which weakens risk detection.',
        'pattern'
      )
    );
  }

  const recWithMissingFields = recommendations.find(
    (rec) => rec.missingFields.length > 0 || rec.needsReview
  );
  if (recWithMissingFields) {
    questions.push(
      createQuestion(
        ownerId,
        recWithMissingFields.category,
        `What detail would make this more actionable: ${recWithMissingFields.title}?`,
        'The recommendation is promising but still missing key context.',
        'recommendation',
        recWithMissingFields.id
      )
    );
  }

  const highRiskBlindSpot = blindSpots.find((spot) => spot.severity === 'high');
  if (highRiskBlindSpot) {
    questions.push(
      createQuestion(
        ownerId,
        highRiskBlindSpot.category || Category.GENERAL,
        `What is your current plan for this risk: ${highRiskBlindSpot.signal}?`,
        'A high-severity watch item needs explicit mitigation.',
        'blind_spot',
        highRiskBlindSpot.id
      )
    );
  }

  const deduped = questions.filter((question, index, arr) => {
    if (recentFeedback(memory, question.id)) return false;
    return arr.findIndex((item) => item.id === question.id) === index;
  });

  return deduped;
};

export const buildDeterministicDoCandidates = ({
  recommendations,
  dailyPlan,
  tasks,
  timelineEvents,
  profile,
}: {
  recommendations: Recommendation[];
  dailyPlan: DailyTask[];
  tasks: DailyTask[];
  timelineEvents: TimelineEvent[];
  profile: UserProfile;
}) => {
  const openTaskCandidates = [...dailyPlan, ...tasks]
    .filter((task) => !task.completed)
    .sort((a, b) => {
      const priorityScore = { high: 3, medium: 2, low: 1 };
      return (priorityScore[b.priority] || 0) - (priorityScore[a.priority] || 0);
    })
    .slice(0, 3)
    .map(taskToRecommendation);

  const recCandidates = recommendations
    .filter((rec) => rec.status === 'ACTIVE')
    .map((rec) => ({
      ...rec,
      horizon: rec.horizon || 'now',
      kind: rec.kind || 'do',
      confidence: rec.confidence ?? 0.8,
    }))
    .slice(0, 4);

  const nextEvent = [...timelineEvents]
    .filter((event) => toTimestamp(event.date) > Date.now() && toTimestamp(event.date) - Date.now() <= 2 * DAY_MS)
    .sort((a, b) => toTimestamp(a.date) - toTimestamp(b.date))[0];

  const eventRecommendation: Recommendation[] = nextEvent
    ? [
        {
          id: `guide-event-${nextEvent.id}`,
          ownerId: profile.id,
          category: nextEvent.category,
          horizon: 'now',
          kind: 'do',
          title: `Prepare ${nextEvent.title}`,
          description: 'Convert the upcoming event into a concrete prep checklist.',
          impactScore: 8,
          rationale: 'An upcoming event is close enough that preparation risk is now material.',
          steps: ['Review event details', 'Prepare required materials', 'Block prep time'],
          estimatedTime: '20m',
          inputs: ['Calendar details'],
          definitionOfDone: 'A concrete prep plan exists and key materials are ready.',
          risks: ['Last-minute scramble'],
          status: 'ACTIVE',
          needsReview: false,
          missingFields: [],
          createdAt: Date.now(),
          confidence: 0.85,
          trigger: 'event',
          evidenceLinks: { claims: [], sources: [] },
        },
      ]
    : [];

  const merged = [...recCandidates, ...openTaskCandidates, ...eventRecommendation]
    .sort((a, b) => b.impactScore - a.impactScore)
    .filter((item, index, arr) => arr.findIndex((candidate) => candidate.title === item.title) === index)
    .slice(0, 6);

  return merged;
};

export const buildDeterministicWatchCandidates = ({
  blindSpots,
  memory,
  timelineEvents,
  profile,
}: {
  blindSpots: BlindSpot[];
  memory: MemoryEntry[];
  timelineEvents: TimelineEvent[];
  profile: UserProfile;
}) => {
  const watches = blindSpots.map((spot) => ({
    ...spot,
    category: spot.category || Category.GENERAL,
    horizon: spot.horizon || 'now',
    confidence: spot.confidence || 0.7,
  }));

  if (!recentlyLogged(memory, Category.RELATIONSHIPS, 14)) {
    watches.push({
      id: `watch-relationships-${profile.id}`,
      ownerId: profile.id,
      category: Category.RELATIONSHIPS,
      horizon: 'soon',
      trigger: 'relationship',
      createdAt: Date.now(),
      signal: 'Relationship drift',
      why: 'There have been few recent relationship signals, which can hide neglect.',
      confidence: 0.76,
      severity: 'med',
      actions: ['Identify one person to reach out to', 'Schedule a check-in'],
      nextPreventionStep: 'Create one intentional connection moment this week.',
    });
  }

  if (!recentlyLogged(memory, Category.HEALTH, 7)) {
    watches.push({
      id: `watch-health-${profile.id}`,
      ownerId: profile.id,
      category: Category.HEALTH,
      horizon: 'soon',
      trigger: 'health',
      createdAt: Date.now(),
      signal: 'Low health visibility',
      why: 'Without current health signals, sleep, stress, or activity drift may go unnoticed.',
      confidence: 0.78,
      severity: 'med',
      actions: ['Log sleep and energy', 'Capture one movement or meal note'],
      nextPreventionStep: 'Re-establish a light daily health signal.',
    });
  }

  const upcomingEvent = [...timelineEvents]
    .filter((event) => toTimestamp(event.date) > Date.now() && toTimestamp(event.date) - Date.now() <= 2 * DAY_MS)
    .sort((a, b) => toTimestamp(a.date) - toTimestamp(b.date))[0];
  if (upcomingEvent) {
    watches.push({
      id: `watch-event-${upcomingEvent.id}`,
      ownerId: profile.id,
      category: upcomingEvent.category,
      horizon: 'now',
      trigger: 'deadline',
      createdAt: Date.now(),
      signal: `Upcoming: ${upcomingEvent.title}`,
      why: 'A near-term event can create avoidable stress if prep is incomplete.',
      confidence: 0.82,
      severity: 'high',
      actions: ['Review logistics', 'Confirm timing', 'Prepare materials'],
      nextPreventionStep: 'Do one prep action today.',
    });
  }

  return watches
    .sort((a, b) => {
      const severityScore = { high: 3, med: 2, low: 1 };
      return (severityScore[b.severity] || 0) - (severityScore[a.severity] || 0);
    })
    .filter((item, index, arr) => arr.findIndex((candidate) => candidate.signal === item.signal) === index)
    .slice(0, 6);
};

