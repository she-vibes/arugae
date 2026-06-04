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
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)

  function toggle(id) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  async function handleJoin() {
    if (!selected.length) return
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: session.user.id,
        display_name: session.user.email?.split('@')[0] || session.user.user_metadata?.name || 'Caregiver',
        conditions: selected,
        avatar_color: T.teal,
      })
      .select()
      .single()
    if (!error) onDone(data)
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', background:T.plum, padding:'40px 20px 100px', fontFamily:"'DM Sans', sans-serif" }}>
      <div style={{ maxWidth:400, margin:'0 auto' }}>
        <div style={{ fontSize:11, fontWeight:700, color:T.tealLt, letterSpacing:'0.12em', marginBottom:20 }}>STEP 3 OF 3</div>
        <div style={{ fontFamily:'Georgia, serif', fontSize:28, fontWeight:900, color:T.parchment, lineHeight:1.2, marginBottom:8 }}>
          Who are you<br/>caring for?
        </div>
        <p style={{ fontSize:13, color:T.gray, lineHeight:1.7, marginBottom:8 }}>
          Select all that apply. You can change anytime.
        </p>
        <p style={{ fontSize:12, color:T.tealLt, marginBottom:24 }}>
          {selected.length === 0 ? 'No circles selected yet' : `${selected.length} circle${selected.length > 1 ? 's' : ''} selected`}
        </p>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:28 }}>
          {CONDITIONS.map(c => {
            const isSelected = selected.includes(c.id)
            return (
              <div key={c.id} onClick={() => toggle(c.id)} style={{
                borderRadius:14, padding:'16px 14px', cursor:'pointer',
                border:`1.5px solid ${isSelected ? T.teal : 'rgba(255,255,255,0.08)'}`,
                background: isSelected ? `${T.teal}22` : 'rgba(255,255,255,0.04)',
                transition:'all 0.15s', position:'relative',
              }}>
                {isSelected && (
                  <div style={{ position:'absolute', top:8, right:8, width:16, height:16, borderRadius:'50%', background:T.teal, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, color:'white', fontWeight:700 }}>✓</div>
                )}
                <div style={{ fontSize:24, marginBottom:8 }}>{c.icon}</div>
                <div style={{ fontSize:13, fontWeight:700, color:'white', marginBottom:2 }}>{c.label}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>{c.desc}</div>
              </div>
            )
          })}
        </div>

        <button onClick={handleJoin} disabled={!selected.length || loading} style={{
          width:'100%', padding:'14px',
          background: selected.length ? T.teal : 'rgba(255,255,255,0.08)',
          color:'white', border:'none', borderRadius:12,
          fontSize:14, fontWeight:700,
          cursor: selected.length ? 'pointer' : 'default',
          fontFamily:"'DM Sans', sans-serif",
          opacity: selected.length ? 1 : 0.5,
          transition:'all 0.2s',
        }}>
          {loading ? 'Joining...' : selected.length ? `Join ${selected.length} Circle${selected.length > 1 ? 's' : ''} →` : 'Select at least one'}
        </button>
      </div>
    </div>
  )
}
