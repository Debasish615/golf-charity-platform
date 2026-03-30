'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Tab = 'users' | 'draws' | 'winners' | 'charities'

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('users')
  const [checking, setChecking] = useState(true)

  // Data states
  const [users, setUsers] = useState<any[]>([])
  const [draws, setDraws] = useState<any[]>([])
  const [winners, setWinners] = useState<any[]>([])
  const [charities, setCharities] = useState<any[]>([])

  // Draw engine states
  const [drawType, setDrawType] = useState<'random' | 'algorithm'>('random')
  const [simResult, setSimResult] = useState<any>(null)
  const [drawLoading, setDrawLoading] = useState(false)

  // Charity form
  const [charityForm, setCharityForm] = useState({
    name: '', description: '', website_url: '', is_featured: false,
  })

  useEffect(() => {
    fetch('/api/admin/check')
      .then(r => r.json())
      .then(d => {
        if (!d.isAdmin) router.push('/dashboard')
        else {
          setChecking(false)
          fetchAll()
        }
      })
  }, [])

  const fetchAll = async () => {
    const [u, d, w, c] = await Promise.all([
      fetch('/api/admin/users').then(r => r.json()),
      fetch('/api/admin/draws').then(r => r.json()),
      fetch('/api/admin/winners').then(r => r.json()),
      fetch('/api/admin/charities').then(r => r.json()),
    ])
    setUsers(u.users || [])
    setDraws(d.draws || [])
    setWinners(w.winners || [])
    setCharities(c.charities || [])
  }

  const handleSimulate = async () => {
    setDrawLoading(true)
    setSimResult(null)
    const res = await fetch('/api/draws/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draw_type: drawType, simulate: true }),
    })
    const data = await res.json()
    setSimResult(data)
    setDrawLoading(false)
  }

  const handleRunDraw = async () => {
    if (!confirm('Run and publish this draw? This cannot be undone.')) return
    setDrawLoading(true)
    const res = await fetch('/api/draws/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draw_type: drawType, simulate: false }),
    })
    const data = await res.json()
    if (data.success) {
      alert(`Draw published! ${data.winner_count} winners. Pool: ₹${data.total_pool}`)
      fetchAll()
    }
    setDrawLoading(false)
    setSimResult(null)
  }

  const handleVerifyWinner = async (id: string, status: string) => {
    await fetch('/api/admin/winners', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, payout_status: status === 'approved' ? 'unpaid' : 'unpaid' }),
    })
    fetchAll()
  }

  const handleMarkPaid = async (id: string) => {
    await fetch('/api/admin/winners', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'approved', payout_status: 'paid' }),
    })
    fetchAll()
  }

  const handleAddCharity = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/admin/charities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(charityForm),
    })
    setCharityForm({ name: '', description: '', website_url: '', is_featured: false })
    fetchAll()
  }

  const handleDeleteCharity = async (id: string) => {
    if (!confirm('Delete this charity?')) return
    await fetch('/api/admin/charities', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchAll()
  }

  if (checking) return (
    <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#666' }}>Checking access...</p>
    </div>
  )

  const tabs: { id: Tab; label: string }[] = [
    { id: 'users', label: `Users (${users.length})` },
    { id: 'draws', label: `Draws (${draws.length})` },
    { id: 'winners', label: `Winners (${winners.length})` },
    { id: 'charities', label: `Charities (${charities.length})` },
  ]

  // Analytics
  const activeUsers = users.filter(u => u.subscription_status === 'active').length
  const totalPool = users.reduce((sum: number, u: any) => {
    if (u.subscription_status !== 'active') return sum
    return sum + (u.subscription_plan === 'yearly' ? Math.round(9999 / 12) : 999)
  }, 0)
  const pendingWinners = winners.filter((w: any) => w.status === 'pending').length

  return (
    <div style={styles.page}>
      {/* Nav */}
      <nav style={styles.nav}>
        <span style={styles.navLogo}>⛳ GolfGives · Admin</span>
        <button
          style={styles.backBtn}
          onClick={() => router.push('/dashboard')}
        >
          ← Back to dashboard
        </button>
      </nav>

      <div style={styles.wrap}>

        {/* Analytics row */}
        <div style={styles.statsRow}>
          {[
            { label: 'Total users', value: users.length },
            { label: 'Active subscribers', value: activeUsers },
            { label: 'Monthly prize pool', value: `₹${totalPool.toLocaleString()}` },
            { label: 'Pending verifications', value: pendingWinners },
          ].map(s => (
            <div key={s.label} style={styles.statCard}>
              <div style={styles.statLabel}>{s.label}</div>
              <div style={styles.statValue}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              style={{
                ...styles.tab,
                ...(activeTab === tab.id ? styles.tabActive : {}),
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>All users</h2>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {['Name', 'Email', 'Status', 'Plan', 'Charity %', 'Joined'].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.id}>
                      <td style={styles.td}>{u.full_name || '—'}</td>
                      <td style={styles.td}>{u.email}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.pill,
                          ...(u.subscription_status === 'active' ? styles.pillGreen : styles.pillGray),
                        }}>
                          {u.subscription_status}
                        </span>
                      </td>
                      <td style={styles.td}>{u.subscription_plan || '—'}</td>
                      <td style={styles.td}>{u.charity_percentage || 10}%</td>
                      <td style={styles.td}>
                        {new Date(u.created_at).toLocaleDateString('en-GB')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DRAWS TAB */}
        {activeTab === 'draws' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Draw engine */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Draw engine</h2>
              <div style={styles.drawControls}>
                <div style={styles.field}>
                  <label style={styles.label}>Draw type</label>
                  <select
                    style={styles.select}
                    value={drawType}
                    onChange={e => setDrawType(e.target.value as 'random' | 'algorithm')}
                  >
                    <option value="random">Random</option>
                    <option value="algorithm">Algorithmic (weighted by scores)</option>
                  </select>
                </div>
                <div style={styles.drawBtns}>
                  <button
                    style={styles.simBtn}
                    onClick={handleSimulate}
                    disabled={drawLoading}
                  >
                    {drawLoading ? 'Running...' : '🔍 Simulate draw'}
                  </button>
                  <button
                    style={styles.runBtn}
                    onClick={handleRunDraw}
                    disabled={drawLoading}
                  >
                    {drawLoading ? 'Publishing...' : '🚀 Publish draw'}
                  </button>
                </div>
              </div>

              {/* Simulation result */}
              {simResult && (
                <div style={styles.simResult}>
                  <div style={styles.simTitle}>Simulation result (not saved)</div>
                  <div style={styles.simNumbers}>
                    {simResult.winning_numbers?.map((n: number) => (
                      <div key={n} style={styles.simBall}>{n}</div>
                    ))}
                  </div>
                  <div style={styles.simStats}>
                    <span>Subscribers: {simResult.subscriber_count}</span>
                    <span>Total pool: ₹{simResult.total_pool?.toLocaleString()}</span>
                    <span>Winners: {simResult.winner_count}</span>
                    <span>Jackpot rolls: {simResult.jackpot_rolled_over ? 'Yes' : 'No'}</span>
                  </div>
                  <div style={styles.poolBreakdown}>
                    <div style={styles.poolItem}>
                      <span>5-match (40%)</span>
                      <span>₹{simResult.pools?.['5-match']?.toLocaleString()}</span>
                    </div>
                    <div style={styles.poolItem}>
                      <span>4-match (35%)</span>
                      <span>₹{simResult.pools?.['4-match']?.toLocaleString()}</span>
                    </div>
                    <div style={styles.poolItem}>
                      <span>3-match (25%)</span>
                      <span>₹{simResult.pools?.['3-match']?.toLocaleString()}</span>
                    </div>
                  </div>
                  <button style={styles.runBtn} onClick={handleRunDraw}>
                    Looks good — publish this draw →
                  </button>
                </div>
              )}
            </div>

            {/* Past draws */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Past draws</h2>
              {draws.length === 0 ? (
                <p style={styles.empty}>No draws yet</p>
              ) : (
                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        {['Month', 'Type', 'Status', 'Pool', 'Winning numbers'].map(h => (
                          <th key={h} style={styles.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {draws.map((d: any) => (
                        <tr key={d.id}>
                          <td style={styles.td}>
                            {new Date(d.draw_month).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                          </td>
                          <td style={styles.td}>{d.draw_type}</td>
                          <td style={styles.td}>
                            <span style={{
                              ...styles.pill,
                              ...(d.status === 'published' ? styles.pillGreen : styles.pillGray),
                            }}>
                              {d.status}
                            </span>
                          </td>
                          <td style={styles.td}>₹{d.total_pool?.toLocaleString()}</td>
                          <td style={styles.td}>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {d.winning_numbers?.map((n: number) => (
                                <span key={n} style={styles.numChip}>{n}</span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* WINNERS TAB */}
        {activeTab === 'winners' && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Winner verifications</h2>
            {winners.length === 0 ? (
              <p style={styles.empty}>No winners yet</p>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {['User', 'Tier', 'Prize', 'Status', 'Payout', 'Actions'].map(h => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {winners.map((w: any) => (
                      <tr key={w.id}>
                        <td style={styles.td}>
                          <div>{w.profiles?.full_name || '—'}</div>
                          <div style={{ fontSize: '12px', color: '#555' }}>{w.profiles?.email}</div>
                        </td>
                        <td style={styles.td}>{w.draw_entries?.prize_tier}</td>
                        <td style={styles.td}>₹{w.draw_entries?.prize_amount?.toLocaleString()}</td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.pill,
                            ...(w.status === 'approved' ? styles.pillGreen
                              : w.status === 'rejected' ? styles.pillRed
                              : styles.pillAmber),
                          }}>
                            {w.status}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.pill,
                            ...(w.payout_status === 'paid' ? styles.pillGreen : styles.pillGray),
                          }}>
                            {w.payout_status}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {w.status === 'pending' && (
                              <>
                                <button
                                  style={styles.approveBtn}
                                  onClick={() => handleVerifyWinner(w.id, 'approved')}
                                >
                                  Approve
                                </button>
                                <button
                                  style={styles.rejectBtn}
                                  onClick={() => handleVerifyWinner(w.id, 'rejected')}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {w.status === 'approved' && w.payout_status === 'unpaid' && (
                              <button
                                style={styles.approveBtn}
                                onClick={() => handleMarkPaid(w.id)}
                              >
                                Mark paid
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* CHARITIES TAB */}
        {activeTab === 'charities' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Add charity form */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Add charity</h2>
              <form onSubmit={handleAddCharity} style={styles.charityForm}>
                <div style={styles.formRow}>
                  <div style={styles.field}>
                    <label style={styles.label}>Name</label>
                    <input
                      style={styles.input}
                      required
                      placeholder="Charity name"
                      value={charityForm.name}
                      onChange={e => setCharityForm({ ...charityForm, name: e.target.value })}
                    />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Website URL</label>
                    <input
                      style={styles.input}
                      placeholder="https://..."
                      value={charityForm.website_url}
                      onChange={e => setCharityForm({ ...charityForm, website_url: e.target.value })}
                    />
                  </div>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Description</label>
                  <input
                    style={styles.input}
                    placeholder="Short description"
                    value={charityForm.description}
                    onChange={e => setCharityForm({ ...charityForm, description: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="featured"
                    checked={charityForm.is_featured}
                    onChange={e => setCharityForm({ ...charityForm, is_featured: e.target.checked })}
                  />
                  <label htmlFor="featured" style={styles.label}>Featured charity</label>
                </div>
                <button style={styles.runBtn} type="submit">Add charity</button>
              </form>
            </div>

            {/* Charities list */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>All charities</h2>
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {['Name', 'Description', 'Featured', 'Active', 'Actions'].map(h => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {charities.map((c: any) => (
                      <tr key={c.id}>
                        <td style={styles.td}>{c.name}</td>
                        <td style={styles.td}>{c.description || '—'}</td>
                        <td style={styles.td}>{c.is_featured ? '⭐ Yes' : 'No'}</td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.pill,
                            ...(c.is_active ? styles.pillGreen : styles.pillGray),
                          }}>
                            {c.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <button
                            style={styles.rejectBtn}
                            onClick={() => handleDeleteCharity(c.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { background: '#0a0a0a', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif' },
  nav: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1.25rem 2rem', borderBottom: '1px solid #1a1a1a',
    position: 'sticky', top: 0, background: '#0a0a0a', zIndex: 100,
  },
  navLogo: { fontSize: '18px', fontWeight: 700, color: '#fff' },
  backBtn: {
    background: 'none', border: '1px solid #2a2a2a', borderRadius: '8px',
    padding: '6px 14px', color: '#888', fontSize: '13px', cursor: 'pointer',
  },
  wrap: { maxWidth: '1100px', margin: '0 auto', padding: '2rem' },
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px', marginBottom: '2rem',
  },
  statCard: {
    background: '#111', border: '1px solid #1e1e1e',
    borderRadius: '12px', padding: '1.25rem',
  },
  statLabel: { fontSize: '12px', color: '#555', marginBottom: '6px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
  statValue: { fontSize: '22px', fontWeight: 700, color: '#22c55e' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' as const },
  tab: {
    background: 'none', border: '1px solid #2a2a2a', borderRadius: '8px',
    padding: '8px 18px', color: '#666', fontSize: '14px', cursor: 'pointer',
  },
  tabActive: { background: '#111', color: '#fff', borderColor: '#333' },
  card: {
    background: '#111', border: '1px solid #1e1e1e',
    borderRadius: '16px', padding: '1.5rem',
  },
  cardTitle: { fontSize: '16px', fontWeight: 700, color: '#fff', margin: '0 0 1.25rem' },
  tableWrap: { overflowX: 'auto' as const },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '14px' },
  th: {
    textAlign: 'left' as const, padding: '10px 12px',
    borderBottom: '1px solid #1e1e1e', color: '#555',
    fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' as const,
  },
  td: { padding: '12px', borderBottom: '1px solid #161616', color: '#ccc', verticalAlign: 'top' as const },
  pill: { fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', display: 'inline-block' },
  pillGreen: { background: '#1a2a1a', color: '#4ade80' },
  pillGray: { background: '#1a1a1a', color: '#555' },
  pillAmber: { background: '#1a1500', color: '#facc15' },
  pillRed: { background: '#2a1010', color: '#f87171' },
  empty: { color: '#555', fontSize: '14px', textAlign: 'center', padding: '2rem 0' },
  drawControls: { display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' as const, marginBottom: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '200px' },
  label: { fontSize: '13px', color: '#aaa', fontWeight: 500 },
  select: {
    background: '#1a1a1a', border: '1px solid #2a2a2a',
    borderRadius: '8px', padding: '10px 14px',
    color: '#fff', fontSize: '14px', outline: 'none',
  },
  input: {
    background: '#1a1a1a', border: '1px solid #2a2a2a',
    borderRadius: '8px', padding: '10px 14px',
    color: '#fff', fontSize: '14px', outline: 'none', width: '100%',
    boxSizing: 'border-box' as const,
  },
  drawBtns: { display: 'flex', gap: '10px', flexWrap: 'wrap' as const },
  simBtn: {
    background: '#1a1a2a', border: '1px solid #2a2a4a',
    borderRadius: '8px', padding: '10px 20px',
    color: '#818cf8', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
  },
  runBtn: {
    background: '#22c55e', border: 'none',
    borderRadius: '8px', padding: '10px 20px',
    color: '#000', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
  },
  simResult: {
    background: '#0d0d1a', border: '1px solid #1e1e3a',
    borderRadius: '12px', padding: '1.25rem', marginTop: '1rem',
  },
  simTitle: { fontSize: '13px', color: '#818cf8', fontWeight: 600, marginBottom: '1rem' },
  simNumbers: { display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' as const },
  simBall: {
    width: '40px', height: '40px', borderRadius: '50%',
    background: '#1e1e3a', border: '1px solid #3a3a6a',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', fontWeight: 700, color: '#818cf8',
  },
  simStats: {
    display: 'flex', gap: '20px', fontSize: '13px',
    color: '#888', marginBottom: '1rem', flexWrap: 'wrap' as const,
  },
  poolBreakdown: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '1rem' },
  poolItem: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: '13px', color: '#ccc',
    padding: '6px 0', borderBottom: '1px solid #1e1e3a',
  },
  numChip: {
    background: '#1e1e1e', border: '1px solid #2a2a2a',
    borderRadius: '4px', padding: '2px 6px',
    fontSize: '12px', color: '#888',
  },
  approveBtn: {
    background: '#1a2a1a', border: '1px solid #2a3a2a',
    borderRadius: '6px', padding: '5px 12px',
    color: '#4ade80', fontSize: '12px', cursor: 'pointer',
  },
  rejectBtn: {
    background: '#2a1010', border: '1px solid #3a2020',
    borderRadius: '6px', padding: '5px 12px',
    color: '#f87171', fontSize: '12px', cursor: 'pointer',
  },
  charityForm: { display: 'flex', flexDirection: 'column', gap: '14px' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
}