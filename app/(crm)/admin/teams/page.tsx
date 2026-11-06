"use client";

import * as React from "react";
import {
  Plus, Pencil, Trash2, AlertTriangle, Users, Save, X, UserPlus, UserMinus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useSessionProvider } from "@/src/providers/SessionProvider";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────

type UserSummary = { user_id: string; email: string; name: string };

type Team = {
  id: string;
  name: string;
  manager_id: string;
  manager: { email: string; name: string };
  members: UserSummary[];
  created_at: string;
  updated_at: string;
};

type UserOption = { id: string; email: string; role: string | null };

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputCls =
  "h-10 w-full rounded-[14px] border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TeamsPage() {
  const { token, appRole } = useSessionProvider();

  const isAdmin = appRole === "admin" || appRole === "super_admin";

  const [teams, setTeams] = React.useState<Team[]>([]);
  const [allUsers, setAllUsers] = React.useState<UserOption[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Create / Edit team modal
  const [teamModal, setTeamModal] = React.useState<{ mode: "create" | "edit"; team?: Team } | null>(null);
  const [teamForm, setTeamForm] = React.useState({ name: "", manager_id: "" });
  const [teamSaving, setTeamSaving] = React.useState(false);
  const [teamError, setTeamError] = React.useState("");

  // Delete confirm modal
  const [deleteTarget, setDeleteTarget] = React.useState<Team | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // Member management modal
  const [memberModal, setMemberModal] = React.useState<Team | null>(null);
  const [addingMember, setAddingMember] = React.useState(false);
  const [memberError, setMemberError] = React.useState("");
  const [selectedUserId, setSelectedUserId] = React.useState("");

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [teamsData, usersData] = await Promise.all([
        apiGet("/api/admin/teams", token),
        apiGet("/api/users", token),
      ]);
      setTeams((teamsData as Team[]) ?? []);
      setAllUsers((usersData as UserOption[]) ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  }, [token]);

  React.useEffect(() => { if (token) load(); }, [token, load]);

  // ── BD Managers for the manager picker ────────────────────────────────────
  const bdManagers = allUsers.filter((u) => u.role === "BD Manager" || u.role === "bd_manager");

  // ── BD Executives not already in the current modal team ───────────────────
  const availableExecs = React.useMemo(() => {
    if (!memberModal) return [];
    const memberIds = new Set(memberModal.members.map((m) => m.user_id));
    return allUsers.filter(
      (u) =>
        (u.role === "BD Executive" || u.role === "bd_executive") &&
        !memberIds.has(u.id)
    );
  }, [memberModal, allUsers]);

  // ── Team modal handlers ────────────────────────────────────────────────────
  const openCreate = () => {
    setTeamForm({ name: "", manager_id: "" });
    setTeamError("");
    setTeamModal({ mode: "create" });
  };

  const openEdit = (t: Team) => {
    setTeamForm({ name: t.name, manager_id: t.manager_id });
    setTeamError("");
    setTeamModal({ mode: "edit", team: t });
  };

  const handleTeamSave = async () => {
    if (!teamForm.name.trim()) { setTeamError("Team name is required"); return; }
    if (!teamForm.manager_id) { setTeamError("A BD Manager must be selected"); return; }
    setTeamSaving(true);
    setTeamError("");
    try {
      if (teamModal?.mode === "create") {
        await apiPost("/api/admin/teams", token, {
          name: teamForm.name.trim(),
          manager_id: teamForm.manager_id,
        });
      } else if (teamModal?.team) {
        await apiPatch(`/api/admin/teams/${teamModal.team.id}`, token, {
          name: teamForm.name.trim(),
          manager_id: teamForm.manager_id,
        });
      }
      setTeamModal(null);
      await load();
    } catch (e: unknown) {
      setTeamError(e instanceof Error ? e.message : "Save failed");
    }
    setTeamSaving(false);
  };

  // ── Delete handler ─────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDelete(`/api/admin/teams/${deleteTarget.id}`, token);
      setDeleteTarget(null);
      await load();
    } catch { /* ignore */ }
    setDeleting(false);
  };

  // ── Member management handlers ─────────────────────────────────────────────
  const openMemberModal = (t: Team) => {
    setMemberModal(t);
    setSelectedUserId("");
    setMemberError("");
  };

  const handleAddMember = async () => {
    if (!memberModal || !selectedUserId) return;
    setAddingMember(true);
    setMemberError("");
    try {
      await apiPost(`/api/admin/teams/${memberModal.id}/members`, token, {
        user_id: selectedUserId,
      });
      setSelectedUserId("");
      await load();
      // Refresh memberModal with updated data
      setMemberModal((prev) => {
        if (!prev) return null;
        const updated = teams.find((t) => t.id === prev.id);
        return updated ?? prev;
      });
    } catch (e: unknown) {
      setMemberError(e instanceof Error ? e.message : "Failed to add member");
    }
    setAddingMember(false);
  };

  const handleRemoveMember = async (userId: string) => {
    if (!memberModal) return;
    try {
      await apiDelete(`/api/admin/teams/${memberModal.id}/members`, token, { user_id: userId });
      await load();
      setMemberModal((prev) => {
        if (!prev) return null;
        const updated = teams.find((t) => t.id === prev.id);
        return updated ?? prev;
      });
    } catch { /* ignore */ }
  };

  // Keep memberModal in sync after load
  React.useEffect(() => {
    if (memberModal) {
      const updated = teams.find((t) => t.id === memberModal.id);
      if (updated) setMemberModal(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teams]);

  // ── Guard ─────────────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        Administrator access required.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Teams</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create teams, assign a BD Manager, and add BD Executives as members
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> New Team
        </Button>
      </div>

      {/* Team list */}
      {loading ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
      ) : teams.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-border py-12 text-center">
          <Users className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No teams yet</p>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Create First Team
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {teams.map((t) => (
            <div
              key={t.id}
              className="rounded-[16px] border border-border bg-surface p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Managed by:{" "}
                    <span className="text-foreground font-medium">
                      {t.manager.name !== t.manager.email
                        ? `${t.manager.name} (${t.manager.email})`
                        : t.manager.email}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    title="Manage members"
                    onClick={() => openMemberModal(t)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-muted transition"
                  >
                    <UserPlus className="h-4 w-4" />
                  </button>
                  <button
                    title="Edit team"
                    onClick={() => openEdit(t)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-muted transition"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    title="Delete team"
                    onClick={() => setDeleteTarget(t)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:text-danger hover:bg-surface-muted transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Members */}
              {t.members.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {t.members.map((m) => (
                    <span
                      key={m.user_id}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-muted px-3 py-1 text-xs text-foreground"
                    >
                      {m.name !== m.email ? m.name : m.email}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No members yet</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Create / Edit Team Modal ──────────────────────────────────────────── */}
      <Modal
        open={!!teamModal}
        title={teamModal?.mode === "create" ? "New Team" : "Edit Team"}
        onClose={() => setTeamModal(null)}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">
              Team name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={teamForm.name}
              onChange={(e) => setTeamForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Gulf BD Team"
              className={inputCls}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">
              BD Manager <span className="text-danger">*</span>
            </label>
            {bdManagers.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No users with BD Manager role found. Assign the BD Manager role in Employees first.
              </p>
            ) : (
              <select
                value={teamForm.manager_id}
                onChange={(e) => setTeamForm((f) => ({ ...f, manager_id: e.target.value }))}
                className={inputCls}
              >
                <option value="">— select a BD Manager —</option>
                {bdManagers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email}
                  </option>
                ))}
              </select>
            )}
          </div>

          {teamError && (
            <div className="flex items-center gap-2 rounded-[12px] bg-danger/10 px-3 py-2 text-sm text-danger">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {teamError}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setTeamModal(null)}>
              <X className="h-4 w-4" /> Cancel
            </Button>
            <Button onClick={handleTeamSave} disabled={teamSaving}>
              <Save className="h-4 w-4" /> {teamSaving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirm Modal ──────────────────────────────────────────────── */}
      <Modal
        open={!!deleteTarget}
        title="Delete Team"
        onClose={() => setDeleteTarget(null)}
      >
        <div className="space-y-4">
          <p className="text-sm text-foreground">
            Delete <strong>{deleteTarget?.name}</strong>? All team memberships will be removed.
            This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 h-9 rounded-[14px] bg-danger/90 hover:bg-danger px-4 text-sm font-medium text-white transition disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" /> {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Member Management Modal ───────────────────────────────────────────── */}
      <Modal
        open={!!memberModal}
        title={`Members — ${memberModal?.name ?? ""}`}
        onClose={() => setMemberModal(null)}
      >
        <div className="space-y-4">
          {/* Current members */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Current Members
            </p>
            {memberModal?.members && memberModal.members.length > 0 ? (
              <div className="space-y-1.5">
                {memberModal.members.map((m) => (
                  <div
                    key={m.user_id}
                    className="flex items-center justify-between rounded-[12px] border border-border bg-surface-muted px-3 py-2"
                  >
                    <span className="text-sm text-foreground">
                      {m.name !== m.email ? `${m.name} (${m.email})` : m.email}
                    </span>
                    <button
                      title="Remove"
                      onClick={() => handleRemoveMember(m.user_id)}
                      className="text-muted-foreground hover:text-danger transition"
                    >
                      <UserMinus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No members yet.</p>
            )}
          </div>

          {/* Add member */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Add BD Executive
            </p>
            {availableExecs.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                All BD Executives are already on this team (or none exist yet).
              </p>
            ) : (
              <div className="flex gap-2">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className={inputCls + " flex-1"}
                >
                  <option value="">— select a BD Executive —</option>
                  {availableExecs.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.email}
                    </option>
                  ))}
                </select>
                <Button onClick={handleAddMember} disabled={!selectedUserId || addingMember}>
                  {addingMember ? "Adding…" : "Add"}
                </Button>
              </div>
            )}
            {memberError && (
              <div className="flex items-center gap-2 rounded-[12px] bg-danger/10 px-3 py-2 text-sm text-danger">
                <AlertTriangle className="h-4 w-4 shrink-0" /> {memberError}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setMemberModal(null)}>
              <X className="h-4 w-4" /> Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
