'use client'

import { useState, useEffect } from 'react'

interface Charity {
  id: string
  name: string
  description: string
  is_featured: boolean
}

interface Props {
  currentCharityId: string | null
  currentPercentage: number
}

export default function CharitySelector({ currentCharityId, currentPercentage }: Props) {
  const [charities, setCharities] = useState<Charity[]>([])
  const [selectedId, setSelectedId] = useState(currentCharityId || '')
  const [percentage, setPercentage] = useState(currentPercentage || 10)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/charities')
      .then(r => r.json())
      .then(d => {
        setCharities(d.charities || [])
        setFetching(false)
      })
  }, [])

  const handleSave = async () => {
    if (!selectedId) { setError('Please select a charity'); return }
    setLoading(true)
    setError('')
    setSuccess('')

    const res = await fetch('/api/profile/charity', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ charity_id: selectedId, charity_percentage: percentage }),
    })

    const data = await res.json()

    if (data.error) {
      setError(data.error)
    } else {
      setSuccess('Charity preference saved!')
    }
    setLoading(false)
  }

  if (fetching) return (
    <div style={styles.wrap}>
      <p style={styles.empty}>Loading charities...</p>
    </div>
  )

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Your charity</h2>
          <p style={styles.sub}>Minimum 10% of your subscription goes to your chosen charity</p>
        </div>
      </div>

      {/* Charity list */}
      <div style={styles.list}>
        {charities.map(charity => (
          <div
            key={charity.id}
            style={{
              ...styles.charityCard,
              ...(selectedId === charity.id ? styles.charityCardSelected : {}),
            }}
            onClick={() => setSelectedId(charity.id)}
          >
            <div style={styles.charityLeft}>
              <div style={{
                ...styles.radio,
                ...(selectedId === charity.id ? styles.radioSelected : {}),
              }}>
                {selectedId === charity.id && <div style={styles.radioDot} />}
              </div>
              <div>
                <div style={styles.charityName}>
                  {charity.name}
                  {charity.is_featured && (
                    <span style={styles.featuredBadge}>⭐ Featured</span>
                  )}
                </div>
                {charity.description && (
                  <div style={styles.charityDesc}>{charity.description}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Contribution percentage */}
      <div style={styles.percentSection}>
        <div style={styles.percentHeader}>
          <label style={styles.label}>Contribution percentage</label>
          <span style={styles.percentValue}>{percentage}%</span>
        </div>
        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={percentage}
          onChange={e => setPercentage(parseInt(e.target.value))}
          style={styles.slider}
        />
        <div style={styles.percentHints}>
          <span>10% (minimum)</span>
          <span>100%</span>
        </div>
        <div style={styles.contributionPreview}>
          <span style={styles.previewLabel}>Your monthly contribution</span>
          <span style={styles.previewValue}>
            ₹{Math.round(999 * percentage / 100).toLocaleString()}
          </span>
        </div>
      </div>

      {error && <p style={styles.error}>{error}</p>}
      {success && <p style={styles.successMsg}>{success}</p>}

      <button
        style={styles.saveBtn}
        onClick={handleSave}
        disabled={loading}
      >
        {loading ? 'Saving...' : 'Save charity preference'}
      </button>
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
  header: { marginBottom: '1.25rem' },
  title: { fontSize: '18px', fontWeight: 700, color: '#fff', margin: '0 0 4px' },
  sub: { fontSize: '13px', color: '#666', margin: 0 },
  list: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem' },
  charityCard: {
    border: '1px solid #1e1e1e',
    borderRadius: '10px',
    padding: '14px 16px',
    cursor: 'pointer',
    transition: 'border-color 0.15s',
  },
  charityCardSelected: { border: '1px solid #22c55e', background: '#0d1a0d' },
  charityLeft: { display: 'flex', alignItems: 'flex-start', gap: '12px' },
  radio: {
    width: '18px', height: '18px', borderRadius: '50%',
    border: '2px solid #333', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginTop: '2px',
  },
  radioSelected: { border: '2px solid #22c55e' },
  radioDot: {
    width: '8px', height: '8px',
    borderRadius: '50%', background: '#22c55e',
  },
  charityName: {
    fontSize: '14px', fontWeight: 600, color: '#fff',
    display: 'flex', alignItems: 'center', gap: '8px',
    flexWrap: 'wrap' as const,
  },
  featuredBadge: {
    fontSize: '11px', fontWeight: 500,
    background: '#1a1500', color: '#facc15',
    padding: '2px 8px', borderRadius: '20px',
  },
  charityDesc: { fontSize: '13px', color: '#666', marginTop: '3px' },
  percentSection: {
    background: '#161616',
    border: '1px solid #1e1e1e',
    borderRadius: '10px',
    padding: '1rem',
    marginBottom: '1rem',
  },
  percentHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '10px',
  },
  label: { fontSize: '13px', color: '#aaa', fontWeight: 500 },
  percentValue: { fontSize: '20px', fontWeight: 700, color: '#22c55e' },
  slider: { width: '100%', marginBottom: '6px' },
  percentHints: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: '11px', color: '#444', marginBottom: '12px',
  },
  contributionPreview: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #1e1e1e', paddingTop: '10px',
  },
  previewLabel: { fontSize: '13px', color: '#666' },
  previewValue: { fontSize: '16px', fontWeight: 700, color: '#fff' },
  error: { color: '#f87171', fontSize: '13px', margin: '0 0 10px' },
  successMsg: { color: '#4ade80', fontSize: '13px', margin: '0 0 10px' },
  saveBtn: {
    width: '100%', background: '#22c55e', border: 'none',
    borderRadius: '8px', padding: '12px',
    fontSize: '15px', fontWeight: 700, color: '#000', cursor: 'pointer',
  },
}