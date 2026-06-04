import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import PostThread from './PostThread'

const T = {
  plum:'#1E0E3E', teal:'#0B7B82', tealLt:'#12A8B0',
  ember:'#C4622D', sunrise:'#F5894A', parchment:'#FAF3EC', gray:'#94A3B8'
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 60000)
  if (diff < 1) return 'just now'
  if (diff < 60) return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff/60)}h ago`
  return `${Math.floor(diff/1440)}d ago`
}

export default function Feed({ session, profile, activeCircle }) {
  const [posts, setPosts] = useState([])
  const [replyCounts, setReplyCounts] = useState({})
  const [text, setText] = useState('')
  const [anon, setAnon] = useState(false)
  const [posting, setPosting] = useState(false)
  const [myPostsOnly, setMyPostsOnly] = useState(false)
  const [openPost, setOpenPost] = useState(null)
  const circleIdRef = useRef(null)

  useEffect(() => {
    loadCircleAndPosts()

    const channel = supabase
      .channel('arugae-feed-' + (activeCircle?.id || 'all'))
      .on('postgres_changes',
        { event:'INSERT', schema:'public', table:'posts' },
        async payload => {
          const { data } = await supabase
            .from('posts')
            .select('*, circles(name, icon), profiles(display_name, avatar_color)')
            .eq('id', payload.new.id)
            .single()
          if (data) setPosts(prev => [data, ...prev])
        }
      )
      .on('postgres_changes',
        { event:'INSERT', schema:'public', table:'comments' },
        payload => {
          setReplyCounts(prev => ({
            ...prev,
            [payload.new.post_id]: (prev[payload.new.post_id] || 0) + 1
          }))
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [activeCircle])

  async function loadCircleAndPosts() {
    let circleId = null
    if (activeCircle?.id) {
      const { data: circleRow } = await supabase
        .from('circles').select('id').eq('slug', activeCircle.id).single()
      if (circleRow) {
        circleId = circleRow.id
        circleIdRef.current = circleId
      }
    }

    let query = supabase
      .from('posts')
      .select('*, circles(name, icon), profiles(display_name, avatar_color)')
      .order('created_at', { ascending:false })
      .limit(30)
    if (circleId) query = query.eq('circle_id', circleId)

    const { data } = await query
    if (data) {
      setPosts(data)
      // Fetch reply counts
      const ids = data.map(p => p.id)
      if (ids.length) {
        const { data: comments } = await supabase
          .from('comments')
          .select('post_id')
          .in('post_id', ids)
        if (comments) {
          const counts = {}
          comments.forEach(c => {
            counts[c.post_id] = (counts[c.post_id] || 0) + 1
          })
          setReplyCounts(counts)
        }
      }
    }
  }

  async function submitPost() {
    if (!text.trim()) return
    setPosting(true)
    await supabase.from('posts').insert({
      author_id: anon ? null : session.user.id,
      circle_id: circleIdRef.current || 1,
      content: text.trim(),
      is_anonymous: anon,
    })
    setText('')
    setPosting(false)
  }

  const filtered = myPostsOnly
    ? posts.filter(p => p.author_id === session.user.id)
    : posts

  if (openPost) {
    return (
      <PostThread
        post={openPost}
        session={session}
        profile={profile}
        onBack={() => setOpenPost(null)}
      />
    )
  }

  return (
    <div style={{
      minHeight:'calc(100vh - 114px)', background:T.plum,
      display:'flex', flexDirection:'column',
      fontFamily:"'DM Sans', sans-serif"
    }}>

      {/* Circle bar + My Posts toggle */}
      <div style={{
        padding:'8px 16px',
        background:'rgba(11,123,130,0.08)',
        borderBottom:'1px solid rgba(11,123,130,0.15)',
        display:'flex', alignItems:'center', justifyContent:'space-between'
      }}>
        <div style={{ fontSize:12, color:T.tealLt, display:'flex', alignItems:'center', gap:6 }}>
          {activeCircle && (
            <>
              <span aria-hidden="true">{activeCircle.icon}</span>
              <span style={{ fontWeight:600 }}>{activeCircle.label}</span>
            </>
          )}
          <span style={{ color:'rgba(255,255,255,0.2)' }}>· {filtered.length} posts</span>
        </div>
        <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
          <div
            role="switch"
            aria-checked={myPostsOnly}
            aria-label="Show my posts only"
            tabIndex={0}
            onClick={() => setMyPostsOnly(!myPostsOnly)}
            onKeyDown={e => e.key === 'Enter' && setMyPostsOnly(!myPostsOnly)}
            style={{
              width:28, height:16, borderRadius:8,
              background: myPostsOnly ? T.ember : 'rgba(255,255,255,0.15)',
              position:'relative', transition:'all 0.2s', cursor:'pointer'
            }}>
            <div style={{
              position:'absolute', width:12, height:12, borderRadius:'50%',
              background:'white', top:2, left: myPostsOnly ? 14 : 2, transition:'all 0.2s'
            }} />
          </div>
          <span style={{
            fontSize:11,
            color: myPostsOnly ? T.sunrise : 'rgba(255,255,255,0.4)',
            fontWeight: myPostsOnly ? 600 : 400
          }}>
            My posts
          </span>
        </label>
      </div>

      {/* Compose */}
      <div style={{
        margin:'12px 16px',
        background:'rgba(255,255,255,0.05)',
        borderRadius:14, padding:'12px 14px',
        border:'1px solid rgba(255,255,255,0.1)', flexShrink:0
      }}>
        <label htmlFor="compose-input" className="sr-only" style={{ position:'absolute', width:1, height:1, overflow:'hidden' }}>
          Share with your circle
        </label>
        <textarea
          id="compose-input"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Share what's on your mind..."
          rows={2}
          aria-label="Compose a post"
          style={{
            width:'100%', background:'none', border:'none', outline:'none',
            color:'white', fontFamily:"'DM Sans', sans-serif",
            fontSize:13, lineHeight:1.6, resize:'none', boxSizing:'border-box'
          }}
        />
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
            <div
              role="switch"
              aria-checked={anon}
              aria-label="Post anonymously"
              tabIndex={0}
              onClick={() => setAnon(!anon)}
              onKeyDown={e => e.key === 'Enter' && setAnon(!anon)}
              style={{
                width:28, height:16, borderRadius:8,
                background: anon ? T.teal : 'rgba(255,255,255,0.15)',
                position:'relative', transition:'all 0.2s', cursor:'pointer'
              }}>
              <div style={{
                position:'absolute', width:12, height:12, borderRadius:'50%',
                background:'white', top:2, left: anon ? 14 : 2, transition:'all 0.2s'
              }} />
            </div>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>
              Post anonymously
            </span>
          </label>
          <button
            onClick={submitPost}
            disabled={!text.trim() || posting}
            aria-label="Submit post"
            style={{
              background: text.trim() ? T.ember : 'rgba(255,255,255,0.1)',
              border:'none', borderRadius:8, padding:'7px 16px',
              fontSize:12, fontWeight:700, color:'white',
              cursor: text.trim() ? 'pointer' : 'default',
              fontFamily:"'DM Sans', sans-serif", transition:'all 0.15s'
            }}>
            {posting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>

      {/* Posts */}
      <main style={{ flex:1, overflowY:'auto', padding:'0 16px 20px' }} aria-label="Posts feed">
        {filtered.length === 0 && (
          <div style={{
            textAlign:'center', padding:'48px 20px',
            color:'rgba(255,255,255,0.2)', fontSize:13, lineHeight:1.7
          }}
            role="status"
          >
            {myPostsOnly ? "You haven't posted here yet." : 'No posts yet.'}<br/>
            <span style={{ color:T.tealLt }}>Be the first to share 🤍</span>
          </div>
        )}

        {filtered.map(post => {
          const replyCount = replyCounts[post.id] || 0
          return (
            <article
              key={post.id}
              onClick={() => setOpenPost(post)}
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setOpenPost(post)}
              aria-label={`Post by ${post.is_anonymous ? 'Anonymous' : (post.profiles?.display_name || 'Caregiver')}. ${post.content.slice(0,60)}. ${replyCount} replies.`}
              style={{
                background:'rgba(255,255,255,0.04)', borderRadius:14, padding:'14px',
                marginBottom:10, border:'1px solid rgba(255,255,255,0.07)',
                cursor:'pointer', transition:'background 0.15s', outline:'none',
              }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <div
                  aria-hidden="true"
                  style={{
                    width:32, height:32, borderRadius:'50%',
                    background: post.is_anonymous ? T.gray : (post.profiles?.avatar_color || T.teal),
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:13, fontWeight:700, color:'white', flexShrink:0
                  }}>
                  {post.is_anonymous ? '?' : (post.profiles?.display_name || 'U')[0].toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'white' }}>
                    {post.is_anonymous ? 'Anonymous' : (post.profiles?.display_name || 'Caregiver')}
                  </div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)' }}>
                    {timeAgo(post.created_at)}
                  </div>
                </div>
                {post.circles && (
                  <span style={{
                    background:`${T.teal}22`, color:T.tealLt,
                    fontSize:10, fontWeight:700,
                    padding:'3px 8px', borderRadius:20,
                    border:`1px solid ${T.teal}44`
                  }}>
                    {post.circles.icon} {post.circles.name}
                  </span>
                )}
              </div>

              <p style={{
                fontSize:13, color:'rgba(255,255,255,0.78)',
                lineHeight:1.65, margin:'0 0 10px'
              }}>
                {post.content}
              </p>

              {/* Reply count */}
              <div style={{
                display:'flex', alignItems:'center', gap:12,
                fontSize:12, color:'rgba(255,255,255,0.3)'
              }}>
                <span>💬 {replyCount} {replyCount === 1 ? 'reply' : 'replies'}</span>
                <span style={{ color:'rgba(255,255,255,0.15)' }}>·</span>
                <span style={{ color:T.tealLt, fontSize:11 }}>Tap to reply →</span>
              </div>
            </article>
          )
        })}
      </main>
    </div>
  )
}
