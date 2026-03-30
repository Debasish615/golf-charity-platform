import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { plan } = await request.json()

  if (!['monthly', 'yearly'].includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  // Simulate payment processing delay
  await new Promise(resolve => setTimeout(resolve, 1500))

  // Generate a mock subscription ID
  const mockSubscriptionId = `mock_sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Update profile directly (in real app this would come from webhook)
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: 'active',
      subscription_plan: plan,
      stripe_subscription_id: mockSubscriptionId,
    })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to activate subscription' }, { status: 500 })
  }

  return NextResponse.json({ success: true, subscriptionId: mockSubscriptionId })
}