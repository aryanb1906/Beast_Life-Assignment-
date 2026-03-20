'use client';

import { useState } from 'react';
import { CustomerQuery } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Download, FileText } from 'lucide-react';

interface ExportDialogProps {
  queries: CustomerQuery[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportDialog({ queries, open, onOpenChange }: ExportDialogProps) {
  const [exporting, setExporting] = useState(false);

  const exportToCSV = () => {
    setExporting(true);
    const headers = ['ID', 'Text', 'Category', 'Urgency', 'Sentiment', 'Automation Score', 'Status', 'Created At'];
    const rows = queries.map(q => [
      q.id,
      `"${q.text.replace(/"/g, '""')}"`,
      q.category,
      q.urgency,
      q.sentiment,
      q.automationScore.toFixed(2),
      q.resolutionStatus,
      new Date(q.createdAt).toISOString(),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beastlife-queries-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setExporting(false);
    onOpenChange(false);
  };

  const exportToPDF = () => {
    setExporting(true);
    const pdfContent = `
BEASTLIFE CUSTOMER QUERIES REPORT
Generated: ${new Date().toLocaleString()}

SUMMARY
Total Queries: ${queries.length}
High Priority: ${queries.filter(q => q.urgency === 'critical' || q.urgency === 'high').length}
Negative Sentiment: ${queries.filter(q => q.sentiment === 'negative').length}

DETAILED QUERIES
${queries.map((q, i) => `
${i + 1}. ${q.text}
   Category: ${q.category}
   Urgency: ${q.urgency}
   Sentiment: ${q.sentiment}
   Status: ${q.resolutionStatus}
   Automation Score: ${(q.automationScore * 100).toFixed(0)}%
   Created: ${new Date(q.createdAt).toLocaleString()}
`).join('\n')}
    `;
    
    const blob = new Blob([pdfContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beastlife-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    setExporting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            Choose your preferred export format
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Button
            onClick={exportToCSV}
            disabled={exporting}
            variant="outline"
            className="w-full justify-start gap-2"
          >
            <Download className="h-4 w-4" />
            Export as CSV
          </Button>
          <Button
            onClick={exportToPDF}
            disabled={exporting}
            variant="outline"
            className="w-full justify-start gap-2"
          >
            <FileText className="h-4 w-4" />
            Export as Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
