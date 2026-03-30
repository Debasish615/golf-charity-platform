'use client'

import { useState, useEffect } from 'react'

interface Score {
  id: string
  score: number
  played_at: string
  created_at: string
}

export default function ScoreEntry() {
  const [scores, setScores] = useState<Score[]>([])
  const [score, setScore] = useState('')
  const [playedAt, setPlayedAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchScores = async () => {
    setFetching(true)
    const res = await fetch('/api/scores')
    const data = await res.json()
    setScores(data.scores || [])
    setFetching(false)
  }

  useEffect(() => { fetchScores() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const scoreNum = parseInt(score)

    if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 45) {
      setError('Score must be between 1 and 45')
      setLoading(false)
      return
    }

    const res = await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: scoreNum, played_at: playedAt }),
    })

    const data = await res.json()

    if (data.error) {
      setError(data.error)
      setLoading(false)
      return
    }

    setSuccess('Score added! Your 5 most recent scores are shown below.')
    setScore('')
    setPlayedAt('')
    setLoading(false)
    fetchScores()
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/scores/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) fetchScores()
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div style={styles.wrap}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>My scores</h2>
          <p style={styles.sub}>Stableford format · Last 5 scores kept · Range 1–45</p>
        </div>
        <div style={styles.countBadge}>
          {scores.length}/5
        </div>
      </div>

      {/* Score entry form */}
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formRow}>
          <div style={styles.field}>
            <label style={styles.label}>Stableford score</label>
            <input
              style={styles.input}
              type="number"
              min={1}
              max={45}
              placeholder="e.g. 36"
              required
              value={score}
              onChange={e => setScore(e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Date played</label>
            <input
              style={styles.input}
              type="date"
              required
              max={today}
              value={playedAt}
              onChange={e => setPlayedAt(e.target.value)}
            />
          </div>
          <button
            style={styles.addBtn}
            type="submit"
            disabled={loading}
          >
            {loading ? 'Adding...' : '+ Add score'}
          </button>
        </div>

        {error && <p style={styles.error}>{error}</p>}
        {success && <p style={styles.successMsg}>{success}</p>}
      </form>

      {/* Rolling 5 notice */}
      {scores.length === 5 && (
        <div style={styles.notice}>
          ⚡ You have 5 scores. Adding a new one will automatically remove your oldest score.
        </div>
      )}

      {/* Scores list */}
      <div style={styles.scoresList}>
        {fetching ? (
          <p style={styles.empty}>Loading scores...</p>
        ) : scores.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🏌️</div>
            <p style={styles.emptyText}>No scores yet. Add your first score above.</p>
          </div>
        ) : (
          scores.map((s, index) => (
            <div key={s.id} style={styles.scoreRow}>
              <div style={styles.scoreLeft}>
                <div style={styles.scoreRank}>#{index + 1}</div>
                <div>
                  <div style={styles.scoreDate}>
                    {new Date(s.played_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </div>
                  <div style={styles.scoreLatest}>
                    {index === 0 ? 'Most recent' : `${index + 1} scores ago`}
                  </div>
                </div>
              </div>
              <div style={styles.scoreRight}>
                <div style={styles.scoreValue}>{s.score}</div>
                <div style={styles.scoreUnit}>pts</div>
                <button
                  style={styles.deleteBtn}
                  onClick={() => handleDelete(s.id)}
                  title="Remove score"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Score average */}
      {scores.length > 0 && (
        <div style={styles.avgRow}>
          <span style={styles.avgLabel}>Average score</span>
          <span style={styles.avgValue}>
            {(scores.reduce((sum, s) => sum + s.score, 0) / scores.length).toFixed(1)} pts
          </span>
        </div>
      )}
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.5rem',
  },
  title: { fontSize: '18px', fontWeight: 700, color: '#fff', margin: '0 0 4px' },
  sub: { fontSize: '13px', color: '#666', margin: 0 },
  countBadge: {
    background: '#1a2a1a',
    border: '1px solid #2a3a2a',
    borderRadius: '8px',
    padding: '6px 14px',
    fontSize: '16px',
    fontWeight: 700,
    color: '#22c55e',
  },
  form: { marginBottom: '1rem' },
  formRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  field: { display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '140px' },
  label: { fontSize: '13px', color: '#aaa', fontWeight: 500 },
  input: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  addBtn: {
    background: '#22c55e',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    height: '42px',
  },
  error: { color: '#f87171', fontSize: '13px', margin: '10px 0 0' },
  successMsg: { color: '#4ade80', fontSize: '13px', margin: '10px 0 0' },
  notice: {
    background: '#1a1a00',
    border: '1px solid #2a2a00',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '13px',
    color: '#facc15',
    marginBottom: '1rem',
  },
  scoresList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  empty: { color: '#666', fontSize: '14px', textAlign: 'center', padding: '2rem 0' },
  emptyState: { textAlign: 'center', padding: '2rem 0' },
  emptyIcon: { fontSize: '36px', marginBottom: '10px' },
  emptyText: { color: '#666', fontSize: '14px', margin: 0 },
  scoreRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#161616',
    border: '1px solid #1e1e1e',
    borderRadius: '10px',
    padding: '12px 16px',
  },
  scoreLeft: { display: 'flex', alignItems: 'center', gap: '14px' },
  scoreRank: { fontSize: '13px', color: '#444', fontWeight: 600, minWidth: '24px' },
  scoreDate: { fontSize: '14px', fontWeight: 600, color: '#fff' },
  scoreLatest: { fontSize: '12px', color: '#555', marginTop: '2px' },
  scoreRight: { display: 'flex', alignItems: 'center', gap: '6px' },
  scoreValue: { fontSize: '22px', fontWeight: 800, color: '#22c55e' },
  scoreUnit: { fontSize: '13px', color: '#555', marginTop: '4px' },
  deleteBtn: {
    background: 'none',
    border: '1px solid #2a2a2a',
    borderRadius: '6px',
    color: '#555',
    fontSize: '12px',
    cursor: 'pointer',
    padding: '4px 8px',
    marginLeft: '8px',
  },
  avgRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #1e1e1e',
    marginTop: '1rem',
    paddingTop: '1rem',
  },
  avgLabel: { fontSize: '13px', color: '#666' },
  avgValue: { fontSize: '16px', fontWeight: 700, color: '#22c55e' },
}