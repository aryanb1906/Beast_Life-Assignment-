import { CustomerQuery, QueryCategory, QuerySource, QueryStats, ResponseTemplate, TeamMember, UserValueTier } from './types';

const STORAGE_KEY = 'beastlife_queries';
const TEMPLATES_KEY = 'beastlife_templates';
const TEAM_KEY = 'beastlife_team';
const LEGACY_TEAM_NAMES = new Set(['Sarah Johnson', 'Mike Chen', 'Emma Wilson', 'David Lopez', 'Nina Patel', 'Owen Brooks', 'Priya Shah', 'Alex Rivera']);

function deriveChannel(index: number): QuerySource {
  return ['whatsapp', 'instagram', 'email'][index % 3] as QuerySource;
}

function deriveCluster(category: QueryCategory): string {
  const clusters: Record<QueryCategory, string> = {
    billing: 'duplicate-payment',
    technical: 'device-sync',
    membership: 'subscription-change',
    nutrition: 'meal-personalization',
    workout: 'plan-guidance',
    'app-issue': 'mobile-app-stability',
    account: 'login-recovery',
    other: 'general-support',
  };

  return clusters[category];
}

function deriveGeneratedResponse(category: QueryCategory): string {
  const responses: Record<QueryCategory, string> = {
    billing: 'We have started a billing verification workflow and will confirm the outcome once payment checks complete.',
    technical: 'A guided sync and diagnostics flow is available while the support team inspects your case.',
    membership: 'Your membership-related request qualifies for a self-service flow or guided support action.',
    nutrition: 'We can regenerate nutrition recommendations using your current goals and dietary preferences.',
    workout: 'A training recommendation response has been generated based on your recent progress and intent.',
    'app-issue': 'Crash and performance diagnostics can be triggered automatically for this app issue.',
    account: 'A secure recovery flow can be initiated to restore account access and verify identity.',
    other: 'The issue has been summarized and routed for manual support review.',
  };

  return responses[category];
}

function enrichQuery(query: CustomerQuery, index: number): CustomerQuery {
  const confidence = query.confidence ?? Number(Math.min(0.98, 0.72 + query.readinessScore * 0.15).toFixed(2));
  const userValueTier: UserValueTier = query.userValueTier ?? (query.urgency === 'critical' ? 'vip' : query.readinessScore >= 0.7 ? 'premium' : 'standard');
  const priorityBase = query.urgency === 'critical' ? 95 : query.urgency === 'high' ? 80 : query.urgency === 'medium' ? 60 : 35;
  const sentimentWeight = query.sentiment === 'negative' ? 12 : query.sentiment === 'neutral' ? 4 : -6;
  const valueWeight = userValueTier === 'vip' ? 15 : userValueTier === 'premium' ? 8 : 2;
  const priorityScore = query.priorityScore ?? Math.max(1, Math.min(100, priorityBase + sentimentWeight + valueWeight));
  const autoResolvable = query.autoResolvable ?? (query.readinessScore >= 0.7 && confidence >= 0.85);
  const automationDecision = query.automationDecision ?? (autoResolvable ? 'auto-reply' : query.readinessScore >= 0.4 ? 'human-assist' : 'escalate');

  return {
    ...query,
    sourceChannel: query.sourceChannel ?? deriveChannel(index),
    confidence,
    autoResolvable,
    automationDecision,
    priorityScore,
    userValueTier,
    issueCluster: query.issueCluster ?? deriveCluster(query.category),
    generatedResponse: query.generatedResponse ?? deriveGeneratedResponse(query.category),
    aiSummary: query.aiSummary ?? `Classified as ${query.category} with ${query.urgency} urgency and ${query.sentiment} sentiment.`,
  };
}

function createSampleSnapshot(): {
  queries: CustomerQuery[];
  templates: ResponseTemplate[];
  team: TeamMember[];
} {
  return {
    queries: SAMPLE_QUERIES.map((query, index) => enrichQuery({ ...query }, index)),
    templates: SAMPLE_TEMPLATES.map((template) => ({ ...template })),
    team: SAMPLE_TEAM.map((member) => ({ ...member })),
  };
}

const SAMPLE_QUERIES: CustomerQuery[] = [
  {
    id: '0',
    text: '[DEMO] Subscription payment failed - urgent support needed',
    category: 'billing',
    urgency: 'critical',
    sentiment: 'negative',
    readinessScore: 0.35,
    suggestedAutomation: 'Route to billing team with escalation',
    createdAt: Date.now() - 600000,
    resolutionStatus: 'escalated',
    assignedTo: 'tm-1',
    customerName: 'Arjun Singh',
    customerEmail: 'arjun.singh@example.com',
  },
  {
    id: '1',
    text: 'I cannot access my workout progress on the app',
    category: 'app-issue',
    urgency: 'high',
    sentiment: 'negative',
    readinessScore: 0.45,  // Diagnostic suggestions, not actual fix
    suggestedAutomation: 'Automated troubleshooting guide for app access issues',
    createdAt: Date.now() - 3600000,
    resolutionStatus: 'in-progress',
    assignedTo: 'tm-2',
    customerName: 'Raj Mehra',
    customerEmail: 'raj.mehra@example.com',
  },
  {
    id: '2',
    text: 'How do I cancel my membership?',
    category: 'membership',
    urgency: 'high',
    sentiment: 'neutral',
    readinessScore: 0.75,  // Template-ready, requires user confirmation
    suggestedAutomation: 'Self-service membership cancellation flow',
    createdAt: Date.now() - 7200000,  // 2 hours ago
    resolutionStatus: 'open',
    customerName: 'Neha Kapoor',
    customerEmail: 'neha.kapoor@example.com',
  },
  {
    id: '3',
    text: 'I love the new nutrition plans!',
    category: 'nutrition',
    urgency: 'low',
    sentiment: 'positive',
    readinessScore: 0.15,  // Positive feedback needs human acknowledgment
    suggestedAutomation: 'None - requires human response for feedback',
    createdAt: Date.now() - 3600000,  // 1 hour ago
    resolutionStatus: 'resolved',
    resolvedAt: Date.now() - 9000000,
    satisfactionRating: 5,
    assignedTo: 'tm-3',
    customerName: 'Ananya Sharma',
    customerEmail: 'ananya.sharma@example.com',
  },
  {
    id: '4',
    text: 'Why am I being charged twice for my subscription?',
    category: 'billing',
    urgency: 'critical',
    sentiment: 'negative',
    readinessScore: 0.35,  // Escalation to billing team, no payment API
    suggestedAutomation: 'Route to billing department with transaction history attached',
    createdAt: Date.now() - 4800000,  // 1.3 hours ago
    resolutionStatus: 'escalated',
    assignedTo: 'tm-1',
    customerName: 'Rohit Verma',
    customerEmail: 'rohit.verma@example.com',
  },
  {
    id: '5',
    text: 'Can you recommend a workout plan for beginners?',
    category: 'workout',
    urgency: 'medium',
    sentiment: 'positive',
    readinessScore: 0.65,  // Template suggestion available, user selects
    suggestedAutomation: 'Suggest from existing plan templates',
    createdAt: Date.now() - 1800000,  // 30 min ago
    resolutionStatus: 'open',
    customerName: 'Sanya Bhatia',
    customerEmail: 'sanya.bhatia@example.com',
  },
  {
    id: '6',
    text: 'My password reset link expired again and I cannot log in.',
    category: 'account',
    urgency: 'high',
    sentiment: 'negative',
    readinessScore: 0.72,  // Template-ready: send reset link, user confirms
    suggestedAutomation: 'Send password reset template with support confirmation',
    createdAt: Date.now() - 5400000,  // 1.5 hours ago
    resolutionStatus: 'in-progress',
    assignedTo: 'tm-6',
    customerName: 'Arjun Malhotra',
    customerEmail: 'arjun.malhotra@example.com',
  },
  {
    id: '7',
    text: 'Can I pause my membership for 2 months while I travel?',
    category: 'membership',
    urgency: 'medium',
    sentiment: 'neutral',
    readinessScore: 0.70,  // Template-ready, requires user approval
    suggestedAutomation: 'Suggest pause workflow template to support agent',
    createdAt: Date.now() - 3000000,  // 50 min ago
    resolutionStatus: 'resolved',
    resolvedAt: Date.now() - 24000000,
    satisfactionRating: 4,
    assignedTo: 'tm-5',
    customerName: 'Ishita Jain',
    customerEmail: 'ishita.jain@example.com',
  },
  {
    id: '8',
    text: 'Your Apple Pay checkout fails every time on iPhone.',
    category: 'billing',
    urgency: 'critical',
    sentiment: 'negative',
    readinessScore: 0.32,  // Escalation-only, engineering routing
    suggestedAutomation: 'Route to billing engineering with device logs attached',
    createdAt: Date.now() - 5400000,  // 1.5 hours ago
    resolutionStatus: 'open',
    assignedTo: 'tm-1',
    customerName: 'Karan Khanna',
    customerEmail: 'karan.khanna@example.com',
  },
  {
    id: '9',
    text: 'Meal planner does not align with my vegetarian preference.',
    category: 'nutrition',
    urgency: 'medium',
    sentiment: 'neutral',
    readinessScore: 0.62,  // Template: regenerate meal plan suggestion
    suggestedAutomation: 'Suggest meal plan template based on preferences',
    createdAt: Date.now() - 32400000,
    resolutionStatus: 'in-progress',
    assignedTo: 'tm-3',
    customerName: 'Pooja Nair',
    customerEmail: 'pooja.nair@example.com',
  },
  {
    id: '10',
    text: 'The app keeps crashing during video workouts after latest update.',
    category: 'app-issue',
    urgency: 'critical',
    sentiment: 'negative',
    readinessScore: 0.38,  // Escalation-only with diagnostic guidance
    suggestedAutomation: 'Escalate with troubleshooting checklist and version info',
    createdAt: Date.now() - 36000000,
    resolutionStatus: 'escalated',
    assignedTo: 'tm-4',
    customerName: 'Manav Sethi',
    customerEmail: 'manav.sethi@example.com',
  },
  {
    id: '11',
    text: 'Thanks for the quick support. My subscription issue is fixed.',
    category: 'billing',
    urgency: 'low',
    sentiment: 'positive',
    readinessScore: 0.20,  // Positive feedback - no automation
    suggestedAutomation: 'None - requires human follow-up for satisfaction tracking',
    createdAt: Date.now() - 39600000,
    resolutionStatus: 'resolved',
    resolvedAt: Date.now() - 39000000,
    satisfactionRating: 5,
    assignedTo: 'tm-2',
    customerName: 'Tanya Arora',
    customerEmail: 'tanya.arora@example.com',
  },
  {
    id: '12',
    text: 'Need help understanding progressive overload in my workout plan.',
    category: 'workout',
    urgency: 'low',
    sentiment: 'neutral',
    readinessScore: 0.60,  // Template: suggest educational content
    suggestedAutomation: 'Suggest educational template to support agent',
    createdAt: Date.now() - 43200000,
    resolutionStatus: 'open',
    customerName: 'Vikram Rao',
    customerEmail: 'vikram.rao@example.com',
  },
  {
    id: '13',
    text: 'I was logged out on all devices and cannot verify my account email.',
    category: 'account',
    urgency: 'high',
    sentiment: 'negative',
    readinessScore: 0.68,  // Template-ready: account recovery workflow
    suggestedAutomation: 'Send account recovery template with verification steps',
    createdAt: Date.now() - 46800000,
    resolutionStatus: 'in-progress',
    assignedTo: 'tm-6',
    customerName: 'Mehul Desai',
    customerEmail: 'mehul.desai@example.com',
  },
  {
    id: '14',
    text: 'Can I switch from monthly to annual billing and keep my promo?',
    category: 'billing',
    urgency: 'medium',
    sentiment: 'neutral',
    readinessScore: 0.38,  // Requires billing API for promo validation
    suggestedAutomation: 'Route to billing team with promo lookup',
    createdAt: Date.now() - 50400000,
    resolutionStatus: 'open',
    customerName: 'Riya Chawla',
    customerEmail: 'riya.chawla@example.com',
  },
  {
    id: '15',
    text: 'How can I sync Beastlife workouts to my smartwatch?',
    category: 'technical',
    urgency: 'medium',
    sentiment: 'neutral',
    readinessScore: 0.42,  // Diagnostic suggestion, not actual pairing automation
    suggestedAutomation: 'Share device sync troubleshooting template',
    createdAt: Date.now() - 54000000,
    resolutionStatus: 'resolved',
    resolvedAt: Date.now() - 52000000,
    satisfactionRating: 4,
    assignedTo: 'tm-4',
    customerName: 'Dev Bansal',
    customerEmail: 'dev.bansal@example.com',
  },
];

const SAMPLE_TEMPLATES: ResponseTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Membership Cancellation',
    category: 'membership',
    content: 'Hello! To cancel your membership, please follow these steps: 1. Log in to your account, 2. Go to Settings > Subscription, 3. Click Cancel Membership. If you need further assistance, please reply to this message.',
    createdAt: Date.now(),
  },
  {
    id: 'tpl-2',
    name: 'App Access Troubleshooting',
    category: 'app-issue',
    content: 'We\'re sorry you\'re experiencing app access issues. Please try: 1. Log out and log back in, 2. Clear your app cache, 3. Update to the latest version, 4. Restart your device. If problems persist, contact support.',
    createdAt: Date.now(),
  },
  {
    id: 'tpl-3',
    name: 'Billing Issue Response',
    category: 'billing',
    content: 'Thank you for reporting this billing issue. We\'ve reviewed your account and identified the problem. Our team will resolve this within 24 hours. We appreciate your patience and loyalty.',
    createdAt: Date.now(),
  },
  {
    id: 'tpl-4',
    name: 'Password Reset Recovery',
    category: 'account',
    content: 'We can help you regain account access quickly. Please use the secure reset link we just sent. If it expires, reply with "RESET" and we\'ll send a fresh one instantly.',
    createdAt: Date.now(),
  },
  {
    id: 'tpl-5',
    name: 'Workout Guidance Follow-up',
    category: 'workout',
    content: 'Great question! Based on your current level, we recommend a 3-day split focused on form and consistency. We\'ve added a beginner plan in your dashboard to get started safely.',
    createdAt: Date.now(),
  },
  {
    id: 'tpl-6',
    name: 'Nutrition Preference Adjustment',
    category: 'nutrition',
    content: 'Thanks for the details. We\'ve updated your preference profile and regenerated your weekly nutrition plan to match your dietary goals. Changes are now visible in your app.',
    createdAt: Date.now(),
  },
  {
    id: 'tpl-7',
    name: 'App Crash Escalation',
    category: 'app-issue',
    content: 'We\'re escalating this crash issue to engineering and have attached your logs. In the meantime, please update to the latest app build and disable offline mode temporarily.',
    createdAt: Date.now(),
  },
  {
    id: 'tpl-8',
    name: 'Membership Pause Request',
    category: 'membership',
    content: 'We can pause your membership. Please confirm your preferred pause start date and duration, and we\'ll process it immediately while preserving your current benefits.',
    createdAt: Date.now(),
  },
];

const SAMPLE_TEAM: TeamMember[] = [
  {
    id: 'tm-1',
    name: 'Raj Sharma',
    email: 'raj@beastlife.com',
    role: 'admin',
    assignedQueryCount: 5,
  },
  {
    id: 'tm-2',
    name: 'Gaurav Taneja',
    email: 'gaurav@beastlife.com',
    role: 'support',
    assignedQueryCount: 4,
  },
  {
    id: 'tm-3',
    name: 'Niharika Singh',
    email: 'niharika@beastlife.com',
    role: 'support',
    assignedQueryCount: 3,
  },
  {
    id: 'tm-4',
    name: 'Flying Beast Ops',
    email: 'flyingbeast@beastlife.com',
    role: 'manager',
    assignedQueryCount: 2,
  },
  {
    id: 'tm-5',
    name: 'Priyanshi Patel',
    email: 'priyanshi@beastlife.com',
    role: 'support',
    assignedQueryCount: 3,
  },
  {
    id: 'tm-6',
    name: 'Raghav Bansal',
    email: 'raghav@beastlife.com',
    role: 'support',
    assignedQueryCount: 4,
  },
  {
    id: 'tm-7',
    name: 'Aditi Shah',
    email: 'aditi@beastlife.com',
    role: 'manager',
    assignedQueryCount: 2,
  },
  {
    id: 'tm-8',
    name: 'Ankit Verma',
    email: 'ankit@beastlife.com',
    role: 'admin',
    assignedQueryCount: 1,
  },
];

export function loadQueries(): CustomerQuery[] {
  if (typeof window === 'undefined') return createSampleSnapshot().queries;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return createSampleSnapshot().queries;
  }

  try {
    return (JSON.parse(stored) as CustomerQuery[]).map((query, index) => enrichQuery(query, index));
  } catch {
    return createSampleSnapshot().queries;
  }
}

export function saveQueries(queries: CustomerQuery[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queries));
}

export function addQuery(query: CustomerQuery): void {
  const queries = loadQueries();
  queries.push(query);
  saveQueries(queries);
}

export function deleteQuery(id: string): void {
  const queries = loadQueries();
  const filtered = queries.filter(q => q.id !== id);
  saveQueries(filtered);
}

export function updateQuery(id: string, updates: Partial<CustomerQuery>): void {
  const queries = loadQueries();
  const index = queries.findIndex(q => q.id === id);
  if (index !== -1) {
    queries[index] = { ...queries[index], ...updates };
    saveQueries(queries);
  }
}

export function loadTemplates(): ResponseTemplate[] {
  if (typeof window === 'undefined') return SAMPLE_TEMPLATES;
  const stored = localStorage.getItem(TEMPLATES_KEY);
  if (!stored) return SAMPLE_TEMPLATES;
  try {
    return JSON.parse(stored);
  } catch {
    return SAMPLE_TEMPLATES;
  }
}

export function saveTemplates(templates: ResponseTemplate[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

export function saveTeam(team: TeamMember[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TEAM_KEY, JSON.stringify(team));
}

export function loadTeam(): TeamMember[] {
  if (typeof window === 'undefined') return SAMPLE_TEAM;
  const stored = localStorage.getItem(TEAM_KEY);
  if (!stored) return SAMPLE_TEAM;
  try {
    const parsed = JSON.parse(stored) as TeamMember[];
    if (parsed.some((member) => LEGACY_TEAM_NAMES.has(member.name))) {
      saveTeam(SAMPLE_TEAM);
      return SAMPLE_TEAM;
    }
    return parsed;
  } catch {
    return SAMPLE_TEAM;
  }
}

export function resetDemoData(): {
  queries: CustomerQuery[];
  templates: ResponseTemplate[];
  team: TeamMember[];
} {
  const snapshot = createSampleSnapshot();

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot.queries));
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(snapshot.templates));
    localStorage.setItem(TEAM_KEY, JSON.stringify(snapshot.team));
  }

  return snapshot;
}

export function calculateStats(queries: CustomerQuery[]): QueryStats {
  const stats: QueryStats = {
    total: queries.length,
    byCategory: {
      billing: 0,
      technical: 0,
      membership: 0,
      nutrition: 0,
      workout: 0,
      'app-issue': 0,
      account: 0,
      other: 0,
    },
    byUrgency: {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    },
    bySentiment: {
      positive: 0,
      neutral: 0,
      negative: 0,
    },
    automationOpportunities: 0,
  };

  queries.forEach(query => {
    stats.byCategory[query.category]++;
    stats.byUrgency[query.urgency]++;
    stats.bySentiment[query.sentiment]++;
    if (query.readinessScore >= 0.6) {
      stats.automationOpportunities++;
    }
  });

  return stats;
}
