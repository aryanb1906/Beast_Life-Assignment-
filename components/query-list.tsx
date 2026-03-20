'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CustomerQuery, QueryCategory, Urgency, Sentiment } from '@/lib/types';
import { QueryDetailModal } from './query-detail-modal';
import { Trash2, Filter } from 'lucide-react';

interface QueryListProps {
  queries: CustomerQuery[];
  onDelete: (id: string) => void;
}

const CATEGORY_COLORS: Record<QueryCategory, string> = {
  billing: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  technical: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  membership: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  nutrition: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  workout: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'app-issue': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  account: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

const URGENCY_COLORS: Record<Urgency, string> = {
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export function QueryList({ queries, onDelete }: QueryListProps) {
  const [selectedQuery, setSelectedQuery] = useState<CustomerQuery | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<QueryCategory | 'all'>('all');

  const filteredQueries = categoryFilter === 'all' 
    ? queries 
    : queries.filter(q => q.category === categoryFilter);

  const sortedQueries = [...filteredQueries].sort((a, b) => b.createdAt - a.createdAt);

  if (queries.length === 0) {
    return (
      <Card className="p-12 bg-card border-border text-center">
        <p className="text-muted-foreground">No queries yet. Submit one above to get started!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as QueryCategory | 'all')}
          className="text-sm px-3 py-1 rounded border border-border bg-background text-foreground"
        >
          <option value="all">All Categories</option>
          <option value="billing">Billing</option>
          <option value="technical">Technical</option>
          <option value="membership">Membership</option>
          <option value="nutrition">Nutrition</option>
          <option value="workout">Workout</option>
          <option value="app-issue">App Issue</option>
          <option value="account">Account</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="space-y-3">
        {sortedQueries.map((query) => (
          <Card
            key={query.id}
            className="p-4 bg-card border-border hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => setSelectedQuery(query)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground line-clamp-2 mb-2">{query.text}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-medium px-2 py-1 rounded ${CATEGORY_COLORS[query.category]}`}>
                    {query.category}
                  </span>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${URGENCY_COLORS[query.urgency]}`}>
                    {query.urgency}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Automation: {(query.automationScore * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(query.id);
                }}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {selectedQuery && (
        <QueryDetailModal
          query={selectedQuery}
          isOpen={!!selectedQuery}
          onClose={() => setSelectedQuery(null)}
        />
      )}
    </div>
  );
}
