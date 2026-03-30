import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Prize pool distribution per PRD
const POOL_DISTRIBUTION = {
  '5-match': 0.40,
  '4-match': 0.35,
  '3-match': 0.25,
}

// Subscription prices in paise/rupees
const PLAN_AMOUNTS: Record<string, number> = {
  monthly: 999,
  yearly: 9999 / 12, // monthly equivalent
}

function generateRandomNumbers(): number[] {
  const numbers: number[] = []
  while (numbers.length < 5) {
    const num = Math.floor(Math.random() * 45) + 1
    if (!numbers.includes(num)) numbers.push(num)
  }
  return numbers.sort((a, b) => a - b)
}

async function generateAlgorithmicNumbers(): Promise<number[]> {
  // Weighted by most frequent user scores
  const { data: scores } = await supabaseAdmin
    .from('scores')
    .select('score')

  if (!scores || scores.length === 0) return generateRandomNumbers()

  // Count frequency of each score
  const freq: Record<number, number> = {}
  scores.forEach(s => {
    freq[s.score] = (freq[s.score] || 0) + 1
  })

  // Build weighted pool
  const pool: number[] = []
  Object.entries(freq).forEach(([score, count]) => {
    for (let i = 0; i < count; i++) pool.push(parseInt(score))
  })

  // Pick 5 unique numbers from weighted pool
  const picked: number[] = []
  const shuffled = pool.sort(() => Math.random() - 0.5)

  for (const num of shuffled) {
    if (!picked.includes(num)) picked.push(num)
    if (picked.length === 5) break
  }

  // Fill remaining with random if needed
  while (picked.length < 5) {
    const num = Math.floor(Math.random() * 45) + 1
    if (!picked.includes(num)) picked.push(num)
  }

  return picked.sort((a, b) => a - b)
}

function countMatches(userScores: number[], winningNumbers: number[]): number {
  return userScores.filter(s => winningNumbers.includes(s)).length
}

function getPrizeTier(matches: number): '5-match' | '4-match' | '3-match' | 'none' {
  if (matches >= 5) return '5-match'
  if (matches === 4) return '4-match'
  if (matches === 3) return '3-match'
  return 'none'
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const {
    draw_type = 'random',
    simulate = false,
    draw_month,
    jackpot_carryover = 0,
  } = await request.json()

  // 1. Get all active subscribers
  const { data: subscribers } = await supabaseAdmin
    .from('profiles')
    .select('id, subscription_plan')
    .eq('subscription_status', 'active')

  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json({ error: 'No active subscribers' }, { status: 400 })
  }

  // 2. Calculate total prize pool
  const totalPool = subscribers.reduce((sum, sub) => {
    return sum + (PLAN_AMOUNTS[sub.subscription_plan || 'monthly'] || 999)
  }, 0) + jackpot_carryover

  const pools = {
    '5-match': Math.round(totalPool * POOL_DISTRIBUTION['5-match']),
    '4-match': Math.round(totalPool * POOL_DISTRIBUTION['4-match']),
    '3-match': Math.round(totalPool * POOL_DISTRIBUTION['3-match']),
  }

  // 3. Generate winning numbers
  const winningNumbers = draw_type === 'algorithm'
    ? await generateAlgorithmicNumbers()
    : generateRandomNumbers()

  // 4. Get all scores for active subscribers
  const { data: allScores } = await supabaseAdmin
    .from('scores')
    .select('user_id, score')
    .in('user_id', subscribers.map(s => s.id))

  // 5. Group scores by user
  const userScoreMap: Record<string, number[]> = {}
  allScores?.forEach(s => {
    if (!userScoreMap[s.user_id]) userScoreMap[s.user_id] = []
    userScoreMap[s.user_id].push(s.score)
  })

  // 6. Find winners
  const winners: Array<{
    user_id: string
    matches: number
    tier: string
    prize: number
  }> = []

  const tierWinners: Record<string, string[]> = {
    '5-match': [],
    '4-match': [],
    '3-match': [],
  }

  subscribers.forEach(sub => {
    const scores = userScoreMap[sub.id] || []
    const matches = countMatches(scores, winningNumbers)
    const tier = getPrizeTier(matches)

    if (tier !== 'none') {
      tierWinners[tier].push(sub.id)
    }
  })

  // 7. Calculate prize per winner (split equally in same tier)
  let jackpotRolledOver = false

  Object.entries(tierWinners).forEach(([tier, userIds]) => {
    const poolAmount = pools[tier as keyof typeof pools]

    if (tier === '5-match' && userIds.length === 0) {
      jackpotRolledOver = true
    }

    if (userIds.length > 0) {
      const prizePerWinner = Math.round(poolAmount / userIds.length)
      userIds.forEach(userId => {
        winners.push({
          user_id: userId,
          matches: tier === '5-match' ? 5 : tier === '4-match' ? 4 : 3,
          tier,
          prize: prizePerWinner,
        })
      })
    }
  })

  // 8. If simulation mode, return results without saving
  if (simulate) {
    return NextResponse.json({
      simulated: true,
      winning_numbers: winningNumbers,
      total_pool: totalPool,
      pools,
      winner_count: winners.length,
      winners,
      jackpot_rolled_over: jackpotRolledOver,
      subscriber_count: subscribers.length,
    })
  }

  // 9. Save draw to database
  const { data: draw, error: drawError } = await supabaseAdmin
    .from('draws')
    .insert({
      draw_month: draw_month || new Date().toISOString().slice(0, 7) + '-01',
      draw_type,
      winning_numbers: winningNumbers,
      status: 'published',
      jackpot_amount: pools['5-match'],
      jackpot_rolled_over: jackpotRolledOver,
      total_pool: totalPool,
    })
    .select()
    .single()

  if (drawError) {
    return NextResponse.json({ error: drawError.message }, { status: 500 })
  }

  // 10. Save draw entries for all subscribers
  const entries = subscribers.map(sub => {
    const scores = userScoreMap[sub.id] || []
    const matches = countMatches(scores, winningNumbers)
    const tier = getPrizeTier(matches)
    const winnerEntry = winners.find(w => w.user_id === sub.id)

    return {
      draw_id: draw.id,
      user_id: sub.id,
      matched_numbers: matches,
      prize_tier: tier,
      prize_amount: winnerEntry?.prize || 0,
    }
  })

  await supabaseAdmin.from('draw_entries').insert(entries)

  // 11. Create winner verification records
  const winnerEntries = entries.filter(e => e.prize_tier !== 'none')
  if (winnerEntries.length > 0) {
    const { data: savedEntries } = await supabaseAdmin
      .from('draw_entries')
      .select('id, user_id')
      .eq('draw_id', draw.id)
      .neq('prize_tier', 'none')

    if (savedEntries) {
      await supabaseAdmin.from('winner_verifications').insert(
        savedEntries.map(e => ({
          draw_entry_id: e.id,
          user_id: e.user_id,
          status: 'pending',
          payout_status: 'unpaid',
        }))
      )
    }
  }

  return NextResponse.json({
    success: true,
    draw_id: draw.id,
    winning_numbers: winningNumbers,
    total_pool: totalPool,
    pools,
    winner_count: winners.length,
    jackpot_rolled_over: jackpotRolledOver,
    subscriber_count: subscribers.length,
  })
}