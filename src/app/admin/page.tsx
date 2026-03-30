'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Tab = 'users' | 'draws' | 'winners' | 'charities'

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('users')
  const [checking, setChecking] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [draws, setDraws] = useState<any[]>([])
  const [winners, setWinners] = useState<any[]>([])
  const [charities, setCharities] = useState<any[]>([])
  const [drawType, setDrawType] = useState<'random' | 'algorithm'>('random')
  const [simResult, setSimResult] = useState<any>(null)
  const [drawLoading, setDrawLoading] = useState(false)
  const [charityForm, setCharityForm] = useState({
    name: '', description: '', website_url: '', is_featured: false,
  })

  useEffect(() => {
    fetch('/api/admin/check')
      .then(r => r.json())
      .then(d => {
        if (!d.isAdmin) router.push('/dashboard')
        else { setChecking(false); fetchAll() }
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
    if (!confirm('Publish this draw? Cannot be undone.')) return
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
    } else {
      alert(data.error || 'Failed to run draw')
    }
    setDrawLoading(false)
    setSimResult(null)
  }

  const handleVerifyWinner = async (id: string, status: string) => {
    await fetch('/api/admin/winners', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, payout_status: 'unpaid' }),
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
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#666' }}>Checking access...</p>
    </div>
  )

  const activeUsers = users.filter(u => u.subscription_status === 'active').length
  const totalPool = users.reduce((sum: number, u: any) => {
    if (u.subscription_status !== 'active') return sum
    return sum + (u.subscription_plan === 'yearly' ? Math.round(9999 / 12) : 999)
  }, 0)
  const pendingWinners = winners.filter((w: any) => w.status === 'pending').length

  const tabs: { id: Tab; label: string }[] = [
    { id: 'users', label: `Users (${users.length})` },
    { id: 'draws', label: `Draws (${draws.length})` },
    { id: 'winners', label: `Winners (${winners.length})` },
    { id: 'charities', label: `Charities (${charities.length})` },
  ]

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <span style={s.logo}>⛳ GolfGives · Admin</span>
        <button style={s.backBtn} onClick={() => router.push('/dashboard')}>← Dashboard</button>
      </nav>

      <div style={s.wrap}>
        {/* Stats */}
        <div style={s.statsRow}>
          {[
            { label: 'Total users', value: users.length },
            { label: 'Active subscribers', value: activeUsers },
            { label: 'Monthly pool', value: `₹${totalPool.toLocaleString()}` },
            { label: 'Pending verifications', value: pendingWinners },
          ].map(s2 => (
            <div key={s2.label} style={s.statCard}>
              <div style={s.statLabel}>{s2.label}</div>
              <div style={s.statValue}>{s2.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              style={{ ...s.tab, ...(activeTab === tab.id ? s.tabActive : {}) }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* USERS */}
        {activeTab === 'users' && (
          <div style={s.card}>
            <h2 style={s.cardTitle}>All users</h2>
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>{['Name','Email','Status','Plan','Charity %','Joined'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.id}>
                      <td style={s.td}>{u.full_name || '—'}</td>
                      <td style={s.td}>{u.email}</td>
                      <td style={s.td}>
                        <span style={{ ...s.pill, ...(u.subscription_status === 'active' ? s.pillGreen : s.pillGray) }}>
                          {u.subscription_status}
                        </span>
                      </td>
                      <td style={s.td}>{u.subscription_plan || '—'}</td>
                      <td style={s.td}>{u.charity_percentage || 10}%</td>
                      <td style={s.td}>{new Date(u.created_at).toLocaleDateString('en-GB')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DRAWS */}
        {activeTab === 'draws' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={s.card}>
              <h2 style={s.cardTitle}>Draw engine</h2>
              <div style={s.drawControls}>
                <div style={s.field}>
                  <label style={s.label}>Draw type</label>
                  <select style={s.select} value={drawType} onChange={e => setDrawType(e.target.value as any)}>
                    <option value="random">Random</option>
                    <option value="algorithm">Algorithmic (weighted)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
                  <button style={s.simBtn} onClick={handleSimulate} disabled={drawLoading}>
                    {drawLoading ? 'Running...' : '🔍 Simulate'}
                  </button>
                  <button style={s.runBtn} onClick={handleRunDraw} disabled={drawLoading}>
                    {drawLoading ? 'Publishing...' : '🚀 Publish draw'}
                  </button>
                </div>
              </div>

              {simResult && (
                <div style={s.simResult}>
                  <div style={s.simTitle}>Simulation result (not saved)</div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' as const }}>
                    {simResult.winning_numbers?.map((n: number) => (
                      <div key={n} style={s.simBall}>{n}</div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#888', marginBottom: '12px', flexWrap: 'wrap' as const }}>
                    <span>Subscribers: {simResult.subscriber_count}</span>
                    <span>Pool: ₹{simResult.total_pool?.toLocaleString()}</span>
                    <span>Winners: {simResult.winner_count}</span>
                    <span>Jackpot rolls: {simResult.jackpot_rolled_over ? 'Yes' : 'No'}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                    {['5-match','4-match','3-match'].map(tier => (
                      <div key={tier} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#ccc', padding: '6px 0', borderBottom: '1px solid #1e1e3a' }}>
                        <span>{tier} ({tier === '5-match' ? '40%' : tier === '4-match' ? '35%' : '25%'})</span>
                        <span>₹{simResult.pools?.[tier]?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <button style={s.runBtn} onClick={handleRunDraw}>Publish this draw →</button>
                </div>
              )}
            </div>

            <div style={s.card}>
              <h2 style={s.cardTitle}>Past draws</h2>
              {draws.length === 0 ? <p style={s.empty}>No draws yet</p> : (
                <div style={s.tableWrap}>
                  <table style={s.table}>
                    <thead>
                      <tr>{['Month','Type','Status','Pool','Numbers'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {draws.map((d: any) => (
                        <tr key={d.id}>
                          <td style={s.td}>{new Date(d.draw_month).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</td>
                          <td style={s.td}>{d.draw_type}</td>
                          <td style={s.td}>
                            <span style={{ ...s.pill, ...(d.status === 'published' ? s.pillGreen : s.pillGray) }}>{d.status}</span>
                          </td>
                          <td style={s.td}>₹{d.total_pool?.toLocaleString()}</td>
                          <td style={s.td}>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' as const }}>
                              {d.winning_numbers?.map((n: number) => (
                                <span key={n} style={s.numChip}>{n}</span>
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

        {/* WINNERS */}
        {activeTab === 'winners' && (
          <div style={s.card}>
            <h2 style={s.cardTitle}>Winner verifications</h2>
            {winners.length === 0 ? <p style={s.empty}>No winners yet</p> : (
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>{['User','Tier','Prize','Status','Payout','Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {winners.map((w: any) => (
                      <tr key={w.id}>
                        <td style={s.td}>
                          <div>{w.profiles?.full_name || '—'}</div>
                          <div style={{ fontSize: '12px', color: '#555' }}>{w.profiles?.email}</div>
                        </td>
                        <td style={s.td}>{w.draw_entries?.prize_tier}</td>
                        <td style={s.td}>₹{w.draw_entries?.prize_amount?.toLocaleString()}</td>
                        <td style={s.td}>
                          <span style={{ ...s.pill, ...(w.status === 'approved' ? s.pillGreen : w.status === 'rejected' ? s.pillRed : s.pillAmber) }}>
                            {w.status}
                          </span>
                        </td>
                        <td style={s.td}>
                          <span style={{ ...s.pill, ...(w.payout_status === 'paid' ? s.pillGreen : s.pillGray) }}>
                            {w.payout_status}
                          </span>
                        </td>
                        <td style={s.td}>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                            {w.status === 'pending' && <>
                              <button style={s.approveBtn} onClick={() => handleVerifyWinner(w.id, 'approved')}>Approve</button>
                              <button style={s.rejectBtn} onClick={() => handleVerifyWinner(w.id, 'rejected')}>Reject</button>
                            </>}
                            {w.status === 'approved' && w.payout_status === 'unpaid' && (
                              <button style={s.approveBtn} onClick={() => handleMarkPaid(w.id)}>Mark paid</button>
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

        {/* CHARITIES */}
        {activeTab === 'charities' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={s.card}>
              <h2 style={s.cardTitle}>Add charity</h2>
              <form onSubmit={handleAddCharity} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={s.field}>
                    <label style={s.label}>Name</label>
                    <input style={s.input} required placeholder="Charity name" value={charityForm.name}
                      onChange={e => setCharityForm({ ...charityForm, name: e.target.value })} />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Website</label>
                    <input style={s.input} placeholder="https://..." value={charityForm.website_url}
                      onChange={e => setCharityForm({ ...charityForm, website_url: e.target.value })} />
                  </div>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Description</label>
                  <input style={s.input} placeholder="Short description" value={charityForm.description}
                    onChange={e => setCharityForm({ ...charityForm, description: e.target.value })} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" id="featured" checked={charityForm.is_featured}
                    onChange={e => setCharityForm({ ...charityForm, is_featured: e.target.checked })} />
                  <label htmlFor="featured" style={s.label}>Featured charity</label>
                </div>
                <button style={s.runBtn} type="submit">Add charity</button>
              </form>
            </div>

            <div style={s.card}>
              <h2 style={s.cardTitle}>All charities</h2>
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>{['Name','Description','Featured','Active','Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {charities.map((c: any) => (
                      <tr key={c.id}>
                        <td style={s.td}>{c.name}</td>
                        <td style={s.td}>{c.description || '—'}</td>
                        <td style={s.td}>{c.is_featured ? '⭐ Yes' : 'No'}</td>
                        <td style={s.td}>
                          <span style={{ ...s.pill, ...(c.is_active ? s.pillGreen : s.pillGray) }}>
                            {c.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={s.td}>
                          <button style={s.rejectBtn} onClick={() => handleDeleteCharity(c.id)}>Delete</button>
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

const s: Record<string, React.CSSProperties> = {
  page: { background: '#0a0a0a', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 2rem', borderBottom: '1px solid #1a1a1a', position: 'sticky', top: 0, background: '#0a0a0a', zIndex: 100 },
  logo: { fontSize: '18px', fontWeight: 700, color: '#fff' },
  backBtn: { background: 'none', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '6px 14px', color: '#888', fontSize: '13px', cursor: 'pointer' },
  wrap: { maxWidth: '1100px', margin: '0 auto', padding: '2rem' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '2rem' },
  statCard: { background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '1.25rem' },
  statLabel: { fontSize: '12px', color: '#555', marginBottom: '6px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
  statValue: { fontSize: '22px', fontWeight: 700, color: '#22c55e' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' as const },
  tab: { background: 'none', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '8px 18px', color: '#666', fontSize: '14px', cursor: 'pointer' },
  tabActive: { background: '#111', color: '#fff', borderColor: '#333' },
  card: { background: '#111', border: '1px solid #1e1e1e', borderRadius: '16px', padding: '1.5rem' },
  cardTitle: { fontSize: '16px', fontWeight: 700, color: '#fff', margin: '0 0 1.25rem' },
  tableWrap: { overflowX: 'auto' as const },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '14px' },
  th: { textAlign: 'left' as const, padding: '10px 12px', borderBottom: '1px solid #1e1e1e', color: '#555', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' as const },
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
  select: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none' },
  input: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' as const },
  simBtn: { background: '#1a1a2a', border: '1px solid #2a2a4a', borderRadius: '8px', padding: '10px 20px', color: '#818cf8', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
  runBtn: { background: '#22c55e', border: 'none', borderRadius: '8px', padding: '10px 20px', color: '#000', fontSize: '14px', fontWeight: 700, cursor: 'pointer' },
  simResult: { background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: '12px', padding: '1.25rem', marginTop: '1rem' },
  simTitle: { fontSize: '13px', color: '#818cf8', fontWeight: 600, marginBottom: '1rem' },
  simBall: { width: '40px', height: '40px', borderRadius: '50%', background: '#1e1e3a', border: '1px solid #3a3a6a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#818cf8' },
  numChip: { background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: '4px', padding: '2px 6px', fontSize: '12px', color: '#888' },
  approveBtn: { background: '#1a2a1a', border: '1px solid #2a3a2a', borderRadius: '6px', padding: '5px 12px', color: '#4ade80', fontSize: '12px', cursor: 'pointer' },
  rejectBtn: { background: '#2a1010', border: '1px solid #3a2020', borderRadius: '6px', padding: '5px 12px', color: '#f87171', fontSize: '12px', cursor: 'pointer' },
}