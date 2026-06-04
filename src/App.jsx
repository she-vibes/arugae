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
      .from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
    setLoading(false)
  }

  function handleTabChange(tabId) {
    setActiveTab(tabId)
  }

  const BottomNav = () => (
    <div style={{
      background:'#1E0E3E',
      borderTop:'1px solid rgba(255,255,255,0.07)',
      padding:'10px 0 6px',
      display:'flex', justifyContent:'space-around',
      zIndex:20, flexShrink:0,
    }}>
      {[
        { id:'feed',   icon:'🏠', label:'Feed' },
        { id:'arubot', icon:'🤖', label:'AruBot' },
        { id:'plans',  icon:'💰', label:'Plans' },
      ].map(tab => (
        <div
          key={tab.id}
          onClick={() => handleTabChange(tab.id)}
          role="button"
          tabIndex={0}
          aria-label={tab.label}
          aria-current={activeTab === tab.id ? 'page' : undefined}
          onKeyDown={e => e.key === 'Enter' && handleTabChange(tab.id)}
          style={{
            display:'flex', flexDirection:'column', alignItems:'center',
            gap:2, cursor:'pointer',
            opacity: activeTab === tab.id ? 1 : 0.35,
            transition:'opacity 0.15s', padding:'4px 20px',
          }}>
          <span style={{ fontSize:20 }}>{tab.icon}</span>
          <span style={{
            fontSize:9,
            color: activeTab === tab.id ? '#12A8B0' : 'rgba(255,255,255,0.4)',
            fontWeight: activeTab === tab.id ? 700 : 400
          }}>{tab.label}</span>
        </div>
      ))}
    </div>
  )

  if (loading) return (
    <div style={{
      minHeight:'100vh', background:'#1E0E3E',
      display:'flex', alignItems:'center', justifyContent:'center'
    }}>
      <div style={{
        fontFamily:'Georgia, serif', fontSize:26,
        fontWeight:900, color:'#FAF3EC', textAlign:'center'
      }}>
        arugae
        <span style={{
          display:'block', fontSize:11, fontWeight:400,
          color:'rgba(255,255,255,0.3)', letterSpacing:'0.12em', marginTop:6
        }}>
          அருகே
        </span>
      </div>
    </div>
  )

  if (!session) return <SignUp />

  if (!profile?.conditions?.length)
    return <Condition session={session} onDone={setProfile} />

  // ── MAIN LAYOUT — used for ALL screens after login ──
  return (
    <div style={{
      height:'100vh', background:'#1E0E3E',
      display:'flex', flexDirection:'column',
      fontFamily:"'DM Sans', sans-serif",
      overflow:'hidden',
    }}>
      <Header
        profile={profile}
        activeCircle={activeCircle}
        onManageCircles={() => setActiveCircle(null)}
      />

      {/* Scrollable content area */}
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
        {!activeCircle && (
          <CircleSelector
            profile={profile}
            setProfile={setProfile}
            session={session}
            onSelect={setActiveCircle}
          />
        )}

        {activeCircle && activeTab === 'feed' && (
          <Feed
            session={session}
            profile={profile}
            activeCircle={activeCircle}
          />
        )}

        {activeCircle && activeTab === 'arubot' && (
          <AruBot session={session} profile={profile} />
        )}

        {activeCircle && activeTab === 'plans' && (
          <Plans />
        )}
      </div>

      {/* Bottom nav — always visible */}
      <BottomNav />
    </div>
  )
}
