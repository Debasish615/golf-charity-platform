'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const plans = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '₹999',
    period: 'per month',
    features: [
      'Enter golf scores',
      'Monthly prize draw',
      'Support your charity',
      'Cancel anytime',
    ],
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '₹9,999',
    period: 'per year',
    badge: 'Save 17%',
    features: [
      'Everything in monthly',
      '2 months free',
      'Priority support',
      'Early draw results',
    ],
  },
]

export default function SubscribePage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [showMockModal, setShowMockModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('')
  const [cardNum, setCardNum] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [processing, setProcessing] = useState(false)

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId)
    setShowMockModal(true)
  }

  const handleMockPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)
    setError('')

    const res = await fetch('/api/subscription/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: selectedPlan }),
    })

    const data = await res.json()

    if (data.error) {
      if (data.error === 'Unauthorized') { router.push('/login'); return }
      setError(data.error)
      setProcessing(false)
      return
    }

    router.push('/dashboard?subscribed=true')
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Choose your plan</h1>
        <p style={styles.sub}>Play golf. Win prizes. Support a charity you love.</p>
      </div>

      <div style={styles.grid}>
        {plans.map(plan => (
          <div key={plan.id} style={{
            ...styles.card,
            ...(plan.id === 'yearly' ? styles.cardFeatured : {}),
          }}>
            {plan.badge && <div style={styles.badge}>{plan.badge}</div>}
            <h2 style={styles.planName}>{plan.name}</h2>
            <div style={styles.price}>
              <span style={styles.priceNum}>{plan.price}</span>
              <span style={styles.pricePeriod}> {plan.period}</span>
            </div>
            <ul style={styles.features}>
              {plan.features.map(f => (
                <li key={f} style={styles.feature}>
                  <span style={styles.check}>✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              style={{
                ...styles.btn,
                ...(plan.id === 'yearly' ? styles.btnFeatured : {}),
              }}
              onClick={() => handleSelectPlan(plan.id)}
              disabled={!!loading}
            >
              {loading === plan.id ? 'Processing...' : `Get ${plan.name}`}
            </button>
          </div>
        ))}
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <p style={styles.note}>
        Secure payment · Cancel anytime · 10% minimum goes to your chosen charity
      </p>

      {/* Mock Payment Modal */}
      {showMockModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <p style={styles.modalBrand}>Golf Charity Platform</p>
                <p style={styles.modalPlan}>
                  {selectedPlan === 'monthly' ? '₹999 / month' : '₹9,999 / year'}
                </p>
              </div>
              <button
                style={styles.closeBtn}
                onClick={() => { setShowMockModal(false); setLoading(null) }}
              >✕</button>
            </div>

            <form onSubmit={handleMockPayment} style={styles.modalForm}>
              <div style={styles.field}>
                <label style={styles.label}>Card number</label>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="4242 4242 4242 4242"
                  maxLength={19}
                  required
                  value={cardNum}
                  onChange={e => setCardNum(e.target.value
                    .replace(/\D/g, '')
                    .replace(/(.{4})/g, '$1 ')
                    .trim()
                  )}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ ...styles.field, flex: 1 }}>
                  <label style={styles.label}>Expiry</label>
                  <input
                    style={styles.input}
                    type="text"
                    placeholder="MM/YY"
                    maxLength={5}
                    required
                    value={expiry}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '')
                      setExpiry(v.length >= 2 ? v.slice(0, 2) + '/' + v.slice(2) : v)
                    }}
                  />
                </div>
                <div style={{ ...styles.field, flex: 1 }}>
                  <label style={styles.label}>CVV</label>
                  <input
                    style={styles.input}
                    type="text"
                    placeholder="123"
                    maxLength={3}
                    required
                    value={cvv}
                    onChange={e => setCvv(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              <div style={styles.testNote}>
                🧪 Test mode — use any card details
              </div>

              <button
                style={styles.payBtn}
                type="submit"
                disabled={processing}
              >
                {processing ? 'Processing payment...' : `Pay ${selectedPlan === 'monthly' ? '₹999' : '₹9,999'}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#0a0a0a',
    padding: '4rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  header: { textAlign: 'center', marginBottom: '3rem' },
  title: { fontSize: '32px', fontWeight: 700, color: '#fff', margin: '0 0 10px' },
  sub: { fontSize: '16px', color: '#888', margin: 0 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    width: '100%',
    maxWidth: '640px',
  },
  card: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '16px',
    padding: '2rem',
    position: 'relative',
  },
  cardFeatured: { border: '2px solid #22c55e' },
  badge: {
    position: 'absolute',
    top: '-12px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#22c55e',
    color: '#000',
    fontSize: '12px',
    fontWeight: 700,
    padding: '4px 14px',
    borderRadius: '20px',
  },
  planName: { fontSize: '18px', fontWeight: 600, color: '#fff', margin: '0 0 12px' },
  price: { margin: '0 0 20px' },
  priceNum: { fontSize: '32px', fontWeight: 700, color: '#fff' },
  pricePeriod: { fontSize: '14px', color: '#888' },
  features: {
    listStyle: 'none', padding: 0, margin: '0 0 24px',
    display: 'flex', flexDirection: 'column', gap: '10px',
  },
  feature: { fontSize: '14px', color: '#ccc', display: 'flex', alignItems: 'center', gap: '8px' },
  check: { color: '#22c55e', fontWeight: 700 },
  btn: {
    width: '100%', padding: '12px', borderRadius: '8px',
    border: '1px solid #333', background: 'transparent',
    color: '#fff', fontSize: '15px', fontWeight: 600, cursor: 'pointer',
  },
  btnFeatured: { background: '#22c55e', color: '#000', border: 'none' },
  error: { color: '#f87171', fontSize: '14px', marginTop: '1rem' },
  note: { fontSize: '12px', color: '#555', marginTop: '2rem', textAlign: 'center' },
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '1rem',
  },
  modal: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '16px',
    padding: '2rem',
    width: '100%',
    maxWidth: '400px',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.5rem',
  },
  modalBrand: { fontSize: '14px', color: '#888', margin: '0 0 4px' },
  modalPlan: { fontSize: '22px', fontWeight: 700, color: '#fff', margin: 0 },
  closeBtn: {
    background: 'none', border: 'none',
    color: '#666', fontSize: '18px', cursor: 'pointer',
  },
  modalForm: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', color: '#aaa', fontWeight: 500 },
  input: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
  },
  testNote: {
    background: '#1a2a1a',
    border: '1px solid #2a3a2a',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '13px',
    color: '#4ade80',
  },
  payBtn: {
    background: '#22c55e',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    padding: '13px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
  },
}