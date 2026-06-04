import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import SignUp from './screens/SignUp'
import Condition from './screens/Condition'
import CircleSelector from './screens/CircleSelector'
import Feed from './screens/Feed'
import AruBot from './screens/AruBot'
import Profile from './screens/Profile'
import Plans from './screens/Plans'

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
        else { setProfile(null); setLoading(false) }
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

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#1E0E3E', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontFamily:'Georgia, serif', fontSize:26, fontWeight:900, color:'#FAF3EC', letterSpacing:'-0.02em', textAlign:'center' }}>
        arugae
        <span style={{ display:'block', fontSize:11, fontWeight:400, color:'rgba(255,255,255,0.3)', letterSpacing:'0.12em', marginTop:6 }}>அருகே</span>
      </div>
    </div>
  )

  if (!session) return <SignUp />

  if (!profile?.conditions?.length)
    return <Condition session={session} onDone={setProfile} />

  if (!activeCircle)
    return <CircleSelector profile={profile} onSelect={setActiveCircle} />

  const sharedProps = { session, profile, activeCircle, setActiveCircle }

  return (
    <div style={{ minHeight:'100vh', background:'#1E0E3E', display:'flex', flexDirection:'column', fontFamily:"'DM Sans', sans-serif" }}>
      <div style={{ flex:1, overflowY:'auto' }}>
        {activeTab === 'feed'    && <Feed    {...sharedProps} />}
        {activeTab === 'arubot' && <AruBot  {...sharedProps} />}
        {activeTab === 'profile' && <Profile {...sharedProps} setProfile={setProfile} />}
        {activeTab === 'plans'   && <Plans   {...sharedProps} />}
      </div>

      {/* Bottom nav */}
      <div style={{ position:'sticky', bottom:0, background:'#1E0E3E', borderTop:'1px solid rgba(255,255,255,0.07)', padding:'10px 0 6px', display:'flex', justifyContent:'space-around', zIndex:20 }}>
        {[
          { id:'feed',    icon:'🏠', label:'Feed' },
          { id:'arubot',  icon:'🤖', label:'AruBot' },
          { id:'profile', icon:'👤', label:'Profile' },
          { id:'plans',   icon:'💰', label:'Plans' },
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
