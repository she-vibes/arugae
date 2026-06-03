import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import SignUp from './screens/SignUp'
import Condition from './screens/Condition'
import Feed from './screens/Feed'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

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
      <div style={{ fontFamily:'Georgia, serif', fontSize:26, fontWeight:900, color:'#FAF3EC', letterSpacing:'-0.02em' }}>
        arugae<span style={{ display:'block', fontSize:11, fontWeight:400, color:'rgba(255,255,255,0.3)', letterSpacing:'0.12em', marginTop:6, textAlign:'center' }}>அருகே</span>
      </div>
    </div>
  )

  if (!session) return <SignUp />
  if (!profile?.condition) return <Condition session={session} onDone={setProfile} />
  return <Feed session={session} profile={profile} />
}
