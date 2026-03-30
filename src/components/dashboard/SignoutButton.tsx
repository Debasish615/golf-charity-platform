'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignoutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleSignout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignout}
      style={{
        background: 'none',
        border: '1px solid #2a2a2a',
        borderRadius: '8px',
        padding: '6px 14px',
        color: '#888',
        fontSize: '13px',
        cursor: 'pointer',
      }}
    >
      Sign out
    </button>
  )
}