'use client';

import { ResponseTemplate, QueryCategory } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface ResponseTemplatesProps {
  templates: ResponseTemplate[];
  onDelete: (id: string) => void;
  onUse: (template: ResponseTemplate) => void;
}

export function ResponseTemplates({ templates, onDelete, onUse }: ResponseTemplatesProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const categoryColors: Record<QueryCategory, string> = {
    billing: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    technical: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    membership: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    nutrition: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    workout: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    'app-issue': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    account: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  };

  return (
    <div className="space-y-3">
      {templates.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No response templates yet. Create one to speed up your responses.
        </div>
      ) : (
        templates.map(template => (
          <Card key={template.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">{template.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${categoryColors[template.category]}`}>
                    {template.category}
                  </span>
                </div>
                <p className="text-sm text-foreground/70 line-clamp-2">{template.content}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(template.content, template.id)}
                  title="Copy to clipboard"
                >
                  <Copy className="h-4 w-4" />
                  {copied === template.id && <span className="text-xs ml-1">Copied!</span>}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(template.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
