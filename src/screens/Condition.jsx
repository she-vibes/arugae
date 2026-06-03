import { useState } from 'react'
import { supabase } from '../lib/supabase'

const T = { plum:'#1E0E3E', teal:'#0B7B82', tealLt:'#12A8B0', ember:'#C4622D', parchment:'#FAF3EC', gray:'#94A3B8' }

const CONDITIONS = [
  { id:'cancer',    label:'Cancer',       icon:'🎗️', desc:'Chemo, radiation, palliative' },
  { id:'dementia',  label:'Dementia',     icon:'🧠', desc:'Alzheimer\'s, memory care' },
  { id:'stroke',    label:'Stroke',       icon:'💙', desc:'Recovery, rehabilitation' },
  { id:'disability',label:'Disability',   icon:'♿', desc:'Physical, developmental' },
  { id:'elderly',   label:'Elderly Care', icon:'🌿', desc:'Ageing, mobility, nutrition' },
  { id:'other',     label:'Other',        icon:'🤍', desc:'Any other condition' },
]

export default function Condition({ session, onDone }) {
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleJoin() {
    if (!selected) return
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: session.user.id,
        display_name: session.user.email.split('@')[0],
        condition: selected,
        avatar_color: T.teal,
      })
      .select()
      .single()
    if (!error) onDone(data)
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', background:T.plum, padding:'40px 20px', fontFamily:"'DM Sans', sans-serif" }}>
      <div style={{ maxWidth:400, margin:'0 auto' }}>
        <div style={{ fontSize:11, fontWeight:700, color:T.tealLt, letterSpacing:'0.12em', marginBottom:20 }}>STEP 3 OF 3</div>
        <div style={{ fontFamily:'Georgia, serif', fontSize:28, fontWeight:900, color:T.parchment, lineHeight:1.2, marginBottom:8 }}>
          Who are you<br/>caring for?
        </div>
        <p style={{ fontSize:13, color:T.gray, lineHeight:1.7, marginBottom:28 }}>
          We'll connect you with the right circle. Change anytime.
        </p>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:28 }}>
          {CONDITIONS.map(c => (
            <div key={c.id}
              onClick={() => setSelected(c.id)}
              style={{
                borderRadius:14, padding:'16px 14px', cursor:'pointer',
                border:`1.5px solid ${selected===c.id ? T.teal : 'rgba(255,255,255,0.08)'}`,
                background: selected===c.id ? `${T.teal}22` : 'rgba(255,255,255,0.04)',
                transition:'all 0.15s',
              }}>
              <div style={{ fontSize:24, marginBottom:8 }}>{c.icon}</div>
              <div style={{ fontSize:13, fontWeight:700, color:'white', marginBottom:2 }}>{c.label}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>{c.desc}</div>
            </div>
          ))}
        </div>

        <button
          onClick={handleJoin}
          disabled={!selected || loading}
          style={{
            width:'100%', padding:'14px',
            background: selected ? T.teal : 'rgba(255,255,255,0.08)',
            color:'white', border:'none', borderRadius:12,
            fontSize:14, fontWeight:700, cursor: selected ? 'pointer' : 'default',
            fontFamily:"'DM Sans', sans-serif", opacity: selected ? 1 : 0.5,
            transition:'all 0.2s',
          }}>
          {loading ? 'Joining...' : selected
            ? `Join ${CONDITIONS.find(c=>c.id===selected)?.label} Circle →`
            : 'Select a condition'}
        </button>
      </div>
    </div>
  )
}
