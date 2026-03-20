import { CustomerQuery, QueryCategory, QuerySource, Sentiment, Urgency, UserValueTier } from './types';

// Mock analysis function - replace with actual Groq API call
export async function analyzeQuery(text: string): Promise<Omit<CustomerQuery, 'id' | 'createdAt'>> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock analysis logic
  const textLower = text.toLowerCase();

  // Determine category
  let category: QueryCategory = 'other';
  if (textLower.includes('charge') || textLower.includes('payment') || textLower.includes('bill')) {
    category = 'billing';
  } else if (textLower.includes('sync') || textLower.includes('device') || textLower.includes('integration')) {
    category = 'technical';
  } else if (textLower.includes('error') || textLower.includes('crash') || textLower.includes('bug')) {
    category = 'app-issue';
  } else if (textLower.includes('membership') || textLower.includes('cancel') || textLower.includes('plan')) {
    category = 'membership';
  } else if (textLower.includes('nutrition') || textLower.includes('diet') || textLower.includes('meal')) {
    category = 'nutrition';
  } else if (textLower.includes('workout') || textLower.includes('exercise') || textLower.includes('training')) {
    category = 'workout';
  } else if (textLower.includes('account') || textLower.includes('login') || textLower.includes('password')) {
    category = 'account';
  }

  // Determine urgency
  let urgency: Urgency = 'medium';
  if (textLower.includes('urgent') || textLower.includes('critical') || textLower.includes('immediately')) {
    urgency = 'critical';
  } else if (textLower.includes('asap') || textLower.includes('important') || textLower.includes('error') || textLower.includes('crash')) {
    urgency = 'high';
  } else if (textLower.includes('question') || textLower.includes('advice') || textLower.includes('curious')) {
    urgency = 'low';
  }

  // Determine sentiment
  let sentiment: Sentiment = 'neutral';
  const positiveWords = ['love', 'great', 'awesome', 'perfect', 'excellent', 'amazing', 'wonderful', 'fantastic'];
  const negativeWords = ['hate', 'terrible', 'awful', 'broken', 'useless', 'worst', 'angry', 'frustrated', 'unhappy'];

  if (positiveWords.some(word => textLower.includes(word))) {
    sentiment = 'positive';
  } else if (negativeWords.some(word => textLower.includes(word))) {
    sentiment = 'negative';
  }

  let sourceChannel: QuerySource = 'email';
  if (textLower.includes('whatsapp') || textLower.includes('wa')) {
    sourceChannel = 'whatsapp';
  } else if (textLower.includes('instagram') || textLower.includes('insta') || textLower.includes('dm')) {
    sourceChannel = 'instagram';
  }

  let confidence = 0.72;
  if (category !== 'other') confidence += 0.1;
  if (urgency === 'critical' || urgency === 'high') confidence += 0.05;
  if (sentiment !== 'neutral') confidence += 0.03;
  confidence = Math.min(0.98, Number(confidence.toFixed(2)));

  // Calculate readiness score (0-1): indicates template/workflow suggestion readiness, not actual end-to-end automation
  let readinessScore = 0.5;
  if (category === 'membership' || category === 'account') {
    readinessScore = 0.75;  // Template-ready but requires user confirmation
  } else if (category === 'billing') {
    readinessScore = 0.4;   // Requires human review and payment API
  } else if (category === 'technical' || category === 'app-issue') {
    readinessScore = 0.35;  // Diagnostic suggestions only, not actual fix
  } else if (category === 'nutrition' || category === 'workout') {
    readinessScore = 0.65;  // Template suggestions available
  } else if (sentiment === 'positive' || urgency === 'low') {
    readinessScore = Math.max(0.2, readinessScore - 0.15);
  }

  const userValueTier: UserValueTier = urgency === 'critical' ? 'vip' : readinessScore >= 0.7 ? 'premium' : 'standard';
  const priorityBase = urgency === 'critical' ? 95 : urgency === 'high' ? 80 : urgency === 'medium' ? 60 : 35;
  const sentimentWeight = sentiment === 'negative' ? 12 : sentiment === 'neutral' ? 4 : -6;
  const valueWeight = userValueTier === 'vip' ? 15 : userValueTier === 'premium' ? 8 : 2;
  const priorityScore = Math.max(1, Math.min(100, priorityBase + sentimentWeight + valueWeight));

  const autoResolvable = readinessScore >= 0.7 && confidence >= 0.85;  // High readiness + high confidence for template-driven response
  const automationDecision = autoResolvable
    ? 'auto-reply'  // Send template response
    : readinessScore >= 0.4
      ? 'human-assist'  // Suggest template to support agent
      : 'escalate';  // Route to specialist

  const clusterByCategory: Record<QueryCategory, string> = {
    billing: 'duplicate-payment',
    technical: 'device-sync',
    membership: 'subscription-change',
    nutrition: 'meal-personalization',
    workout: 'plan-guidance',
    'app-issue': 'mobile-app-stability',
    account: 'login-recovery',
    other: 'general-support',
  };

  // Suggest automation
  const automationSuggestions: Record<QueryCategory, string> = {
    billing: 'Route to billing team with payment history',
    technical: 'Auto-run diagnostics & suggest common fixes',
    membership: 'Self-service cancellation/modification flow',
    nutrition: 'Provide nutritional guide based on goals',
    workout: 'Generate personalized workout plan',
    'app-issue': 'Display troubleshooting guide in app',
    account: 'Self-service password reset',
    other: 'Route to customer support team',
  };

  const generatedResponses: Record<QueryCategory, string> = {
    billing: 'We have detected a possible billing inconsistency and have already started a payment verification check. If a duplicate charge is confirmed, a refund update will be sent automatically.',
    technical: 'We are checking the sync issue on your device profile. Please keep Bluetooth and app permissions enabled while our system runs a guided recovery flow.',
    membership: 'Your membership request can likely be handled automatically. We have prepared the next steps and will confirm the change as soon as you approve it.',
    nutrition: 'We reviewed your nutrition preference and can generate an updated meal plan aligned to your current goals and dietary choices.',
    workout: 'We can recommend a more suitable workout path based on your level, recent progress, and recovery pattern.',
    'app-issue': 'We detected an app stability issue pattern similar to recent reports. Crash recovery guidance and engineering logs can be triggered from this ticket.',
    account: 'We can help restore access using a secure verification and password recovery flow. A recovery link can be issued immediately.',
    other: 'Your query has been summarized and routed to the best-fit support workflow for manual review.',
  };

  return {
    text,
    category,
    urgency,
    sentiment,
    readinessScore: Math.round(readinessScore * 100) / 100,
    suggestedAutomation: automationSuggestions[category],
    resolutionStatus: 'open',
    sourceChannel,
    confidence,
    autoResolvable,
    automationDecision,
    priorityScore,
    userValueTier,
    issueCluster: clusterByCategory[category],
    generatedResponse: generatedResponses[category],
    feedbackResolved: undefined,
    aiSummary: `Classified as ${category} with ${urgency} urgency and ${sentiment} sentiment.`,
  };
}

// Actual Groq implementation (uncomment when API key is available)
/*
export async function analyzeQuery(text: string): Promise<Omit<CustomerQuery, 'id' | 'createdAt'>> {
  const response = await fetch('https://api.groq.com/analyze', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      task: 'analyze_customer_query',
    }),
  });

  const result = await response.json();
  
  return {
    text,
    category: result.category,
    urgency: result.urgency,
    sentiment: result.sentiment,
    readinessScore: result.readinessScore,
    suggestedAutomation: result.suggestedAutomation,
  };
}
*/
