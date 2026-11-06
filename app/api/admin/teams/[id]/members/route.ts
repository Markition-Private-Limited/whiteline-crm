import { adminClient } from '@/lib/supabase/admin'
import { requireAuth, forbidden } from '@/lib/auth/require-role'

function canManageTeams(role: string) {
  return role === 'super_admin' || role === 'admin'
}

type Params = { params: Promise<{ id: string }> }

/**
 * POST /api/admin/teams/[id]/members
 * Body: { user_id: string }
 * Removes user from any prior team, then adds to this one.
 */
export async function POST(request: Request, { params }: Params) {
  const { ctx, error } = await requireAuth(request)
  if (error) return error
  if (!canManageTeams(ctx.role)) return forbidden()

  const { id: teamId } = await params
  const body = await request.json()
  const { user_id } = body as { user_id?: string }

  if (!user_id) return Response.json({ error: 'user_id is required' }, { status: 400 })

  // Remove from any existing team first (enforces single-team constraint)
  const { error: removeErr } = await adminClient
    .from('team_members')
    .delete()
    .eq('user_id', user_id)
    .neq('team_id', teamId)

  if (removeErr) return Response.json({ error: removeErr.message }, { status: 500 })

  const { data, error: insertErr } = await adminClient
    .from('team_members')
    .upsert({ team_id: teamId, user_id }, { onConflict: 'team_id,user_id' })
    .select()
    .single()

  if (insertErr) return Response.json({ error: insertErr.message }, { status: 400 })
  return Response.json(data, { status: 201 })
}

/**
 * DELETE /api/admin/teams/[id]/members
 * Body: { user_id: string }
 */
export async function DELETE(request: Request, { params }: Params) {
  const { ctx, error } = await requireAuth(request)
  if (error) return error
  if (!canManageTeams(ctx.role)) return forbidden()

  const { id: teamId } = await params
  const body = await request.json()
  const { user_id } = body as { user_id?: string }

  if (!user_id) return Response.json({ error: 'user_id is required' }, { status: 400 })

  const { error: dbErr } = await adminClient
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', user_id)

  if (dbErr) return Response.json({ error: dbErr.message }, { status: 400 })
  return new Response(null, { status: 204 })
}
