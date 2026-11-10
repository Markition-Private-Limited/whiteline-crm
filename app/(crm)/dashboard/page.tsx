"use client";

import * as React from "react";
import Link from "next/link";
import {
  Target, FileText, Calendar, Package, AlertTriangle, ArrowRight, TrendingUp,
} from "lucide-react";
import { useSessionProvider } from "@/src/providers/SessionProvider";
import { apiGet } from "@/lib/api";
import { ProspectListView } from "@/components/prospects/ProspectListView";

type KPIs = {
  total_prospects: number;
  active_proposals: number;
  scheduled_follow_ups: number;
  in_onboarding: number;
};

type OverdueProspect = {
  id: string;
  company_name: string | null;
  prospect_code: string;
  follow_up_date: string;
  pipeline_stages: { name: string } | null;
};

type DashboardData = {
  kpis: KPIs;
  overdue: OverdueProspect[];
};

function KPICard({
  icon: Icon,
  label,
  value,
  color,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  href?: string;
}) {
  const inner = (
    <div className="flex flex-col gap-3 rounded-[20px] border border-border bg-surface p-5 shadow-sm shadow-black/5 hover:shadow-md transition-shadow">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-[12px] ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground leading-none">{value.toLocaleString()}</p>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

function daysSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / 86_400_000);
}

export default function DashboardPage() {
  const { token } = useSessionProvider();
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!token) return;
    apiGet("/api/dashboard", token)
      .then((d) => setData(d as DashboardData))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const kpis = data?.kpis;
  const overdue = data?.overdue ?? [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your sales pipeline at a glance.</p>
      </div>

      {/* KPI cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-[20px] bg-surface-muted" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KPICard
            icon={Target}
            label="Total Prospects"
            value={kpis?.total_prospects ?? 0}
            color="bg-blue-500/10 text-blue-500"
            href="/prospects"
          />
          <KPICard
            icon={FileText}
            label="Active Proposals"
            value={kpis?.active_proposals ?? 0}
            color="bg-violet-500/10 text-violet-500"
          />
          <KPICard
            icon={Calendar}
            label="Scheduled Follow-ups"
            value={kpis?.scheduled_follow_ups ?? 0}
            color="bg-emerald-500/10 text-emerald-500"
          />
          <KPICard
            icon={Package}
            label="In Onboarding"
            value={kpis?.in_onboarding ?? 0}
            color="bg-amber-500/10 text-amber-500"
          />
        </div>
      )}

      {/* Overdue banner */}
      {!loading && overdue.length > 0 && (
        <div className="rounded-[20px] border border-danger/30 bg-danger/5 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 shrink-0 text-danger" />
              <div>
                <p className="font-semibold text-danger">
                  {overdue.length} overdue follow-up{overdue.length !== 1 ? "s" : ""}
                </p>
                <p className="text-sm text-danger/70 mt-0.5">
                  Prospects with a follow-up date that has passed
                </p>
              </div>
            </div>
            <Link
              href="/prospects"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-[10px] border border-danger/30 bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/20 transition"
            >
              Review Actions <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 space-y-2">
            {overdue.slice(0, 5).map((p) => (
              <Link
                key={p.id}
                href={`/prospects/${p.id}`}
                className="flex items-center justify-between gap-3 rounded-[12px] border border-border bg-surface px-4 py-2.5 hover:border-foreground/20 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs text-muted-foreground shrink-0">{p.prospect_code}</span>
                  <span className="font-medium text-sm text-foreground truncate">
                    {p.company_name ?? "—"}
                  </span>
                  {p.pipeline_stages?.name && (
                    <span className="shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {p.pipeline_stages.name}
                    </span>
                  )}
                </div>
                <span className="shrink-0 text-xs font-medium text-danger whitespace-nowrap">
                  {daysSince(p.follow_up_date)}d overdue
                </span>
              </Link>
            ))}
            {overdue.length > 5 && (
              <p className="text-center text-xs text-muted-foreground pt-1">
                +{overdue.length - 5} more overdue
              </p>
            )}
          </div>
        </div>
      )}

      {/* All-clear state */}
      {!loading && overdue.length === 0 && (
        <div className="flex items-center gap-3 rounded-[16px] border border-border bg-surface-muted px-5 py-4">
          <TrendingUp className="h-5 w-5 text-emerald-500" />
          <p className="text-sm text-muted-foreground">No overdue follow-ups. You&apos;re on track.</p>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Prospect list — full filter bar + table/pipeline/team views */}
      <ProspectListView showHeader={false} />
    </div>
  );
}
