'use client';

import { Card } from '@/components/ui/card';
import { CustomerQuery } from '@/lib/types';
import { CheckCircle2, AlertCircle, TrendingUp, Zap } from 'lucide-react';

interface AutomationInsightsProps {
  queries: CustomerQuery[];
}

export function AutomationInsights({ queries }: AutomationInsightsProps) {
  const automationCandidates = queries
    .filter(q => q.automationScore >= 0.7)
    .sort((a, b) => b.automationScore - a.automationScore);

  const autoReplyCount = queries.filter((q) => q.automationDecision === 'auto-reply').length;
  const humanAssistCount = queries.filter((q) => q.automationDecision === 'human-assist').length;
  const escalateCount = queries.filter((q) => q.automationDecision === 'escalate').length;

  const highPriorityAutomations = automationCandidates.slice(0, 5);

  const totalPotentialSavings = automationCandidates.length;
  const avgAutomationScore = automationCandidates.length > 0
    ? (automationCandidates.reduce((sum, q) => sum + q.automationScore, 0) / automationCandidates.length * 100).toFixed(0)
    : 0;

  // Group by automation type
  const automationsByType: Record<string, number> = {};
  automationCandidates.forEach(q => {
    const type = q.suggestedAutomation.split('\n')[0];
    automationsByType[type] = (automationsByType[type] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Automatable Queries</p>
              <p className="text-3xl font-bold text-foreground">{totalPotentialSavings}</p>
              <p className="text-xs text-muted-foreground">
                {queries.length > 0 ? ((totalPotentialSavings / queries.length) * 100).toFixed(0) : 0}% of total
              </p>
            </div>
            <Zap className="w-8 h-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-100/50 to-green-50/50 border-green-200">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Avg Automation Score</p>
              <p className="text-3xl font-bold text-foreground">{avgAutomationScore}%</p>
              <p className="text-xs text-muted-foreground">High confidence automation</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-100/50 to-blue-50/50 border-blue-200">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Efficiency Gain</p>
              <p className="text-3xl font-bold text-foreground">
                {queries.length > 0 ? (totalPotentialSavings * 2.5).toFixed(0) : 0}
              </p>
              <p className="text-xs text-muted-foreground">Hours per month saved</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-card border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Automation Decision Engine</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-sm font-medium text-muted-foreground">Auto Reply</p>
            <p className="text-2xl font-bold">{autoReplyCount}</p>
            <p className="text-xs text-muted-foreground">automation score &gt;= 80 and confidence &gt;= 80</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-sm font-medium text-muted-foreground">Human Assist</p>
            <p className="text-2xl font-bold">{humanAssistCount}</p>
            <p className="text-xs text-muted-foreground">mid-confidence cases with AI drafting support</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-sm font-medium text-muted-foreground">Escalate</p>
            <p className="text-2xl font-bold">{escalateCount}</p>
            <p className="text-xs text-muted-foreground">high-risk or low-confidence support tickets</p>
          </div>
        </div>

        <pre className="text-xs overflow-x-auto rounded-lg bg-slate-950 text-slate-100 p-4">
          {`IF category == "membership" AND confidence > 90%:
  trigger_template("cancel_membership")
ELIF automation_score >= 0.50:
  assign_human_assist()
ELSE:
  escalate_to_manager()`}
        </pre>
      </Card>

      <Card className="p-6 bg-card border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Top Automation Opportunities</h3>
        {highPriorityAutomations.length > 0 ? (
          <div className="space-y-3">
            {highPriorityAutomations.map((query, index) => (
              <div key={query.id} className="flex items-start gap-4 p-4 rounded-lg bg-background border border-border">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm text-foreground line-clamp-2">{query.text}</p>
                    <span className="text-xs font-semibold text-primary flex-shrink-0">
                      {(query.automationScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Suggested Action:</p>
                    <p className="text-sm text-foreground bg-primary/5 rounded px-3 py-2 border border-primary/10">
                      {query.suggestedAutomation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 text-muted-foreground p-4 rounded-lg bg-background border border-border">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>No automation opportunities found yet. Submit more queries to discover patterns.</p>
          </div>
        )}
      </Card>

      <Card className="p-6 bg-card border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Automation Types Distribution</h3>
        {Object.keys(automationsByType).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(automationsByType)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => (
                <div key={type} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                  <span className="text-sm text-foreground">{type}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${(count / totalPotentialSavings) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-foreground min-w-fit">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No automation types yet</p>
        )}
      </Card>

      <Card className="p-6 bg-card border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Automation Strategy</h3>
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="grid grid-cols-[1fr_1.3fr] bg-muted/50 px-4 py-2 text-xs font-semibold text-muted-foreground">
            <span>Issue</span>
            <span>Solution</span>
          </div>
          {[
            ['Membership cancellation', 'Self-service flow with guided confirmation'],
            ['Billing issues', 'Auto refund check + payment verification system'],
            ['App issues', 'AI troubleshooting bot with log collection'],
            ['Workout queries', 'AI recommendation engine for plan selection'],
          ].map(([issue, solution]) => (
            <div key={issue} className="grid grid-cols-[1fr_1.3fr] px-4 py-3 border-t border-border text-sm">
              <span className="font-medium text-foreground">{issue}</span>
              <span className="text-muted-foreground">{solution}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
        <h3 className="text-lg font-semibold text-foreground mb-3">Implementation Recommendations</h3>
        <ul className="space-y-2 text-sm text-foreground">
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Start with membership-related automation (highest automation score)</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Implement self-service account management tools to reduce support burden</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Monitor negative sentiment queries for pattern detection and resolution</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Prioritize critical urgency queries for immediate human attention</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
