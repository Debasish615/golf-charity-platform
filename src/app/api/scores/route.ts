import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET — fetch user's scores
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', user.id)
    .order('played_at', { ascending: false })
    .limit(5)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ scores: data })
}

// POST — add a new score
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { score, played_at } = await request.json()

  // Validate score range
  if (!score || score < 1 || score > 45) {
    return NextResponse.json(
      { error: 'Score must be between 1 and 45' },
      { status: 400 }
    )
  }

  if (!played_at) {
    return NextResponse.json({ error: 'Date is required' }, { status: 400 })
  }

  // Insert — the DB trigger will auto-delete the oldest if >5 exist
  const { data, error } = await supabaseAdmin
    .from('scores')
    .insert({ user_id: user.id, score, played_at })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ score: data })
}