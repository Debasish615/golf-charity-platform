import Link from 'next/link'

export default function HomePage() {
  return (
    <div style={styles.page}>

      {/* Navbar */}
      <nav style={styles.nav}>
        <span style={styles.navLogo}>⛳ GolfGives</span>
        <div style={styles.navLinks}>
          <Link href="/login" style={styles.navLink}>Sign in</Link>
          <Link href="/signup" style={styles.navCta}>Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.heroBadge}>🏆 Monthly prize draws · 🤝 Charity giving · ⛳ Golf tracking</div>
        <h1 style={styles.heroTitle}>
          Golf that gives <br />
          <span style={styles.heroGreen}>back.</span>
        </h1>
        <p style={styles.heroSub}>
          Enter your scores. Join the monthly draw. Support a charity you love.
          Every subscription makes an impact.
        </p>
        <div style={styles.heroBtns}>
          <Link href="/signup" style={styles.btnPrimary}>Start playing →</Link>
          <Link href="#how" style={styles.btnGhost}>How it works</Link>
        </div>
        <div style={styles.statsRow}>
          {[
            { val: '₹40,000+', label: 'Prize pool this month' },
            { val: '10%+', label: 'Goes to charity' },
            { val: '3 ways', label: 'To win every draw' },
          ].map(s => (
            <div key={s.label} style={styles.statBox}>
              <div style={styles.statVal}>{s.val}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={styles.section}>
        <p style={styles.sectionTag}>How it works</p>
        <h2 style={styles.sectionTitle}>Three simple steps</h2>
        <div style={styles.stepsGrid}>
          {[
            { num: '01', title: 'Subscribe', desc: 'Choose a monthly or yearly plan. A portion of every subscription goes straight to your chosen charity.' },
            { num: '02', title: 'Enter your scores', desc: 'Log your last 5 golf scores in Stableford format. Your scores are your draw entries.' },
            { num: '03', title: 'Win & give', desc: 'Match 3, 4, or 5 numbers in our monthly draw. Win prizes. Your charity wins too.' },
          ].map(step => (
            <div key={step.num} style={styles.stepCard}>
              <div style={styles.stepNum}>{step.num}</div>
              <h3 style={styles.stepTitle}>{step.title}</h3>
              <p style={styles.stepDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Prize pool */}
      <section style={styles.sectionDark}>
        <p style={styles.sectionTag}>Prize structure</p>
        <h2 style={styles.sectionTitle}>Every draw, three ways to win</h2>
        <div style={styles.prizeGrid}>
          {[
            { match: '5-number match', share: '40%', label: 'Jackpot', rollover: true },
            { match: '4-number match', share: '35%', label: 'Major prize', rollover: false },
            { match: '3-number match', share: '25%', label: 'Prize', rollover: false },
          ].map(p => (
            <div key={p.match} style={styles.prizeCard}>
              <div style={styles.prizeShare}>{p.share}</div>
              <div style={styles.prizeLabel}>{p.label}</div>
              <div style={styles.prizeMatch}>{p.match}</div>
              {p.rollover && (
                <div style={styles.rolloverBadge}>Rolls over if unclaimed</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Charity */}
      <section style={styles.section}>
        <p style={styles.sectionTag}>Charity</p>
        <h2 style={styles.sectionTitle}>You choose where your money goes</h2>
        <p style={styles.sectionSub}>
          Select a charity at signup. Minimum 10% of your subscription goes directly to them.
          Want to give more? Increase your percentage anytime.
        </p>
        <div style={styles.charityCards}>
          {[
            { name: 'Cancer Research UK', desc: 'Funding life-saving research' },
            { name: "St Jude Children's Hospital", desc: 'Defeating childhood cancer' },
            { name: 'Macmillan Cancer Support', desc: 'Supporting people with cancer' },
          ].map(c => (
            <div key={c.name} style={styles.charityCard}>
              <div style={styles.charityIcon}>❤️</div>
              <div style={styles.charityName}>{c.name}</div>
              <div style={styles.charityDesc}>{c.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={styles.ctaSection}>
        <h2 style={styles.ctaTitle}>Ready to play with purpose?</h2>
        <p style={styles.ctaSub}>Join today. Your first draw entry is waiting.</p>
        <Link href="/signup" style={styles.ctaBtn}>Create your account →</Link>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <span>⛳ GolfGives · Built for good</span>
        <div style={styles.footerLinks}>
          <Link href="/login" style={styles.footerLink}>Sign in</Link>
          <Link href="/subscribe" style={styles.footerLink}>Plans</Link>
        </div>
      </footer>

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
  navLinks: { display: 'flex', alignItems: 'center', gap: '16px' },
  navLink: { fontSize: '14px', color: '#888', textDecoration: 'none' },
  navCta: {
    fontSize: '14px', fontWeight: 600, color: '#000',
    background: '#22c55e', padding: '8px 18px',
    borderRadius: '8px', textDecoration: 'none',
  },

  hero: {
    maxWidth: '800px', margin: '0 auto',
    padding: '6rem 2rem 4rem', textAlign: 'center',
  },
  heroBadge: {
    display: 'inline-block',
    background: '#111', border: '1px solid #222',
    borderRadius: '20px', padding: '6px 16px',
    fontSize: '13px', color: '#888', marginBottom: '2rem',
  },
  heroTitle: {
    fontSize: 'clamp(40px, 7vw, 72px)', fontWeight: 800,
    lineHeight: 1.1, margin: '0 0 1.5rem',
  },
  heroGreen: { color: '#22c55e' },
  heroSub: { fontSize: '18px', color: '#888', lineHeight: 1.7, margin: '0 0 2.5rem' },
  heroBtns: {
    display: 'flex', gap: '12px', justifyContent: 'center',
    flexWrap: 'wrap' as const, marginBottom: '4rem',
  },
  btnPrimary: {
    background: '#22c55e', color: '#000',
    padding: '14px 28px', borderRadius: '10px',
    fontSize: '16px', fontWeight: 700, textDecoration: 'none',
    display: 'inline-block', textAlign: 'center' as const,
  },
  btnGhost: {
    background: 'transparent', color: '#fff',
    padding: '14px 28px', borderRadius: '10px',
    fontSize: '16px', fontWeight: 600, textDecoration: 'none',
    border: '1px solid #333', display: 'inline-block',
  },
  statsRow: {
    display: 'flex', gap: '16px',
    justifyContent: 'center', flexWrap: 'wrap' as const,
  },
  statBox: {
    background: '#111', border: '1px solid #1e1e1e',
    borderRadius: '12px', padding: '1.25rem 2rem', textAlign: 'center',
  },
  statVal: { fontSize: '24px', fontWeight: 700, color: '#22c55e', marginBottom: '4px' },
  statLabel: { fontSize: '13px', color: '#666' },

  section: {
    maxWidth: '1000px', margin: '0 auto',
    padding: '5rem 2rem', textAlign: 'center',
  },
  sectionDark: { background: '#0d0d0d', padding: '5rem 2rem', textAlign: 'center' },
  sectionTag: {
    fontSize: '13px', color: '#22c55e', fontWeight: 600,
    textTransform: 'uppercase' as const, letterSpacing: '0.1em', margin: '0 0 12px',
  },
  sectionTitle: { fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 700, margin: '0 0 16px' },
  sectionSub: {
    fontSize: '16px', color: '#888', lineHeight: 1.7,
    maxWidth: '600px', margin: '0 auto 3rem',
  },

  stepsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px', marginTop: '3rem',
  },
  stepCard: {
    background: '#111', border: '1px solid #1e1e1e',
    borderRadius: '16px', padding: '2rem', textAlign: 'left' as const,
  },
  stepNum: { fontSize: '32px', fontWeight: 800, color: '#22c55e', marginBottom: '1rem' },
  stepTitle: { fontSize: '18px', fontWeight: 700, margin: '0 0 10px' },
  stepDesc: { fontSize: '14px', color: '#888', lineHeight: 1.7, margin: 0 },

  prizeGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px', maxWidth: '800px', margin: '3rem auto 0',
  },
  prizeCard: {
    background: '#111', border: '1px solid #1e1e1e',
    borderRadius: '16px', padding: '2rem', textAlign: 'center',
  },
  prizeShare: { fontSize: '40px', fontWeight: 800, color: '#22c55e', marginBottom: '8px' },
  prizeLabel: { fontSize: '16px', fontWeight: 700, marginBottom: '6px' },
  prizeMatch: { fontSize: '13px', color: '#666', marginBottom: '12px' },
  rolloverBadge: {
    background: '#1a2a1a', border: '1px solid #2a3a2a',
    borderRadius: '6px', padding: '4px 10px',
    fontSize: '12px', color: '#4ade80', display: 'inline-block',
  },

  charityCards: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px', marginTop: '2rem',
  },
  charityCard: {
    background: '#111', border: '1px solid #1e1e1e',
    borderRadius: '16px', padding: '1.5rem', textAlign: 'center',
  },
  charityIcon: { fontSize: '28px', marginBottom: '12px' },
  charityName: { fontSize: '15px', fontWeight: 600, marginBottom: '6px' },
  charityDesc: { fontSize: '13px', color: '#666' },

  ctaSection: {
    background: '#0f1f0f', border: '1px solid #1a2a1a',
    margin: '2rem', borderRadius: '20px',
    padding: '5rem 2rem', textAlign: 'center',
    display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center',
  },
  ctaTitle: { fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, margin: '0 0 16px' },
  ctaSub: { fontSize: '16px', color: '#888', margin: '0 0 2rem' },
  ctaBtn: {
    background: '#22c55e', color: '#000',
    padding: '16px 36px', borderRadius: '10px',
    fontSize: '16px', fontWeight: 700, textDecoration: 'none',
    display: 'inline-block', textAlign: 'center' as const,
  },

  footer: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1.5rem 2rem', borderTop: '1px solid #1a1a1a',
    fontSize: '13px', color: '#555', flexWrap: 'wrap' as const, gap: '12px',
  },
  footerLinks: { display: 'flex', gap: '16px' },
  footerLink: { color: '#555', textDecoration: 'none' },
}