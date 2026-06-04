import { useState } from 'react'
import { supabase } from '../lib/supabase'

const T = {
  plum:'#1E0E3E', teal:'#0B7B82', tealLt:'#12A8B0',
  ember:'#C4622D', parchment:'#FAF3EC', gray:'#94A3B8'
}

export default function Header({ profile, activeCircle, onManageCircles }) {
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <>
      <div style={{
        padding:'12px 20px',
        borderBottom:'1px solid rgba(255,255,255,0.07)',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        background:'#1E0E3E', position:'sticky', top:0, zIndex:30, flexShrink:0
      }}>
        <div>
          <div style={{
            fontFamily:'Georgia, serif', fontSize:18,
            fontWeight:900, color:T.parchment, letterSpacing:'-0.02em'
          }}>
            arugae
          </div>
          {activeCircle && (
            <div style={{ fontSize:10, color:T.tealLt, marginTop:1 }}>
              {activeCircle.icon} {activeCircle.label} Circle
            </div>
          )}
        </div>

        <div style={{ position:'relative' }}>
          <div
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              width:36, height:36, borderRadius:'50%',
              background: profile?.avatar_color || T.teal,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:14, fontWeight:700, color:'white', cursor:'pointer',
              border:`2px solid ${menuOpen ? T.tealLt : 'transparent'}`,
              transition:'border 0.15s',
            }}>
            {(profile?.display_name || '?')[0].toUpperCase()}
          </div>

          {menuOpen && (
            <div style={{
              position:'absolute', right:0, top:44,
              background:'#2D1A52', borderRadius:12,
              border:'1px solid rgba(255,255,255,0.1)',
              boxShadow:'0 8px 32px rgba(0,0,0,0.4)',
              minWidth:210, zIndex:50, overflow:'hidden',
            }}>
              {/* User info */}
              <div style={{
                padding:'14px 16px',
                borderBottom:'1px solid rgba(255,255,255,0.07)'
              }}>
                <div style={{ fontSize:13, fontWeight:700, color:'white' }}>
                  {profile?.display_name || 'Caregiver'}
                </div>
                <div style={{ fontSize:11, color:T.gray, marginTop:2 }}>
                  {profile?.conditions?.length || 0} circle{profile?.conditions?.length !== 1 ? 's' : ''} enrolled
                </div>
              </div>

              {/* Manage circles — always shown */}
              <div
                onClick={() => {
                  if (onManageCircles) onManageCircles()
                  setMenuOpen(false)
                }}
                style={{
                  padding:'12px 16px', fontSize:13, color:'white',
                  cursor:'pointer', display:'flex', alignItems:'center', gap:10,
                  borderBottom:'1px solid rgba(255,255,255,0.07)'
                }}>
                <span>⭕</span> Manage Circles
              </div>

              {/* Sign out */}
              <div
                onClick={handleSignOut}
                style={{
                  padding:'12px 16px', fontSize:13,
                  color:'rgba(255,255,255,0.5)',
                  cursor:'pointer', display:'flex', alignItems:'center', gap:10
                }}>
                <span>👋</span> I'll be right back
              </div>
            </div>
          )}
        </div>
      </div>

      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{ position:'fixed', inset:0, zIndex:29 }}
        />
      )}
    </>
  )
}
