import { useState } from 'react'
import { supabase } from '../lib/supabase'

const T = { plum:'#1E0E3E', teal:'#0B7B82', tealLt:'#12A8B0', ember:'#C4622D', parchment:'#FAF3EC', gray:'#94A3B8' }

const ALL_CIRCLES = [
  { id:'cancer',    label:'Cancer',       icon:'🎗️', desc:'Chemo, radiation, palliative' },
  { id:'dementia',  label:'Dementia',     icon:'🧠', desc:'Alzheimer\'s, memory care' },
  { id:'stroke',    label:'Stroke',       icon:'💙', desc:'Recovery, rehabilitation' },
  { id:'disability',label:'Disability',   icon:'♿', desc:'Physical, developmental' },
  { id:'elderly',   label:'Elderly Care', icon:'🌿', desc:'Ageing, mobility, nutrition' },
  { id:'other',     label:'Other',        icon:'🤍', desc:'Any other condition' },
]

export default function CircleSelector({ profile, onSelect, setProfile, session, isFirstTime }) {
  const enrolled = profile?.conditions || []
  const unenrolled = ALL_CIRCLES.filter(c => !enrolled.includes(c.id))
  const enrolledCircles = ALL_CIRCLES.filter(c => enrolled.includes(c.id))

  const [popupOpen, setPopupOpen] = useState(false)
  const [adding, setAdding] = useState([])
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(null)
  const [confirmRemove, setConfirmRemove] = useState(null)

  function toggleAdding(id) {
    setAdding(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  async function saveNewCircles() {
    if (!adding.length) return
    setSaving(true)
    const updated = [...enrolled, ...adding]
    const { data } = await supabase
      .from('profiles')
      .update({ conditions: updated })
      .eq('id', session.user.id)
      .select()
      .single()
    if (data) setProfile(data)
    setAdding([])
    setPopupOpen(false)
    setSaving(false)
  }

  async function removeCircle(id) {
    setRemoving(id)
    const updated = enrolled.filter(x => x !== id)
    const { data } = await supabase
      .from('profiles')
      .update({ conditions: updated })
      .eq('id', session.user.id)
      .select()
      .single()
    if (data) setProfile(data)
    setConfirmRemove(null)
    setRemoving(null)
  }

  // ── FIRST TIME ──
  if (isFirstTime) {
    return (
      <div style={{ minHeight:'100vh', background:T.plum, padding:'40px 20px', fontFamily:"'DM Sans', sans-serif" }}>
        <div style={{ maxWidth:400, margin:'0 auto' }}>
          <div style={{ fontFamily:'Georgia, serif', fontSize:28, fontWeight:900, color:T.parchment, lineHeight:1.2, marginBottom:8 }}>
            Which circle are<br/>you entering?
          </div>
          <p style={{ fontSize:13, color:T.gray, lineHeight:1.7, marginBottom:28 }}>
            Your enrolled circles are highlighted. You can browse any circle.
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {ALL_CIRCLES.map(c => {
              const isEnrolled = enrolled.includes(c.id)
              return (
                <div key={c.id} onClick={() => onSelect(c)} style={{
                  borderRadius:14, padding:'16px 18px', cursor:'pointer',
                  border:`1.5px solid ${isEnrolled ? T.teal : 'rgba(255,255,255,0.08)'}`,
                  background: isEnrolled ? `${T.teal}18` : 'rgba(255,255,255,0.03)',
                  display:'flex', alignItems:'center', gap:14, transition:'all 0.15s',
                }}>
                  <span style={{ fontSize:26 }}>{c.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'white', marginBottom:2 }}>{c.label}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>{c.desc}</div>
                  </div>
                  {isEnrolled
                    ? <span style={{ fontSize:10, fontWeight:700, color:T.tealLt, background:`${T.teal}22`, padding:'3px 8px', borderRadius:20, border:`1px solid ${T.teal}44` }}>Enrolled</span>
                    : <span style={{ fontSize:11, color:'rgba(255,255,255,0.2)' }}>Browse →</span>
                  }
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── RETURNING USER ──
  return (
    <div style={{ minHeight:'100vh', background:T.plum, padding:'24px 20px', fontFamily:"'DM Sans', sans-serif" }}>
      <div style={{ maxWidth:400, margin:'0 auto' }}>
        <div style={{ fontFamily:'Georgia, serif', fontSize:28, fontWeight:900, color:T.parchment, lineHeight:1.2, marginBottom:8 }}>
          Enter a circle
        </div>
        <p style={{ fontSize:13, color:T.gray, lineHeight:1.7, marginBottom:20 }}>
          Tap to enter · Swipe left to remove
        </p>

        {unenrolled.length > 0 && (
          <button onClick={() => setPopupOpen(true)} style={{
            width:'100%', padding:'11px', marginBottom:16,
            background:'rgba(255,255,255,0.04)',
            border:'1px dashed rgba(255,255,255,0.2)',
            borderRadius:10, color:T.tealLt, fontSize:13, fontWeight:600,
            cursor:'pointer', fontFamily:"'DM Sans', sans-serif",
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          }}>
            + Add More Circles
          </button>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {enrolledCircles.map(c => (
            <div key={c.id} style={{ position:'relative' }}>
              <div
                onClick={() => confirmRemove === c.id ? setConfirmRemove(null) : onSelect(c)}
                style={{
                  borderRadius:14, padding:'16px 18px', cursor:'pointer',
                  border:`1.5px solid ${T.teal}`,
                  background:`${T.teal}18`,
                  display:'flex', alignItems:'center', gap:14, transition:'all 0.15s',
                }}>
                <span style={{ fontSize:26 }}>{c.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'white', marginBottom:2 }}>{c.label}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>{c.desc}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  {/* Remove button */}
                  <div
                    onClick={e => { e.stopPropagation(); setConfirmRemove(confirmRemove === c.id ? null : c.id) }}
                    style={{
                      width:26, height:26, borderRadius:'50%',
                      background:'rgba(255,255,255,0.08)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:12, color:'rgba(255,255,255,0.4)', cursor:'pointer',
                    }}>
                    ✕
                  </div>
                  <span style={{ color:'rgba(255,255,255,0.3)', fontSize:18 }}>→</span>
                </div>
              </div>

              {/* Confirm remove */}
              {confirmRemove === c.id && (
                <div style={{
                  position:'absolute', top:0, left:0, right:0, bottom:0,
                  background:'rgba(196,98,45,0.15)', borderRadius:14,
                  border:'1.5px solid rgba(196,98,45,0.5)',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                  zIndex:5,
                }}>
                  <span style={{ fontSize:12, color:'white' }}>Remove {c.label}?</span>
                  <button
                    onClick={() => removeCircle(c.id)}
                    disabled={removing === c.id}
                    style={{ background:'#C4622D', border:'none', borderRadius:8, padding:'6px 12px', fontSize:12, fontWeight:700, color:'white', cursor:'pointer' }}>
                    {removing === c.id ? '...' : 'Yes'}
                  </button>
                  <button
                    onClick={() => setConfirmRemove(null)}
                    style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:8, padding:'6px 12px', fontSize:12, color:'white', cursor:'pointer' }}>
                    No
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Circles Popup */}
      {popupOpen && (
        <>
          <div onClick={() => setPopupOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:40 }} />
          <div style={{
            position:'fixed', bottom:0, left:0, right:0, zIndex:50,
            background:'#2D1A52', borderRadius:'20px 20px 0 0',
            padding:'24px 20px 40px',
            border:'1px solid rgba(255,255,255,0.1)',
            maxHeight:'70vh', overflowY:'auto',
          }}>
            <div style={{ fontFamily:'Georgia, serif', fontSize:20, fontWeight:900, color:T.parchment, marginBottom:6 }}>Add Circles</div>
            <p style={{ fontSize:12, color:T.gray, marginBottom:20 }}>Select circles to join</p>
            <div style={{ display:'flex', flexDirection:'column', gap:8​​​​​​​​​​​​​​​​
