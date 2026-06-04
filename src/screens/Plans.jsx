const T = { plum:'#1E0E3E', teal:'#0B7B82', tealLt:'#12A8B0', ember:'#C4622D', sunrise:'#F5894A', parchment:'#FAF3EC', gray:'#94A3B8' }

const PLANS = [
  {
    name:'Free', price:'₹0', period:'forever',
    color:'rgba(255,255,255,0.04)', border:'rgba(255,255,255,0.08)', tc:'white',
    perks:['3 community circles','10 AruBot messages/day','Public resource library','Anonymous posting'],
    cta:'Current Plan', ctaStyle:{ background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.4)' }
  },
  {
    name:'Pro', price:'₹149', period:'per month',
    color:`rgba(11,123,130,0.15)`, border:'#0B7B82', tc:'white', badge:'MOST POPULAR',
    perks:['Unlimited circles','Unlimited AruBot','Expert text Q&A','Condition deep-dives','Priority feed'],
    cta:'Upgrade to Pro →', ctaStyle:{ background:'#0B7B82', color:'white' }
  },
  {
    name:'Expert Access', price:'₹499', period:'per month',
    color:'rgba(44,22,84,0.4)', border:'rgba(124,58,237,0.4)', tc:'white',
    perks:['Everything in Pro','Video consultations','Personalised care plans','Response within 2hrs','Care plan PDF export'],
    cta:'Upgrade to Expert →', ctaStyle:{ background:'#7C3AED', color:'white' }
  },
  {
    name:'NGO', price:'₹2,999', period:'per month',
    color:'rgba(196,98,45,0.12)', border:'rgba(196,98,45,0.4)', tc:'white',
    perks:['20 member seats','White-label option','Analytics dashboard','Dedicated account manager','Custom circles'],
    cta:'Contact Us →', ctaStyle:{ background:'#C4622D', color:'white' }
  },
]

export default function Plans() {
  return (
    <div style={{ minHeight:'calc(100vh - 57px)', background:'#1E0E3E', padding:'24px 20px 40px', fontFamily:"'DM Sans', sans-serif", overflowY:'auto' }}>
      <div style={{ maxWidth:400, margin:'0 auto' }}>
        <div style={{ fontFamily:'Georgia, serif', fontSize:26, fontWeight:900, color:'#FAF3EC', marginBottom:4 }}>Choose your plan</div>
        <p style={{ fontSize:13, color:'#94A3B8', marginBottom:24, lineHeight:1.6 }}>Upgrade or cancel anytime. No hidden fees.</p>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {PLANS.map((p, i) => (
            <div key={i} style={{
              borderRadius:16, padding:'18px', position:'relative',
              background:p.color, border:`1.5px solid ${p.border}`,
            }}>
              {p.badge && (
                <div style={{ position:'absolute', top:-10, right:16, background:'#F5894A', color:'white', fontSize:9, fontWeight:800, padding:'3px 10px', borderRadius:20, letterSpacing:'0.08em' }}>
                  {p.badge}
                </div>
              )}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:700, color:'white' }}>{p.name}</div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginTop:1 }}>{p.period}</div>
                </div>
                <div style={{ fontFamily:'Georgia, serif', fontSize:24, fontWeight:900, color:'#F5894A' }}>{p.price}</div>
              </div>
              <div style={{ marginBottom:14 }}>
                {p.perks.map((perk, j) => (
                  <div key={j} style={{ fontSize:12, color:'rgba(255,255,255,0.65)', marginBottom:5, display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ color:T.tealLt, fontSize:10 }}>✓</span> {perk}
                  </div>
                ))}
              </div>
              <button style={{
                width:'100%', padding:'11px', border:'none', borderRadius:10,
                fontSize:13, fontWeight:700, cursor:'pointer',
                fontFamily:"'DM Sans', sans-serif", ...p.ctaStyle
              }}>
                {p.cta}
              </button>
            </div>
          ))}
        </div>

        <p style={{ fontSize:11, color:'rgba(255,255,255,0.2)', textAlign:'center', marginTop:20 }}>
          All plans include anonymous posting and community access.
        </p>
      </div>
    </div>
  )
}
