import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const T = {
  plum:'#1E0E3E', teal:'#0B7B82', tealLt:'#12A8B0',
  ember:'#C4622D', parchment:'#FAF3EC', gray:'#94A3B8'
}

const ALL_CIRCLES = [
  { id:'cancer',    label:'Cancer',       icon:'🎗️' },
  { id:'dementia',  label:'Dementia',     icon:'🧠' },
  { id:'stroke',    label:'Stroke',       icon:'💙' },
  { id:'disability',label:'Disability',   icon:'♿' },
  { id:'elderly',   label:'Elderly Care', icon:'🌿' },
  { id:'other',     label:'Other',        icon:'🤍' },
]

const DUMMY_PEERS = [
  { id:'dummy-1', display_name:'Priya M.', avatar_color:'#0B7B82', conditions:['cancer','elderly'], location:'Chennai' },
  { id:'dummy-2', display_name:'Rahul S.', avatar_color:'#7C3AED', conditions:['dementia'], location:'Bangalore' },
  { id:'dummy-3', display_name:'Meena K.', avatar_color:'#C4622D', conditions:['stroke','disability'], location:'Mumbai' },
  { id:'dummy-4', display_name:'Ananya R.', avatar_color:'#0EA5E9', conditions:['elderly'], location:'Delhi' },
  { id:'dummy-5', display_name:'Vikram T.', avatar_color:'#059669', conditions:['cancer'], location:'Hyderabad' },
  { id:'dummy-6', display_name:'Sunita V.', avatar_color:'#DC2626', conditions:['disability','other'], location:'Pune' },
]

export default function Peers({ session, profile, onMessage }) {
  const [peers, setPeers] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPeers()
  }, [filter])

  async function fetchPeers() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_color, conditions')
      .neq('id', session.user.id)
      .not('display_name', 'is', null)

    // Merge real peers with dummy peers, dedup by display_name
    const realPeers = (data || [])
    const allPeers = [...realPeers, ...DUMMY_PEERS]

    const filtered = filter === 'all'
      ? allPeers
      : allPeers.filter(p => p.conditions?.includes(filter))

    setPeers(filtered)
    setLoading(false)
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      minHeight: '100%', background: T.plum,
      fontFamily: "'DM Sans', sans-serif",
      padding: '16px',
    }}>
      <div style={{
        fontFamily: 'Georgia, serif', fontSize: 22,
        fontWeight: 900, color: T.parchment, marginBottom: 4,
      }}>
        Find Peers
      </div>
      <p style={{ fontSize: 13, color: T.gray, marginBottom: 16, lineHeight: 1.6 }}>
        Connect with caregivers facing the same challenges.
      </p>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
            border: `1px solid ${filter === 'all' ? T.teal : 'rgba(255,255,255,0.15)'}`,
            background: filter === 'all' ? `${T.teal}22` : 'none',
            color: filter === 'all' ? T.tealLt : 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
          }}>
          All
        </button>
        {ALL_CIRCLES.map(c => (
          <button key={c.id} onClick={() => setFilter(c.id)} style={{
            padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
            border: `1px solid ${filter === c.id ? T.teal : 'rgba(255,255,255,0.15)'}`,
            background: filter === c.id ? `${T.teal}22` : 'none',
            color: filter === c.id ? T.tealLt : 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
          }}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
          Loading peers...
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {peers.map(peer => {
          const sharedCircles = (peer.conditions || []).filter(c => profile?.conditions?.includes(c))
          return (
            <div key={peer.id} style={{
              background: 'rgba(255,255,255,0.04)', borderRadius: 14,
              padding: '14px 16px', border: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                background: peer.avatar_color || T.teal,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700, color: 'white',
              }}>
                {(peer.display_name || '?')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 4 }}>
                  {peer.display_name}
                  {peer.location && (
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginLeft: 6, fontWeight: 400 }}>
                      📍 {peer.location}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {(peer.conditions || []).map(cid => {
                    const circle = ALL_CIRCLES.find(c => c.id === cid)
                    if (!circle) return null
                    const isShared = profile?.conditions?.includes(cid)
                    return (
                      <span key={cid} style={{
                        fontSize: 10, padding: '2px 6px', borderRadius: 20,
                        background: isShared ? `${T.teal}22` : 'rgba(255,255,255,0.06)',
                        color: isShared ? T.tealLt : 'rgba(255,255,255,0.35)',
                        border: `1px solid ${isShared ? T.teal + '44' : 'rgba(255,255,255,0.08)'}`,
                      }}>
                        {circle.icon} {circle.label}
                      </span>
                    )
                  })}
                  {sharedCircles.length > 0 && (
                    <span style={{ fontSize: 10, color: T.tealLt, padding: '2px 0' }}>
                      · {sharedCircles.length} shared
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => onMessage(peer)}
                style={{
                  background: T.teal, border: 'none', borderRadius: 8,
                  padding: '7px 12px', fontSize: 11, fontWeight: 700,
                  color: 'white', cursor: 'pointer', flexShrink: 0,
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                Message
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
