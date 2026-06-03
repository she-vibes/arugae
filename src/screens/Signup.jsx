import { useState } from 'react'
import { supabase } from '../lib/supabase'

const T = {
  plum:'#1E0E3E', teal:'#0B7B82', tealLt:'#12A8B0',
  ember:'#C4622D', sunrise:'#F5894A', parchment:'#FAF3EC', gray:'#94A3B8'
}

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!email.includes('@')) { setError('Enter a valid email'); return }
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  const s = {
    wrap: { minHeight:'100vh', background:T.plum, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:"'DM Sans', sans-serif" },
    card: { width:'100%', maxWidth:400, background:'rgba(255,255,255,0.04)', borderRadius:20, padding:'36px 28px', border:'1px solid rgba(255,255,255,0.08)' },
    logo: { fontFamily:'Georgia, serif', fontSize:30, fontWeight:900, color:T.parchment, textAlign:'center', marginBottom:4, letterSpacing:'-0.02em' },
    tamil: { fontSize:12, color:'rgba(255,255,255,0.25)', textAlign:'center', letterSpacing:'0.08em', marginBottom:6 },
    tagline: { fontSize:12, color:'rgba(255,255,255,0.35)', textAlign:'center', marginBottom:28 },
    label: { fontSize:11, fontWeight:600, color:T.gray, letterSpacing:'0.08em', display:'block', marginBottom:6 },
    input: { width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:'14px 12px', fontSize:14, color:'white', fontFamily:"'DM Sans', sans-serif", outline:'none', boxSizing:'border-box' },
    btn: { width:'100%', padding:'14px', background:T.ember, color:'white', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans', sans-serif", marginTop:20, letterSpacing:'0.01em' },
    error: { fontSize:12, color:'#F87171', marginTop:8 },
  }

  if (sent) return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.logo}>arugae</div>
        <div style={s.tamil}>அருகே</div>
        <div style={{ textAlign:'center', marginTop:20 }}>
          <div style={{ fontSize:36, marginBottom:16 }}>📬</div>
          <div style={{ fontSize:18, fontWeight:700, color:'white', marginBottom:8 }}>Check your email</div>
          <p style={{ fontSize:13, color:T.gray, lineHeight:1.7 }}>
            We sent a magic link to <strong style={{ color:'white' }}>{email}</strong>.<br/>
            Click it to sign in — no password needed.
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.logo}>arugae</div>
        <div style={s.tamil}>அருகே</div>
        <div style={s.tagline}>beside you, always</div>
        <p style={{ textAlign:'center', fontSize:13, color:T.gray, marginBottom:28, lineHeight:1.7 }}>
          A safe space for family caregivers.<br/>
          No judgment. Anonymous whenever you need.
        </p>
        <label style={s.label}>YOUR EMAIL</label>
        <input
          style={s.input}
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={e => { setEmail(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />
        {error && <div style={s.error}>{error}</div>}
        <button style={s.btn} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Sending...' : 'Send Magic Link →'}
        </button>
        <p style={{ fontSize:11, color:'rgba(255,255,255,0.2)', textAlign:'center', marginTop:14 }}>
          🔒 Your data stays private and secure
        </p>
      </div>
    </div>
  )
}
