import { useState } from 'react'
import { supabase } from '../lib/supabase'

const T = {
  plum:'#1E0E3E', teal:'#0B7B82', tealLt:'#12A8B0',
  ember:'#C4622D', parchment:'#FAF3EC', gray:'#94A3B8'
}

export default function SignUp() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGoogle() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'https://arugae.vercel.app' }
    })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100dvh', background: T.plum,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: "'DM Sans', sans-serif",
      boxSizing: 'border-box',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            fontFamily: 'Georgia, serif', fontSize: 36,
            fontWeight: 900, color: T.parchment, letterSpacing: '-0.02em',
          }}>arugae</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginTop: 4 }}>
            அருகே
          </div>
        </div>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h1 style={{
            fontFamily: 'Georgia, serif', fontSize: 24,
            fontWeight: 900, color: T.parchment, lineHeight: 1.3, margin: '0 0 8px',
          }}>
            Come home. Be heard.
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, margin: 0 }}>
            A listening space for caregivers.<br />
            Judgement free. Anonymous whenever you need.
          </p>
        </div>

        {/* Welcome box */}
        <div style={{
          background: 'rgba(11,123,130,0.12)',
          border: '1px solid rgba(11,123,130,0.3)',
          borderRadius: 14, padding: '18px', marginBottom: 20,
        }}>
          <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, margin: '0 0 14px' }}>
            Welcome home. This is your safe space to step out of the caregiver role and simply exist as yourself. Caregiving is beautiful, but it can also be exhausting, overwhelming, and deeply isolating. Here, you do not have to hold it all together. You are allowed to be tired, frustrated, or uncertain without any judgment.
          </p>
          {[
            { icon: '🫂', label: 'Total anonymity', desc: 'Share your deepest thoughts without revealing your name.' },
            { icon: '🤍', label: 'Zero judgment', desc: 'Every emotion you feel is valid and safe to express here.' },
            { icon: '👂', label: 'Active listening', desc: 'Your voice, your struggles, and your wins matter.' },
            { icon: '🌿', label: 'Unconditional support', desc: 'You care for others; let this space care for you.' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
              <div>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: T.tealLt }}>{item.label}: </span>
                <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)' }}>{item.desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Security note */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10, padding: '12px 14px', marginBottom: 20,
          fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, textAlign: 'center',
        }}>
          🔒 Login securely to view your messages, chats and save contacts.
          Your data is private and never shared.
        </div>

        {/* Google button */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          style={{
            width: '100%', padding: '14px', background: 'white', color: T.plum,
            border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.4-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7.1l-6.5 5C9.5 39.5 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.5-4.7 5.9l6.2 5.2C40.7 35.5 44 30.2 44 24c0-1.3-.1-2.7-.4-4z"/>
          </svg>
          {loading ? 'Redirecting...' : 'Continue with Google'}
        </button>

        {error && (
          <div style={{ fontSize: 12, color: '#F87171', textAlign: 'center', marginTop: 12 }}>{error}</div>
        )}
      </div>
    </div>
  )
}
