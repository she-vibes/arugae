import { useState } from 'react'
import { supabase } from '../lib/supabase'

const T = {
  plum:'#1E0E3E', teal:'#0B7B82', tealLt:'#12A8B0',
  ember:'#C4622D', sunrise:'#F5894A', parchment:'#FAF3EC', gray:'#94A3B8'
}

export default function SignUp() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGoogle() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://arugae.vercel.app'
      }
    })
    if (error) setError(error.message)
    setLoading(false)
  }

  const s = {
    wrap: { minHeight:'100vh', background:T.plum, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:"'DM Sans', sans-serif" },
    card: { width:'100%', maxWidth:400, background:'rgba(255,255,255,0.04)', borderRadius:20, padding:'36px 28px', border:'1px solid rgba(255,255,255,0.08)' },
    logo: { fontFamily:'Georgia, serif', fontSize:30, fontWeight:900, color:T.parchment, textAlign:'center', marginBottom:4, letterSpacing:'-0.02em' },
    tamil: { fontSize:12, color:'rgba(255,255,255,0.25)', textAlign:'center', letterSpacing:'0.08em', marginBottom:6 },
    tagline: { fontSize:12, color:'rgba(255,255,255,0.35)', textAlign:'center', marginBottom:32 },
    googleBtn: {
      width:'100%', padding:'14px', background:'white',
      color:'#1E0E3E', border:'none', borderRadius:10,
      fontSize:14, fontWeight:700, cursor:'pointer',
      fontFamily:"'DM Sans', sans-serif",
      display:'flex', alignItems:'center', justifyContent:'center', gap:10,
      boxShadow:'0 4px 20px rgba(0,0,0,0.3)', transition:'all 0.15s'
    },
    error: { fontSize:12, color:'#F87171', marginTop:12, textAlign:'center' },
  }

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.logo}>arugae</div>
        <div style={s.tamil}>அருகே</div>
        <div style={s.tagline}>beside you, always</div>

        <p style={{ textAlign:'center', fontSize:13, color:T.gray, marginBottom:32, lineHeight:1.7 }}>
          A safe space for family caregivers.<br/>
          No judgment. Anonymous whenever you need.
        </p>

        <button
          style={s.googleBtn}
          onClick={handleGoogle}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.4-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7.1l-6.5 5C9.5 39.5 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.5-4.7 5.9l6.2 5.2C40.7 35.5 44 30.2 44 24c0-1.3-.1-2.7-.4-4z"/>
          </svg>
          {loading ? 'Redirecting...' : 'Continue with Google'}
        </button>

        {error && <div style={s.error}>{error}</div>}

        <p style={{ fontSize:11, color:'rgba(255,255,255,0.2)', textAlign:'center', marginTop:20 }}>
          🔒 Your data stays private and secure
        </p>
      </div>
    </div>
  )
}
