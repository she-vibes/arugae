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

  if (loading) return (
    <div style={{
      height: '100dvh', background: '#1E0E3E',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        fontFamily: 'Georgia, serif', fontSize: 26,
        fontWeight: 900, color: '#FAF3EC', textAlign: 'center',
      }}>
        arugae
        <span style={{
          display: 'block', fontSize: 11, fontWeight: 400,
          color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', marginTop: 6,
        }}>
          அருகே
        </span>
      </div>
    </div>
  )

  if (!session) return <SignUp />

  if (!profile?.conditions?.length)
    return <Condition session={session} onDone={setProfile} />

  const tabs = [
    { id: 'feed',   icon: '🏠', label: 'Feed' },
    { id: 'arubot', icon: '🤖', label: 'AruBot' },
    { id: 'plans',  icon: '💰', label: 'Plans' },
  ]

  return (
    <div style={{
      height: '100dvh',
      background: '#1E0E3E',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      maxWidth: 480,
      margin: '0 auto',
      overflow: 'hidden',
    }}>

      {/* Header */}
      <Header
        profile={profile}
        activeCircle={activeCircle}
        onManageCircles={() => {
          setActiveCircle(null)
          setActiveTab('feed')
        }}
      />

      {/* Scrollable content */}
      <div style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* Feed tab */}
        {activeTab === 'feed' && !activeCircle && (
          <CircleSelector
            profile={profile}
            setProfile={setProfile}
            session={session}
            onSelect={(circle) => {
              setActiveCircle(circle)
              setActiveTab('feed')
            }}
          />
        )}

        {activeTab === 'feed' && activeCircle && (
          <Feed
            session={session}
            profile={profile}
            activeCircle={activeCircle}
            onBack={() => setActiveCircle(null)}
          />
        )}

        {/* AruBot — always accessible */}
        {activeTab === 'arubot' && (
          <AruBot session={session} profile={profile} />
        )}

        {/* Plans — always accessible */}
        {activeTab === 'plans' && (
          <Plans />
        )}
      </div>

      {/* Bottom nav */}
      <nav
        aria-label="Main navigation"
        style={{
          background: '#1E0E3E',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          justifyContent: 'space-around',
          padding: 'env(safe-area-inset-bottom, 8px) 0 8px',
          flexShrink: 0,
          zIndex: 20,
        }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            aria-label={tab.label}
            aria-current={activeTab === tab.id ? 'page' : undefined}
            style={{
              flex: 1, background: 'none', border: 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 2, cursor: 'pointer', padding: '6px 0',
              opacity: activeTab === tab.id ? 1 : 0.35,
              transition: 'opacity 0.15s',
            }}>
            <span style={{ fontSize: 22 }} aria-hidden="true">{tab.icon}</span>
            <span style={{
              fontSize: 10,
              color: activeTab === tab.id ? '#12A8B0' : 'rgba(255,255,255,0.4)',
              fontWeight: activeTab === tab.id ? 700 : 400,
            }}>
              {tab.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  )
}
