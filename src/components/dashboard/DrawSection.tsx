'use client'

import { useState, useEffect } from 'react'

interface Draw {
  id: string
  draw_month: string
  winning_numbers: number[]
  status: string
  total_pool: number
  jackpot_amount: number
  jackpot_rolled_over: boolean
}

interface DrawEntry {
  matched_numbers: number
  prize_tier: string
  prize_amount: number
}

export default function DrawSection() {
  const [draws, setDraws] = useState<Draw[]>([])
  const [entries, setEntries] = useState<Record<string, DrawEntry>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDraws()
  }, [])

  const fetchDraws = async () => {
    setLoading(true)
    const res = await fetch('/api/draws')
    const data = await res.json()
    const drawList: Draw[] = data.draws || []
    setDraws(drawList)

    // Fetch my entry for each draw
    const entryMap: Record<string, DrawEntry> = {}
    await Promise.all(
      drawList.map(async (draw) => {
        const res = await fetch(`/api/draws/${draw.id}`)
        const data = await res.json()
        if (data.myEntry) entryMap[draw.id] = data.myEntry
      })
    )
    setEntries(entryMap)
    setLoading(false)
  }

  if (loading) return (
    <div style={styles.wrap}>
      <p style={styles.empty}>Loading draws...</p>
    </div>
  )

  if (draws.length === 0) return (
    <div style={styles.wrap}>
      <h2 style={styles.title}>Monthly draws</h2>
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>🎯</div>
        <p style={styles.emptyText}>No draws yet. The first draw will appear here once published by admin.</p>
      </div>
    </div>
  )

  return (
    <div style={styles.wrap}>
      <h2 style={styles.title}>Monthly draws</h2>
      <div style={styles.drawList}>
        {draws.map(draw => {
          const entry = entries[draw.id]
          const isWinner = entry && entry.prize_tier !== 'none'

          return (
            <div key={draw.id} style={{
              ...styles.drawCard,
              ...(isWinner ? styles.drawCardWinner : {}),
            }}>
              {/* Draw header */}
              <div style={styles.drawHeader}>
                <div>
                  <div style={styles.drawMonth}>
                    {new Date(draw.draw_month).toLocaleDateString('en-GB', {
                      month: 'long', year: 'numeric'
                    })}
                  </div>
                  <div style={styles.drawPool}>
                    Prize pool: ₹{draw.total_pool.toLocaleString()}
                  </div>
                </div>
                <div style={{
                  ...styles.statusBadge,
                  ...(draw.status === 'published' ? styles.statusPublished : styles.statusDraft),
                }}>
                  {draw.status}
                </div>
              </div>

              {/* Winning numbers */}
              {draw.winning_numbers && (
                <div style={styles.numbersRow}>
                  <span style={styles.numbersLabel}>Winning numbers</span>
                  <div style={styles.numbers}>
                    {draw.winning_numbers.map(n => (
                      <div
                        key={n}
                        style={{
                          ...styles.numberBall,
                          ...(entry?.matched_numbers && draw.winning_numbers.includes(n)
                            ? styles.numberBallMatched : {}),
                        }}
                      >
                        {n}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* My result */}
              {entry && (
                <div style={{
                  ...styles.resultRow,
                  ...(isWinner ? styles.resultWinner : styles.resultLoser),
                }}>
                  {isWinner ? (
                    <>
                      <span>🏆 You matched {entry.matched_numbers} numbers!</span>
                      <span style={styles.prizeAmt}>₹{entry.prize_amount.toLocaleString()}</span>
                    </>
                  ) : (
                    <span>You matched {entry.matched_numbers || 0} numbers this draw</span>
                  )}
                </div>
              )}

              {/* Jackpot rollover */}
              {draw.jackpot_rolled_over && (
                <div style={styles.rollover}>
                  🔄 Jackpot rolled over to next month
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    background: '#111',
    border: '1px solid #1e1e1e',
    borderRadius: '16px',
    padding: '1.5rem',
  },
  title: { fontSize: '18px', fontWeight: 700, color: '#fff', margin: '0 0 1.5rem' },
  empty: { color: '#666', textAlign: 'center', padding: '2rem 0' },
  emptyState: { textAlign: 'center', padding: '2rem 0' },
  emptyIcon: { fontSize: '36px', marginBottom: '10px' },
  emptyText: { color: '#666', fontSize: '14px', margin: 0 },
  drawList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  drawCard: {
    background: '#161616',
    border: '1px solid #1e1e1e',
    borderRadius: '12px',
    padding: '1.25rem',
  },
  drawCardWinner: { border: '1px solid #22c55e' },
  drawHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
  },
  drawMonth: { fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '4px' },
  drawPool: { fontSize: '13px', color: '#666' },
  statusBadge: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: '20px',
    textTransform: 'capitalize' as const,
  },
  statusPublished: { background: '#1a2a1a', color: '#4ade80' },
  statusDraft: { background: '#1a1a1a', color: '#666' },
  numbersRow: { marginBottom: '1rem' },
  numbersLabel: { fontSize: '12px', color: '#555', display: 'block', marginBottom: '8px' },
  numbers: { display: 'flex', gap: '8px', flexWrap: 'wrap' as const },
  numberBall: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: '#1e1e1e',
    border: '1px solid #2a2a2a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 700,
    color: '#666',
  },
  numberBallMatched: {
    background: '#1a2a1a',
    border: '1px solid #22c55e',
    color: '#22c55e',
  },
  resultRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '14px',
  },
  resultWinner: { background: '#1a2a1a', color: '#4ade80' },
  resultLoser: { background: '#161616', color: '#555' },
  prizeAmt: { fontWeight: 700, fontSize: '16px' },
  rollover: {
    fontSize: '13px',
    color: '#facc15',
    marginTop: '10px',
    padding: '8px 12px',
    background: '#1a1a00',
    borderRadius: '8px',
  },
}