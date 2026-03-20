'use client';

import { useState } from 'react';
import { CustomerQuery } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Upload } from 'lucide-react';

interface BulkImportDialogProps {
  onImport: (queries: CustomerQuery[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkImportDialog({ onImport, open, onOpenChange }: BulkImportDialogProps) {
  const [text, setText] = useState('');
  const [importing, setImporting] = useState(false);

  const parseQueries = (input: string): CustomerQuery[] => {
    const lines = input.split('\n').filter(l => l.trim());
    const newQueries: CustomerQuery[] = [];

    lines.forEach((line, idx) => {
      if (line.trim()) {
        newQueries.push({
          id: `${Date.now()}-${idx}`,
          text: line.trim(),
          category: 'other',
          urgency: 'medium',
          sentiment: 'neutral',
          automationScore: 0.5,
          suggestedAutomation: 'Pending analysis',
          createdAt: Date.now(),
          resolutionStatus: 'open',
        });
      }
    });

    return newQueries;
  };

  const handleImport = () => {
    if (!text.trim()) return;
    
    setImporting(true);
    const queries = parseQueries(text);
    
    setTimeout(() => {
      onImport(queries);
      setText('');
      setImporting(false);
      onOpenChange(false);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Import Queries</DialogTitle>
          <DialogDescription>
            Paste one query per line. These will be analyzed and added to your system.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Textarea
            placeholder="Paste customer queries here (one per line)..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-48"
          />
          <div className="text-sm text-muted-foreground">
            {text.split('\n').filter(l => l.trim()).length} queries to import
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleImport}
              disabled={!text.trim() || importing}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Queries
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
