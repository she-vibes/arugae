import { useState } from 'react'
import { supabase } from '../lib/supabase'

const T = { plum:'#1E0E3E', teal:'#0B7B82', tealLt:'#12A8B0', ember:'#C4622D', parchment:'#FAF3EC', gray:'#94A3B8' }

export default function Header({ profile, activeCircle, onChangeCircle }) {
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
          <div style={{ fontFamily:'Georgia, serif', fontSize:18, fontWeight:900, color:T.parchment, letterSpacing:'-0.02em' }}>
            ar​​​​​​​​​​​​​​​​
