import { adminClient } from '@/lib/supabase/admin'
import { requireAuth, forbidden } from '@/lib/auth/require-role'

function canManageTeams(role: string) {
  return role === 'super_admin' || role === 'admin'
}

/** GET /api/admin/teams — list all teams with manager info and member count */
export async function GET(request: Request) {
  const { ctx, error } = await requireAuth(request)
  if (error) return error
  if (!canManageTeams(ctx.role)) return forbidden()

  const { data, error: dbErr } = await adminClient
    .from('teams')
    .select('id, name, manager_id, created_at, updated_at')
    .order('name')

  if (dbErr) return Response.json({ error: dbErr.message }, { status: 500 })

  if (!data || data.length === 0) return Response.json([])

  // Fetch manager emails and member counts in parallel
  const managerIds = [...new Set(data.map((t) => t.manager_id))]
  const teamIds = data.map((t) => t.id)

  const [userListResult, membersResult] = await Promise.all([
    adminClient.auth.admin.listUsers(),
    adminClient.from('team_members').select('team_id, user_id').in('team_id', teamIds),
  ])

  const userById: Record<string, { email: string; name: string }> = {}
  if (userListResult.data) {
    for (const u of userListResult.data.users) {
      userById[u.id] = {
        email: u.email ?? '',
        name: (u.user_metadata?.full_name as string | undefined) ?? u.email ?? u.id,
      }
    }
  }

  const membersByTeam: Record<string, Array<{ user_id: string; email: string; name: string }>> = {}
  for (const id of teamIds) membersByTeam[id] = []
  if (membersResult.data) {
    for (const row of membersResult.data) {
      const u = userById[row.user_id]
      membersByTeam[row.team_id]?.push({
        user_id: row.user_id,
        email: u?.email ?? row.user_id,
        name: u?.name ?? row.user_id,
      })
    }
  }

  const teams = data.map((t) => ({
    ...t,
    manager: userById[t.manager_id] ?? { email: t.manager_id, name: t.manager_id },
    members: membersByTeam[t.id] ?? [],
  }))

  return Response.json(teams)
}

/** POST /api/admin/teams — create a team */
export async function POST(request: Request) {
  const { ctx, error } = await requireAuth(request)
  if (error) return error
  if (!canManageTeams(ctx.role)) return forbidden()

  const body = await request.json()
  const { name, manager_id } = body as { name?: string; manager_id?: string }

  if (!name?.trim()) return Response.json({ error: 'name is required' }, { status: 400 })
  if (!manager_id) return Response.json({ error: 'manager_id is required' }, { status: 400 })

  const { data, error: dbErr } = await adminClient
    .from('teams')
    .insert({ name: name.trim(), manager_id })
    .select()
    .single()

  if (dbErr) return Response.json({ error: dbErr.message }, { status: 400 })
  return Response.json(data, { status: 201 })
}
