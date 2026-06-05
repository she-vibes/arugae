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

export default function Feed({ session, profile, activeCircle, onBack }) {
  const [posts, setPosts] = useState([])
  const [replyCounts, setReplyCounts] = useState({})
  const [text, setText] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [showLink, setShowLink] = useState(false)
  const [anon, setAnon] = useState(false)
  const [posting, setPosting] = useState(false)
  const [myPostsOnly, setMyPostsOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [openPost, setOpenPost] = useState(null)
  const circleDbId = useRef(null)
  const realtimeChannel = useRef(null)

  useEffect(() => {
  setPosts([])
  setReplyCounts({})
  setSearch('')
  setMyPostsOnly(false)
  setOpenPost(null)
  circleDbId.current = null

  if (!activeCircle?.id) return

  const slugMap = {
    cancer: 'cancer',
    dementia: 'dementia',
    stroke: 'stroke',
    disability: 'disability',
    elderly: 'elderly',
    other: 'other',
  }

  const slug = slugMap[activeCircle.id] || activeCircle.id

  supabase
    .from('circles')
    .select('id')
    .eq('slug', slug)
    .single()
    .then(({ data, error }) => {
      if (error || !data) {
        console.error('Circle lookup failed for slug:', slug, error)
        return
      }
      circleDbId.current = data.id
      fetchPosts(data.id)
      setupRealtime(data.id)
    })

  return () => {
    if (realtimeChannel.current) {
      supabase.removeChannel(realtimeChannel.current)
    }
  }
}, [activeCircle?.id]) // 👈 key fix — was [activeCircle], now [activeCircle?.id]


  async function fetchPosts(cid) {
    const { data, error } = await supabase
      .from('posts')
      .select('*, circles(name, icon, slug), profiles(display_name, avatar_color)')
      .eq('circle_id', cid)
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) { console.error('fetchPosts error:', error); return }
console.log('fetchPosts result:', data?.length, 'posts for circle_id:', cid)
if (!data) return


    setPosts(data)

    if (!data.length) return
    const ids = data.map(p => p.id)
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

  function setupRealtime(cid) {
    if (realtimeChannel.current) {
      supabase.removeChannel(realtimeChannel.current)
    }
    realtimeChannel.current = supabase
      .channel('feed-' + cid)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        async payload => {
          if (payload.new.circle_id !== cid) return
          const { data } = await supabase
            .from('posts')
            .select('*, circles(name, icon, slug), profiles(display_name, avatar_color)')
            .eq('id', payload.new.id)
            .single()
          if (data) setPosts(prev => [data, ...prev])
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments' },
        payload => {
          setReplyCounts(prev => ({
            ...prev,
            [payload.new.post_id]: (prev[payload.new.post_id] || 0) + 1
          }))
        }
      )
      .subscribe()
  }

  async function submitPost() {
    if (!text.trim()) return

    // Optimistic insert — show immediately
    const optimistic = {
      id: 'temp-' + Date.now(),
      content: text.trim(),
      link_url: linkUrl.trim() || null,
      link_title: linkUrl.trim() ? new URL(linkUrl.trim()).hostname : null,
      is_anonymous: anon,
      created_at: new Date().toISOString(),
      circle_id: circleDbId.current,
      circles: { name: activeCircle?.label, icon: activeCircle?.icon },
      profiles: anon ? null : {
        display_name: profile?.display_name,
        avatar_color: profile?.avatar_color,
      },
      author_id: anon ? null : session.user.id,
      _optimistic: true,
    }
    setPosts(prev => [optimistic, ...prev])
    const savedText = text.trim()
    const savedLink = linkUrl.trim()
    setText('')
    setLinkUrl('')
    setShowLink(false)
    setPosting(true)

    if (!circleDbId.current) {
      console.error('No circle ID — waiting for lookup')
      setPosting(false)
      return
    }

    const insertPayload = {
      author_id: anon ? null : session.user.id,
      circle_id: circleDbId.current,
      content: savedText,
      is_anonymous: anon,
    }
    if (savedLink) {
      insertPayload.link_url = savedLink
      try {
        insertPayload.link_title = new URL(savedLink).hostname
      } catch {
        insertPayload.link_title = savedLink
      }
    }

    const { error } = await supabase.from('posts').insert(insertPayload)
    if (error) {
      console.error('submitPost error:', error)
      // Remove optimistic post on failure
      setPosts(prev => prev.filter(p => p.id !== optimistic.id))
    }
    setPosting(false)
  }

  const filtered = posts
    .filter(p => myPostsOnly ? p.author_id === session.user.id : true)
    .filter(p => search.trim()
      ? p.content.toLowerCase().includes(search.toLowerCase())
      : true
    )

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
      display: 'flex', flexDirection: 'column',
      fontFamily: "'DM Sans', sans-serif",
      minHeight: '100%', background: T.plum,
    }}>

      {/* Circle bar */}
      <div style={{
        padding: '8px 16px',
        background: 'rgba(11,123,130,0.08)',
        borderBottom: '1px solid rgba(11,123,130,0.15)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <button onClick={onBack} aria-label="Back to circles" style={{
            background: 'none', border: 'none', color: T.tealLt,
            fontSize: 18, cursor: 'pointer', flexShrink: 0, lineHeight: 1, padding: '0 4px 0 0',
          }}>←</button>
          <span style={{
            fontSize: 12, color: T.tealLt, fontWeight: 600,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {activeCircle?.icon} {activeCircle?.label}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
            · {filtered.length} post{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0 }}>
          <div
            role="switch" aria-checked={myPostsOnly}
            tabIndex={0}
            onClick={() => setMyPostsOnly(!myPostsOnly)}
            onKeyDown={e => e.key === 'Enter' && setMyPostsOnly(!myPostsOnly)}
            style={{
              width: 28, height: 16, borderRadius: 8,
              background: myPostsOnly ? T.ember : 'rgba(255,255,255,0.15)',
              position: 'relative', transition: 'all 0.2s', cursor: 'pointer',
            }}>
            <div style={{
              position: 'absolute', width: 12, height: 12, borderRadius: '50%',
              background: 'white', top: 2, left: myPostsOnly ? 14 : 2, transition: 'all 0.2s'
            }} />
          </div>
          <span style={{ fontSize: 11, whiteSpace: 'nowrap', color: myPostsOnly ? T.sunrise : 'rgba(255,255,255,0.4)' }}>
            My posts
          </span>
        </label>
      </div>

      {/* Search */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.06)', borderRadius: 10,
          padding: '8px 12px', border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <span style={{ fontSize: 13, opacity: 0.4 }}>🔍</span>
          <input
            type="search" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${activeCircle?.label || ''}...`}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'white', fontFamily: "'DM Sans', sans-serif", fontSize: 13, minWidth: 0,
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer', fontSize: 13, padding: 0,
            }}>✕</button>
          )}
        </div>
        {search.trim() && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{search}"
          </div>
        )}
      </div>

      {/* Compose */}
      <div style={{
        margin: '12px 16px 0',
        background: 'rgba(255,255,255,0.05)', borderRadius: 14,
        padding: '12px 14px', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0,
      }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={`Share with ${activeCircle?.label || 'your circle'}...`}
          rows={2}
          style={{
            width: '100%', background: 'none', border: 'none', outline: 'none',
            color: 'white', fontFamily: "'DM Sans', sans-serif",
            fontSize: 13, lineHeight: 1.6, resize: 'none', boxSizing: 'border-box',
          }}
        />

        {/* Link input */}
        {showLink && (
          <div style={{
            display: 'flex', gap: 6, marginBottom: 8, alignItems: 'center',
          }}>
            <input
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              placeholder="https://..."
              style={{
                flex: 1, background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 8, padding: '6px 10px',
                fontSize: 12, color: 'white',
                fontFamily: "'DM Sans', sans-serif", outline: 'none',
              }}
            />
            <button onClick={() => { setShowLink(false); setLinkUrl('') }} style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
              cursor: 'pointer', fontSize: 13, padding: 0,
            }}>✕</button>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Anonymous toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <div
                role="switch" aria-checked={anon} tabIndex={0}
                onClick={() => setAnon(!anon)}
                onKeyDown={e => e.key === 'Enter' && setAnon(!anon)}
                style={{
                  width: 28, height: 16, borderRadius: 8,
                  background: anon ? T.teal : 'rgba(255,255,255,0.15)',
                  position: 'relative', transition: 'all 0.2s', cursor: 'pointer',
                }}>
                <div style={{
                  position: 'absolute', width: 12, height: 12, borderRadius: '50%',
                  background: 'white', top: 2, left: anon ? 14 : 2, transition: 'all 0.2s'
                }} />
              </div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>Anon</span>
            </label>

            {/* Link toggle */}
            <button
              onClick={() => setShowLink(!showLink)}
              title="Attach a link"
              style={{
                background: showLink ? `${T.teal}33` : 'none',
                border: showLink ? `1px solid ${T.teal}` : '1px solid rgba(255,255,255,0.15)',
                borderRadius: 6, padding: '3px 8px',
                fontSize: 11, color: showLink ? T.tealLt : 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
              }}>
              🔗 Link
            </button>
          </div>

          <button
            onClick={submitPost}
            disabled={!text.trim() || posting}
            style={{
              background: text.trim() ? T.ember : 'rgba(255,255,255,0.1)',
              border: 'none', borderRadius: 8, padding: '7px 16px',
              fontSize: 12, fontWeight: 700, color: 'white',
              cursor: text.trim() ? 'pointer' : 'default',
              fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s', flexShrink: 0,
            }}>
            {posting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>

      {/* Posts */}
      <div style={{ padding: '12px 16px 20px' }}>
      {filtered.length === 0 && (
  <div style={{
    textAlign: 'center', padding: '40px 20px',
    color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.8,
  }}>
    Debug: posts state has {posts.length} items<br/>
    circleDbId: {circleDbId.current || 'null'}<br/>
    activeCircle: {activeCircle?.id || 'none'}<br/>
    <span style={{ color: '#12A8B0' }}>filtered: {filtered.length}</span>
  </div>
)}

          <div style={{
            textAlign: 'center', padding: '40px 20px',
            color: 'rgba(255,255,255,0.2)', fontSize: 13, lineHeight: 1.8,
          }}>
            {search.trim() ? `No posts matching "${search}"` : `No posts in ${activeCircle?.label} yet.`}
            <br />
            {!search.trim() && <span style={{ color: T.tealLt }}>Be the first to share 🤍</span>}
          </div>
        )}

        {filtered.map(post => {
          const replyCount = replyCounts[post.id] || 0
          return (
            <article
              key={post.id}
              onClick={() => !post._optimistic && setOpenPost(post)}
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && !post._optimistic && setOpenPost(post)}
              style={{
                background: post._optimistic ? 'rgba(11,123,130,0.08)' : 'rgba(255,255,255,0.04)',
                borderRadius: 14, padding: '14px', marginBottom: 10,
                border: `1px solid ${post._optimistic ? T.teal + '44' : 'rgba(255,255,255,0.07)'}`,
                cursor: post._optimistic ? 'default' : 'pointer', outline: 'none',
                opacity: post._optimistic ? 0.8 : 1,
              }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: post.is_anonymous ? T.gray : (post.profiles?.avatar_color || T.teal),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: 'white',
                }}>
                  {post.is_anonymous ? '?' : (post.profiles?.display_name || 'U')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 600, color: 'white',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {post.is_anonymous ? 'Anonymous' : (post.profiles?.display_name || 'Caregiver')}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                    {post._optimistic ? 'just now' : timeAgo(post.created_at)}
                  </div>
                </div>
                <span style={{
                  background: `${T.teal}22`, color: T.tealLt,
                  fontSize: 10, fontWeight: 700, flexShrink: 0,
                  padding: '3px 8px', borderRadius: 20, border: `1px solid ${T.teal}44`,
                  whiteSpace: 'nowrap',
                }}>
                  {activeCircle?.icon} {activeCircle?.label}
                </span>
              </div>

              <p style={{
                fontSize: 13, color: 'rgba(255,255,255,0.78)',
                lineHeight: 1.65, margin: '0 0 10px', wordBreak: 'break-word',
              }}>
                {search.trim()
                  ? post.content.split(new RegExp(`(${search})`, 'gi')).map((part, i) =>
                    part.toLowerCase() === search.toLowerCase()
                      ? <mark key={i} style={{ background: T.teal, color: 'white', borderRadius: 2, padding: '0 2px' }}>{part}</mark>
                      : part
                  )
                  : post.content
                }
              </p>

              {/* Link preview */}
              {post.link_url && (
                <a
                  href={post.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, padding: '8px 10px', marginBottom: 10,
                    textDecoration: 'none',
                  }}>
                  <span style={{ fontSize: 14 }}>🔗</span>
                  <span style={{ fontSize: 11, color: T.tealLt, wordBreak: 'break-all' }}>
                    {post.link_title || post.link_url}
                  </span>
                </a>
              )}

              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                fontSize: 11, color: 'rgba(255,255,255,0.3)',
              }}>
                {!post._optimistic && (
                  <>
                    <span>💬 {replyCount} {replyCount === 1 ? 'reply' : 'replies'}</span>
                    <span>·</span>
                    <span style={{ color: T.tealLt }}>Tap to reply →</span>
                  </>
                )}
                {post._optimistic && <span style={{ color: T.tealLt }}>Posting...</span>}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
