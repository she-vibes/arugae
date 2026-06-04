import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const T = { plum:'#1E0E3E', teal:'#0B7B82', tealLt:'#12A8B0', ember:'#C4622D', sunrise:'#F5894A', parchment:'#FAF3EC', gray:'#94A3B8' }

const CONDITIONS = [
  { id:'cancer',    label:'Cancer',       icon:'🎗️' },
  { id:'dementia',  label:'Dementia',     icon:'🧠' },
  { id:'stroke',    label:'Stroke',       icon:'💙' },
  { id:'disability',label:'Disability',   icon:'♿' },
  { id:'elderly',   label:'Elderly Care', icon:'🌿' },
  { id:'other',     label:'Other',        icon:'🤍' },
]

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 60000)
  if (diff < 1) return 'just now'
  if (diff < 60) return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff/60)}h ago`
  return `${Math.floor(diff/1440)}d ago`
}

export default function Feed({ session, profile }) {
  const [posts, setPosts] = useState([])
  const [text, setText] = useState('')
  const [anon, setAnon] = useState(false)
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    fetchPosts()
    const channel = supabase
      .channel('arugae-posts')
      .on('postgres_changes',
        { event:'INSERT', schema:'public', table:'posts' },
        payload => setPosts(prev => [payload.new, ...prev])
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchPosts() {
    const { data } = await supabase
      .from('posts')
      .select('*, circles(name, icon), profiles(display_name, avatar_color)')
      .order('created_at', { ascending:false })
      .limit(20)
    if (data) setPosts(data)
  }

  async function submitPost() {
    if (!text.trim()) return
    setPosting(true)
    await supabase.from('posts').insert({
      author_id: anon ? null : session.user.id,
      circle_id: 1,
      content: text.trim(),
      is_anonymous: anon,
    })
    setText('')
    setPosting(false)
  }

  const myCondition = CONDITIONS.find(c => c.id === profile?.condition)

  return (
    <div style={{ minHeight:'100vh', background:T.plum, display:'flex', flexDirection:'column', fontFamily:"'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, background:T.plum, zIndex:10 }}>
        <div>
          <div style={{ fontFamily:'Georgia, serif', fontSize:20, fontWeight:900, color:T.parchment, letterSpacing:'-0.02em' }}>arugae</div>
          <div style={{ fontSize:10, color:T.tealLt, marginTop:1 }}>
            {myCondition?.icon} {myCondition?.label} Circle
          </div>
        </div>
        <div style={{ width:34, height:34, borderRadius:'50%', background:profile?.avatar_color||T.teal, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'white' }}>
          {(profile?.display_name||'?')[0].toUpperCase()}
        </div>
      </div>

      {/* Compose */}
      <div style={{ margin:'12px 16px', background:'rgba(255,255,255,0.05)', borderRadius:14, padding:'12px 14px', border:'1px solid rgba(255,255,255,0.1)', flexShrink:0 }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Share what's on your mind..."
          rows={2}
          style={{ width:'100%', background:'none', border:'none', outline:'none', color:'white', fontFamily:"'DM Sans', sans-serif", fontSize:13, lineHeight:1.6, resize:'none', boxSizing:'border-box' }}
        />
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }} onClick={() => setAnon(!anon)}>
            <div style={{ width:28, height:16, borderRadius:8, background:anon?T.teal:'rgba(255,255,255,0.15)', position:'relative', transition:'all 0.2s' }}>
              <div style={{ position:'absolute', width:12, height:12, borderRadius:'50%', background:'white', top:2, left:anon?14:2, transition:'all 0.2s' }} />
            </div>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>Post anonymously</span>
          </div>
          <button
            onClick={submitPost}
            disabled={!text.trim() || posting}
            style={{ background:text.trim()?T.ember:'rgba(255,255,255,0.1)', border:'none', borderRadius:8, padding:'7px 16px', fontSize:12, fontWeight:700, color:'white', cursor:text.trim()?'pointer':'default', fontFamily:"'DM Sans', sans-serif", transition:'all 0.15s' }}>
            {posting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>

      {/* Posts */}
      <div style={{ flex:1, overflowY:'auto', padding:'0 16px 80px' }}>
        {posts.length === 0 && (
          <div style={{ textAlign:'center', padding:'40px 20px', color:'rgba(255,255,255,0.2)', fontSize:13 }}>
            Be the first to post in this circle 🤍
          </div>
        )}
        {posts.map(post => (
          <div key={post.id} style={{ background:'rgba(255,255,255,0.04)', borderRadius:14, padding:'14px', marginBottom:10, border:'1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <div style={{ width:30, height:30, borderRadius:'50%', background:post.is_anonymous?T.gray:(post.profiles?.avatar_color||T.teal), display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'white', flexShrink:0 }}>
                {post.is_anonymous ? '?' : (post.profiles?.display_name||'U')[0].toUpperCase()}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'white' }}>
                  {post.is_anonymous ? 'Anonymous' : (post.profiles?.display_name||'Caregiver')}
                </div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)' }}>{timeAgo(post.created_at)}</div>
              </div>
              {post.circles && (
                <span style={{ background:`${T.teal}22`, color:T.tealLt, fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:20, border:`1px solid ${T.teal}44` }}>
                  {post.circles.icon} {post.circles.name}
                </span>
              )}
            </div>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.78)', lineHeight:1.65, margin:0 }}>
              {post.content}
            </p>
          </div>
        ))}
      </div>
  )
}
