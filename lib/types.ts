export type QueryCategory =
  | 'billing'
  | 'technical'
  | 'membership'
  | 'nutrition'
  | 'workout'
  | 'app-issue'
  | 'account'
  | 'other';

export type Urgency = 'low' | 'medium' | 'high' | 'critical';

export type Sentiment = 'positive' | 'neutral' | 'negative';

export type QuerySource = 'whatsapp' | 'instagram' | 'email';

export type UserValueTier = 'standard' | 'premium' | 'vip';

export interface CustomerQuery {
  id: string;
  text: string;
  category: QueryCategory;
  urgency: Urgency;
  sentiment: Sentiment;
  readinessScore: number;
  suggestedAutomation: string;
  createdAt: number;
  resolvedAt?: number;
  resolutionStatus: 'open' | 'in-progress' | 'resolved' | 'escalated';
  assignedTo?: string;
  satisfactionRating?: number;
  responseTemplate?: string;
  customerName?: string;
  customerEmail?: string;
  sourceChannel?: QuerySource;
  confidence?: number;
  autoResolvable?: boolean;
  automationDecision?: 'auto-reply' | 'human-assist' | 'escalate';
  priorityScore?: number;
  userValueTier?: UserValueTier;
  issueCluster?: string;
  generatedResponse?: string;
  feedbackResolved?: boolean;
  aiSummary?: string;
}

export interface ResponseTemplate {
  id: string;
  name: string;
  category: QueryCategory;
  content: string;
  createdAt: number;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'support' | 'manager';
  assignedQueryCount: number;
}

export interface QueryStats {
  total: number;
  byCategory: Record<QueryCategory, number>;
  byUrgency: Record<Urgency, number>;
  bySentiment: Record<Sentiment, number>;
  automationOpportunities: number;
}
