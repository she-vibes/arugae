import { useState } from 'react'
import { supabase } from '../lib/supabase'

const T = { plum:'#1E0E3E', teal:'#0B7B82', tealLt:'#12A8B0', ember:'#C4622D', parchment:'#FAF3EC', gray:'#94A3B8' }

const SYSTEM_PROMPT = `You are AruBot, a compassionate AI companion for family caregivers on Arugae — a platform whose name means "beside you" in Tamil. 

You support people caring for loved ones with cancer, dementia, stroke, disability, or elderly care needs.

Your personality: warm, calm, non-judgmental. You listen first. You never diagnose or prescribe. You speak in plain language, not medical jargon. You acknowledge emotions before giving information.

If someone is in crisis or mentions self-harm, gently direct them to iCall India: 9152987821.

Keep responses concise — this is a mobile chat. Use short paragraphs. Occasionally use bullet points for practical tips.`

export default function AruBot({ profile }) {
  const [messages, setMessages] = useState([
    { role:'assistant', content:`Hi${profile?.display_name ? ' ' + profile.display_name : ''} 🤍 I'm AruBot — here for you any time, day or night. What's on your mind today?` }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const FREE_LIMIT = 10

  async function sendMessage() {
    if (!input.trim() || loading) return
    if (messages.filter(m => m.role === 'user').length >= FREE_LIMIT) return

    const userMsg = { role:'user', content:input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          model:'claude-sonnet-4-20250514',
          max_tokens:1000,
          system: SYSTEM_PROMPT,
          messages: newMessages.map(m => ({ role:m.role, content:m.content }))
        })
      })
      const data = await response.json()
      const reply = data.content?.[0]?.text || "I'm here. Can you tell me a little more?"
      setMessages(prev => [...prev, { role:'assistant', content:reply }])
    } catch {
      setMessages(prev => [...prev, { role:'assistant', content:"I'm having trouble connecting right now. Please try again in a moment 🤍" }])
    }
    setLoading(false)
  }

  const userMsgCount = messages.filter(m => m.role === 'user').length
  const remaining = FREE_LIMIT - userMsgCount

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 57px)', background:T.plum, fontFamily:"'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
        <div style={{ width:36, height:36, borderRadius:'50%', background:`linear-gradient(135deg, ${T.teal}, #7C3AED)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🤖</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:700, color:T.parchment }}>AruBot</div>
          <div style={{ fontSize:10, color:T.tealLt }}>● Powered by Claude AI · Always here</div>
        </div>
        <div style={{ background:'rgba(245,137,74,0.15)', border:'1px solid rgba(245,137,74,0.3)', borderRadius:20, padding:'4px 10px', fontSize:10, color:'#F5894A', fontWeight:600 }}>
          {remaining}/{FREE_LIMIT} free
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display:'flex', justifyContent: m.role==='user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth:'85%',
              background: m.role==='user' ? T.teal : 'rgba(255,255,255,0.07)',
              borderRadius: m.role==='user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              padding:'12px 14px',
              border: m.role==='assistant' ? '1px solid rgba(255,255,255,0.08)' : 'none',
            }}>
              <p style={{ fontSize:13, color:'white', lineHeight:1.65, margin:0, whiteSpace:'pre-line' }}>{m.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display:'flex', justifyContent:'flex-start' }}>
            <div style={{ background:'rgba(255,255,255,0.07)', borderRadius:'16px 16px 16px 4px', padding:'12px 16px', border:'1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize:18, letterSpacing:4 }}>···</span>
            </div>
          </div>
        )}
        {remaining === 0 && (
          <div style={{ background:'rgba(196,98,45,0.15)', border:'1px solid rgba(196,98,45,0.3)', borderRadius:12, padding:'14px', textAlign:'center' }}>
            <div style={{ fontSize:13, color:T.parchment, fontWeight:600, marginBottom:4 }}>Daily limit reached</div>
            <div style={{ fontSize:12, color:T.gray }}>Upgrade to Pro for unlimited AruBot conversations</div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding:'10px 16px 14px', borderTop:'1px solid rgba(255,255,255,0.07)', flexShrink:0 }}>
        <div style={{ display:'flex', gap:8 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={remaining > 0 ? 'Ask AruBot anything...' : 'Upgrade for more messages'}
            disabled={remaining === 0 || loading}
            style={{ flex:1, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'12px 14px', fontSize:13, color:'white', fontFamily:"'DM Sans', sans-serif", outline:'none' }}
          />
          <button onClick={sendMessage} disabled={!input.trim() || loading || remaining === 0} style={{
            background: input.trim() && remaining > 0 ? `linear-gradient(135deg, ${T.teal}, #7C3AED)` : 'rgba(255,255,255,0.08)',
            border:'none', borderRadius:12, padding:'12px 16px', color:'white', fontSize:18, cursor:'pointer', transition:'all 0.15s'
          }}>↑</button>
        </div>
        <p style={{ fontSize:10, color:'rgba(255,255,255,0.2)', textAlign:'center', marginTop:8 }}>
          AruBot is not a doctor. Always consult your medical team.
        </p>
      </div>
    </div>
  )
}
