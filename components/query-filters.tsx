'use client';

import { CustomerQuery, QueryCategory, Urgency, Sentiment } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Search } from 'lucide-react';
import { useState } from 'react';

interface QueryFiltersProps {
  queries: CustomerQuery[];
  onFilter: (filtered: CustomerQuery[]) => void;
}

export function QueryFilters({ queries, onFilter }: QueryFiltersProps) {
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<QueryCategory | ''>('');
  const [selectedUrgency, setSelectedUrgency] = useState<Urgency | ''>('');
  const [selectedSentiment, setSelectedSentiment] = useState<Sentiment | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const categories: QueryCategory[] = ['billing', 'technical', 'membership', 'nutrition', 'workout', 'app-issue', 'account', 'other'];
  const urgencies: Urgency[] = ['low', 'medium', 'high', 'critical'];
  const sentiments: Sentiment[] = ['positive', 'neutral', 'negative'];
  const statuses = ['open', 'in-progress', 'resolved', 'escalated'];

  const applyFilters = () => {
    let filtered = queries;

    if (searchText) {
      filtered = filtered.filter(q => q.text.toLowerCase().includes(searchText.toLowerCase()));
    }
    if (selectedCategory) {
      filtered = filtered.filter(q => q.category === selectedCategory);
    }
    if (selectedUrgency) {
      filtered = filtered.filter(q => q.urgency === selectedUrgency);
    }
    if (selectedSentiment) {
      filtered = filtered.filter(q => q.sentiment === selectedSentiment);
    }
    if (selectedStatus) {
      filtered = filtered.filter(q => q.resolutionStatus === selectedStatus);
    }
    if (dateFrom) {
      const fromTime = new Date(dateFrom).getTime();
      filtered = filtered.filter(q => q.createdAt >= fromTime);
    }
    if (dateTo) {
      const toTime = new Date(dateTo).getTime();
      filtered = filtered.filter(q => q.createdAt <= toTime);
    }

    onFilter(filtered);
  };

  const clearFilters = () => {
    setSearchText('');
    setSelectedCategory('');
    setSelectedUrgency('');
    setSelectedSentiment('');
    setSelectedStatus('');
    setDateFrom('');
    setDateTo('');
    onFilter(queries);
  };

  return (
    <div className="space-y-4 p-4 bg-card border border-border rounded-lg">
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search queries..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as QueryCategory | '')}
            className="text-sm border border-border rounded px-2 py-1.5 bg-background"
          >
            <option value="">Category</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value as Urgency | '')}
            className="text-sm border border-border rounded px-2 py-1.5 bg-background"
          >
            <option value="">Urgency</option>
            {urgencies.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>

          <select
            value={selectedSentiment}
            onChange={(e) => setSelectedSentiment(e.target.value as Sentiment | '')}
            className="text-sm border border-border rounded px-2 py-1.5 bg-background"
          >
            <option value="">Sentiment</option>
            {sentiments.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-sm border border-border rounded px-2 py-1.5 bg-background"
          >
            <option value="">Status</option>
            {statuses.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="text-sm border border-border rounded px-2 py-1.5 bg-background"
            placeholder="From"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="text-sm border border-border rounded px-2 py-1.5 bg-background"
            placeholder="To"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={applyFilters} size="sm" className="flex-1">
          Apply Filters
        </Button>
        <Button onClick={clearFilters} variant="outline" size="sm">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
