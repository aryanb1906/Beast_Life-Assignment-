'use client';

import { TeamMember, CustomerQuery } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ShieldCheck, Trophy, Users } from 'lucide-react';

interface TeamAssignmentProps {
  team: TeamMember[];
  queries: CustomerQuery[];
  onAssign: (queryId: string, memberId: string) => void;
}

export function TeamAssignment({ team, queries, onAssign }: TeamAssignmentProps) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'manager': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'support': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getAssignedCount = (memberId: string) => {
    return queries.filter(q => q.assignedTo === memberId).length;
  };

  const getEscalations = (memberId: string) => {
    return queries.filter((q) => q.assignedTo === memberId && q.resolutionStatus === 'escalated').length;
  };

  const getSlaBreaches = (memberId: string) => {
    const now = Date.now();
    return queries.filter((q) => q.assignedTo === memberId && q.resolutionStatus !== 'resolved' && now - q.createdAt > 24 * 60 * 60 * 1000).length;
  };

  const rankedTeam = [...team].sort((a, b) => getAssignedCount(b.id) - getAssignedCount(a.id));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5" />
        <h3 className="font-semibold">Support Team</h3>
      </div>

      {team.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No team members configured
        </div>
      ) : (
        rankedTeam.map((member, index) => (
          <Card key={member.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="font-medium">#{index + 1} {member.name}</h4>
                  <span className={`text-xs px-2 py-1 rounded capitalize ${getRoleColor(member.role)}`}>
                    {member.role}
                  </span>
                  {index === 0 && (
                    <Badge className="bg-amber-500 text-white border-0">
                      <Trophy className="h-3 w-3 mr-1" /> Leader
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">{member.email}</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg bg-background border border-border px-3 py-2">
                    <p className="text-muted-foreground">Assigned</p>
                    <p className="text-base font-semibold">{getAssignedCount(member.id)}</p>
                  </div>
                  <div className="rounded-lg bg-background border border-border px-3 py-2">
                    <p className="text-muted-foreground">Escalations</p>
                    <p className="text-base font-semibold">{getEscalations(member.id)}</p>
                  </div>
                  <div className="rounded-lg bg-background border border-border px-3 py-2">
                    <p className="text-muted-foreground">SLA Breach</p>
                    <p className="text-base font-semibold">{getSlaBreaches(member.id)}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {getSlaBreaches(member.id) > 0 ? (
                  <Badge className="bg-red-600 text-white border-0">
                    <AlertTriangle className="h-3 w-3 mr-1" /> SLA Alert
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-600 text-white border-0">
                    <ShieldCheck className="h-3 w-3 mr-1" /> Healthy
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
