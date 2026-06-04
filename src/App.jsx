import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import SignUp from './screens/SignUp'
import Condition from './screens/Condition'
import CircleSelector from './screens/CircleSelector'
import Feed from './screens/Feed'
import AruBot from './screens/AruBot'
import Plans from './screens/Plans'
import Header from './components/Header'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('feed')
  const [activeCircle, setActiveCircle] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        if (session) loadProfile(session.user.id)
        else { setProfile(null); setActiveCircle(null); setLoading(false) }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  // Loading splash
  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#1E0E3E', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontFamily:'Georgia, serif', fontSize:26, fontWeight:900, color:'#FAF3EC', textAlign:'center' }}>
        arugae
        <span style={{ display:'block', fontSize:11, fontWeight:400, color:'rgba(255,255,255,0.3)', letterSpacing:'0.12em', marginTop:6 }}>அருகே</span>
      </div>
    </div>
  )

  // Not logged in
  if (!session) return <SignUp />

  // First time — condition selection
  if (!profile?.conditions?.length)
    return <Condition session={session} onDone={setProfile} />

  // Circle selector
  if (!activeCircle) return (
    <CircleSelector
      profile={profile}
      setProfile={setProfile}
      session={session}
      onSelect={setActiveCircle}
      isFirstTime={false}
    />
  )

  // Main app
  return (
    <div style={{ minHeight:'100vh', background:'#1E0E3E', display:'flex', flexDirection:'column', fontFamily:"'DM Sans', sans-serif" }}>

      {/* Persistent header */}
      <Header
        profile={profile}
        activeCircle={activeCircle}
        onChangeCircle={() => setActiveCircle(null)}
      />

      {/* Screen content */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {activeTab === 'feed'   && <Feed   session={session} profile={profile} activeCircle={activeCircle} />}
        {activeTab === 'arubot' && <AruBot session={session} profile={profile} />}
        {activeTab === 'plans'  && <Plans />}
      </div>

      {/* Bottom nav — 3 tabs only */}
      <div style={{ position:'sticky', bottom:0, background:'#1E0E3E', borderTop:'1px solid rgba(255,255,255,0.07)', padding:'10px 0 6px', display:'flex', justifyContent:'space-around', zIndex:20 }}>
        {[
          { id:'feed',   icon:'🏠', label:'Feed' },
          { id:'arubot', icon:'🤖', label:'AruBot' },
          { id:'plans',  icon:'💰', label:'Plans' },
        ].map(tab => (
          <div key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, cursor:'pointer', opacity: activeTab===tab.id ? 1 : 0.35, transition:'opacity 0.15s' }}>
            <span style={{ fontSize:20 }}>{tab.icon}</span>
            <span style={{ fontSize:9, color: activeTab===tab.id ? '#12A8B0' : 'rgba(255,255,255,0.4)', fontWeight: activeTab===tab.id ? 700 : 400 }}>{tab.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
