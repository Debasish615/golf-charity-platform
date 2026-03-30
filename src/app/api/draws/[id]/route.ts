import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: draw } = await supabase
    .from('draws')
    .select('*')
    .eq('id', params.id)
    .single()

  const { data: myEntry } = await supabase
    .from('draw_entries')
    .select('*')
    .eq('draw_id', params.id)
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ draw, myEntry })
}