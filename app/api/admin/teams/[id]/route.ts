import { adminClient } from '@/lib/supabase/admin'
import { requireAuth, forbidden } from '@/lib/auth/require-role'

function canManageTeams(role: string) {
  return role === 'super_admin' || role === 'admin'
}

type Params = { params: Promise<{ id: string }> }

/** PATCH /api/admin/teams/[id] — update name and/or manager */
export async function PATCH(request: Request, { params }: Params) {
  const { ctx, error } = await requireAuth(request)
  if (error) return error
  if (!canManageTeams(ctx.role)) return forbidden()

  const { id } = await params
  const body = await request.json()
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.name !== undefined) patch.name = String(body.name).trim()
  if (body.manager_id !== undefined) patch.manager_id = body.manager_id

  if (!patch.name && !patch.manager_id) {
    return Response.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const { data, error: dbErr } = await adminClient
    .from('teams')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (dbErr) return Response.json({ error: dbErr.message }, { status: 400 })
  return Response.json(data)
}

/** DELETE /api/admin/teams/[id] — delete a team (cascades members) */
export async function DELETE(request: Request, { params }: Params) {
  const { ctx, error } = await requireAuth(request)
  if (error) return error
  if (!canManageTeams(ctx.role)) return forbidden()

  const { id } = await params

  const { error: dbErr } = await adminClient.from('teams').delete().eq('id', id)
  if (dbErr) return Response.json({ error: dbErr.message }, { status: 400 })
  return new Response(null, { status: 204 })
}
