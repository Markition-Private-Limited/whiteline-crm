import { adminClient } from '@/lib/supabase/admin'
import { requireAuth, forbidden } from '@/lib/auth/require-role'

/** GET /api/prospect-presets — list all active presets */
export async function GET(request: Request) {
  const { error } = await requireAuth(request)
  if (error) return error

  const { data, error: dbErr } = await adminClient
    .from('prospect_presets')
    .select('id, name, service_segment, default_stage, display_order')
    .eq('is_active', true)
    .order('display_order')

  if (dbErr) return Response.json({ error: dbErr.message }, { status: 500 })
  return Response.json(data ?? [])
}

/** POST /api/prospect-presets — create a preset (admin only) */
export async function POST(request: Request) {
  const { ctx, error } = await requireAuth(request)
  if (error) return error
  if (ctx.role !== 'super_admin' && ctx.role !== 'admin') return forbidden()

  const body = await request.json()
  const { name, service_segment, default_stage, display_order } = body
  if (!name?.trim()) return Response.json({ error: 'name is required' }, { status: 400 })

  const { data, error: dbErr } = await adminClient
    .from('prospect_presets')
    .insert({ name: name.trim(), service_segment, default_stage, display_order: display_order ?? 0 })
    .select()
    .single()

  if (dbErr) return Response.json({ error: dbErr.message }, { status: 400 })
  return Response.json(data, { status: 201 })
}
