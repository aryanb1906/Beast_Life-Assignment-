'use client';

import { CustomerQuery, Sentiment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface QueryDetailModalProps {
  query: CustomerQuery;
  isOpen: boolean;
  onClose: () => void;
}

const SENTIMENT_COLORS: Record<Sentiment, string> = {
  positive: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  negative: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export function QueryDetailModal({ query, isOpen, onClose }: QueryDetailModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Query Details</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Query Text</h3>
            <p className="text-foreground text-base leading-relaxed">{query.text}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Category</h3>
              <p className="text-foreground font-medium capitalize">{query.category}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Urgency</h3>
              <p className="text-foreground font-medium capitalize">{query.urgency}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Sentiment</h3>
              <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${SENTIMENT_COLORS[query.sentiment]}`}>
                {query.sentiment.charAt(0).toUpperCase() + query.sentiment.slice(1)}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Automation Score</h3>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-border rounded-full h-2">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{ width: `${query.automationScore * 100}%` }}
                  />
                </div>
                <span className="text-foreground font-medium min-w-fit">
                  {(query.automationScore * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Suggested Automation</h3>
            <div className="bg-background border border-border rounded-lg p-4">
              <p className="text-foreground">{query.suggestedAutomation}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Submitted</h3>
            <p className="text-foreground text-sm">
              {new Date(query.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
