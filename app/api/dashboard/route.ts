import { adminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth/require-role'
import { getTeamMemberIds, getViewerFilter } from '@/lib/auth/team-scope'

/** GET /api/dashboard — returns KPI counts + overdue prospects */
export async function GET(request: Request) {
  const { ctx, error } = await requireAuth(request)
  if (error) return error

  // Build owner filter based on role
  let ownerIds: string[] | null = null
  if (ctx.role === 'bd_executive') {
    ownerIds = [ctx.userId]
  } else if (ctx.role === 'bd_manager') {
    const teamIds = await getTeamMemberIds(ctx.userId)
    ownerIds = [ctx.userId, ...teamIds]
  }

  const now = new Date().toISOString().split('T')[0]

  // ── 1. Total prospects ────────────────────────────────────────────────────
  let totalQ = adminClient
    .from('prospects')
    .select('id', { count: 'exact', head: true })
    .eq('is_archived', false)
  if (ownerIds) totalQ = totalQ.in('owner_id', ownerIds)
  const { count: totalProspects } = await totalQ

  // ── 2. Active proposals ───────────────────────────────────────────────────
  const { count: activeProposals } = await adminClient
    .from('proposals')
    .select('id', { count: 'exact', head: true })
    .not('status', 'in', '("approved","rejected","expired")')

  // ── 3. Scheduled follow-ups (follow_up_date >= today, not archived) ───────
  let fuQ = adminClient
    .from('prospects')
    .select('id', { count: 'exact', head: true })
    .eq('is_archived', false)
    .not('follow_up_date', 'is', null)
    .gte('follow_up_date', now)
  if (ownerIds) fuQ = fuQ.in('owner_id', ownerIds)
  const { count: scheduledFollowUps } = await fuQ

  // ── 4. In Onboarding/Documentation stage ─────────────────────────────────
  const { data: onboardingStage } = await adminClient
    .from('pipeline_stages')
    .select('id')
    .ilike('name', '%onboarding%')
    .limit(1)
    .single()

  let inOnboarding = 0
  if (onboardingStage) {
    let obQ = adminClient
      .from('prospects')
      .select('id', { count: 'exact', head: true })
      .eq('is_archived', false)
      .eq('stage_id', (onboardingStage as { id: string }).id)
    if (ownerIds) obQ = obQ.in('owner_id', ownerIds)
    const { count } = await obQ
    inOnboarding = count ?? 0
  }

  // ── 5. Overdue prospects (follow_up_date < today) ─────────────────────────
  let overdueQ = adminClient
    .from('prospects')
    .select('id, company_name, prospect_code, follow_up_date, pipeline_stages(name)')
    .eq('is_archived', false)
    .not('follow_up_date', 'is', null)
    .lt('follow_up_date', now)
    .order('follow_up_date', { ascending: true })
    .limit(10)
  if (ownerIds) overdueQ = overdueQ.in('owner_id', ownerIds)
  const { data: overdueProspects } = await overdueQ

  return Response.json({
    kpis: {
      total_prospects:      totalProspects     ?? 0,
      active_proposals:     activeProposals    ?? 0,
      scheduled_follow_ups: scheduledFollowUps ?? 0,
      in_onboarding:        inOnboarding,
    },
    overdue: overdueProspects ?? [],
  })
}
