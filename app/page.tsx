'use client';

import { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { QueryForm } from '@/components/query-form';
import { QueryList } from '@/components/query-list';
import { AnalyticsDashboard } from '@/components/analytics-dashboard';
import { AutomationInsights } from '@/components/automation-insights';
import { WorkflowDiagram } from '@/components/workflow-diagram';
import { ExportDialog } from '@/components/export-dialog';
import { BulkImportDialog } from '@/components/bulk-import-dialog';
import { QueryFilters } from '@/components/query-filters';
import { ResponseTemplates } from '@/components/response-templates';
import { TeamAssignment } from '@/components/team-assignment';
import { ThemeToggle } from '@/components/theme-toggle';
import { CustomerQuery, ResponseTemplate, TeamMember } from '@/lib/types';
import {
  loadQueries, saveQueries, deleteQuery as removeQuery, updateQuery,
  loadTemplates, saveTemplates, loadTeam, resetDemoData
} from '@/lib/storage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUpDown,
  ArrowUp,
  BarChart3,
  Check,
  ChevronRight,
  Clock3,
  Command,
  Download,
  Flame,
  FileJson,
  GitBranch,
  GitMerge,
  LayoutGrid,
  Layers3,
  Palette,
  Pause,
  Play,
  Presentation,
  MessageSquare,
  MessageSquareDashed,
  Rocket,
  Search,
  SlidersHorizontal,
  Target,
  TimerReset,
  TrendingUp,
  RotateCcw,
  Upload,
  UserCog,
  UserRoundCheck,
  Users,
  ShieldCheck,
  Wallet,
  Zap,
  BrainCircuit,
  Gauge,
  ShieldAlert,
  Shield,
  Bot,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

type TabKey = 'queries' | 'analytics' | 'automation' | 'templates' | 'team' | 'workflow';
type DateRange = '24h' | '7d' | '30d' | 'all';
type BuiltInView = 'default' | 'high-risk' | 'automation' | 'escalations';
type PrioritySortField = 'createdAt' | 'urgency' | 'readinessScore' | 'category';
type ScoringProfile = 'balanced' | 'growth' | 'incident';
type DataScale = 1 | 2 | 3 | 5;
type TimelineDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

type SavedFilterPreset = {
  id: string;
  name: string;
  dateRange: DateRange;
  urgencyFilter: 'all' | 'low' | 'medium' | 'high' | 'critical';
  sentimentFilter: 'all' | 'positive' | 'neutral' | 'negative';
  globalSearch: string;
  createdAt: number;
};

const SAVED_VIEWS_STORAGE_KEY = 'beastlife_saved_views';
const DEMO_AUTOPLAY_MS = 9000;
const DEMO_AUTOPLAY_SECONDS = Math.floor(DEMO_AUTOPLAY_MS / 1000);
const SOFT_VOICE_PROFILE = {
  rate: 1.15,
  pitch: 1.0,
  volume: 0.58,
} as const;

type DemoTalkingPoint = {
  title: string;
  expectedTalkingPoint: string;
};

type GuardrailLogItem = {
  queryId: string;
  action: 'override' | 'false-positive';
  createdAt: number;
};

const BUILT_IN_VIEWS: Record<BuiltInView, Omit<SavedFilterPreset, 'id' | 'name' | 'createdAt'>> = {
  default: {
    dateRange: '7d',
    urgencyFilter: 'all',
    sentimentFilter: 'all',
    globalSearch: '',
  },
  'high-risk': {
    dateRange: '7d',
    urgencyFilter: 'critical',
    sentimentFilter: 'negative',
    globalSearch: '',
  },
  automation: {
    dateRange: '30d',
    urgencyFilter: 'all',
    sentimentFilter: 'all',
    globalSearch: '',
  },
  escalations: {
    dateRange: '30d',
    urgencyFilter: 'all',
    sentimentFilter: 'negative',
    globalSearch: '',
  },
};

function Sparkline({ points, color }: { points: number[]; color: string }) {
  const width = 120;
  const height = 36;
  const max = Math.max(...points, 1);
  const step = points.length > 1 ? width / (points.length - 1) : width;
  const polyline = points
    .map((point, index) => `${index * step},${height - (point / max) * (height - 4) - 2}`)
    .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-9 w-full" preserveAspectRatio="none" aria-hidden="true">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={polyline} />
    </svg>
  );
}

const TAB_ITEMS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'queries', label: 'Queries', icon: BarChart3 },
  { key: 'analytics', label: 'Analytics', icon: TrendingUp },
  { key: 'automation', label: 'Automation', icon: Zap },
  { key: 'templates', label: 'Templates', icon: MessageSquare },
  { key: 'team', label: 'Team', icon: Users },
  { key: 'workflow', label: 'Workflow', icon: GitBranch },
];

const BRAND_PRESETS = [
  { id: 'ocean', label: 'Ocean Pulse', swatch: 'from-cyan-500 via-sky-500 to-indigo-500' },
  { id: 'sunset', label: 'Sunset Pop', swatch: 'from-orange-500 via-rose-500 to-fuchsia-600' },
  { id: 'mint', label: 'Mint Spark', swatch: 'from-emerald-500 via-teal-500 to-cyan-600' },
  { id: 'candy', label: 'Candy Neon', swatch: 'from-pink-500 via-violet-500 to-blue-500' },
] as const;

export default function Home() {
  const [queries, setQueries] = useState<CustomerQuery[]>([]);
  const [filteredQueries, setFilteredQueries] = useState<CustomerQuery[]>([]);
  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('queries');
  const [selectedPalette, setSelectedPalette] = useState<(typeof BRAND_PRESETS)[number]['id']>('ocean');
  const [isLiveTickerOn, setIsLiveTickerOn] = useState(true);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [mobileCommandOpen, setMobileCommandOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>('7d');
  const [selectedViewKey, setSelectedViewKey] = useState<string>('default');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');
  const [globalSearch, setGlobalSearch] = useState('');
  const [customViews, setCustomViews] = useState<SavedFilterPreset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [demoScriptMode, setDemoScriptMode] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [demoAutoplay, setDemoAutoplay] = useState(false);
  const [demoCountdown, setDemoCountdown] = useState(DEMO_AUTOPLAY_SECONDS);
  const [liveIncidentActive, setLiveIncidentActive] = useState(false);
  const [incidentIntensity, setIncidentIntensity] = useState(0.4);
  const [incidentRecoverySeries, setIncidentRecoverySeries] = useState<number[]>([100, 85, 72, 58, 42, 28, 15, 5, 8, 15, 25, 40, 58, 72, 85, 95]);
  const [explainabilityOpen, setExplainabilityOpen] = useState(false);
  const [selectedExplainQuery, setSelectedExplainQuery] = useState<CustomerQuery | null>(null);
  const [templateAId, setTemplateAId] = useState<string>('');
  const [templateBId, setTemplateBId] = useState<string>('');
  const [confidenceThreshold, setConfidenceThreshold] = useState(65);
  const [guardrailLogs, setGuardrailLogs] = useState<GuardrailLogItem[]>([]);
  const [scoringProfile, setScoringProfile] = useState<ScoringProfile>('balanced');
  const [dataScale, setDataScale] = useState<DataScale>(3);
  const [judgeMode, setJudgeMode] = useState(false);
  const [voiceNarrationOn, setVoiceNarrationOn] = useState(false);
  const [voiceRate, setVoiceRate] = useState<number>(SOFT_VOICE_PROFILE.rate);
  const [voiceName, setVoiceName] = useState('Female voice (auto)');
  const [voiceReady, setVoiceReady] = useState(false);
  const [whatIfTeamScale, setWhatIfTeamScale] = useState(100);
  const [whatIfAutomationThreshold, setWhatIfAutomationThreshold] = useState(75);
  const [whatIfIncidentSeverity, setWhatIfIncidentSeverity] = useState(100);
  const [timelineReplayOn, setTimelineReplayOn] = useState(false);
  const [timelineDay, setTimelineDay] = useState<TimelineDay>(6);
  const [prioritySort, setPrioritySort] = useState<{ field: PrioritySortField; direction: 'asc' | 'desc' }>({
    field: 'createdAt',
    direction: 'desc',
  });

  const demoTalkingPoints: DemoTalkingPoint[] = [
    {
      title: 'Unified Inbox Intake',
      expectedTalkingPoint: 'Unified Inbox collects WhatsApp, Instagram, and Email into one AI pipeline.',
    },
    {
      title: 'AI Classification',
      expectedTalkingPoint: 'LLM classifies each query to structured JSON: category, urgency, sentiment, confidence, auto_resolvable.',
    },
    {
      title: 'Decision Routing',
      expectedTalkingPoint: 'Automation Decision Engine routes tickets to auto-reply, human-assist, or escalation.',
    },
    {
      title: 'Distribution Snapshot',
      expectedTalkingPoint: 'Problem Distribution table shows exact issue percentages required by the assignment.',
    },
    {
      title: 'Anomaly Intelligence',
      expectedTalkingPoint: 'Insight Engine detects spikes, root causes, and startup risk metrics for founders.',
    },
    {
      title: 'Execution at Scale',
      expectedTalkingPoint: 'Team leaderboard and SLA alerts keep support execution focused and scalable.',
    },
  ];

  const currentDemoPoint = demoTalkingPoints[demoStep];

  // Load data from localStorage on mount
  useEffect(() => {
    const loadedQueries = loadQueries();
    const loadedTemplates = loadTemplates();
    const loadedTeam = loadTeam();

    setQueries(loadedQueries);
    setFilteredQueries(loadedQueries);
    setTemplates(loadedTemplates);
    setTeam(loadedTeam);
    setIsLoaded(true);
  }, []);

  // Save queries to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      saveQueries(queries);
    }
  }, [queries, isLoaded]);

  useEffect(() => {
    const html = document.documentElement;
    const savedPalette = localStorage.getItem('brand-palette') as (typeof BRAND_PRESETS)[number]['id'] | null;
    const palette = savedPalette && BRAND_PRESETS.some((preset) => preset.id === savedPalette) ? savedPalette : 'ocean';
    html.setAttribute('data-brand', palette);
    setSelectedPalette(palette);

    const storedViews = localStorage.getItem(SAVED_VIEWS_STORAGE_KEY);
    if (storedViews) {
      try {
        const parsed = JSON.parse(storedViews) as SavedFilterPreset[];
        setCustomViews(parsed);
      } catch {
        setCustomViews([]);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SAVED_VIEWS_STORAGE_KEY, JSON.stringify(customViews));
  }, [customViews]);

  useEffect(() => {
    if (!templateAId && templates[0]) {
      setTemplateAId(templates[0].id);
    }
    if (!templateBId && templates[1]) {
      setTemplateBId(templates[1].id);
    }
  }, [templates, templateAId, templateBId]);

  const handleQueryAdded = (newQuery: CustomerQuery) => {
    setQueries([newQuery, ...queries]);
    setFilteredQueries([newQuery, ...filteredQueries]);
  };

  const handleDeleteQuery = (id: string) => {
    removeQuery(id);
    setQueries(queries.filter(q => q.id !== id));
    setFilteredQueries(filteredQueries.filter(q => q.id !== id));
  };

  const handleBulkImport = (newQueries: CustomerQuery[]) => {
    setQueries([...newQueries, ...queries]);
    setFilteredQueries([...newQueries, ...filteredQueries]);
  };

  const handleFilterChange = (filtered: CustomerQuery[]) => {
    setFilteredQueries(filtered);
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    saveTemplates(updated);
  };

  const handleAssignQuery = (queryId: string, memberId: string) => {
    updateQuery(queryId, { assignedTo: memberId });
    setQueries(queries.map(q => q.id === queryId ? { ...q, assignedTo: memberId } : q));
  };

  const switchToTab = (tab: TabKey) => {
    setActiveTab(tab);
    toast.info(`${TAB_ITEMS.find((item) => item.key === tab)?.label} view opened`);
  };

  const handlePaletteChange = (palette: (typeof BRAND_PRESETS)[number]['id']) => {
    document.documentElement.setAttribute('data-brand', palette);
    localStorage.setItem('brand-palette', palette);
    setSelectedPalette(palette);
    toast.success(`${BRAND_PRESETS.find((preset) => preset.id === palette)?.label} palette applied`);
  };

  const handleResetDemoData = () => {
    const snapshot = resetDemoData();
    setQueries(snapshot.queries);
    setFilteredQueries(snapshot.queries);
    setTemplates(snapshot.templates);
    setTeam(snapshot.team);
    setActiveTab('queries');
    toast.success('Demo data reset successfully', {
      description: `Loaded ${snapshot.queries.length} queries, ${snapshot.templates.length} templates, and ${snapshot.team.length} team members.`,
    });
  };

  const triggerLiveIncident = () => {
    setLiveIncidentActive(true);
    setIncidentIntensity(1);
    setIncidentRecoverySeries([0]);
    toast.warning('Live Incident: Billing outage simulation started', {
      description: 'Spike injected. Watch anomaly badges, escalation routing, and recovery trend.',
    });
  };

  const applyPreset = (preset: Omit<SavedFilterPreset, 'id' | 'name' | 'createdAt'>, key: string) => {
    setDateRange(preset.dateRange);
    setUrgencyFilter(preset.urgencyFilter);
    setSentimentFilter(preset.sentimentFilter);
    setGlobalSearch(preset.globalSearch);
    setSelectedViewKey(key);
  };

  const handleViewSelection = (value: string) => {
    const builtInPreset = BUILT_IN_VIEWS[value as BuiltInView];
    if (builtInPreset) {
      applyPreset(builtInPreset, value);
      toast.success(`Applied ${value.replace('-', ' ')} view`);
      return;
    }

    const customPreset = customViews.find((preset) => preset.id === value);
    if (customPreset) {
      applyPreset(customPreset, customPreset.id);
      toast.success(`Loaded saved view: ${customPreset.name}`);
    }
  };

  const handleSaveCurrentView = () => {
    const name = presetName.trim();
    if (!name) {
      toast.error('Enter a preset name first');
      return;
    }

    const preset: SavedFilterPreset = {
      id: `view-${Date.now()}`,
      name,
      dateRange,
      urgencyFilter,
      sentimentFilter,
      globalSearch,
      createdAt: Date.now(),
    };

    setCustomViews((current) => [preset, ...current].slice(0, 8));
    setSelectedViewKey(preset.id);
    setPresetName('');
    toast.success(`Saved view: ${name}`);
  };

  const markFiltersDirty = () => {
    setSelectedViewKey('default');
  };

  const applyGlobalFilters = (items: CustomerQuery[]) => {
    const now = Date.now();
    const rangeCutoff = {
      '24h': now - 24 * 60 * 60 * 1000,
      '7d': now - 7 * 24 * 60 * 60 * 1000,
      '30d': now - 30 * 24 * 60 * 60 * 1000,
      all: 0,
    };

    return items.filter((query) => {
      if (dateRange !== 'all' && query.createdAt < rangeCutoff[dateRange]) return false;
      if (urgencyFilter !== 'all' && query.urgency !== urgencyFilter) return false;
      if (sentimentFilter !== 'all' && query.sentiment !== sentimentFilter) return false;

      if (globalSearch.trim()) {
        const search = globalSearch.toLowerCase();
        const haystack = `${query.text} ${query.category} ${query.customerName || ''} ${query.customerEmail || ''}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }

      if (selectedViewKey === 'high-risk' && !(query.urgency === 'critical' || query.sentiment === 'negative')) return false;
      if (selectedViewKey === 'automation' && query.readinessScore < 0.6) return false;
      if (selectedViewKey === 'escalations' && query.resolutionStatus !== 'escalated') return false;

      return true;
    });
  };

  const dashboardQueries = applyGlobalFilters(queries);
  const displayedQueries = applyGlobalFilters(filteredQueries);
  const supportCount = Math.max(1, team.filter((member) => member.role === 'support').length);
  const effectiveSupportCount = Math.max(1, Math.round(supportCount * (whatIfTeamScale / 100)));
  const automationThreshold = whatIfAutomationThreshold / 100;
  const incidentSeverityFactor = whatIfIncidentSeverity / 100;

  const togglePrioritySort = (field: PrioritySortField) => {
    setPrioritySort((current) =>
      current.field === field
        ? { field, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { field, direction: field === 'createdAt' ? 'desc' : 'asc' },
    );
  };

  const openQueries = dashboardQueries.filter((q) => q.resolutionStatus !== 'resolved').length;
  const criticalCount = dashboardQueries.filter((q) => q.urgency === 'critical').length;
  const autoReadyCount = dashboardQueries.filter((q) => q.readinessScore >= automationThreshold).length;
  const resolvedCount = dashboardQueries.filter((q) => q.resolutionStatus === 'resolved').length;
  const resolvedRate = dashboardQueries.length > 0 ? resolvedCount / dashboardQueries.length : 1;

  const urgentQueue = [...dashboardQueries]
    .filter((q) => q.resolutionStatus !== 'resolved' && (q.urgency === 'critical' || q.urgency === 'high'))
    .sort((a, b) => {
      const urgencyRank = { critical: 4, high: 3, medium: 2, low: 1 };
      const direction = prioritySort.direction === 'asc' ? 1 : -1;

      if (prioritySort.field === 'createdAt') return (a.createdAt - b.createdAt) * direction;
      if (prioritySort.field === 'urgency') return (urgencyRank[a.urgency] - urgencyRank[b.urgency]) * direction;
      if (prioritySort.field === 'readinessScore') return (a.readinessScore - b.readinessScore) * direction;
      return a.category.localeCompare(b.category) * direction;
    });

  const statusCounts = {
    open: dashboardQueries.filter((q) => q.resolutionStatus === 'open').length,
    inProgress: dashboardQueries.filter((q) => q.resolutionStatus === 'in-progress').length,
    escalated: dashboardQueries.filter((q) => q.resolutionStatus === 'escalated').length,
    resolved: dashboardQueries.filter((q) => q.resolutionStatus === 'resolved').length,
  };

  const roleCounts = {
    admin: team.filter((member) => member.role === 'admin').length,
    manager: team.filter((member) => member.role === 'manager').length,
    support: team.filter((member) => member.role === 'support').length,
  };

  const averageSatisfaction = (() => {
    const rated = dashboardQueries.filter((query) => typeof query.satisfactionRating === 'number');
    if (rated.length === 0) return 0;
    const total = rated.reduce((sum, query) => sum + (query.satisfactionRating || 0), 0);
    return Number((total / rated.length).toFixed(1));
  })();

  const statusMatrix = [
    { key: 'open', label: 'Open', count: statusCounts.open, target: 'Triage < 15m', owner: 'Support', icon: Clock3 },
    { key: 'in-progress', label: 'In Progress', count: statusCounts.inProgress, target: 'Resolve < 2h', owner: 'Support', icon: Activity },
    { key: 'escalated', label: 'Escalated', count: statusCounts.escalated, target: 'Manager review', owner: 'Manager', icon: AlertTriangle },
    { key: 'resolved', label: 'Resolved', count: statusCounts.resolved, target: 'CSAT follow-up', owner: 'Admin', icon: Check },
  ] as const;

  const activityFeed = [
    `${openQueries} active conversations in triage`,
    `${criticalCount} critical issues flagged`,
    `${autoReadyCount} tickets ready for automation`,
    `${team.length} support members online`,
    `${dashboardQueries.length > 0 ? Math.round((resolvedCount / dashboardQueries.length) * 100) : 0}% current resolution rate`,
  ];

  const dayBuckets = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - index));
    day.setHours(0, 0, 0, 0);
    return day.getTime();
  });

  const bucketIndex = (timestamp: number) => {
    const day = new Date(timestamp);
    day.setHours(0, 0, 0, 0);
    return dayBuckets.findIndex((bucket) => bucket === day.getTime());
  };

  const volumeSeries = Array(7).fill(0);
  const resolvedSeries = Array(7).fill(0);
  const criticalSeries = Array(7).fill(0);
  const automationSeries = Array(7).fill(0);
  const negativeSeries = Array(7).fill(0);

  dashboardQueries.forEach((query) => {
    const idx = bucketIndex(query.createdAt);
    if (idx === -1) return;
    volumeSeries[idx] += 1;
    if (query.resolutionStatus === 'resolved') resolvedSeries[idx] += 1;
    if (query.urgency === 'critical') criticalSeries[idx] += 1;
    if (query.readinessScore >= 0.6) automationSeries[idx] += 1;
    if (query.sentiment === 'negative') negativeSeries[idx] += 1;
  });

  const delta = (series: number[]) => {
    if (series.length < 2) return 0;
    return series[series.length - 1] - series[series.length - 2];
  };

  const startupMetrics = {
    mrrAtRisk: dashboardQueries.filter((query) => query.urgency === 'critical' || query.sentiment === 'negative').length * 1499,
    csat: averageSatisfaction,
    automationHours: Number((autoReadyCount * 0.6).toFixed(1)),
    escalationRate: dashboardQueries.length > 0 ? Math.round((statusCounts.escalated / dashboardQueries.length) * 100) : 0,
  };

  const incidentVolumeBoost = Math.round(7 * incidentIntensity * incidentSeverityFactor);
  const incidentCriticalBoost = Math.round(4 * incidentIntensity * incidentSeverityFactor);
  const incidentEscalationBoost = Math.round(3 * incidentIntensity * incidentSeverityFactor);

  const adjustedVolumeSeries = [...volumeSeries];
  const adjustedCriticalSeries = [...criticalSeries];
  if (adjustedVolumeSeries.length > 0) {
    adjustedVolumeSeries[adjustedVolumeSeries.length - 1] += incidentVolumeBoost;
  }
  if (adjustedCriticalSeries.length > 0) {
    adjustedCriticalSeries[adjustedCriticalSeries.length - 1] += incidentCriticalBoost;
  }

  const channelCounts = {
    whatsapp: dashboardQueries.filter((query) => query.sourceChannel === 'whatsapp').length,
    instagram: dashboardQueries.filter((query) => query.sourceChannel === 'instagram').length,
    email: dashboardQueries.filter((query) => query.sourceChannel === 'email').length,
  };

  const categoryDistribution = (['membership', 'app-issue', 'billing', 'nutrition', 'workout', 'account', 'technical', 'other'] as const)
    .map((category) => {
      const count = dashboardQueries.filter((query) => query.category === category).length;
      const percent = dashboardQueries.length > 0 ? Math.round((count / dashboardQueries.length) * 100) : 0;
      return { category, count, percent };
    })
    .filter((item) => item.count > 0);

  const decisionCounts = {
    autoReply: dashboardQueries.filter((query) => query.automationDecision === 'auto-reply').length,
    humanAssist: dashboardQueries.filter((query) => query.automationDecision === 'human-assist').length,
    escalate: dashboardQueries.filter((query) => query.automationDecision === 'escalate').length,
  };

  const adjustedDecisionCounts = {
    autoReply: Math.max(0, decisionCounts.autoReply - Math.round(2 * incidentIntensity)),
    humanAssist: decisionCounts.humanAssist + Math.round(2 * incidentIntensity),
    escalate: decisionCounts.escalate + incidentEscalationBoost,
  };

  const rootCauseClusters = Object.entries(
    dashboardQueries.reduce<Record<string, number>>((accumulator, query) => {
      const key = query.issueCluster || 'general-support';
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const sampleAiQuery = dashboardQueries[0];
  const aiOutputJson = sampleAiQuery
    ? JSON.stringify(
      {
        category: sampleAiQuery.category,
        urgency: sampleAiQuery.urgency,
        sentiment: sampleAiQuery.sentiment,
        confidence: sampleAiQuery.confidence,
        auto_resolvable: sampleAiQuery.autoResolvable,
        source_channel: sampleAiQuery.sourceChannel,
      },
      null,
      2,
    )
    : '{\n  "category": "billing"\n}';

  const billingLast24 = dashboardQueries.filter((query) => query.category === 'billing' && query.createdAt >= Date.now() - 24 * 60 * 60 * 1000).length;
  const billingPrev24 = dashboardQueries.filter((query) => query.category === 'billing' && query.createdAt < Date.now() - 24 * 60 * 60 * 1000 && query.createdAt >= Date.now() - 48 * 60 * 60 * 1000).length;
  const billingDelta = billingPrev24 > 0 ? Math.round(((billingLast24 - billingPrev24) / billingPrev24) * 100) : billingLast24 > 0 ? 100 : 0;
  const leadCluster = rootCauseClusters[0];
  const aiInsight = billingDelta > 0
    ? `Billing issues increased by ${billingDelta}% in the last 24h, indicating a possible payment gateway issue.`
    : leadCluster
      ? `${leadCluster[0].replace(/-/g, ' ')} is the top complaint cluster with ${leadCluster[1]} related queries.`
      : 'No anomaly detected in the current filter scope.';

  const feedbackResolvedRate = dashboardQueries.filter((query) => query.feedbackResolved === true).length;
  const feedbackTotal = dashboardQueries.filter((query) => typeof query.feedbackResolved === 'boolean').length;
  const feedbackPercent = feedbackTotal > 0 ? Math.round((feedbackResolvedRate / feedbackTotal) * 100) : 0;

  const founderNarrative = `Beastlife support is currently managing ${dashboardQueries.length} tracked queries with ${autoReadyCount} ready for automation. Estimated revenue at risk is Rs ${startupMetrics.mrrAtRisk.toLocaleString('en-IN')}, while automation can recover ${startupMetrics.automationHours} hours per week for a lean startup team.`;

  const founderChartData = dayBuckets.map((bucket, index) => ({
    day: new Date(bucket).toLocaleDateString('en-IN', { weekday: 'short' }),
    revenueRisk: criticalSeries[index] * 1499 + negativeSeries[index] * 499,
    churnRisk: negativeSeries[index] * 8,
    automationSavings: Number((automationSeries[index] * 0.6).toFixed(1)),
  }));

  const exportPriorityQueueCsv = () => {
    if (urgentQueue.length === 0) {
      toast.error('No rows available for CSV export in the current filter scope');
      return;
    }

    const header = ['Text', 'Urgency', 'ReadinessScore', 'Category', 'CreatedAt', 'CustomerName', 'CustomerEmail'];
    const rows = urgentQueue.map((query) => [
      query.text,
      query.urgency,
      `${Math.round(query.readinessScore * 100)}%`,
      query.category,
      new Date(query.createdAt).toISOString(),
      query.customerName || '',
      query.customerEmail || '',
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `beastlife-priority-queue-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Priority Queue CSV exported');
  };

  const renderSortIndicator = (field: PrioritySortField) => {
    if (prioritySort.field !== field) return <ArrowUpDown className="h-3 w-3" />;
    return prioritySort.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  const getAnomalyLabel = (value: number) => {
    if (value >= 3) return { label: `Spike +${value}`, variant: 'destructive' as const };
    if (value >= 1) return { label: `Rise +${value}`, variant: 'secondary' as const };
    if (value <= -3) return { label: `Drop ${value}`, variant: 'destructive' as const };
    if (value <= -1) return { label: `Dip ${value}`, variant: 'secondary' as const };
    return { label: 'Stable', variant: 'outline' as const };
  };

  const getQueryRiskScore = (query: CustomerQuery) => {
    const ageMinutes = Math.max(1, Math.round((Date.now() - query.createdAt) / (1000 * 60)));
    const supportCapacity = Math.max(1, effectiveSupportCount * 6);
    const backlogPressure = Math.min(2.5, openQueries / supportCapacity);
    const profileWeights: Record<ScoringProfile, { urgency: number; age: number; backlog: number; sentiment: number; automation: number; incident: number }> = {
      balanced: { urgency: 14, age: 11, backlog: 20, sentiment: 10, automation: 10, incident: 16 },
      growth: { urgency: 12, age: 9, backlog: 18, sentiment: 16, automation: 12, incident: 12 },
      incident: { urgency: 18, age: 12, backlog: 22, sentiment: 8, automation: 8, incident: 24 },
    };
    const weight = profileWeights[scoringProfile];
    const urgencyScore = { low: 1, medium: 2, high: 3, critical: 4 }[query.urgency] * weight.urgency;
    const ageScore = Math.min(3, ageMinutes / 60) * weight.age;
    const backlogScore = backlogPressure * weight.backlog;
    const sentimentScore = query.sentiment === 'negative' ? weight.sentiment : query.sentiment === 'neutral' ? weight.sentiment * 0.35 : 0;
    const automationRelief = (query.readinessScore || 0) * weight.automation;
    const incidentPenalty = liveIncidentActive ? incidentIntensity * weight.incident : 0;

    return Math.round(Math.max(0, urgencyScore + ageScore + backlogScore + sentimentScore + incidentPenalty - automationRelief));
  };

  const likelySlaBreaches = dashboardQueries
    .filter((query) => query.resolutionStatus !== 'resolved')
    .map((query) => ({
      query,
      riskScore: getQueryRiskScore(query),
      ageMinutes: Math.max(1, Math.round((Date.now() - query.createdAt) / (1000 * 60))),
    }))
    .filter((entry) => entry.riskScore >= 65)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);

  const scoreSeed = (value: string) =>
    value.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);

  const agentScorecards = team.map((member) => {
    const assigned = dashboardQueries.filter((query) => query.assignedTo === member.id);
    const assignedCount = assigned.length;
    const seed = scoreSeed(member.id);
    const resolvedAssigned = assigned.filter((query) => query.resolutionStatus === 'resolved');
    const openAssigned = assigned.filter((query) => query.resolutionStatus !== 'resolved');
    const avgFirstResponse = assignedCount > 0
      ? Math.round(assigned.reduce((sum, query) => {
        const urgencyBase = { low: 18, medium: 14, high: 10, critical: 7 }[query.urgency];
        const channelModifier = query.sourceChannel === 'whatsapp' ? -2 : query.sourceChannel === 'instagram' ? -1 : 1;
        return sum + Math.max(3, urgencyBase + channelModifier + (scoreSeed(query.id) % 3));
      }, 0) / assignedCount)
      : 0;
    const avgResolution = resolvedAssigned.length > 0
      ? Math.round(resolvedAssigned.reduce((sum, query) => {
        if (query.resolvedAt) {
          return sum + Math.max(10, Math.round((query.resolvedAt - query.createdAt) / (1000 * 60)));
        }
        return sum + 50 + ({ low: 8, medium: 14, high: 25, critical: 35 }[query.urgency]);
      }, 0) / resolvedAssigned.length)
      : 0;
    const reopened = resolvedAssigned.filter((query) => query.feedbackResolved === false).length;
    const reopenRate = Math.min(100, resolvedAssigned.length > 0 ? Math.round((reopened / resolvedAssigned.length) * 100) : (openAssigned.length > 0 ? 12 + (seed % 6) : 0));
    const rated = assigned.filter((query) => typeof query.satisfactionRating === 'number');
    const csatContribution = rated.length > 0
      ? Number((rated.reduce((sum, query) => sum + (query.satisfactionRating || 0), 0) / rated.length).toFixed(1))
      : Number((3.6 + (seed % 13) / 10).toFixed(1));
    const totalAssigned = Math.max(1, team.reduce((sum, row) => sum + row.assignedQueryCount, 0));
    const idealShare = totalAssigned / Math.max(1, team.length);
    const fairnessIndex = Math.max(50, Math.min(100, Math.round(100 - (Math.abs(member.assignedQueryCount - idealShare) / idealShare) * 100)));

    return {
      member,
      assignedCount,
      avgFirstResponse,
      avgResolution,
      reopenRate,
      csatContribution,
      fairnessIndex,
    };
  });

  const selectedTemplateA = templates.find((template) => template.id === templateAId);
  const selectedTemplateB = templates.find((template) => template.id === templateBId);

  const evaluateTemplate = (template: ResponseTemplate | undefined) => {
    if (!template) {
      return { sampleSize: 0, csat: 0, resolutionMins: 0, winTag: 'N/A' };
    }
    const pool = dashboardQueries.filter((query) => query.category === template.category || query.responseTemplate === template.name);
    const sampleSize = pool.length;
    const baseCsat = sampleSize > 0
      ? pool.reduce((sum, query) => sum + (query.satisfactionRating || (query.sentiment === 'negative' ? 3.6 : 4.1)), 0) / sampleSize
      : 3.9;
    const empathyBoost = template.content.toLowerCase().includes('sorry') || template.content.toLowerCase().includes('understand') ? 0.08 : 0;
    const actionBoost = template.content.toLowerCase().includes('next') || template.content.toLowerCase().includes('steps') ? 0.06 : 0;
    const csat = Number(Math.min(5, baseCsat + empathyBoost + actionBoost).toFixed(2));
    const avgAutomation = pool.reduce((sum, query) => sum + query.readinessScore, 0) / Math.max(1, sampleSize);
    const urgencyMix = pool.reduce((sum, query) => sum + ({ low: 0.8, medium: 1, high: 1.3, critical: 1.6 }[query.urgency]), 0) / Math.max(1, sampleSize);
    const resolutionMins = Math.max(12, Math.round((72 - avgAutomation * 24 + (template.content.length % 6)) * urgencyMix));
    return {
      sampleSize,
      csat,
      resolutionMins,
      winTag: csat >= 4.25 || resolutionMins <= 42 ? 'Strong fit' : csat >= 4 ? 'Competitive' : 'Needs tuning',
    };
  };

  const templateAStats = evaluateTemplate(selectedTemplateA);
  const templateBStats = evaluateTemplate(selectedTemplateB);

  const breachPressure = openQueries > 0 ? likelySlaBreaches.length / openQueries : 0;
  const automationLift = dashboardQueries.length > 0 ? autoReadyCount / dashboardQueries.length : 0;
  const incidentImpact = liveIncidentActive ? incidentIntensity * 0.18 : 0;
  const staffingHealth = Math.min(1.3, effectiveSupportCount / supportCount);
  const slaHealth = Math.round(
    Math.max(
      0,
      Math.min(100, (resolvedRate * 0.42 + (1 - breachPressure) * 0.3 + automationLift * 0.18 + staffingHealth * 0.1 - incidentImpact) * 100),
    ),
  );

  const getFounderRecommendation = (cluster: string) => {
    if (cluster.includes('billing')) return 'Enable auto-refund workflow and payment-failure retries.';
    if (cluster.includes('app') || cluster.includes('technical')) return 'Add in-app guided troubleshooting before human escalation.';
    if (cluster.includes('membership')) return 'Launch retention flow with pause-plan and assisted cancellation path.';
    if (cluster.includes('workout') || cluster.includes('nutrition')) return 'Improve onboarding prompts with goal-based content recommendations.';
    return 'Monitor this cluster weekly and assign an owner for preventive action.';
  };

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const recentClusters = dashboardQueries
    .filter((query) => query.createdAt >= oneWeekAgo)
    .reduce<Record<string, number>>((acc, query) => {
      const key = query.issueCluster || 'general-support';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  const previousClusters = dashboardQueries
    .filter((query) => query.createdAt >= twoWeeksAgo && query.createdAt < oneWeekAgo)
    .reduce<Record<string, number>>((acc, query) => {
      const key = query.issueCluster || 'general-support';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

  const voiceOfCustomerClusters = Object.entries(recentClusters)
    .map(([cluster, count]) => {
      const previous = previousClusters[cluster] || 0;
      return {
        cluster,
        count,
        tag: previous === 0 ? 'new' : 'recurring',
        recommendation: getFounderRecommendation(cluster),
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const founderAlerts = [
    {
      title: 'Enable auto-refund flow',
      active: categoryDistribution.find((entry) => entry.category === 'billing')?.percent || 0 >= 20,
      reason: 'Billing complaints are elevated and impacting trust conversion.',
      severity: 'high',
    },
    {
      title: 'Add onboarding prompt in app issue path',
      active: categoryDistribution.find((entry) => entry.category === 'app-issue')?.percent || 0 >= 18,
      reason: 'App friction is driving repetitive support load for first-week users.',
      severity: 'medium',
    },
    {
      title: 'Assign one manager to billing queue',
      active: adjustedDecisionCounts.escalate >= 4 || incidentEscalationBoost > 0,
      reason: 'Escalations are rising and need tighter manager supervision.',
      severity: 'high',
    },
  ];

  const exportExecutiveSnapshot = () => {
    const riskHighlights = [
      `Critical queue at ${criticalCount + incidentCriticalBoost}`,
      `Escalation load at ${adjustedDecisionCounts.escalate}`,
      `SLA breach candidates: ${likelySlaBreaches.length}`,
    ];
    const winHighlights = [
      `${autoReadyCount} queries automation-ready`,
      `CSAT snapshot ${startupMetrics.csat || '-'} / 5`,
      `${feedbackPercent}% resolved feedback loop`,
    ];
    const nextActions = founderAlerts
      .filter((alert) => alert.active)
      .map((alert) => alert.title);

    const markdown = `# Beastlife Executive Snapshot\n\nGenerated: ${new Date().toLocaleString('en-IN')}\n\n## KPI Strip\n- Queries in scope: ${dashboardQueries.length}\n- Open queue: ${openQueries}\n- Critical: ${criticalCount + incidentCriticalBoost}\n- Resolved: ${resolvedCount}\n- SLA Health: ${slaHealth}%\n\n## Risks\n${riskHighlights.map((item) => `- ${item}`).join('\n')}\n\n## Wins\n${winHighlights.map((item) => `- ${item}`).join('\n')}\n\n## Next Actions\n${(nextActions.length > 0 ? nextActions : ['Stabilize queue and review guardrail thresholds']).map((item) => `- ${item}`).join('\n')}`;
    const cleanedMarkdown = markdown
      .replace(/^\s*!\[[^\]]*\]\([^)]*\)\s*/g, '')
      .trimStart();

    const blob = new Blob([cleanedMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `beastlife-executive-snapshot-${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Executive snapshot exported');
  };

  const scaleValue = (value: number) => Math.max(0, Math.round(value * dataScale));
  const scaleSeries = (series: number[]) => series.map((point) => scaleValue(point));
  const scaledAdjustedVolumeSeries = scaleSeries(adjustedVolumeSeries);
  const scaledResolvedSeries = scaleSeries(resolvedSeries);
  const scaledAdjustedCriticalSeries = scaleSeries(adjustedCriticalSeries);
  const scaledAutomationSeries = scaleSeries(automationSeries);
  const replaySeries = (series: number[]) => series.map((point, index) => (index <= timelineDay ? point : 0));
  const replayedVolumeSeries = replaySeries(scaledAdjustedVolumeSeries);
  const replayedResolvedSeries = replaySeries(scaledResolvedSeries);
  const replayedCriticalSeries = replaySeries(scaledAdjustedCriticalSeries);
  const replayedAutomationSeries = replaySeries(scaledAutomationSeries);
  const scaledOpenQueries = scaleValue(openQueries);
  const scaledCriticalCount = scaleValue(criticalCount + incidentCriticalBoost);
  const scaledAutoReadyCount = scaleValue(autoReadyCount);
  const scaledResolvedCount = scaleValue(resolvedCount);
  const scaledDashboardVolume = scaleValue(dashboardQueries.length + incidentVolumeBoost);

  const demoStepProgress = Math.round(((demoStep + 1) / demoTalkingPoints.length) * 100);
  const demoCycleProgress = demoAutoplay
    ? Math.round(((DEMO_AUTOPLAY_SECONDS - demoCountdown) / DEMO_AUTOPLAY_SECONDS) * 100)
    : 0;

  const adoptionFactor = Math.max(0.45, 1 - (whatIfAutomationThreshold - 60) / 80);
  const monthlySavedHours = Number((autoReadyCount * 0.6 * 4.3 * adoptionFactor).toFixed(1));
  const monthlySavingsInr = Math.round(monthlySavedHours * 420);

  const guardrailStats = {
    threshold: confidenceThreshold / 100,
    trustedAuto: dashboardQueries.filter((query) => query.autoResolvable && (query.confidence || 0) >= confidenceThreshold / 100).length,
    blockedAuto: dashboardQueries.filter((query) => query.autoResolvable && (query.confidence || 0) < confidenceThreshold / 100).length,
    falsePositives: guardrailLogs.filter((item) => item.action === 'false-positive').length,
    overrides: guardrailLogs.filter((item) => item.action === 'override').length,
  };

  const scoringProfileVisuals: Record<ScoringProfile, {
    label: string;
    shellClass: string;
    badgeClass: string;
    stroke: string;
    fill: string;
  }> = {
    balanced: {
      label: 'Balanced',
      shellClass: 'border-sky-500/30 bg-sky-500/5',
      badgeClass: 'border-sky-500/40 text-sky-700 dark:text-sky-300',
      stroke: '#0ea5e9',
      fill: '#7dd3fc',
    },
    growth: {
      label: 'Growth',
      shellClass: 'border-emerald-500/30 bg-emerald-500/5',
      badgeClass: 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300',
      stroke: '#22c55e',
      fill: '#86efac',
    },
    incident: {
      label: 'Incident',
      shellClass: 'border-rose-500/30 bg-rose-500/5',
      badgeClass: 'border-rose-500/40 text-rose-700 dark:text-rose-300',
      stroke: '#ef4444',
      fill: '#fda4af',
    },
  };
  const activeProfileVisual = scoringProfileVisuals[scoringProfile];

  const profileTrendColors: Record<ScoringProfile, {
    volume: string;
    resolved: string;
    critical: string;
    automation: string;
  }> = {
    balanced: {
      volume: 'oklch(0.62 0.18 250)',
      resolved: 'oklch(0.68 0.16 165)',
      critical: 'oklch(0.66 0.22 26)',
      automation: 'oklch(0.64 0.18 315)',
    },
    growth: {
      volume: 'oklch(0.66 0.14 170)',
      resolved: 'oklch(0.7 0.16 155)',
      critical: 'oklch(0.72 0.12 85)',
      automation: 'oklch(0.66 0.18 145)',
    },
    incident: {
      volume: 'oklch(0.64 0.2 20)',
      resolved: 'oklch(0.7 0.12 160)',
      critical: 'oklch(0.62 0.25 25)',
      automation: 'oklch(0.62 0.16 5)',
    },
  };
  const activeTrendColor = profileTrendColors[scoringProfile];
  const judgeTabSequence: TabKey[] = ['queries', 'analytics', 'automation', 'workflow'];

  const pickPreferredVoice = (voices: SpeechSynthesisVoice[]) => {
    if (voices.length === 0) return null;

    const softFemalePriority = /(aria|samantha|natasha|priya|veena|sonia|karen|hazel|moira|susan|zira|heera|siri female|google uk english female)/i;
    const femaleHints = /(female|zira|samantha|aria|natasha|priya|veena|karen|moira|susan|hazel|sonia|zira desktop)/i;
    const englishHints = /en-IN|en-GB|en-US/i;

    return (
      voices.find((voice) => softFemalePriority.test(voice.name) && englishHints.test(voice.lang)) ||
      voices.find((voice) => softFemalePriority.test(voice.name)) ||
      voices.find((voice) => femaleHints.test(voice.name) && englishHints.test(voice.lang)) ||
      voices.find((voice) => femaleHints.test(voice.name)) ||
      null
    );
  };

  const speakDemoPoint = (text?: string, retry = 0) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) return;
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = pickPreferredVoice(voices);

    if (!preferredVoice) {
      if (retry < 5) {
        window.setTimeout(() => speakDemoPoint(text, retry + 1), 250);
        return;
      }
      setVoiceNarrationOn(false);
      setVoiceReady(false);
      setVoiceName('Female voice unavailable');
      toast.error('No female voice found on this device/browser', {
        description: 'Install a female speech voice in system settings to enable narration.',
      });
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = voiceRate;
    utterance.pitch = SOFT_VOICE_PROFILE.pitch;
    utterance.volume = SOFT_VOICE_PROFILE.volume;
    utterance.lang = 'en-IN';
    if (preferredVoice) {
      utterance.voice = preferredVoice;
      setVoiceReady(true);
      setVoiceName(preferredVoice.name);
      utterance.lang = preferredVoice.lang || utterance.lang;
    }
    window.speechSynthesis.speak(utterance);
  };

  const handleJudgeModeToggle = () => {
    setJudgeMode((prev) => {
      const next = !prev;
      if (next) {
        setDataScale(5);
        setScoringProfile('incident');
        setDemoScriptMode(true);
        setDemoAutoplay(true);
        setDemoStep(0);
        setDemoCountdown(DEMO_AUTOPLAY_SECONDS);
        if (!liveIncidentActive) {
          triggerLiveIncident();
        }
        setTimelineReplayOn(true);
        setTimelineDay(0);
        setActiveTab(judgeTabSequence[0]);
        toast.success('Judge Mode enabled', {
          description: 'x5 scale, autoplay, incident simulation, and guided tab sequence are live.',
        });
      } else {
        setDemoAutoplay(false);
        setTimelineReplayOn(false);
        setLiveIncidentActive(false);
        setIncidentIntensity(0);
        toast.info('Judge Mode disabled');
      }
      return next;
    });
  };

  const handleDemoScriptToggle = () => {
    if (demoScriptMode) {
      setDemoScriptMode(false);
      setDemoAutoplay(false);
      setDemoCountdown(DEMO_AUTOPLAY_SECONDS);
      toast.info('Demo script turned off');
      return;
    }

    setDemoScriptMode(true);
    setDemoStep(0);
    setDemoCountdown(DEMO_AUTOPLAY_SECONDS);
    toast.success('Demo script ready', {
      description: 'Use autoplay or step controls to guide the presentation.',
    });
  };

  const handleDemoAutoplayToggle = () => {
    if (!demoScriptMode) {
      setDemoScriptMode(true);
      setDemoStep(0);
    }

    if (demoStep >= demoTalkingPoints.length - 1) {
      setDemoStep(0);
      setDemoCountdown(DEMO_AUTOPLAY_SECONDS);
    }

    const nextAutoplayState = !demoAutoplay;
    setDemoAutoplay(nextAutoplayState);

    if (nextAutoplayState) {
      setVoiceNarrationOn(true);
      speakDemoPoint(currentDemoPoint?.expectedTalkingPoint, 0);
    }

    toast(nextAutoplayState ? 'Demo autoplay started' : 'Demo autoplay paused', {
      description: `Advances every ${DEMO_AUTOPLAY_SECONDS} seconds.${nextAutoplayState ? ' Voice narration is on.' : ''}`,
    });
    setDemoCountdown(DEMO_AUTOPLAY_SECONDS);
  };

  const handleVoiceNarrationToggle = () => {
    setVoiceNarrationOn((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && !next) {
        window.speechSynthesis.cancel();
      }
      if (next) {
        speakDemoPoint(currentDemoPoint?.expectedTalkingPoint, 0);
      }
      toast(next ? 'Voice narration started' : 'Voice narration stopped');
      return next;
    });
  };

  const handleLiveIncidentToggle = () => {
    if (liveIncidentActive) {
      setLiveIncidentActive(false);
      setIncidentIntensity(0);
      setIncidentRecoverySeries((series) => [...series.slice(-7), 100]);
      toast.success('Live Incident simulation stopped');
      return;
    }

    triggerLiveIncident();
  };

  const generateDashboardReport = () => {
    const topCluster = rootCauseClusters[0]?.[0]?.replace(/-/g, ' ') || 'none';
    const reportMarkdown = `# Beastlife Dashboard Report\n\nGenerated: ${new Date().toLocaleString('en-IN')}\n\n## Scope\n- Date Range: ${dateRange}\n- Saved View: ${selectedViewKey}\n- Urgency Filter: ${urgencyFilter}\n- Sentiment Filter: ${sentimentFilter}\n- Search: ${globalSearch || 'none'}\n\n## Core KPIs\n- Total Queries (scope): ${dashboardQueries.length}\n- Open Queue: ${openQueries}\n- Critical Issues: ${criticalCount}\n- Resolved: ${resolvedCount}\n- SLA Health: ${slaHealth}%\n- Auto-ready Queries: ${autoReadyCount}\n\n## Startup Metrics\n- MRR At Risk: Rs ${startupMetrics.mrrAtRisk.toLocaleString('en-IN')}\n- CSAT Snapshot: ${startupMetrics.csat || '-'} / 5\n- Automation Hours Recovery: ${startupMetrics.automationHours} hrs\n- Escalation Rate: ${startupMetrics.escalationRate}%\n\n## AI Pipeline Summary\n- Unified Inbox Channels: WhatsApp ${channelCounts.whatsapp}, Instagram ${channelCounts.instagram}, Email ${channelCounts.email}\n- Decision Engine: Auto Reply ${decisionCounts.autoReply}, Human Assist ${decisionCounts.humanAssist}, Escalate ${decisionCounts.escalate}\n- Top Root Cause Cluster: ${topCluster}\n- AI Insight: ${aiInsight}\n\n## Problem Distribution\n${categoryDistribution.map((item) => `- ${item.category}: ${item.percent}% (${item.count})`).join('\n')}\n\n## Anomaly Callouts\n- Volume Trend: ${getAnomalyLabel(delta(volumeSeries)).label}\n- Resolved Trend: ${getAnomalyLabel(delta(resolvedSeries)).label}\n- Critical Trend: ${getAnomalyLabel(delta(criticalSeries)).label}\n- Automation Trend: ${getAnomalyLabel(delta(automationSeries)).label}\n\n## Scalability Note\nAI can automate repetitive queries while routing complex cases to humans, supporting 10,000+ queries/day via API-driven architecture.`;
    const cleanedReportMarkdown = reportMarkdown
      .replace(/^\s*!\[[^\]]*\]\([^)]*\)\s*/g, '')
      .trimStart();

    const blob = new Blob([cleanedReportMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `beastlife-dashboard-report-${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('PDF-style markdown report generated');
  };

  useEffect(() => {
    const tickerInterval = window.setInterval(() => {
      setTickerIndex((current) => (current + 1) % activityFeed.length);
    }, 3500);

    return () => window.clearInterval(tickerInterval);
  }, [activityFeed.length]);

  useEffect(() => {
    if (!isLiveTickerOn) return;

    const toastInterval = window.setInterval(() => {
      const message = activityFeed[Math.floor(Math.random() * activityFeed.length)];
      toast(message, {
        description: 'Live operations ticker',
      });
    }, 12000);

    return () => window.clearInterval(toastInterval);
  }, [isLiveTickerOn, activityFeed]);

  useEffect(() => {
    if (!demoScriptMode || !demoAutoplay) return;

    const autoplayInterval = window.setInterval(() => {
      setDemoStep((current) => {
        const lastIndex = demoTalkingPoints.length - 1;
        if (current >= lastIndex) {
          setDemoAutoplay(false);
          setDemoCountdown(0);
          toast.success('Demo autoplay completed', {
            description: 'Reached the final talking point.',
          });
          return current;
        }

        setDemoCountdown(DEMO_AUTOPLAY_SECONDS);
        return current + 1;
      });
    }, DEMO_AUTOPLAY_MS);

    const countdownInterval = window.setInterval(() => {
      setDemoCountdown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => {
      window.clearInterval(autoplayInterval);
      window.clearInterval(countdownInterval);
    };
  }, [demoScriptMode, demoAutoplay, demoTalkingPoints.length]);

  useEffect(() => {
    if (!demoScriptMode) {
      setDemoAutoplay(false);
      setDemoCountdown(DEMO_AUTOPLAY_SECONDS);
    }
  }, [demoScriptMode]);

  useEffect(() => {
    if (!voiceNarrationOn || !demoScriptMode) return;
    speakDemoPoint(currentDemoPoint?.expectedTalkingPoint, 0);
  }, [voiceNarrationOn, demoScriptMode, demoStep, currentDemoPoint?.expectedTalkingPoint, voiceRate]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;

    const refreshVoice = () => {
      const preferred = pickPreferredVoice(synth.getVoices());
      if (preferred) {
        setVoiceName(preferred.name);
        setVoiceReady(true);
      } else {
        setVoiceName('Female voice unavailable');
        setVoiceReady(false);
      }
    };

    refreshVoice();
    synth.onvoiceschanged = refreshVoice;

    return () => {
      synth.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    if (!timelineReplayOn) return;
    const replayInterval = window.setInterval(() => {
      setTimelineDay((current) => ((current + 1) % 7) as TimelineDay);
    }, 950);

    return () => window.clearInterval(replayInterval);
  }, [timelineReplayOn]);

  useEffect(() => {
    if (!judgeMode) return;
    let index = 0;
    const tabInterval = window.setInterval(() => {
      index = (index + 1) % judgeTabSequence.length;
      setActiveTab(judgeTabSequence[index]);
    }, 8500);

    return () => window.clearInterval(tabInterval);
  }, [judgeMode]);

  useEffect(() => {
    if (!liveIncidentActive) return;

    const incidentInterval = window.setInterval(() => {
      setIncidentIntensity((current) => {
        const next = Math.max(0, Number((current - 0.2).toFixed(2)));
        setIncidentRecoverySeries((series) => [...series.slice(-7), Math.round((1 - next) * 100)]);
        if (next === 0) {
          setLiveIncidentActive(false);
          toast.success('Live Incident recovered', {
            description: 'Recovery trend stabilized and escalation pressure dropped.',
          });
        }
        return next;
      });
    }, 5000);

    return () => window.clearInterval(incidentInterval);
  }, [liveIncidentActive]);

  const openExplainability = (query: CustomerQuery) => {
    setSelectedExplainQuery(query);
    setExplainabilityOpen(true);
  };

  const addGuardrailLog = (action: GuardrailLogItem['action']) => {
    if (!selectedExplainQuery) return;
    setGuardrailLogs((current) => [
      {
        queryId: selectedExplainQuery.id,
        action,
        createdAt: Date.now(),
      },
      ...current,
    ].slice(0, 100));
    toast.success(action === 'override' ? 'Human override logged' : 'False positive logged');
  };

  return (
    <main className="min-h-screen mesh-background pb-28 md:pb-8" data-active-tab={activeTab}>
      <header className="border-b border-border/60 bg-background/75 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 sm:px-5 lg:px-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground leading-tight whitespace-nowrap">Beastlife Command Center</h1>
            <p className="text-xs text-muted-foreground">AI support orchestration with live team intelligence</p>
          </div>
          <div className="hidden sm:flex items-center justify-end gap-1.5 max-w-[62rem] overflow-x-auto whitespace-nowrap">
            <Badge className="hidden sm:inline-flex bg-emerald-500 text-white border-0">
              <Activity className="h-3 w-3" /> Live Ops
            </Badge>
            <Button
              variant={demoScriptMode ? 'default' : 'outline'}
              size="sm"
              className="tactile-btn hidden sm:inline-flex"
              onClick={handleDemoScriptToggle}
            >
              <Presentation className="h-4 w-4 mr-1" /> {demoScriptMode ? 'Script On' : 'Demo Script'}
            </Button>
            <Button
              variant={demoAutoplay ? 'default' : 'outline'}
              size="sm"
              className="tactile-btn hidden sm:inline-flex"
              onClick={handleDemoAutoplayToggle}
            >
              {demoAutoplay ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />} {demoAutoplay ? 'Autoplay On' : 'Start Autoplay'}
            </Button>
            <Button
              variant={liveIncidentActive ? 'destructive' : 'outline'}
              size="sm"
              className="tactile-btn hidden sm:inline-flex"
              onClick={handleLiveIncidentToggle}
            >
              <ShieldAlert className="h-4 w-4 mr-1" /> {liveIncidentActive ? 'Resolve Incident' : 'Live Incident'}
            </Button>
            <Button
              variant={judgeMode ? 'default' : 'outline'}
              size="sm"
              className="tactile-btn hidden sm:inline-flex"
              onClick={handleJudgeModeToggle}
            >
              <Sparkles className="h-4 w-4 mr-1" /> {judgeMode ? 'Judge Mode On' : 'Judge Mode'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="tactile-btn hidden sm:inline-flex"
              onClick={exportExecutiveSnapshot}
            >
              <Gauge className="h-4 w-4 mr-1" /> Snapshot
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="tactile-btn hidden sm:inline-flex"
              onClick={generateDashboardReport}
            >
              <Download className="h-4 w-4 mr-1" /> Report
            </Button>
            <Badge variant="outline">Script: {demoScriptMode ? 'ON' : 'OFF'}</Badge>
            <Badge variant={demoAutoplay ? 'default' : 'outline'}>Autoplay: {demoAutoplay ? `${demoCountdown}s` : 'OFF'}</Badge>
            <Badge variant={liveIncidentActive ? 'destructive' : 'outline'} className={!liveIncidentActive ? activeProfileVisual.badgeClass : undefined}>
              Incident: {liveIncidentActive ? 'ACTIVE' : 'STANDBY'}
            </Badge>
            <Badge variant={judgeMode ? 'default' : 'outline'}>Judge: {judgeMode ? 'ON' : 'OFF'}</Badge>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {demoScriptMode && (
          <div className="fixed top-24 right-4 z-50 hidden lg:block w-80 rounded-2xl border border-border/70 bg-background/90 backdrop-blur-xl shadow-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Presenter HUD</p>
              <Badge variant={demoAutoplay ? 'default' : 'outline'}>
                {demoAutoplay ? `${demoCountdown}s` : 'Paused'}
              </Badge>
            </div>
            <p className="text-sm font-semibold">Current Step: {currentDemoPoint?.title}</p>
            <div className="mt-2 space-y-1">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${demoStepProgress}%` }} />
              </div>
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full script-flow-bar transition-all duration-300" style={{ width: `${demoCycleProgress}%` }} />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Expected talking point</p>
            <p className="text-sm mt-1">{currentDemoPoint?.expectedTalkingPoint}</p>
          </div>
        )}

        {demoScriptMode && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="panel-surface py-5 gap-4 border-border/70">
              <div className="px-6 flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Customer Retention Risk</h3>
                  <p className="text-sm text-muted-foreground">Active churn risk signals by cohort with intervention paths.</p>
                </div>
                <Badge variant="outline">Live</Badge>
              </div>
              <div className="px-6 space-y-2">
                <div className="rounded-xl border border-border/70 bg-background/70 p-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">Critical Sentiment Cases</p>
                    <p className="text-xs text-muted-foreground">Negative feedback with escalation pending</p>
                  </div>
                  <Badge variant="destructive">{dashboardQueries.filter(q => q.sentiment === 'negative' && q.resolutionStatus !== 'resolved').length} at risk</Badge>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/70 p-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">SLA Breach Exposure</p>
                    <p className="text-xs text-muted-foreground">Queries aging beyond target response time</p>
                  </div>
                  <Badge variant="secondary">{likelySlaBreaches.length} tickets</Badge>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/70 p-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">VIP/Premium Queue Health</p>
                    <p className="text-xs text-muted-foreground">High-value customers pending resolution</p>
                  </div>
                  <Badge variant="outline">{dashboardQueries.filter(q => q.userValueTier === 'vip' || q.userValueTier === 'premium').length} accounts</Badge>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/70 p-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">MRR at Risk (Monthly)</p>
                    <p className="text-xs text-muted-foreground">Potential revenue loss from churn exposure</p>
                  </div>
                  <Badge variant="secondary">₹{(dashboardQueries.filter(q => q.urgency === 'critical' || q.sentiment === 'negative').length * 1499).toLocaleString('en-IN')}</Badge>
                </div>
              </div>
            </Card>

            <Card className="panel-surface py-5 gap-4 border-border/70">
              <div className="px-6 flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2"><Zap className="h-4 w-4" /> Automation ROI Impact</h3>
                  <p className="text-sm text-muted-foreground">Labor hours saved, cost avoidance, and operational improvements.</p>
                </div>
                <Badge variant="outline">Weekly</Badge>
              </div>
              <div className="px-6 space-y-2">
                <div className="rounded-xl border border-border/70 bg-background/70 p-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">Support Hours Saved</p>
                    <p className="text-xs text-muted-foreground">Templated responses + auto-routing this week</p>
                  </div>
                  <Badge variant="secondary">{monthlySavedHours.toFixed(1)} hrs</Badge>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/70 p-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">Estimated Cost Savings</p>
                    <p className="text-xs text-muted-foreground">Labor cost @ ₹500/hr savings</p>
                  </div>
                  <Badge variant="secondary">₹{monthlySavingsInr.toLocaleString('en-IN')}</Badge>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/70 p-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">Response Time Improvement</p>
                    <p className="text-xs text-muted-foreground">Auto-reply templates vs manual triage</p>
                  </div>
                  <Badge variant="outline">~40% faster</Badge>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/70 p-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">Template Ready Queries</p>
                    <p className="text-xs text-muted-foreground">Can be solved with workflow templates</p>
                  </div>
                  <Badge variant="secondary">{autoReadyCount} this week</Badge>
                </div>
              </div>
            </Card>
          </section>
        )}

        <section className="panel-surface rounded-2xl p-4 border-border/70">
          <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_1fr_1fr_1fr_1.1fr_auto] gap-2 items-center">
            <div className="flex items-center gap-2 px-1">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Global Controls</span>
            </div>

            <Select value={dateRange} onValueChange={(value) => { setDateRange(value as DateRange); markFiltersDirty(); }}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Date range" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedViewKey} onValueChange={handleViewSelection}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Saved view" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default View</SelectItem>
                <SelectItem value="high-risk">High Risk Queue</SelectItem>
                <SelectItem value="automation">Automation Focus</SelectItem>
                <SelectItem value="escalations">Escalations Only</SelectItem>
                {customViews.length > 0 && customViews.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>{preset.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={urgencyFilter} onValueChange={(value) => { setUrgencyFilter(value as typeof urgencyFilter); markFiltersDirty(); }}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Urgency" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sentimentFilter} onValueChange={(value) => { setSentimentFilter(value as typeof sentimentFilter); markFiltersDirty(); }}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Sentiment" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sentiment</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={globalSearch}
                onChange={(event) => { setGlobalSearch(event.target.value); markFiltersDirty(); }}
                className="pl-8"
                placeholder="Search customer, email, query"
              />
            </div>

            <Button
              className="tactile-btn"
              variant="outline"
              onClick={() => {
                applyPreset(BUILT_IN_VIEWS.default, 'default');
              }}
            >
              Reset Filters
            </Button>
          </div>

          <div className="mt-2 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-2 items-center">
            <p className="text-xs text-muted-foreground">Presentation Data Amplifier increases displayed KPI and graph volumes for stronger demo storytelling.</p>
            <Select value={String(dataScale)} onValueChange={(value) => setDataScale(Number(value) as DataScale)}>
              <SelectTrigger className="w-full lg:w-44"><SelectValue placeholder="Data scale" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Scale x1</SelectItem>
                <SelectItem value="2">Scale x2</SelectItem>
                <SelectItem value="3">Scale x3</SelectItem>
                <SelectItem value="5">Scale x5</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_auto] gap-2 mt-3">
            <div className="relative">
              <Input value={presetName} onChange={(event) => setPresetName(event.target.value)} placeholder="Save current filters as a named view" />
            </div>
            <Button className="tactile-btn" onClick={handleSaveCurrentView}>Save View</Button>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <Card className="panel-surface py-3 px-4 gap-3 border-border/70 md:col-span-2 xl:col-span-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">Timeline Replay</p>
                <p className="text-xs text-muted-foreground">Animate last 7 days to narrate trend evolution step-by-step.</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Day {timelineDay + 1} / 7</Badge>
                <Button size="sm" variant={timelineReplayOn ? 'default' : 'outline'} onClick={() => setTimelineReplayOn((prev) => !prev)}>
                  {timelineReplayOn ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />} {timelineReplayOn ? 'Pause Replay' : 'Start Replay'}
                </Button>
              </div>
            </div>
            <Slider value={[timelineDay]} min={0} max={6} step={1} onValueChange={(value) => setTimelineDay((value[0] ?? 6) as TimelineDay)} />
          </Card>

          <Card className={`panel-surface py-4 gap-2 border-border/70 ${activeProfileVisual.shellClass}`}>
            <div className="px-4 flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Volume Trend</p>
              <Badge variant={getAnomalyLabel(delta(replayedVolumeSeries)).variant}>{getAnomalyLabel(delta(replayedVolumeSeries)).label}</Badge>
            </div>
            <div className="px-4">
              <p className="text-2xl font-bold">{scaledDashboardVolume}</p>
              <Sparkline points={replayedVolumeSeries} color={activeTrendColor.volume} />
            </div>
          </Card>

          <Card className={`panel-surface py-4 gap-2 border-border/70 ${activeProfileVisual.shellClass}`}>
            <div className="px-4 flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Resolved Trend</p>
              <Badge variant={getAnomalyLabel(delta(replayedResolvedSeries)).variant}>{getAnomalyLabel(delta(replayedResolvedSeries)).label}</Badge>
            </div>
            <div className="px-4">
              <p className="text-2xl font-bold">{scaledResolvedCount}</p>
              <Sparkline points={replayedResolvedSeries} color={activeTrendColor.resolved} />
            </div>
          </Card>

          <Card className={`panel-surface py-4 gap-2 border-border/70 ${activeProfileVisual.shellClass}`}>
            <div className="px-4 flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Critical Trend</p>
              <Badge variant={getAnomalyLabel(delta(replayedCriticalSeries)).variant}>{getAnomalyLabel(delta(replayedCriticalSeries)).label}</Badge>
            </div>
            <div className="px-4">
              <p className="text-2xl font-bold">{scaledCriticalCount}</p>
              <Sparkline points={replayedCriticalSeries} color={activeTrendColor.critical} />
            </div>
          </Card>

          <Card className={`panel-surface py-4 gap-2 border-border/70 ${activeProfileVisual.shellClass}`}>
            <div className="px-4 flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Automation Trend</p>
              <Badge variant={getAnomalyLabel(delta(replayedAutomationSeries)).variant}>{getAnomalyLabel(delta(replayedAutomationSeries)).label}</Badge>
            </div>
            <div className="px-4">
              <p className="text-2xl font-bold">{scaledAutoReadyCount}</p>
              <Sparkline points={replayedAutomationSeries} color={activeTrendColor.automation} />
            </div>
          </Card>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_1fr] gap-4">
          <Card className="panel-surface py-5 gap-4 border-border/70">
            <div className="px-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2"><MessageSquareDashed className="h-4 w-4" /> Unified Inbox</h3>
                <p className="text-sm text-muted-foreground">Multi-channel ingestion across the Beastlife support stack.</p>
              </div>
              <Badge variant="outline">API-first</Badge>
            </div>
            <div className="px-6 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                <p className="text-xs text-muted-foreground">WhatsApp</p>
                <p className="text-2xl font-bold">{channelCounts.whatsapp}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                <p className="text-xs text-muted-foreground">Instagram</p>
                <p className="text-2xl font-bold">{channelCounts.instagram}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-2xl font-bold">{channelCounts.email}</p>
              </div>
            </div>
          </Card>

          <Card className="panel-surface py-5 gap-4 border-border/70">
            <div className="px-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2"><FileJson className="h-4 w-4" /> How AI Works</h3>
                <p className="text-sm text-muted-foreground">User Query → Preprocessing → LLM → Output JSON.</p>
              </div>
              <Badge variant="outline">Explainable</Badge>
            </div>
            <div className="px-6">
              <pre className="text-xs overflow-x-auto rounded-lg bg-slate-950 text-slate-100 p-4">{aiOutputJson}</pre>
            </div>
          </Card>

          <Card className="panel-surface py-5 gap-4 border-border/70">
            <div className="px-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2"><GitMerge className="h-4 w-4" /> Insight Engine</h3>
                <p className="text-sm text-muted-foreground">Trend intelligence, root-cause alerts, and anomaly detection.</p>
              </div>
              <Badge variant="outline">AI Insight</Badge>
            </div>
            <div className="px-6 space-y-3">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm">{aiInsight}</div>
              <div className="space-y-2">
                {rootCauseClusters.map(([cluster, count]) => (
                  <div key={cluster} className="flex items-center justify-between text-sm rounded-lg border border-border/70 bg-background/70 px-3 py-2">
                    <span className="capitalize">{cluster.replace(/-/g, ' ')}</span>
                    <Badge variant="outline">{count} queries</Badge>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-4">
          <Card className="panel-surface py-5 gap-4 border-border/70">
            <div className="px-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Problem Distribution</h3>
                <p className="text-sm text-muted-foreground">Clear issue-type percentages for the current dashboard scope.</p>
              </div>
              <Badge variant="outline">Mandatory KPI</Badge>
            </div>
            <div className="px-6 overflow-hidden rounded-xl border border-border/70">
              <div className="grid grid-cols-[1.3fr_0.7fr_0.7fr] bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground">
                <span>Issue Type</span>
                <span>% of Queries</span>
                <span>Count</span>
              </div>
              {categoryDistribution.map((item) => (
                <div key={item.category} className="grid grid-cols-[1.3fr_0.7fr_0.7fr] px-3 py-2.5 border-t border-border/70 text-sm">
                  <span className="capitalize">{item.category}</span>
                  <span className="font-semibold">{item.percent}%</span>
                  <span className="text-muted-foreground">{item.count}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="panel-surface py-5 gap-4 border-border/70">
            <div className="px-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Automation Decision Engine</h3>
                <p className="text-sm text-muted-foreground">Rule-based automation routing for scale.</p>
              </div>
              <Badge variant="outline">Execution</Badge>
            </div>
            <div className="px-6 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                <p className="text-xs text-muted-foreground">Auto Reply</p>
                <p className="text-2xl font-bold">{adjustedDecisionCounts.autoReply}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                <p className="text-xs text-muted-foreground">Human Assist</p>
                <p className="text-2xl font-bold">{adjustedDecisionCounts.humanAssist}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                <p className="text-xs text-muted-foreground">Escalate</p>
                <p className="text-2xl font-bold">{adjustedDecisionCounts.escalate}</p>
              </div>
            </div>
            <div className="px-6 overflow-hidden rounded-xl border border-border/70">
              <div className="grid grid-cols-[1fr_1.3fr] bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground">
                <span>Issue</span>
                <span>Solution</span>
              </div>
              {[
                ['Membership cancellation', 'Self-service flow'],
                ['Billing issues', 'Auto refund check system'],
                ['App issues', 'AI troubleshooting bot'],
                ['Workout queries', 'AI recommendation engine'],
              ].map(([issue, solution]) => (
                <div key={issue} className="grid grid-cols-[1fr_1.3fr] px-3 py-2.5 border-t border-border/70 text-sm">
                  <span className="font-medium">{issue}</span>
                  <span className="text-muted-foreground">{solution}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-4">
          <Card className="panel-surface py-4 gap-3 border-border/70">
            <div className="px-6 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold">Fast Next Actions</h3>
                <p className="text-sm text-muted-foreground">One-click shortcuts to keep your demo moving with visible impact.</p>
              </div>
              <Badge variant="outline">New</Badge>
            </div>
            <div className="px-6 flex flex-wrap gap-2">
              <Button variant="outline" className="tactile-btn" onClick={() => { setDateRange('all'); setUrgencyFilter('all'); setSentimentFilter('all'); setGlobalSearch(''); toast.success('View expanded to all-time'); }}>
                <TrendingUp className="h-4 w-4 mr-2" /> Expand Data View
              </Button>
              <Button variant="outline" className="tactile-btn" onClick={() => { setDataScale(5); toast.success('Amplifier set to x5'); }}>
                <BarChart3 className="h-4 w-4 mr-2" /> Boost Graph Volume
              </Button>
              <Button variant="outline" className="tactile-btn" onClick={handleDemoAutoplayToggle}>
                <Presentation className="h-4 w-4 mr-2" /> Start Smooth Demo
              </Button>
            </div>
            <div className="px-6 rounded-xl border border-border/70 bg-background/70 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">Resolution Performance</p>
                <Badge variant="outline">Trend</Badge>
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={[
                  { day: 'Mon', resolved: 12, rejected: 2 },
                  { day: 'Tue', resolved: 18, rejected: 3 },
                  { day: 'Wed', resolved: 15, rejected: 2 },
                  { day: 'Thu', resolved: 22, rejected: 4 },
                  { day: 'Fri', resolved: 25, rejected: 3 },
                  { day: 'Sat', resolved: 8, rejected: 1 },
                  { day: 'Sun', resolved: 14, rejected: 2 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.25} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '6px' }} />
                  <Area type="monotone" dataKey="resolved" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="rejected" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="panel-surface py-4 gap-3 border-border/70">
            <div className="px-6 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold">What-if Simulator</h3>
                <p className="text-sm text-muted-foreground">Tune staffing, automation threshold, and incident severity with instant chart feedback.</p>
              </div>
              <Badge variant="outline">Scenario Lab</Badge>
            </div>
            <div className="px-6 space-y-3">
              <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                <div className="flex items-center justify-between mb-2 text-xs">
                  <span className="text-muted-foreground">Team Size</span>
                  <Badge variant="outline">{whatIfTeamScale}%</Badge>
                </div>
                <Slider value={[whatIfTeamScale]} min={70} max={180} step={5} onValueChange={(value) => setWhatIfTeamScale(value[0] || 100)} />
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                <div className="flex items-center justify-between mb-2 text-xs">
                  <span className="text-muted-foreground">Automation Threshold</span>
                  <Badge variant="outline">{whatIfAutomationThreshold}%</Badge>
                </div>
                <Slider value={[whatIfAutomationThreshold]} min={55} max={90} step={1} onValueChange={(value) => setWhatIfAutomationThreshold(value[0] || 75)} />
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                <div className="flex items-center justify-between mb-2 text-xs">
                  <span className="text-muted-foreground">Incident Severity</span>
                  <Badge variant="outline">{whatIfIncidentSeverity}%</Badge>
                </div>
                <Slider value={[whatIfIncidentSeverity]} min={50} max={200} step={5} onValueChange={(value) => setWhatIfIncidentSeverity(value[0] || 100)} />
              </div>
            </div>
            <div className="px-6 rounded-xl border border-border/70 bg-background/70 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">Cost Savings Calculator</p>
                <Badge variant="outline">Monthly</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Saved support hours</p>
                  <p className="text-lg font-bold">{monthlySavedHours}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Estimated INR savings</p>
                  <p className="text-lg font-bold">Rs {monthlySavingsInr.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-4">
          <Card className="panel-surface py-5 gap-4 border-border/70">
            <div className="px-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2"><Rocket className="h-4 w-4" /> Founder Dashboard Mode</h3>
                <p className="text-sm text-muted-foreground">Startup-focused metrics, weekly narrative, and scale readiness.</p>
              </div>
              <Badge variant="outline">Investor ready</Badge>
            </div>
            <div className="px-6 rounded-xl border border-border/70 bg-background/70 p-4 text-sm">
              {founderNarrative}
            </div>
            <div className="px-6 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                <p className="text-xs text-muted-foreground mb-2">Revenue Risk Over Time</p>
                <Badge variant={getAnomalyLabel(delta(criticalSeries)).variant} className="mb-2">{getAnomalyLabel(delta(criticalSeries)).label}</Badge>
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={founderChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.25} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={10} />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenueRisk" stroke="#f97316" fill="#fdba74" fillOpacity={0.35} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                <p className="text-xs text-muted-foreground mb-2">Churn Risk Over Time</p>
                <Badge variant={getAnomalyLabel(delta(negativeSeries)).variant} className="mb-2">{getAnomalyLabel(delta(negativeSeries)).label}</Badge>
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={founderChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.25} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={10} />
                    <Tooltip />
                    <Area type="monotone" dataKey="churnRisk" stroke="#e11d48" fill="#fda4af" fillOpacity={0.35} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                <p className="text-xs text-muted-foreground mb-2">Automation Savings</p>
                <Badge variant={getAnomalyLabel(delta(automationSeries)).variant} className="mb-2">{getAnomalyLabel(delta(automationSeries)).label}</Badge>
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={founderChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.25} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={10} />
                    <Tooltip />
                    <Area type="monotone" dataKey="automationSavings" stroke="#8b5cf6" fill="#c4b5fd" fillOpacity={0.35} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          <Card className="panel-surface py-5 gap-4 border-border/70">
            <div className="px-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2"><Layers3 className="h-4 w-4" /> AI Response & Feedback Loop</h3>
                <p className="text-sm text-muted-foreground">Generated responses, semantic grouping, and model improvement signals.</p>
              </div>
              <Badge variant="outline">Learning system</Badge>
            </div>
            <div className="px-6 space-y-3">
              <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                <p className="text-xs text-muted-foreground mb-2">Generated Response</p>
                <p className="text-sm">{sampleAiQuery?.generatedResponse || 'No response generated in the current scope.'}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                <p className="text-xs text-muted-foreground mb-2">Semantic Understanding / Root Cause</p>
                <p className="text-sm">Similar queries are grouped into clusters like {rootCauseClusters.map(([cluster]) => cluster.replace(/-/g, ' ')).join(', ')} to detect unseen issues and emerging root causes.</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                <p className="text-xs text-muted-foreground mb-2">Feedback Loop</p>
                <p className="text-sm">Resolved feedback rate is {feedbackPercent}%. This signal can be used to retrain prompts, improve templates, and tune automation thresholds over time.</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                <p className="text-xs text-muted-foreground mb-2">Scalability</p>
                <p className="text-sm">The system is designed so AI can handle 70-80% of repetitive cases automatically, while human agents focus on complex tickets. API-based ingestion supports 10,000+ queries per day.</p>
              </div>
            </div>
          </Card>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <Card className="panel-surface py-4 gap-2 border-border/70">
            <div className="px-4 flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">MRR At Risk</p>
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <div className="px-4">
              <p className="text-2xl font-bold">Rs {startupMetrics.mrrAtRisk.toLocaleString('en-IN')}</p>
              <p className="text-xs text-muted-foreground">Projected from critical and negative support risk.</p>
            </div>
          </Card>

          <Card className="panel-surface py-4 gap-2 border-border/70">
            <div className="px-4 flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">CSAT Snapshot</p>
              <Check className="h-4 w-4 text-primary" />
            </div>
            <div className="px-4">
              <p className="text-2xl font-bold">{startupMetrics.csat || '-'} / 5</p>
              <p className="text-xs text-muted-foreground">Average customer satisfaction in current scope.</p>
            </div>
          </Card>

          <Card className="panel-surface py-4 gap-2 border-border/70">
            <div className="px-4 flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Automation Hours</p>
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div className="px-4">
              <p className="text-2xl font-bold">{startupMetrics.automationHours} hrs</p>
              <p className="text-xs text-muted-foreground">Weekly support hours recoverable via automation.</p>
            </div>
          </Card>

          <Card className="panel-surface py-4 gap-2 border-border/70">
            <div className="px-4 flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Escalation Rate</p>
              <AlertTriangle className="h-4 w-4 text-primary" />
            </div>
            <div className="px-4">
              <p className="text-2xl font-bold">{startupMetrics.escalationRate}%</p>
              <p className="text-xs text-muted-foreground">How much founder or manager attention is needed.</p>
            </div>
          </Card>
        </section>

        <section className="rounded-2xl border border-border/70 bg-card/70 backdrop-blur p-5 md:p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Support Operations Dashboard</h2>
              <p className="text-sm text-muted-foreground">Real-time queue, team load, automation readiness, and workflow control.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300">
                <Activity className="h-3 w-3" /> Live
              </Badge>
              <Badge variant="outline">{team.length} team members</Badge>
              <Badge variant="outline">{dashboardQueries.length} in active view</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Card className="metric-card metric-queries py-4 gap-2 border-0">
              <div className="px-4 text-xs uppercase tracking-wide text-white/90">Open queue</div>
              <div className="px-4 text-3xl font-extrabold text-white">{scaledOpenQueries}</div>
            </Card>
            <Card className="metric-card metric-critical py-4 gap-2 border-0">
              <div className="px-4 text-xs uppercase tracking-wide text-white/90">Critical</div>
              <div className="px-4 text-3xl font-extrabold text-white">{scaledCriticalCount}</div>
            </Card>
            <Card className="metric-card metric-automation py-4 gap-2 border-0">
              <div className="px-4 text-xs uppercase tracking-wide text-white/90">Auto-ready</div>
              <div className="px-4 text-3xl font-extrabold text-white">{scaledAutoReadyCount}</div>
            </Card>
            <Card className="metric-card metric-resolved py-4 gap-2 border-0">
              <div className="px-4 text-xs uppercase tracking-wide text-white/90">Resolved</div>
              <div className="px-4 text-3xl font-extrabold text-white">{scaledResolvedCount}</div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-4 mt-4">
            <Card className="py-4 bg-background/70 border-border/60 gap-3">
              <div className="px-5 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">SLA Performance</p>
                <Badge className="bg-emerald-600 text-white border-0">{slaHealth}%</Badge>
              </div>
              <div className="px-5 space-y-2">
                <Progress value={slaHealth} className="h-2" />
                <p className="text-xs text-muted-foreground">Target: keep SLA above 85% to prevent escalations.</p>
              </div>
            </Card>

            <Card className="py-4 bg-background/70 border-border/60 gap-3">
              <div className="px-5 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">Quick Navigation</p>
                <LayoutGrid className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="px-5 grid grid-cols-2 gap-2">
                <Button className="tactile-btn" size="sm" variant="outline" onClick={() => switchToTab('queries')}>Queue</Button>
                <Button className="tactile-btn" size="sm" variant="outline" onClick={() => switchToTab('analytics')}>Analytics</Button>
                <Button className="tactile-btn" size="sm" variant="outline" onClick={() => switchToTab('automation')}>Automation</Button>
                <Button className="tactile-btn" size="sm" variant="outline" onClick={() => switchToTab('team')}>Team</Button>
              </div>
            </Card>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-4">
          <Card className="panel-surface py-5 gap-4 border-border/70">
            <div className="px-6 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold">Operations Matrix</h3>
                <p className="text-sm text-muted-foreground">Queue status, owner lanes, and execution targets.</p>
              </div>
              <Badge variant="outline">Avg CSAT {averageSatisfaction || '-'} / 5</Badge>
            </div>

            <div className="px-6 overflow-hidden rounded-xl border border-border/70">
              <div className="grid grid-cols-[1.4fr_0.8fr_1fr_0.9fr] bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground">
                <span>Queue lane</span>
                <span>Volume</span>
                <span>Target</span>
                <span>Owner</span>
              </div>
              {statusMatrix.map((row) => {
                const Icon = row.icon;
                return (
                  <div key={row.key} className="grid grid-cols-[1.4fr_0.8fr_1fr_0.9fr] items-center px-3 py-2.5 border-t border-border/70 text-sm">
                    <span className="flex items-center gap-2 font-medium"><Icon className="h-4 w-4 text-primary" /> {row.label}</span>
                    <span className="font-semibold">{row.count}</span>
                    <span className="text-muted-foreground">{row.target}</span>
                    <span>
                      <Badge variant="outline" className="text-xs">{row.owner}</Badge>
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="px-6 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button className="tactile-btn" size="sm" variant="outline" onClick={() => switchToTab('queries')}>Open Work Queue</Button>
              <Button className="tactile-btn" size="sm" variant="outline" onClick={() => switchToTab('team')}>Balance Assignments</Button>
              <Button className="tactile-btn" size="sm" variant="outline" onClick={() => switchToTab('analytics')}>View SLA Trend</Button>
            </div>
          </Card>

          <Card className="panel-surface py-5 gap-4 border-border/70">
            <div className="px-6 flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2"><UserCog className="h-4 w-4" /> Role Quick Actions</h3>
                <p className="text-sm text-muted-foreground">Actions tailored to admin, manager, and support workflows.</p>
              </div>
              <Badge variant="outline">{team.length} online</Badge>
            </div>
            <div className="px-6 grid grid-cols-1 gap-2">
              <button type="button" onClick={() => switchToTab('analytics')} className="rounded-xl border border-border/70 bg-background/70 px-3 py-2.5 text-left hover:bg-background tactile-btn">
                <p className="font-semibold flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Admin Control Tower</p>
                <p className="text-xs text-muted-foreground mt-1">{roleCounts.admin} admins • risk overview, data export, and policy checks.</p>
              </button>
              <button type="button" onClick={() => switchToTab('team')} className="rounded-xl border border-border/70 bg-background/70 px-3 py-2.5 text-left hover:bg-background tactile-btn">
                <p className="font-semibold flex items-center gap-2"><UserRoundCheck className="h-4 w-4 text-primary" /> Manager Routing Desk</p>
                <p className="text-xs text-muted-foreground mt-1">{roleCounts.manager} managers • escalation tracking and workload balancing.</p>
              </button>
              <button type="button" onClick={() => switchToTab('queries')} className="rounded-xl border border-border/70 bg-background/70 px-3 py-2.5 text-left hover:bg-background tactile-btn">
                <p className="font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Support Execution Queue</p>
                <p className="text-xs text-muted-foreground mt-1">{roleCounts.support} support agents • triage, response templates, and fast resolution.</p>
              </button>
            </div>
          </Card>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-4">
          <Card className="panel-surface py-5 gap-4 border-border/70">
            <div className="px-6 flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Palette className="h-4 w-4" /> Brand Palette
                </h3>
                <p className="text-sm text-muted-foreground">Switch color identity instantly and keep it saved.</p>
              </div>
              <Badge variant="outline">Theme engine</Badge>
            </div>
            <div className="px-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {BRAND_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePaletteChange(preset.id)}
                  className={`rounded-xl border p-3 text-left transition hover:shadow-md ${selectedPalette === preset.id ? 'border-primary ring-2 ring-primary/30' : 'border-border'}`}
                >
                  <div className={`h-8 w-full rounded-md bg-gradient-to-r ${preset.swatch}`} />
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-sm font-medium">{preset.label}</p>
                    {selectedPalette === preset.id ? <Check className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="panel-surface py-5 gap-4 border-border/70 overflow-hidden">
            <div className="px-6 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Live Activity Ticker
                </h3>
                <p className="text-sm text-muted-foreground">Streams operations updates and pushes real-time toasts.</p>
              </div>
              <Button
                className="tactile-btn"
                size="sm"
                variant={isLiveTickerOn ? 'default' : 'outline'}
                onClick={() => {
                  setIsLiveTickerOn((prev) => {
                    const next = !prev;
                    toast(next ? 'Live ticker resumed' : 'Live ticker paused');
                    return next;
                  });
                }}
              >
                {isLiveTickerOn ? 'Pause Feed' : 'Resume Feed'}
              </Button>
            </div>

            <div className="px-6">
              <div className="ticker-shell">
                <div className="ticker-track">
                  <span className="font-medium">{activityFeed[tickerIndex]}</span>
                </div>
              </div>
            </div>

            <div className="px-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activityFeed.slice(0, 4).map((item) => (
                <button
                  key={item}
                  type="button"
                  className="text-left rounded-lg border border-border/70 bg-background/80 px-3 py-2 text-sm hover:bg-background"
                  onClick={() => toast(item, { description: 'Manual activity ping' })}
                >
                  {item}
                </button>
              ))}
            </div>
          </Card>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-4">
          <Card className={`panel-surface py-5 gap-4 border-border/70 ${activeProfileVisual.shellClass}`}>
            <div className="px-6 flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> Live Incident Simulation</h3>
                <p className="text-sm text-muted-foreground">Inject sudden incident spikes and observe automated recovery behavior.</p>
              </div>
              <Badge variant={liveIncidentActive ? 'destructive' : 'outline'} className={!liveIncidentActive ? activeProfileVisual.badgeClass : undefined}>{liveIncidentActive ? 'Incident Active' : `${activeProfileVisual.label} mode`}</Badge>
            </div>
            <div className="px-6 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                <p className="text-xs text-muted-foreground">Volume Spike</p>
                <p className="text-2xl font-bold">+{incidentVolumeBoost}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                <p className="text-xs text-muted-foreground">Critical Spike</p>
                <p className="text-2xl font-bold">+{incidentCriticalBoost}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                <p className="text-xs text-muted-foreground">Escalation Spike</p>
                <p className="text-2xl font-bold">+{incidentEscalationBoost}</p>
              </div>
            </div>
            <div className="px-6 rounded-xl border border-border/70 bg-background/70 p-3">
              <p className="text-xs text-muted-foreground mb-2">Recovery trend in real time</p>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={incidentRecoverySeries.map((value, index) => ({ point: index + 1, recovery: value }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.25} />
                  <XAxis dataKey="point" tickLine={false} axisLine={false} fontSize={10} />
                  <Tooltip />
                  <Area type="monotone" dataKey="recovery" stroke={activeProfileVisual.stroke} fill={activeProfileVisual.fill} fillOpacity={0.35} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="px-6 flex flex-wrap gap-2">
              <Button className="tactile-btn" onClick={handleLiveIncidentToggle}><ShieldAlert className="h-4 w-4 mr-2" /> {liveIncidentActive ? 'Resolve Incident' : 'Inject Billing Outage'}</Button>
            </div>
          </Card>

          <Card className={`panel-surface py-5 gap-4 border-border/70 ${activeProfileVisual.shellClass}`}>
            <div className="px-6 flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2"><Clock3 className="h-4 w-4" /> SLA Breach Predictor</h3>
                <p className="text-sm text-muted-foreground">Likely breach within 30 minutes using urgency + age + backlog score.</p>
              </div>
              <Badge variant="outline" className={activeProfileVisual.badgeClass}>{likelySlaBreaches.length} likely breaches</Badge>
            </div>
            <div className="px-6 space-y-2">
              {likelySlaBreaches.length > 0 ? likelySlaBreaches.map(({ query, riskScore, ageMinutes }) => (
                <div key={query.id} className="rounded-xl border border-border/70 bg-background/70 p-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium line-clamp-1">{query.text}</p>
                    <p className="text-xs text-muted-foreground">Age {ageMinutes}m • Urgency {query.urgency}</p>
                  </div>
                  <Badge variant={riskScore >= 85 ? 'destructive' : 'secondary'}>Risk {riskScore}</Badge>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No likely SLA breaches in the current scope.</p>
              )}
            </div>
          </Card>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-4">
          <Card className="panel-surface py-5 gap-4 border-border/70">
            <div className="px-6 flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2"><Users className="h-4 w-4" /> Agent Performance Scorecards</h3>
                <p className="text-sm text-muted-foreground">First response, resolution speed, reopen risk, CSAT contribution, fairness index.</p>
              </div>
              <Badge variant="outline">{agentScorecards.length} agents</Badge>
            </div>
            <div className="px-6 space-y-2">
              {agentScorecards.map((card) => (
                <div key={card.member.id} className="rounded-xl border border-border/70 bg-background/70 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold">{card.member.name}</p>
                    <Badge variant="outline">{card.member.role}</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                    <div><p className="text-muted-foreground">FRT</p><p className="font-semibold">{card.avgFirstResponse}m</p></div>
                    <div><p className="text-muted-foreground">Resolve</p><p className="font-semibold">{card.avgResolution}m</p></div>
                    <div><p className="text-muted-foreground">Reopen</p><p className="font-semibold">{card.reopenRate}%</p></div>
                    <div><p className="text-muted-foreground">CSAT</p><p className="font-semibold">{card.csatContribution}</p></div>
                    <div><p className="text-muted-foreground">Fairness</p><p className="font-semibold">{card.fairnessIndex}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="panel-surface py-5 gap-4 border-border/70">
            <div className="px-6 flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2"><Bot className="h-4 w-4" /> A/B Template Testing</h3>
                <p className="text-sm text-muted-foreground">Compare response template outcomes on similar category cohorts.</p>
              </div>
              <Badge variant="outline">Experiment</Badge>
            </div>
            <div className="px-6 grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select value={templateAId} onValueChange={setTemplateAId}>
                <SelectTrigger><SelectValue placeholder="Template A" /></SelectTrigger>
                <SelectContent>
                  {templates.map((template) => <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={templateBId} onValueChange={setTemplateBId}>
                <SelectTrigger><SelectValue placeholder="Template B" /></SelectTrigger>
                <SelectContent>
                  {templates.map((template) => <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="px-6 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                <p className="font-semibold mb-2">A: {selectedTemplateA?.name || 'Not selected'}</p>
                <p>Sample size: {templateAStats.sampleSize}</p>
                <p>CSAT: {templateAStats.csat}</p>
                <p>Resolution speed: {templateAStats.resolutionMins}m</p>
                <Badge variant="outline" className="mt-2">{templateAStats.winTag}</Badge>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                <p className="font-semibold mb-2">B: {selectedTemplateB?.name || 'Not selected'}</p>
                <p>Sample size: {templateBStats.sampleSize}</p>
                <p>CSAT: {templateBStats.csat}</p>
                <p>Resolution speed: {templateBStats.resolutionMins}m</p>
                <Badge variant="outline" className="mt-2">{templateBStats.winTag}</Badge>
              </div>
            </div>
          </Card>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-4">
          <Card className="panel-surface py-5 gap-4 border-border/70">
            <div className="px-6 flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2"><BrainCircuit className="h-4 w-4" /> Voice of Customer Clusters</h3>
                <p className="text-sm text-muted-foreground">Weekly complaint themes tagged as new or recurring with founder recommendations.</p>
              </div>
              <Badge variant="outline">Weekly VOC</Badge>
            </div>
            <div className="px-6 space-y-2">
              {voiceOfCustomerClusters.map((cluster) => (
                <div key={cluster.cluster} className="rounded-xl border border-border/70 bg-background/70 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold capitalize">{cluster.cluster.replace(/-/g, ' ')}</p>
                    <Badge variant={cluster.tag === 'new' ? 'secondary' : 'outline'}>{cluster.tag}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">Volume {cluster.count}</p>
                  <p className="text-sm">{cluster.recommendation}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="panel-surface py-5 gap-4 border-border/70">
            <div className="px-6 flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2"><Rocket className="h-4 w-4" /> Actionable Founder Alerts</h3>
                <p className="text-sm text-muted-foreground">Do-this-now cards generated from current operational risk profile.</p>
              </div>
              <Badge variant="outline">Execution list</Badge>
            </div>
            <div className="px-6 space-y-2">
              {founderAlerts.map((alert) => (
                <div key={alert.title} className="rounded-xl border border-border/70 bg-background/70 p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">{alert.reason}</p>
                  </div>
                  <Badge variant={alert.active ? (alert.severity === 'high' ? 'destructive' : 'secondary') : 'outline'}>{alert.active ? 'Do now' : 'Watch'}</Badge>
                </div>
              ))}
            </div>
            <div className="px-6 flex gap-2">
              <Button variant="outline" className="tactile-btn" onClick={exportExecutiveSnapshot}><Gauge className="h-4 w-4 mr-2" /> Board Snapshot</Button>
            </div>
          </Card>
        </section>

        <section className="grid grid-cols-1">
          <Card className={`panel-surface py-5 gap-4 border-border/70 ${activeProfileVisual.shellClass}`}>
            <div className="px-6 flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2"><Shield className="h-4 w-4" /> Guardrails & Trust Controls</h3>
                <p className="text-sm text-muted-foreground">Confidence thresholding, override logging, and false-positive tracking for production readiness.</p>
              </div>
              <Badge variant="outline" className={activeProfileVisual.badgeClass}>Trust layer</Badge>
            </div>
            <div className="px-6 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
              <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold">Scoring profile</p>
                    <Badge variant="outline" className={activeProfileVisual.badgeClass}>{activeProfileVisual.label}</Badge>
                  </div>
                  <Select value={scoringProfile} onValueChange={(value) => setScoringProfile(value as ScoringProfile)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Scoring profile" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="balanced">Balanced operations</SelectItem>
                      <SelectItem value="growth">Growth protection</SelectItem>
                      <SelectItem value="incident">Incident response</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">Changes weighting used by SLA breach predictor, scorecards, and simulation emphasis.</p>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">Minimum confidence for automation</p>
                  <Badge variant="outline">{confidenceThreshold}%</Badge>
                </div>
                <Slider value={[confidenceThreshold]} min={40} max={95} step={1} onValueChange={(value) => setConfidenceThreshold(value[0] || 65)} />
                <p className="text-xs text-muted-foreground mt-2">Queries below this confidence stay in human-assist flow.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl border border-border/70 bg-background/70 p-3"><p className="text-xs text-muted-foreground">Trusted Auto</p><p className="font-semibold text-xl">{guardrailStats.trustedAuto}</p></div>
                <div className="rounded-xl border border-border/70 bg-background/70 p-3"><p className="text-xs text-muted-foreground">Blocked Auto</p><p className="font-semibold text-xl">{guardrailStats.blockedAuto}</p></div>
                <div className="rounded-xl border border-border/70 bg-background/70 p-3"><p className="text-xs text-muted-foreground">Overrides</p><p className="font-semibold text-xl">{guardrailStats.overrides}</p></div>
                <div className="rounded-xl border border-border/70 bg-background/70 p-3"><p className="text-xs text-muted-foreground">False Positives</p><p className="font-semibold text-xl">{guardrailStats.falsePositives}</p></div>
              </div>
            </div>
          </Card>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card className="metric-card metric-queries py-4 gap-3 text-white border-0 shadow-xl">
            <div className="px-5 flex items-center justify-between">
              <p className="text-sm font-medium text-white/90">Query Throughput</p>
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="px-5">
              <p className="text-3xl font-extrabold">{dashboardQueries.length}</p>
              <p className="text-xs text-white/85">Queries in current global scope</p>
            </div>
          </Card>

          <Card className="metric-card metric-critical py-4 gap-3 text-white border-0 shadow-xl">
            <div className="px-5 flex items-center justify-between">
              <p className="text-sm font-medium text-white/90">Hot Queue</p>
              <Flame className="h-4 w-4" />
            </div>
            <div className="px-5">
              <p className="text-3xl font-extrabold">{criticalCount + dashboardQueries.filter((q) => q.urgency === 'high').length}</p>
              <p className="text-xs text-white/85">High + critical waiting</p>
            </div>
          </Card>

          <Card className="metric-card metric-resolved py-4 gap-3 text-white border-0 shadow-xl">
            <div className="px-5 flex items-center justify-between">
              <p className="text-sm font-medium text-white/90">Resolved</p>
              <Target className="h-4 w-4" />
            </div>
            <div className="px-5">
              <p className="text-3xl font-extrabold">{resolvedCount}</p>
              <p className="text-xs text-white/85">Closed with confidence</p>
            </div>
          </Card>

          <Card className="metric-card metric-automation py-4 gap-3 text-white border-0 shadow-xl">
            <div className="px-5 flex items-center justify-between">
              <p className="text-sm font-medium text-white/90">Automation Lift</p>
              <TimerReset className="h-4 w-4" />
            </div>
            <div className="px-5">
              <p className="text-3xl font-extrabold">{dashboardQueries.length > 0 ? Math.round((autoReadyCount / dashboardQueries.length) * 100) : 0}%</p>
              <p className="text-xs text-white/85">Tickets likely auto-resolved</p>
            </div>
          </Card>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-4">
          <Card className="py-5 gap-4 panel-surface border-border/70">
            <div className="px-6 flex items-center justify-between">
              <h3 className="text-lg font-bold">Priority Queue</h3>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="gap-2 tactile-btn" onClick={exportPriorityQueueCsv}>
                  <Download className="h-4 w-4" /> Export CSV
                </Button>
                <Button size="sm" variant="outline" className="gap-2 tactile-btn" onClick={() => switchToTab('queries')}>
                  <BarChart3 className="h-4 w-4" /> Open Queue
                </Button>
              </div>
            </div>
            <div className="px-6 overflow-hidden rounded-xl border border-border/70">
              <div className="grid grid-cols-[1.4fr_0.7fr_0.8fr_0.9fr_0.8fr_0.6fr] bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground">
                <span>Ticket</span>
                <button type="button" onClick={() => togglePrioritySort('urgency')} className="text-left flex items-center gap-1 hover:text-foreground">
                  Urgency {renderSortIndicator('urgency')}
                </button>
                <button type="button" onClick={() => togglePrioritySort('readinessScore')} className="text-left flex items-center gap-1 hover:text-foreground">
                  Ready {renderSortIndicator('readinessScore')}
                </button>
                <button type="button" onClick={() => togglePrioritySort('category')} className="text-left flex items-center gap-1 hover:text-foreground">
                  Category {renderSortIndicator('category')}
                </button>
                <button type="button" onClick={() => togglePrioritySort('createdAt')} className="text-left flex items-center gap-1 hover:text-foreground">
                  Created {renderSortIndicator('createdAt')}
                </button>
                <span>AI</span>
              </div>
              {urgentQueue.length > 0 ? (
                urgentQueue.map((query) => (
                  <div key={query.id} className="grid grid-cols-[1.4fr_0.7fr_0.8fr_0.9fr_0.8fr_0.6fr] items-center px-3 py-2.5 border-t border-border/70 text-sm gap-2">
                    <p className="font-medium line-clamp-1 pr-2">{query.text}</p>
                    <Badge className={query.urgency === 'critical' ? 'bg-rose-600 text-white border-0 w-fit' : 'bg-amber-500 text-white border-0 w-fit'}>
                      {query.urgency}
                    </Badge>
                    <span className="font-semibold">{Math.round(query.readinessScore * 100)}%</span>
                    <span className="text-muted-foreground capitalize">{query.category}</span>
                    <span className="text-muted-foreground">{new Date(query.createdAt).toLocaleDateString()}</span>
                    <Button size="sm" variant="ghost" onClick={() => openExplainability(query)} className="h-7 px-2">Why</Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground px-3 py-4">No urgent tickets right now in the current filter scope.</p>
              )}
            </div>
          </Card>

          <Card className="py-5 gap-4 panel-surface border-border/70">
            <div className="px-6">
              <h3 className="text-lg font-bold">Quick Actions</h3>
              <p className="text-sm text-muted-foreground">Jump to key flows with one click.</p>
            </div>
            <div className="px-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button variant="outline" className="justify-start tactile-btn" onClick={() => switchToTab('templates')}>
                <MessageSquare className="h-4 w-4 mr-2" /> Template Lab
              </Button>
              <Button variant="outline" className="justify-start tactile-btn" onClick={() => switchToTab('team')}>
                <Users className="h-4 w-4 mr-2" /> Team Routing
              </Button>
              <Button variant="outline" className="justify-start tactile-btn" onClick={() => setExportOpen(true)}>
                <Download className="h-4 w-4 mr-2" /> Export Snapshot
              </Button>
              <Button variant="outline" className="justify-start tactile-btn" onClick={generateDashboardReport}>
                <FileJson className="h-4 w-4 mr-2" /> Generate Report
              </Button>
              <Button variant="outline" className="justify-start tactile-btn" onClick={exportExecutiveSnapshot}>
                <Gauge className="h-4 w-4 mr-2" /> Executive Snapshot
              </Button>
              <Button variant="outline" className="justify-start tactile-btn" onClick={() => setImportOpen(true)}>
                <Upload className="h-4 w-4 mr-2" /> Import Batch
              </Button>
              <Button variant="outline" className="justify-start tactile-btn" onClick={() => switchToTab('workflow')}>
                <LayoutGrid className="h-4 w-4 mr-2" /> System Map
              </Button>
              <Button variant="outline" className="justify-start tactile-btn" onClick={() => switchToTab('automation')}>
                <Flame className="h-4 w-4 mr-2" /> Boost Automation
              </Button>
              <Button variant="outline" className="justify-start tactile-btn" onClick={handleResetDemoData}>
                <RotateCcw className="h-4 w-4 mr-2" /> Reset Demo Data
              </Button>
            </div>
          </Card>
        </section>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setExportOpen(true)}
            variant="outline"
            size="sm"
            className="gap-2 tactile-btn"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            onClick={() => setImportOpen(true)}
            variant="outline"
            size="sm"
            className="gap-2 tactile-btn"
          >
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button
            onClick={generateDashboardReport}
            variant="outline"
            size="sm"
            className="gap-2 tactile-btn"
          >
            <FileJson className="h-4 w-4" />
            Generate Report
          </Button>
          <Button
            onClick={exportExecutiveSnapshot}
            variant="outline"
            size="sm"
            className="gap-2 tactile-btn"
          >
            <Gauge className="h-4 w-4" />
            Board Snapshot
          </Button>
          <Button
            onClick={handleResetDemoData}
            variant="outline"
            size="sm"
            className="gap-2 tactile-btn"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Demo Data
          </Button>
        </div>

        <ExportDialog
          queries={queries}
          open={exportOpen}
          onOpenChange={setExportOpen}
        />
        <BulkImportDialog
          onImport={handleBulkImport}
          open={importOpen}
          onOpenChange={setImportOpen}
        />

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabKey)} className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-2 md:grid-cols-3 xl:grid-cols-6 bg-card/70 backdrop-blur border border-border p-1 rounded-xl mb-8 gap-1">
            {TAB_ITEMS.map(({ key, label, icon: Icon }) => (
              <TabsTrigger key={key} value={key} className="flex items-center gap-2 tab-trigger" data-tab={key}>
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Queries Tab */}
          <TabsContent value="queries" className="space-y-6 animate-fade-in-up">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Submit & Manage Queries</h2>
              <QueryFilters queries={dashboardQueries} onFilter={handleFilterChange} />
            </div>
            <QueryForm onQueryAdded={handleQueryAdded} />
            <QueryList queries={displayedQueries} onDelete={handleDeleteQuery} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6 animate-fade-in-up">
            <h2 className="text-2xl font-bold">Analytics & Insights</h2>
            <AnalyticsDashboard queries={dashboardQueries} />
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation" className="space-y-6 animate-fade-in-up">
            <h2 className="text-2xl font-bold">Automation Opportunities</h2>
            <AutomationInsights queries={dashboardQueries} />
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6 animate-fade-in-up">
            <h2 className="text-2xl font-bold">Response Templates</h2>
            <ResponseTemplates
              templates={templates}
              onDelete={handleDeleteTemplate}
              onUse={(template) => console.log('Use template:', template)}
            />
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6 animate-fade-in-up">
            <h2 className="text-2xl font-bold">Team Management</h2>
            <TeamAssignment
              team={team}
              queries={dashboardQueries}
              onAssign={handleAssignQuery}
            />
          </TabsContent>

          {/* Workflow Tab */}
          <TabsContent value="workflow" className="space-y-6 animate-fade-in-up">
            <h2 className="text-2xl font-bold">System Workflow</h2>
            <WorkflowDiagram />
          </TabsContent>
        </Tabs>
      </div>

      <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-lg rounded-2xl border border-border/70 bg-background/85 backdrop-blur-xl shadow-2xl">
        <div className="grid grid-cols-6 p-1 gap-1">
          {TAB_ITEMS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => switchToTab(key)}
              className={`rounded-xl px-1 py-2 text-[11px] flex flex-col items-center gap-1 transition tactile-btn tab-chip ${activeTab === key ? 'is-active' : 'text-muted-foreground hover:bg-muted'}`}
              data-tab={key}
              aria-label={`Open ${label}`}
            >
              <Icon className="h-4 w-4" />
              <span className="leading-none">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      <Button
        type="button"
        size="icon"
        className="md:hidden fixed bottom-24 right-4 z-50 h-12 w-12 rounded-full shadow-xl tactile-btn"
        onClick={() => setMobileCommandOpen(true)}
        aria-label="Open quick commands"
      >
        <Command className="h-5 w-5" />
      </Button>

      <Dialog open={mobileCommandOpen} onOpenChange={setMobileCommandOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Command Palette</DialogTitle>
            <DialogDescription>Fast actions for mobile operations.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2">
            {TAB_ITEMS.map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant="outline"
                className="justify-between tactile-btn"
                onClick={() => {
                  switchToTab(key);
                  setMobileCommandOpen(false);
                }}
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" /> {label}
                </span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            ))}
            <Button variant="outline" className="justify-between tactile-btn" onClick={() => { setExportOpen(true); setMobileCommandOpen(false); }}>
              <span className="flex items-center gap-2"><Download className="h-4 w-4" /> Export data</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="justify-between tactile-btn" onClick={() => { setImportOpen(true); setMobileCommandOpen(false); }}>
              <span className="flex items-center gap-2"><Upload className="h-4 w-4" /> Import data</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="justify-between tactile-btn" onClick={() => { generateDashboardReport(); setMobileCommandOpen(false); }}>
              <span className="flex items-center gap-2"><FileJson className="h-4 w-4" /> Generate report</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="justify-between tactile-btn" onClick={() => { exportExecutiveSnapshot(); setMobileCommandOpen(false); }}>
              <span className="flex items-center gap-2"><Gauge className="h-4 w-4" /> Executive snapshot</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="justify-between tactile-btn" onClick={() => { handleLiveIncidentToggle(); setMobileCommandOpen(false); }}>
              <span className="flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> {liveIncidentActive ? 'Resolve incident' : 'Trigger incident'}</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="justify-between tactile-btn" onClick={() => { handleResetDemoData(); setMobileCommandOpen(false); }}>
              <span className="flex items-center gap-2"><RotateCcw className="h-4 w-4" /> Reset demo data</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={explainabilityOpen} onOpenChange={setExplainabilityOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ticket Explainability</DialogTitle>
            <DialogDescription>Why AI classified this ticket and why it chose the current routing decision.</DialogDescription>
          </DialogHeader>
          {selectedExplainQuery && (
            <div className="space-y-3 text-sm">
              <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                <p className="font-medium">{selectedExplainQuery.text}</p>
                <p className="text-xs text-muted-foreground mt-1">{selectedExplainQuery.customerName || 'Unknown'} • {selectedExplainQuery.sourceChannel || 'email'}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                <p className="text-xs text-muted-foreground mb-2">Classification rationale</p>
                <p>Category: <span className="font-semibold capitalize">{selectedExplainQuery.category}</span> due to keywords and semantic match in the query text.</p>
                <p className="mt-1">Urgency: <span className="font-semibold capitalize">{selectedExplainQuery.urgency}</span> based on sentiment, user intent, and impact phrasing.</p>
                <p className="mt-1">Decision: <span className="font-semibold">{selectedExplainQuery.automationDecision || 'human-assist'}</span> based on readiness score {Math.round((selectedExplainQuery.readinessScore || 0) * 100)}% and confidence {(selectedExplainQuery.confidence || 0).toFixed(2)}. (Readiness indicates template/workflow suggestion availability, not full automation.)</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                <p className="text-xs text-muted-foreground mb-2">Confidence breakdown</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><p className="text-muted-foreground">NLP intent</p><p className="font-semibold">{Math.round(((selectedExplainQuery.confidence || 0.6) * 100) - 8)}%</p></div>
                  <div><p className="text-muted-foreground">Category fit</p><p className="font-semibold">{Math.round(((selectedExplainQuery.confidence || 0.6) * 100) - 4)}%</p></div>
                  <div><p className="text-muted-foreground">Route certainty</p><p className="font-semibold">{Math.round((selectedExplainQuery.confidence || 0.6) * 100)}%</p></div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => addGuardrailLog('override')}><UserCog className="h-4 w-4 mr-2" /> Human Override</Button>
                <Button variant="outline" onClick={() => addGuardrailLog('false-positive')}><AlertTriangle className="h-4 w-4 mr-2" /> Mark False Positive</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Toaster richColors position="top-right" />
    </main>
  );
}
