"use client";

import * as React from "react";
import Link from "next/link";
import {
  Target, Plus, Search, Archive, AlertTriangle, X, Trash2,
  Table2, Kanban, BarChart3, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useSessionProvider } from "@/src/providers/SessionProvider";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────

type PipelineStage = {
  id: string; name: string; display_order: number;
  default_probability: number; is_won: boolean; is_lost: boolean; is_active: boolean;
};

type Prospect = {
  id: string; prospect_code: string; company_name: string | null; name: string | null;
  stage_id: string | null; priority: string; estimated_value: number | null; currency: string;
  expected_close_date: string | null; follow_up_date: string | null; follow_up_time: string | null;
  contact_phone: string | null; contact_email: string | null; contact_role: string | null;
  latest_interaction: string | null; next_action: string | null; image_url: string | null;
  owner_id: string | null; lead_gen_user_id: string | null;
  is_archived: boolean; created_at: string;
  pipeline_stages: PipelineStage | null;
  companies: { id: string; name: string } | null;
};

type UserOption = { id: string; email: string; full_name: string | null; role: string | null };
type ServiceCategory = { id: string; name: string };
type DuplicateMatch = { id: string; prospect_code: string; company_name: string };

// ── Constants ─────────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  low:    "bg-surface-muted text-muted-foreground",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  high:   "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const LEAD_SOURCES = [
  "Cold Outreach", "Referral", "Website Inquiry", "LinkedIn",
  "Event/Conference", "Existing Client", "Partner", "Advertisement", "Other",
];
const CURRENCIES = ["USD", "EUR", "GBP", "AED", "SAR", "PKR", "INR"];
const PRIORITIES = ["low", "medium", "high", "urgent"];

const inputCls = "h-10 w-full rounded-[14px] border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none";

// ── User Picker ───────────────────────────────────────────────────────────────

function UserPicker({ value, users, placeholder, onChange }: {
  value: string;
  users: UserOption[];
  placeholder: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const ref = React.useRef<HTMLDivElement>(null);

  const selected = users.find((u) => u.id === value) ?? null;
  const filtered = users.filter((u) => {
    const q = query.toLowerCase();
    return (u.full_name ?? "").toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  React.useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const initials = (u: UserOption) => {
    const name = u.full_name ?? u.email;
    return name.split(/[\s@]/)[0]?.[0]?.toUpperCase() ?? "?";
  };

  return (
    <div ref={ref} className="relative">
      {selected ? (
        <div className="flex items-center justify-between gap-2 rounded-[14px] border border-border bg-background px-3 py-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
              {initials(selected)}
            </div>
            <div className="min-w-0">
              {selected.full_name && <p className="text-sm font-medium text-foreground truncate">{selected.full_name}</p>}
              <p className="text-xs text-muted-foreground truncate">{selected.email}</p>
            </div>
          </div>
          <button type="button" onClick={() => { onChange(""); setQuery(""); }} className="shrink-0 text-muted-foreground hover:text-danger">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className={inputCls}
        />
      )}
      {!selected && open && (
        <div className="absolute z-20 mt-1 w-full rounded-[14px] border border-border bg-surface shadow-xl shadow-black/10">
          <div className="p-1 max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">No users found</p>
            ) : filtered.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => { onChange(u.id); setQuery(""); setOpen(false); }}
                className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2 hover:bg-surface-muted text-left"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
                  {initials(u)}
                </div>
                <div className="min-w-0">
                  {u.full_name && <p className="text-sm font-medium text-foreground truncate">{u.full_name}</p>}
                  <p className={`truncate ${u.full_name ? "text-xs text-muted-foreground" : "text-sm text-foreground"}`}>{u.email}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Service Category Combobox ─────────────────────────────────────────────────

function ServiceCategoryCombobox({ value, categories, canCreate, onChange, onCreate, onDelete }: {
  value: string; categories: ServiceCategory[]; canCreate: boolean;
  onChange: (v: string) => void; onCreate: (n: string) => Promise<void>; onDelete: (id: string) => Promise<void>;
}) {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const ref = React.useRef<HTMLDivElement>(null);
  const filtered = categories.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));
  const exactMatch = categories.some((c) => c.name.toLowerCase() === query.toLowerCase());

  React.useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      {value ? (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-muted px-3 py-1 text-sm text-foreground">
            {value}
            <button type="button" onClick={() => { onChange(""); setQuery(""); }} className="text-muted-foreground hover:text-danger"><X className="h-3 w-3" /></button>
          </span>
        </div>
      ) : (
        <input value={query} onChange={(e) => { setQuery(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder={canCreate ? "Search or type to create…" : "Search categories…"} className={inputCls} />
      )}
      {!value && open && (
        <div className="absolute z-20 mt-1 w-full rounded-[14px] border border-border bg-surface shadow-xl shadow-black/10">
          <div className="p-1">
            {filtered.map((cat) => (
              <div key={cat.id} className="flex items-center gap-1 rounded-[10px] hover:bg-surface-muted">
                <button type="button" onClick={() => { onChange(cat.name); setQuery(""); setOpen(false); }} className="flex-1 px-3 py-2 text-left text-sm text-foreground">{cat.name}</button>
                {canCreate && (
                  <button type="button" disabled={deletingId === cat.id} onClick={async (e) => { e.stopPropagation(); setDeletingId(cat.id); await onDelete(cat.id); setDeletingId(null); }} className="mr-2 shrink-0 rounded p-1 text-muted-foreground hover:text-danger disabled:opacity-40" title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
            {canCreate && query && !exactMatch && (
              <button type="button" onClick={async () => { setCreating(true); await onCreate(query.trim()); onChange(query.trim()); setQuery(""); setCreating(false); setOpen(false); }} disabled={creating} className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-sm text-accent hover:bg-accent/10 disabled:opacity-60">
                <Plus className="h-3.5 w-3.5" />{creating ? "Creating…" : `Create "${query}"`}
              </button>
            )}
            {filtered.length === 0 && !query && <p className="px-3 py-2 text-xs text-muted-foreground">Type a service name…</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Empty prospect form ───────────────────────────────────────────────────────

type FormState = {
  company_name: string; industry: string; country: string; city: string; website: string;
  lead_source: string; name: string; contact_role: string; contact_phone: string; contact_email: string;
  priority: string; service_required: string; stage_id: string;
  estimated_value: string; currency: string; expected_close_date: string;
  follow_up_date: string; follow_up_time: string;
  latest_interaction: string; next_action: string;
  lead_gen_user_id: string; owner_id: string; image_url: string; notes: string;
};

const emptyForm = (): FormState => ({
  company_name: "", industry: "", country: "", city: "", website: "",
  lead_source: "", name: "", contact_role: "", contact_phone: "", contact_email: "",
  priority: "medium", service_required: "", stage_id: "",
  estimated_value: "", currency: "USD",
  expected_close_date: new Date().toISOString().split("T")[0],
  follow_up_date: "", follow_up_time: "",
  latest_interaction: "", next_action: "",
  lead_gen_user_id: "", owner_id: "", image_url: "", notes: "",
});

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// Overdue = the combined date+time moment is strictly in the past.
// No time set → treat as 23:59 (only overdue once the whole day has passed).
function prospectIsOverdue(follow_up_date: string | null, follow_up_time: string | null): boolean {
  if (!follow_up_date) return false;
  // Normalize to HH:MM — DB returns HH:MM:SS; appending :00 to that gives an invalid datetime.
  const time = (follow_up_time || "23:59").slice(0, 5);
  return new Date(`${follow_up_date}T${time}:00`) < new Date();
}

// ── Kanban card ───────────────────────────────────────────────────────────────

function KanbanCard({ p, onDragStart }: { p: Prospect; onDragStart: () => void }) {
  const isOverdue = prospectIsOverdue(p.follow_up_date, p.follow_up_time);
  return (
    <Link href={`/prospects/${p.id}`} draggable onDragStart={(e) => { e.stopPropagation(); onDragStart(); }}>
      <div className="cursor-grab active:cursor-grabbing rounded-[14px] border border-border bg-surface p-3 shadow-sm shadow-black/5 hover:border-foreground/20 transition space-y-2">
        <div className="flex items-start justify-between gap-1">
          <span className="font-semibold text-sm text-foreground leading-snug">{p.company_name ?? "—"}</span>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${PRIORITY_COLORS[p.priority] ?? PRIORITY_COLORS.medium}`}>{p.priority}</span>
        </div>
        {p.name && <p className="text-xs text-muted-foreground truncate">{p.name}{p.contact_role ? ` · ${p.contact_role}` : ""}</p>}
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="font-mono">{p.prospect_code}</span>
          {p.follow_up_date && (
            <span className={`flex items-center gap-0.5 ${isOverdue ? "text-danger" : ""}`}>
              <Calendar className="h-3 w-3" />{new Date(p.follow_up_date + "T00:00:00").toLocaleDateString()}
            </span>
          )}
        </div>
        {p.estimated_value != null && (
          <p className="text-xs font-medium text-foreground">{p.currency} {p.estimated_value.toLocaleString()}</p>
        )}
      </div>
    </Link>
  );
}

// ── ProspectListView ──────────────────────────────────────────────────────────

interface ProspectListViewProps {
  showHeader?: boolean;
}

export function ProspectListView({ showHeader = true }: ProspectListViewProps) {
  "use no memo";
  const { token, appRole } = useSessionProvider();
  const [view, setView] = React.useState<"table" | "kanban" | "team">("table");

  // Data
  const [prospects, setProspects] = React.useState<Prospect[]>([]);
  const [stages, setStages] = React.useState<PipelineStage[]>([]);
  const [categories, setCategories] = React.useState<ServiceCategory[]>([]);
  const [users, setUsers] = React.useState<UserOption[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = React.useState("");
  const [stageFilter, setStageFilter] = React.useState("all");
  const [priorityFilter, setPriorityFilter] = React.useState("all");
  const [ownerFilter, setOwnerFilter] = React.useState("all");
  const [dateFilter, setDateFilter] = React.useState("all");
  const [showArchived, setShowArchived] = React.useState(false);

  // UI state
  const [loading, setLoading] = React.useState(true);
  const [pageError, setPageError] = React.useState<string | null>(null);
  const [showModal, setShowModal] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [formError, setFormError] = React.useState("");
  const [duplicateMatches, setDuplicateMatches] = React.useState<DuplicateMatch[]>([]);
  const [pendingCreate, setPendingCreate] = React.useState<Record<string, unknown> | null>(null);

  // Kanban drag state
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [movingId, setMovingId] = React.useState<string | null>(null);
  const [stageError, setStageError] = React.useState<string | null>(null);

  // Form
  const [form, setForm] = React.useState<FormState>(emptyForm());
  const setField = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const canCreate = appRole === "super_admin" || appRole === "admin" || appRole === "bd_manager" || appRole === "bd_executive";
  const canManage = appRole === "super_admin" || appRole === "admin" || appRole === "bd_manager";

  const today = React.useMemo(() => new Date().toISOString().split("T")[0], []);
  const in3Days = React.useMemo(() => new Date(Date.now() + 3 * 86_400_000).toISOString().split("T")[0], []);

  // ── Load data ────────────────────────────────────────────────────────────
  const load = React.useCallback(() => {
    if (!token) return;
    setLoading(true);
    const qs = new URLSearchParams();
    if (stageFilter !== "all") qs.set("stage_id", stageFilter);
    if (showArchived)          qs.set("archived", "true");
    if (searchQuery)           qs.set("q", searchQuery);
    if (ownerFilter !== "all") qs.set("owner_id", ownerFilter);

    Promise.all([
      apiGet(`/api/prospects?${qs}`, token),
      apiGet("/api/pipeline-stages", token).catch(() => []),
    ])
      .then(([pros, stgs]) => {
        let list = pros as Prospect[];
        if (priorityFilter !== "all") list = list.filter((p) => p.priority === priorityFilter);
        setProspects(list);
        setStages((stgs as PipelineStage[]).filter((s) => s.is_active));
      })
      .catch((e) => setPageError(e.message))
      .finally(() => setLoading(false));
  }, [token, stageFilter, showArchived, searchQuery, ownerFilter, priorityFilter]);

  React.useEffect(() => { load(); }, [load]);

  React.useEffect(() => {
    if (!token) return;
    Promise.all([
      apiGet("/api/service-categories", token).catch(() => []),
      apiGet("/api/users", token).catch(() => []),
    ]).then(([cats, us]) => {
      setCategories(cats as ServiceCategory[]);
      setUsers(us as UserOption[]);
    });
  }, [token]);

  // ── Build POST payload ────────────────────────────────────────────────────
  const buildPayload = (skip = false): Record<string, unknown> => ({
    company_name:        form.company_name.trim(),
    industry:            form.industry     || undefined,
    country:             form.country      || undefined,
    city:                form.city         || undefined,
    website:             form.website      || undefined,
    lead_source:         form.lead_source  || undefined,
    name:                form.name         || undefined,
    contact_role:        form.contact_role || undefined,
    contact_phone:       form.contact_phone || undefined,
    contact_email:       form.contact_email || undefined,
    priority:            form.priority,
    service_required:    form.service_required || undefined,
    stage_id:            form.stage_id     || undefined,
    estimated_value:     form.estimated_value ? Number(form.estimated_value) : undefined,
    currency:            form.currency,
    expected_close_date: form.expected_close_date || undefined,
    follow_up_date:      form.follow_up_date || undefined,
    follow_up_time:      form.follow_up_time || undefined,
    latest_interaction:  form.latest_interaction || undefined,
    next_action:         form.next_action   || undefined,
    lead_gen_user_id:    form.lead_gen_user_id || undefined,
    owner_id:            form.owner_id || undefined,
    image_url:           form.image_url    || undefined,
    notes:               form.notes        || undefined,
    skip_duplicate_check: skip,
  });

  const handleCreate = async (skip = false) => {
    if (!token || !form.company_name.trim()) return;
    setCreating(true);
    setFormError("");
    try {
      const created = await apiPost("/api/prospects", token, buildPayload(skip));
      setProspects((prev) => [created as Prospect, ...prev]);
      setShowModal(false);
      setDuplicateMatches([]);
      setPendingCreate(null);
      setForm(emptyForm());
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create";
      try {
        const parsed = JSON.parse(msg);
        if (parsed.duplicate_warning) { setDuplicateMatches(parsed.matches); setPendingCreate(buildPayload()); return; }
      } catch { /* not JSON */ }
      setFormError(msg);
    } finally { setCreating(false); }
  };

  const handleForceCreate = async () => {
    if (!token || !pendingCreate) return;
    setCreating(true);
    try {
      const created = await apiPost("/api/prospects", token, { ...pendingCreate, skip_duplicate_check: true });
      setProspects((prev) => [created as Prospect, ...prev]);
      setShowModal(false); setDuplicateMatches([]); setPendingCreate(null); setForm(emptyForm());
    } catch (e: unknown) { setFormError(e instanceof Error ? e.message : "Failed"); }
    finally { setCreating(false); }
  };

  // ── Category handlers ─────────────────────────────────────────────────────
  const handleCreateCategory = async (name: string) => {
    if (!token) return;
    try { const c = await apiPost("/api/service-categories", token, { name }); setCategories((prev) => [...prev, c as ServiceCategory]); } catch { /* ignore */ }
  };
  const handleDeleteCategory = async (id: string) => {
    if (!token) return;
    try { await apiDelete(`/api/service-categories/${id}`, token); setCategories((prev) => prev.filter((c) => c.id !== id)); } catch { /* ignore */ }
  };

  // ── Kanban drag drop ──────────────────────────────────────────────────────
  const handleDrop = async (stageId: string) => {
    if (!draggingId || !token) return;
    const p = prospects.find((x) => x.id === draggingId);
    if (!p || p.stage_id === stageId) { setDraggingId(null); return; }
    const targetStage = stages.find((s) => s.id === stageId);
    if (targetStage?.is_won) { setStageError("Cannot drag to Won — use the prospect detail page to set close_date and final_amount."); setDraggingId(null); return; }
    if (targetStage?.is_lost) { setStageError("Cannot drag to Lost — use the prospect detail page to provide a loss_reason."); setDraggingId(null); return; }
    setMovingId(draggingId);
    try {
      const updated = await apiPatch(`/api/prospects/${draggingId}`, token, { stage_id: stageId });
      setProspects((prev) => prev.map((x) => x.id === draggingId ? { ...x, ...(updated as Partial<Prospect>), pipeline_stages: targetStage ?? x.pipeline_stages } : x));
    } catch (e: unknown) { setStageError(e instanceof Error ? e.message : "Stage update failed"); }
    finally { setMovingId(null); setDraggingId(null); }
  };

  // ── Filtered prospects ────────────────────────────────────────────────────
  const filtered = React.useMemo(() => {
    let list = prospects;
    if (priorityFilter !== "all") list = list.filter((p) => p.priority === priorityFilter);
    if (dateFilter === "overdue")   list = list.filter((p) => prospectIsOverdue(p.follow_up_date, p.follow_up_time));
    if (dateFilter === "today")     list = list.filter((p) => p.follow_up_date === today);
    if (dateFilter === "soon")      list = list.filter((p) => p.follow_up_date && p.follow_up_date >= today && p.follow_up_date <= in3Days);
    if (dateFilter === "has_date")  list = list.filter((p) => !!p.follow_up_date);
    return list;
  }, [prospects, priorityFilter, dateFilter, today, in3Days]);

  // ── BD Executives/Managers for team view ─────────────────────────────────
  const bdUsers = users.filter((u) => {
    const r = (u.role ?? "").toLowerCase();
    return r === "bd executive" || r === "bd_executive" || r === "bd manager" || r === "bd_manager";
  });

  const teamStats = React.useMemo(() => {
    return bdUsers.map((u) => {
      const mine = prospects.filter((p) => p.owner_id === u.id);
      const withFollowUp = mine.filter((p) => p.follow_up_date && !prospectIsOverdue(p.follow_up_date, p.follow_up_time));
      const overdue = mine.filter((p) => prospectIsOverdue(p.follow_up_date, p.follow_up_time));
      return { user: u, total: mine.length, followUps: withFollowUp.length, overdue: overdue.length };
    });
  }, [bdUsers, prospects]);

  const openModal = () => { setForm(emptyForm()); setFormError(""); setShowModal(true); };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header — shown on the standalone Prospects page */}
      {showHeader && (
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Prospects</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage your sales pipeline.</p>
          </div>
          {canCreate && (
            <Button onClick={openModal}>
              <Plus className="h-4 w-4" /> New Prospect
            </Button>
          )}
        </div>
      )}

      {/* Filters + view toggle */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search company…" className="h-9 w-52 rounded-[14px] border border-border bg-background pl-9 pr-3 text-sm focus:border-accent focus:outline-none" />
        </div>

        {/* Stage filter */}
        <Select
          value={stageFilter}
          onChange={setStageFilter}
          className="w-36"
          options={[
            { value: "all", label: "All Stages" },
            ...stages.map((s) => ({ value: s.id, label: s.name })),
          ]}
        />

        {/* Priority filter */}
        <Select
          value={priorityFilter}
          onChange={setPriorityFilter}
          className="w-36"
          options={[
            { value: "all", label: "All Priorities" },
            ...PRIORITIES.map((p) => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) })),
          ]}
        />

        {/* Date filter */}
        <Select
          value={dateFilter}
          onChange={setDateFilter}
          className="w-44"
          options={[
            { value: "all",      label: "All Dates" },
            { value: "overdue",  label: "Overdue Follow-ups" },
            { value: "today",    label: "Due Today" },
            { value: "soon",     label: "Soon (next 3 days)" },
            { value: "has_date", label: "Has Follow-up Date" },
          ]}
        />

        {/* Team member filter (managers/admins only) */}
        {canManage && (
          <Select
            value={ownerFilter}
            onChange={setOwnerFilter}
            className="w-44"
            options={[
              { value: "all", label: "All BD Members" },
              ...users
                .filter((u) => { const r = (u.role ?? "").toLowerCase(); return r.includes("bd"); })
                .map((u) => ({ value: u.id, label: u.email })),
            ]}
          />
        )}

        {/* Archived toggle */}
        <button onClick={() => setShowArchived((v) => !v)} className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${showArchived ? "border-foreground bg-surface-muted text-foreground" : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"}`}>
          <Archive className="h-3.5 w-3.5" />{showArchived ? "Archived" : "Show archived"}
        </button>

        {/* New Prospect button — inline when no page header */}
        {!showHeader && canCreate && (
          <Button onClick={openModal} className="ml-auto">
            <Plus className="h-4 w-4" /> New Prospect
          </Button>
        )}

        {/* View toggle */}
        <div className={`${showHeader ? "ml-auto" : ""} flex items-center rounded-[14px] border border-border bg-background p-1 gap-0.5`}>
          {(["table", "kanban", "team"] as const).map((v) => {
            const Icon = v === "table" ? Table2 : v === "kanban" ? Kanban : BarChart3;
            const label = v === "table" ? "Table" : v === "kanban" ? "Pipeline" : "Team";
            return (
              <button key={v} onClick={() => setView(v)} title={label} className={`flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-xs font-medium transition ${view === v ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
                <Icon className="h-3.5 w-3.5" />{label}
              </button>
            );
          })}
        </div>
      </div>

      {pageError && <p className="rounded-[14px] bg-danger/10 px-4 py-3 text-sm text-danger">{pageError}</p>}
      {stageError && (
        <div className="flex items-center justify-between gap-3 rounded-[14px] border border-yellow-300/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-400">
          <span>{stageError}</span>
          <button onClick={() => setStageError(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* ── TABLE VIEW ────────────────────────────────────────────────────── */}
      {view === "table" && (
        loading ? (
          <div className="space-y-2">{[1,2,3,4,5,6].map((i) => <div key={i} className="h-14 animate-pulse rounded-[14px] bg-surface-muted" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-border py-16 text-center">
            <Target className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium text-foreground">No prospects found</p>
            {canCreate && <Button onClick={openModal}><Plus className="h-4 w-4" /> New Prospect</Button>}
          </div>
        ) : (
          <div className="rounded-[20px] border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Stage</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Follow-up</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden xl:table-cell">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => {
                  const isWon  = p.pipeline_stages?.is_won;
                  const isLost = p.pipeline_stages?.is_lost;
                  const isOverdue = prospectIsOverdue(p.follow_up_date, p.follow_up_time);
                  return (
                    <tr key={p.id} className="bg-surface hover:bg-surface-muted transition">
                      <td className="px-4 py-3">
                        <Link href={`/prospects/${p.id}`} className="group flex items-center gap-3">
                          {p.image_url && <img src={p.image_url} alt="" className="h-8 w-8 rounded-[8px] object-cover shrink-0 border border-border" />}
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground group-hover:text-accent truncate">{p.company_name ?? "—"}</p>
                            <p className="text-xs text-muted-foreground font-mono">{p.prospect_code}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${isWon ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : isLost ? "bg-surface-muted text-muted-foreground" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"}`}>
                          {p.pipeline_stages?.name ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PRIORITY_COLORS[p.priority] ?? PRIORITY_COLORS.medium}`}>{p.priority}</span>
                      </td>
                      <td className={`px-4 py-3 text-xs hidden lg:table-cell ${isOverdue ? "text-danger font-medium" : "text-muted-foreground"}`}>
                        {p.follow_up_date ? new Date(p.follow_up_date + "T00:00:00").toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground font-medium hidden xl:table-cell">
                        {p.estimated_value != null ? `${p.currency} ${p.estimated_value.toLocaleString()}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ── KANBAN VIEW ───────────────────────────────────────────────────── */}
      {view === "kanban" && (
        loading ? (
          <div className="flex gap-4 overflow-x-auto pb-4">{stages.slice(0,4).map((s) => <div key={s.id} className="h-64 w-64 shrink-0 animate-pulse rounded-[20px] bg-surface-muted" />)}</div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
            {stages.map((stage) => {
              const cards = filtered.filter((p) => p.stage_id === stage.id);
              return (
                <div
                  key={stage.id}
                  className="flex shrink-0 flex-col w-64 rounded-[20px] border border-border bg-surface-muted"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(stage.id)}
                >
                  <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
                    <span className="font-semibold text-sm text-foreground truncate">{stage.name}</span>
                    <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-xs text-muted-foreground border border-border">{cards.length}</span>
                  </div>
                  <div className="flex flex-col gap-2 px-2 pb-3 overflow-y-auto max-h-[calc(100vh-280px)]">
                    {cards.map((p) => (
                      <div key={p.id} className={movingId === p.id ? "opacity-40" : ""}>
                        <KanbanCard p={p} onDragStart={() => setDraggingId(p.id)} />
                      </div>
                    ))}
                    {cards.length === 0 && (
                      <p className="py-4 text-center text-xs text-muted-foreground/60">Empty</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── TEAM PERFORMANCE VIEW ─────────────────────────────────────────── */}
      {view === "team" && (
        loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map((i) => <div key={i} className="h-40 animate-pulse rounded-[20px] bg-surface-muted" />)}</div>
        ) : teamStats.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-border py-16 text-center">
            <BarChart3 className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium text-foreground">No BD team members found</p>
            <p className="text-sm text-muted-foreground">Assign BD Manager / BD Executive roles in Employees first.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teamStats.map(({ user, total, followUps, overdue }) => {
              const r = (user.role ?? "").toLowerCase();
              const isMgr = r.includes("manager");
              return (
                <div key={user.id} className="rounded-[20px] border border-border bg-surface p-5 space-y-4 shadow-sm shadow-black/5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{user.email}</p>
                      <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${isMgr ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"}`}>
                        {user.role ?? "—"}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-[12px] bg-surface-muted p-2">
                      <p className="text-lg font-bold text-foreground leading-none">{total}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Assigned</p>
                    </div>
                    <div className="rounded-[12px] bg-surface-muted p-2">
                      <p className="text-lg font-bold text-foreground leading-none">{followUps}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Follow-ups</p>
                    </div>
                    <div className={`rounded-[12px] p-2 ${overdue > 0 ? "bg-danger/10" : "bg-surface-muted"}`}>
                      <p className={`text-lg font-bold leading-none ${overdue > 0 ? "text-danger" : "text-foreground"}`}>{overdue}</p>
                      <p className={`text-[10px] mt-1 ${overdue > 0 ? "text-danger/70" : "text-muted-foreground"}`}>Overdue</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Duplicate warning ─────────────────────────────────────────────── */}
      {duplicateMatches.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-[24px] border border-border bg-surface p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-foreground">Possible duplicates found</p>
                <ul className="mt-3 space-y-1.5">
                  {duplicateMatches.map((m) => (
                    <li key={m.id} className="flex items-center gap-2 text-sm">
                      <span className="font-mono text-xs text-muted-foreground">{m.prospect_code}</span>
                      <Link href={`/prospects/${m.id}`} target="_blank" className="text-accent hover:underline">{m.company_name}</Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex gap-2 justify-end">
                  <Button variant="secondary" onClick={() => { setDuplicateMatches([]); setPendingCreate(null); }}>Go back</Button>
                  <Button onClick={handleForceCreate} disabled={creating}>{creating ? "Creating…" : "Proceed anyway"}</Button>
                </div>
              </div>
              <button onClick={() => { setDuplicateMatches([]); setPendingCreate(null); }}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
          </div>
        </div>
      )}

      {/* ── New Prospect Modal ────────────────────────────────────────────── */}
      <Modal open={showModal} title="New Prospect" size="lg" onClose={() => { setShowModal(false); setForm(emptyForm()); }}>
        <div className="max-h-[80vh] overflow-y-auto space-y-4 pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

          {/* Company Name */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Company Name <span className="text-danger">*</span></label>
            <input value={form.company_name} onChange={(e) => setField("company_name", e.target.value)} placeholder="Acme Corp" className={inputCls} />
          </div>

          {/* Contact Person + Role side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Contact Person</label>
              <input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Jane Smith" className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Contact Role</label>
              <input value={form.contact_role} onChange={(e) => setField("contact_role", e.target.value)} placeholder="CEO / Procurement Manager" className={inputCls} />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Phone</label>
            <input value={form.contact_phone} onChange={(e) => setField("contact_phone", e.target.value)} placeholder="+971 50 000 0000" className={inputCls} />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Email</label>
            <input type="email" value={form.contact_email} onChange={(e) => setField("contact_email", e.target.value)} placeholder="contact@company.com" className={inputCls} />
          </div>

          {/* Service / Segment */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Service / Segment</label>
            <ServiceCategoryCombobox
              value={form.service_required}
              categories={categories}
              canCreate={canManage}
              onChange={(v) => setField("service_required", v)}
              onCreate={handleCreateCategory}
              onDelete={handleDeleteCategory}
            />
          </div>

          {/* Pipeline Status */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Pipeline Status</label>
            <select value={form.stage_id} onChange={(e) => setField("stage_id", e.target.value)} className={inputCls}>
              <option value="">— Default ({stages[0]?.name ?? "first stage"}) —</option>
              {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Priority */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Priority</label>
            <select value={form.priority} onChange={(e) => setField("priority", e.target.value)} className={inputCls}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>

          {/* Lead Generation Person */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Lead Generation Person</label>
            <UserPicker
              value={form.lead_gen_user_id}
              users={users.filter((u) => { const r = (u.role ?? "").toLowerCase(); return r === "lead generation" || r === "lead_generation"; })}
              placeholder="Search by name or email…"
              onChange={(id) => setField("lead_gen_user_id", id)}
            />
          </div>

          {/* Assigned BD Executive */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Assigned BD Executive</label>
            <UserPicker
              value={form.owner_id}
              users={users.filter((u) => { const r = (u.role ?? "").toLowerCase(); return r === "bd_executive" || r === "bd executive"; })}
              placeholder="Search by name or email…"
              onChange={(id) => setField("owner_id", id)}
            />
          </div>

          {/* Lead Entry Date */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Lead Entry Date</label>
            <input type="date" value={form.expected_close_date} onChange={(e) => setField("expected_close_date", e.target.value)} className={inputCls} />
          </div>

          {/* Follow-up Date */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Follow-up Date</label>
            <input type="date" value={form.follow_up_date} onChange={(e) => setField("follow_up_date", e.target.value)} className={inputCls} />
            <div className="flex gap-1.5 mt-1.5">
              {[3, 7, 14].map((d) => (
                <button key={d} type="button" onClick={() => setField("follow_up_date", addDays(d))}
                  className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground hover:text-accent hover:border-accent transition">
                  +{d}d
                </button>
              ))}
            </div>
          </div>

          {/* Follow-up Time */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Follow-up Time</label>
            <input type="time" value={form.follow_up_time} onChange={(e) => setField("follow_up_time", e.target.value)} className={inputCls} />
          </div>

          {/* Latest Interaction & Notes */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Latest Interaction & Notes</label>
            <textarea value={form.latest_interaction} onChange={(e) => setField("latest_interaction", e.target.value)} placeholder="What happened in the last meeting/call…" rows={3} className="w-full rounded-[14px] border border-border bg-background px-3 py-2 text-sm resize-none focus:border-accent focus:outline-none" />
          </div>

          {/* Next Action Required */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Next Action Required</label>
            <textarea value={form.next_action} onChange={(e) => setField("next_action", e.target.value)} placeholder="Send proposal, schedule demo…" rows={2} className="w-full rounded-[14px] border border-border bg-background px-3 py-2 text-sm resize-none focus:border-accent focus:outline-none" />
          </div>

          {/* Image Attachment */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Image Attachment</label>
            <div className="flex gap-2 items-center">
              <input type="url" value={form.image_url} onChange={(e) => setField("image_url", e.target.value)} placeholder="https://… paste URL (visiting card, logo…)" className={inputCls + " flex-1"} />
              {form.image_url && <img src={form.image_url} alt="" className="h-10 w-10 rounded-[10px] border border-border object-cover shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
            </div>
          </div>

          {/* Est. Value + Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Est. Value</label>
              <input type="number" value={form.estimated_value} onChange={(e) => setField("estimated_value", e.target.value)} placeholder="0.00" className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Currency</label>
              <select value={form.currency} onChange={(e) => setField("currency", e.target.value)} className={inputCls}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Lead Source */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Lead Source</label>
            <select value={form.lead_source} onChange={(e) => setField("lead_source", e.target.value)} className={inputCls}>
              <option value="">— Select —</option>
              {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Remarks / Notes */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Remarks / Notes</label>
            <textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="Additional context…" rows={2} className="w-full rounded-[14px] border border-border bg-background px-3 py-2 text-sm resize-none focus:border-accent focus:outline-none" />
          </div>

          {formError && (
            <div className="flex items-center gap-2 rounded-[12px] bg-danger/10 px-3 py-2 text-sm text-danger">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {formError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setShowModal(false); setForm(emptyForm()); }}>Cancel</Button>
            <Button onClick={() => handleCreate(false)} disabled={creating || !form.company_name.trim()}>
              {creating ? "Creating…" : "Create Prospect"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
