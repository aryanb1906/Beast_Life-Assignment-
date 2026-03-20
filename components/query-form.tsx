'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { analyzeQuery } from '@/lib/groq-client';
import { CustomerQuery } from '@/lib/types';
import { Send } from 'lucide-react';

interface QueryFormProps {
  onQueryAdded: (query: CustomerQuery) => void;
}

export function QueryForm({ onQueryAdded }: QueryFormProps) {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsLoading(true);
    try {
      const analyzed = await analyzeQuery(text);
      const query: CustomerQuery = {
        id: Date.now().toString(),
        ...analyzed,
        createdAt: Date.now(),
      };
      onQueryAdded(query);
      setText('');
    } catch (error) {
      console.error('Error analyzing query:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Submit Customer Query</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter a customer support query to analyze..."
            className="w-full min-h-24 p-3 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={!text.trim() || isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Analyze Query
              </>
            )}
          </Button>
        </form>
      </div>
    </Card>
  );
}
