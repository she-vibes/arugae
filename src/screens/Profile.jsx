import { useState } from 'react'
import { supabase } from '../lib/supabase'

const T = { plum:'#1E0E3E', teal:'#0B7B82', tealLt:'#12A8B0', ember:'#C4622D', parchment:'#FAF3EC', gray:'#94A3B8' }

const ALL_CONDITIONS = [
  { id:'cancer',    label:'Cancer',       icon:'🎗️' },
  { id:'dementia',  label:'Dementia',     icon:'🧠' },
  { id:'stroke',    label:'Stroke',       icon:'💙' },
  { id:'disability',label:'Disability',   icon:'♿' },
  { id:'elderly',   label:'Elderly Care', icon:'🌿' },
  { id:'other',     label:'Other',        icon:'🤍' },
]

export default function Profile({ session, profile, setProfile }) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [conditions, setConditions] = useState(profile?.conditions || [])
  const [name, setName] = useState(profile?.display_name || '')

  function toggleCondition(id) {
    setConditions(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  async function handleSave() {
    setSaving(true)
    const { data } = await supabase
      .from('profiles')
      .update({ display_name:name, conditions })
      .eq('id', session.user.id)
      .select()
      .single()
    if (data) { setProfile(data); setSaved(true); setTimeout(() => setSaved(false), 2000) }
    setSaving(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <div style={{ minHeight:'calc(100vh - 57px)', background:T.plum, padding:'24px 20px', fontFamily:"'DM Sans', sans-serif" }}>
      <div style={{ maxWidth:400, margin:'0 auto' }}>

        {/* Avatar */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:28 }}>
          <div style={{ width:64, height:64, borderRadius:'50%', background:T.teal, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:900, color:'white', marginBottom:12 }}>
            {(name||'?')[0].toUpperCase()}
          </div>
          <div style={{ fontSize:12, color:T.gray }}>{session.user.email}</div>
        </div>

        {/* Name */}
        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:11, fontWeight:600, color:T.gray, letterSpacing:'0.08em', display:'block', marginBottom:6 }}>DISPLAY NAME</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:'12px', fontSize:14, color:'white', fontFamily:"'DM Sans', sans-serif", outline:'none', boxSizing:'border-box' }}
          />
        </div>

        {/* Conditions */}
        <div style={{ marginBottom:28 }}>
          <label style={{ fontSize:11, fontWeight:600, color:T.gray, letterSpacing:'0.08em', display:'block', marginBottom:12 }}>MY CIRCLES</label>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {ALL_CONDITIONS.map(c => {
              const isSelected = conditions.includes(c.id)
              return (
                <div key={c.id} onClick={() => toggleCondition(c.id)} style={{
                  borderRadius:10, padding:'10px 12px', cursor:'pointer',
                  border:`1.5px solid ${isSelected ? T.teal : 'rgba(255,255,255,0.08)'}`,
                  background: isSelected ? `${T.teal}22` : 'rgba(255,255,255,0.03)',
                  display:'flex', alignItems:'center', gap:8, transition:'all 0.15s',
                }}>
                  <span style={{ fontSize:16 }}>{c.icon}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:'white' }}>{c.label}</span>
                  {isSelected && <span style={{ marginLeft:'auto', fontSize:10, color:T.tealLt }}>✓</span>}
                </div>
              )
            })}
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} style={{
          width:'100%', padding:'13px', background:T.teal, color:'white',
          border:'none', borderRadius:10, fontSize:14, fontWeight:700,
          cursor:'pointer', fontFamily:"'DM Sans', sans-serif", marginBottom:10,
          transition:'all 0.15s',
        }}>
          {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Changes'}
        </button>

        <button onClick={handleSignOut} style={{
          width:'100%', padding:'13px', background:'rgba(255,255,255,0.05)',
          color:'rgba(255,255,255,0.5)', border:'1px solid rgba(255,255,255,0.1)',
          borderRadius:10, fontSize:14, fontWeight:600,
          cursor:'pointer', fontFamily:"'DM Sans', sans-serif",
        }}>
          Sign Out
        </button>
      </div>
    </div>
  )
}
