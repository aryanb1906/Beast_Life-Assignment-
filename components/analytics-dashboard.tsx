'use client';

import { Card } from '@/components/ui/card';
import { CustomerQuery, QueryStats } from '@/lib/types';
import { calculateStats } from '@/lib/storage';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface AnalyticsDashboardProps {
  queries: CustomerQuery[];
}

const CATEGORY_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#6b7280'];
const SENTIMENT_COLORS = { positive: '#10b981', neutral: '#9ca3af', negative: '#ef4444' };
const URGENCY_COLORS = { low: '#3b82f6', medium: '#f59e0b', high: '#ef4444', critical: '#7c2d12' };

export function AnalyticsDashboard({ queries }: AnalyticsDashboardProps) {
  const stats = calculateStats(queries);

  const categoryData = Object.entries(stats.byCategory).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
  }));

  const urgencyData = Object.entries(stats.byUrgency).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
  }));

  const sentimentData = Object.entries(stats.bySentiment).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
  }));

  // Time series data (mock for now)
  const timeSeriesData = [
    { time: '1h ago', queries: Math.floor(stats.total * 0.1) },
    { time: '2h ago', queries: Math.floor(stats.total * 0.15) },
    { time: '3h ago', queries: Math.floor(stats.total * 0.12) },
    { time: '4h ago', queries: Math.floor(stats.total * 0.18) },
    { time: '5h ago', queries: Math.floor(stats.total * 0.2) },
    { time: 'now', queries: stats.total },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-card border-border">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Total Queries</p>
            <p className="text-3xl font-bold text-foreground">{stats.total}</p>
          </div>
        </Card>
        <Card className="p-6 bg-card border-border">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Template Ready Queries</p>
            <p className="text-3xl font-bold text-primary">{stats.automationOpportunities}</p>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.automationOpportunities / stats.total) * 100).toFixed(0) : 0}% of queries
            </p>
          </div>
        </Card>
        <Card className="p-6 bg-card border-border">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Negative Sentiment</p>
            <p className="text-3xl font-bold text-red-600">{stats.bySentiment.negative}</p>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.bySentiment.negative / stats.total) * 100).toFixed(0) : 0}% of queries
            </p>
          </div>
        </Card>
        <Card className="p-6 bg-card border-border">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Critical Issues</p>
            <p className="text-3xl font-bold text-orange-600">{stats.byUrgency.critical}</p>
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-card border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Query Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 bg-card border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Urgency Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={urgencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {urgencyData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={Object.values(URGENCY_COLORS)[index % 4]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-card border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Sentiment Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sentimentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {sentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={Object.values(SENTIMENT_COLORS)[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 bg-card border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Query Volume Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Line
                type="monotone"
                dataKey="queries"
                stroke="#3b82f6"
                dot={{ fill: '#3b82f6' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
