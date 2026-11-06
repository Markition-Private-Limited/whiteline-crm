import { adminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth/require-role'

export async function GET(request: Request) {
  const { ctx, error } = await requireRole(request, ['super_admin', 'admin', 'bd_manager', 'bd_executive'])
  if (error) return error

  const { data: userList, error: listErr } = await adminClient.auth.admin.listUsers()
  if (listErr) return Response.json({ error: listErr.message }, { status: 500 })

  const { data: userRoles } = await adminClient
    .from('user_roles')
    .select('user_id, app_roles(name)')

  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, full_name')

  const roleByUser: Record<string, string> = {}
  if (userRoles) {
    for (const row of (userRoles as unknown) as Array<{ user_id: string; app_roles: { name: string } | null }>) {
      if (row.app_roles) roleByUser[row.user_id] = row.app_roles.name
    }
  }

  const nameByUser: Record<string, string> = {}
  if (profiles) {
    for (const p of profiles as Array<{ id: string; full_name: string | null }>) {
      if (p.full_name) nameByUser[p.id] = p.full_name
    }
  }

  const users = userList.users.map((u) => {
    const profileName = nameByUser[u.id] ?? null
    const metaName = (u.user_metadata?.full_name as string | undefined) ?? null
    return {
      id: u.id,
      email: u.email ?? '',
      full_name: profileName || metaName || null,
      role: roleByUser[u.id] ?? null,
    }
  })

  // BD Executive can only see themselves
  if (ctx.role === 'bd_executive') {
    return Response.json(users.filter((u) => u.id === ctx.userId))
  }

  return Response.json(users)
}
