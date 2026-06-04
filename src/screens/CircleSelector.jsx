const T = { plum:'#1E0E3E', teal:'#0B7B82', tealLt:'#12A8B0', ember:'#C4622D', parchment:'#FAF3EC', gray:'#94A3B8' }

const ALL_CIRCLES = [
  { id:'cancer',    label:'Cancer',       icon:'🎗️', desc:'Chemo, radiation, palliative' },
  { id:'dementia',  label:'Dementia',     icon:'🧠', desc:'Alzheimer\'s, memory care' },
  { id:'stroke',    label:'Stroke',       icon:'💙', desc:'Recovery, rehabilitation' },
  { id:'disability',label:'Disability',   icon:'♿', desc:'Physical, developmental' },
  { id:'elderly',   label:'Elderly Care', icon:'🌿', desc:'Ageing, mobility, nutrition' },
  { id:'other',     label:'Other',        icon:'🤍', desc:'Any other condition' },
]

export default function CircleSelector({ profile, onSelect }) {
  const enrolled = profile?.conditions || []

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
                display:'flex', alignItems:'center', gap:14,
                transition:'all 0.15s',
              }}>
                <span style={{ fontSize:26 }}>{c.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'white', marginBottom:2 }}>{c.label}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>{c.desc}</div>
                </div>
                {isEnrolled && (
                  <span style={{ fontSize:10, fontWeight:700, color:T.tealLt, background:`${T.teal}22`, padding:'3px 8px', borderRadius:20, border:`1px solid ${T.teal}44`, whiteSpace:'nowrap' }}>
                    Enrolled
                  </span>
                )}
                <span style={{ color:'rgba(255,255,255,0.2)', fontSize:16 }}>→</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
