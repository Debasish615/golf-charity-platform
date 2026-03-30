import SignoutButton from '@/components/dashboard/SignoutButton'
import CharitySelector from '@/components/dashboard/CharitySelector'
import DrawSection from '@/components/dashboard/DrawSection'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ScoreEntry from '@/components/dashboard/ScoreEntry'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, charities(name)')
    .eq('id', user.id)
    .single()

  const isActive = profile?.subscription_status === 'active'

  return (
    <div style={styles.page}>

      {/* Navbar */}
      <nav style={styles.nav}>
        <span style={styles.navLogo}>⛳ GolfGives</span>
        <div style={styles.navRight}>
          <span style={styles.navName}>{profile?.full_name || user.email}</span>
          <SignoutButton />
        </div>
      </nav>

      <div style={styles.wrap}>

        {/* Subscription banner if inactive */}
        {!isActive && (
          <div style={styles.subBanner}>
            <div>
              <strong>You don&apos;t have an active subscription.</strong>
              <span style={{ color: '#888', marginLeft: '8px' }}>
                Subscribe to enter draws and track scores.
              </span>
            </div>
            <Link href="/subscribe" style={styles.subBtn}>Subscribe now →</Link>
          </div>
        )}

        {/* Status row */}
        <div style={styles.statsRow}>
          {[
            {
              label: 'Subscription',
              value: profile?.subscription_status || 'inactive',
              highlight: isActive,
            },
            {
              label: 'Plan',
              value: profile?.subscription_plan
                ? profile.subscription_plan.charAt(0).toUpperCase() + profile.subscription_plan.slice(1)
                : '—',
              highlight: false,
            },
            {
              label: 'Charity contribution',
              value: `${profile?.charity_percentage || 10}%`,
              highlight: false,
            },
            {
              label: 'Supporting',
              value: (profile as any)?.charities?.name || 'Not selected',
              highlight: false,
            },
          ].map(s => (
            <div key={s.label} style={styles.statCard}>
              <div style={styles.statLabel}>{s.label}</div>
              <div style={{
                ...styles.statValue,
                color: s.highlight ? '#22c55e' : '#fff',
              }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Score entry */}
        <div style={styles.section}>
          {isActive ? (
            <ScoreEntry />
          ) : (
            <div style={styles.lockedCard}>
              <div style={styles.lockIcon}>🔒</div>
              <p style={styles.lockText}>Subscribe to start entering your golf scores</p>
              <Link href="/subscribe" style={styles.subBtn}>View plans</Link>
            </div>
          )}
        </div>

        {/* Draw section */}
        {isActive && (
          <div style={styles.section}>
            <DrawSection />
          </div>
        )}

        {/* Charity selector */}
        {isActive && (
          <div style={styles.section}>
            <CharitySelector
              currentCharityId={profile?.charity_id || null}
              currentPercentage={profile?.charity_percentage || 10}
            />
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
  navRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  navName: { fontSize: '14px', color: '#888' },
  wrap: { maxWidth: '900px', margin: '0 auto', padding: '2rem' },
  subBanner: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: '#1a1000', border: '1px solid #2a2000',
    borderRadius: '12px', padding: '1rem 1.5rem',
    marginBottom: '2rem', flexWrap: 'wrap' as const, gap: '12px',
    fontSize: '14px', color: '#fff',
  },
  subBtn: {
    background: '#22c55e', color: '#000',
    padding: '8px 18px', borderRadius: '8px',
    fontSize: '14px', fontWeight: 700, textDecoration: 'none',
    whiteSpace: 'nowrap' as const,
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
    marginBottom: '2rem',
  },
  statCard: {
    background: '#111', border: '1px solid #1e1e1e',
    borderRadius: '12px', padding: '1.25rem',
  },
  statLabel: {
    fontSize: '12px', color: '#555', marginBottom: '6px',
    textTransform: 'uppercase' as const, letterSpacing: '0.05em',
  },
  statValue: {
    fontSize: '16px', fontWeight: 700,
    color: '#fff', textTransform: 'capitalize' as const,
  },
  section: { marginBottom: '2rem' },
  lockedCard: {
    background: '#111', border: '1px solid #1e1e1e',
    borderRadius: '16px', padding: '3rem', textAlign: 'center',
  },
  lockIcon: { fontSize: '36px', marginBottom: '1rem' },
  lockText: { color: '#666', fontSize: '15px', marginBottom: '1.5rem' },
}