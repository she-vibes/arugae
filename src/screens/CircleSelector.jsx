import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const T = {
  plum: '#1E0E3E', teal: '#0B7B82', tealLt: '#12A8B0',
  ember: '#C4622D', parchment: '#FAF3EC', gray: '#94A3B8'
}

const ALL_CIRCLES = [
  { id: 'cancer',     label: 'Cancer',       icon: '🎗️', desc: 'Chemo, radiation, palliative' },
  { id: 'dementia',   label: 'Dementia',      icon: '🧠', desc: 'Alzheimers, memory care' },
  { id: 'stroke',     label: 'Stroke',        icon: '💙', desc: 'Recovery, rehabilitation' },
  { id: 'disability', label: 'Disability',    icon: '♿', desc: 'Physical, developmental' },
  { id: 'elderly',    label: 'Elderly Care',  icon: '🌿', desc: 'Ageing, mobility, nutrition' },
  { id: 'other',      label: 'Other',         icon: '🤍', desc: 'Any other condition' },
]

export default function CircleSelector({ profile, onSelect, setProfile, session }) {
  const enrolled = profile?.conditions || []
  const unenrolled = ALL_CIRCLES.filter(c => !enrolled.includes(c.id))
  const enrolledCircles = ALL_CIRCLES.filter(c => enrolled.includes(c.id))

  const [popupOpen, setPopupOpen] = useState(false)
  const [adding, setAdding] = useState([])
  const [saving, setSaving] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(null)
  const [removing, setRemoving] = useState(null)
  const pressTimer = useRef(null)

  function toggleAdding(id) {
    setAdding(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function handlePressStart(id) {
    pressTimer.current = setTimeout(() => setConfirmRemove(id), 600)
  }

  function handlePressEnd() {
    clearTimeout(pressTimer.current)
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

  return (
    <div style={{
      padding: '24px 20px 100px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        <div style={{
          fontFamily: 'Georgia, serif', fontSize: 26,
          fontWeight: 900, color: T.parchment,
          lineHeight: 1.2, marginBottom: 8,
        }}>
          Enter a circle
        </div>
        <p style={{
          fontSize: 13, color: T.gray,
          lineHeight: 1.7, marginBottom: 20,
        }}>
          Tap to enter · Hold to remove
        </p>

        {/* Add More Circles button */}
        {unenrolled.length > 0 && (
          <button
            onClick={() => setPopupOpen(true)}
            style={{
              width: '100%', padding: '13px', marginBottom: 16,
              background: T.teal, border: 'none',
              borderRadius: 12, color: 'white',
              fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 20px rgba(11,123,130,0.3)',
            }}>
            ＋ Add More Circles
          </button>
        )}

        {/* Enrolled circles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {enrolledCircles.map(c => (
            <div key={c.id} style={{ position: 'relative' }}>
              <div
                onClick={() => confirmRemove !== c.id && onSelect(c)}
                onTouchStart={() => handlePressStart(c.id)}
                onTouchEnd={handlePressEnd}
                onMouseDown={() => handlePressStart(c.id)}
                onMouseUp={handlePressEnd}
                style={{
                  borderRadius: 14, padding: '16px 18px', cursor: 'pointer',
                  border: `1.5px solid ${T.teal}`,
                  background: `${T.teal}18`,
                  display: 'flex', alignItems: 'center', gap: 14,
                  transition: 'all 0.15s', userSelect: 'none',
                }}>
                <span style={{ fontSize: 26 }}>{c.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 2 }}>
                    {c.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                    {c.desc}
                  </div>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 18 }}>→</span>
              </div>

              {/* Confirm remove overlay */}
              {confirmRemove === c.id && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(30,14,62,0.97)',
                  borderRadius: 14,
                  border: '1.5px solid #C4622D',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 10, zIndex: 5, padding: 16,
                }}>
                  <span style={{
                    fontSize: 13, color: 'white',
                    fontWeight: 600, textAlign: 'center',
                  }}>
                    Remove {c.label} circle?
                  </span>
                  <p style={{
                    fontSize: 11, color: 'rgba(255,255,255,0.4)',
                    margin: 0, textAlign: 'center',
                  }}>
                    You can re-add it anytime.
                  </p>
                  <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                    <button
                      onClick={() => setConfirmRemove(null)}
                      style={{
                        flex: 1, padding: '10px',
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: 8, fontSize: 13, color: 'white',
                        cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                      }}>
                      Cancel
                    </button>
                    <button
                      onClick={() => removeCircle(c.id)}
                      disabled={removing === c.id}
                      style={{
                        flex: 1, padding: '10px',
                        background: '#C4622D', border: 'none',
                        borderRadius: 8, fontSize: 13,
                        fontWeight: 700, color: 'white',
                        cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                      }}>
                      {removing === c.id ? 'Removing...' : 'Yes, remove'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Circles popup */}
      {popupOpen && (
        <>
          <div
            onClick={() => { setPopupOpen(false); setAdding([]) }}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.6)', zIndex: 40,
            }}
          />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
            background: '#2D1A52',
            borderRadius: '20px 20px 0 0',
            padding: '24px 20px 48px',
            border: '1px solid rgba(255,255,255,0.1)',
            maxHeight: '70vh', overflowY: 'auto',
          }}>
            <div style={{
              fontFamily: 'Georgia, serif', fontSize: 20,
              fontWeight: 900, color: T.parchment, marginBottom: 6,
            }}>
              Add Circles
            </div>
            <p style={{ fontSize: 12, color: T.gray, marginBottom: 20 }}>
              Select circles to join
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {unenrolled.map(c => {
                const isAdding = adding.includes(c.id)
                return (
                  <div
                    key={c.id}
                    onClick={() => toggleAdding(c.id)}
                    style={{
                      borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
                      border: `1.5px solid ${isAdding ? T.teal : 'rgba(255,255,255,0.08)'}`,
                      background: isAdding ? `${T.teal}22` : 'rgba(255,255,255,0.04)',
                      display: 'flex', alignItems: 'center',
                      gap: 12, transition: 'all 0.15s',
                    }}>
                    <span style={{ fontSize: 22 }}>{c.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>
                        {c.label}
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                        {c.desc}
                      </div>
                    </div>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${isAdding ? T.teal : 'rgba(255,255,255,0.2)'}`,
                      background: isAdding ? T.teal : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: 'white', transition: 'all 0.15s',
                    }}>
                      {isAdding ? '✓' : ''}
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              onClick={saveNewCircles}
              disabled={!adding.length || saving}
              style={{
                width: '100%', padding: '13px',
                background: adding.length ? T.teal : 'rgba(255,255,255,0.08)',
                color: 'white', border: 'none', borderRadius: 10,
                fontSize: 14, fontWeight: 700,
                cursor: adding.length ? 'pointer' : 'default',
                fontFamily: "'DM Sans', sans-serif",
                opacity: adding.length ? 1 : 0.5,
              }}>
              {saving ? 'Saving...' : adding.length
                ? `Add ${adding.length} Circle${adding.length > 1 ? 's' : ''} →`
                : 'Select circles above'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
