import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const T = {
  plum:'#1E0E3E', teal:'#0B7B82', tealLt:'#12A8B0',
  ember:'#C4622D', parchment:'#FAF3EC', gray:'#94A3B8'
}

const REACTIONS = [
  { emoji:'❤️', label:'heart' },
  { emoji:'🫂', label:'hug' },
  { emoji:'💪', label:'strength' },
  { emoji:'🙏', label:'thanks' },
]

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 60000)
  if (diff < 1) return 'just now'
  if (diff < 60) return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff/60)}h ago`
  return `${Math.floor(diff/1440)}d ago`
}

export default function PostThread({ post, session, profile, onBack }) {
  const [replies, setReplies] = useState([])
  const [reactions, setReactions] = useState({})
  const [myReactions, setMyReactions] = useState([])
  const [text, setText] = useState('')
  const [anon, setAnon] = useState(false)
  const [posting, setPosting] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    fetchReplies()
    fetchReactions()

    const channel = supabase
      .channel('thread-' + post.id)
      .on('postgres_changes',
        { event:'INSERT', schema:'public', table:'comments',
          filter:`post_id=eq.${post.id}` },
        async payload => {
          const { data } = await supabase
            .from('comments')
            .select('*, profiles(display_name, avatar_color)')
            .eq('id', payload.new.id)
            .single()
          if (data) {
            setReplies(prev => [...prev, data])
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'smooth' }), 100)
          }
        }
      )
      .on('postgres_changes',
        { event:'INSERT', schema:'public', table:'reactions',
          filter:`post_id=eq.${post.id}` },
        () => fetchReactions()
      )
      .on('postgres_changes',
        { event:'DELETE', schema:'public', table:'reactions',
          filter:`post_id=eq.${post.id}` },
        () => fetchReactions()
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [post.id])

  async function fetchReplies() {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(display_name, avatar_color)')
      .eq('post_id', post.id)
      .order('created_at', { ascending:true })
    if (data) setReplies(data)
  }

  async function fetchReactions() {
    const { data } = await supabase
      .from('reactions')
      .select('*')
      .eq('post_id', post.id)

    if (data) {
      // Count by emoji
      const counts = {}
      const mine = []
      data.forEach(r => {
        counts[r.emoji] = (counts[r.emoji] || 0) + 1
        if (r.user_id === session.user.id) mine.push(r.emoji)
      })
      setReactions(counts)
      setMyReactions(mine)
    }
  }

  async function toggleReaction(emoji) {
    const isMine = myReactions.includes(emoji)
    if (isMine) {
      // Remove
      await supabase
        .from('reactions')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', session.user.id)
        .eq('emoji', emoji)
    } else {
      // Add
      await supabase.from('reactions').insert({
        post_id: post.id,
        user_id: session.user.id,
        emoji,
      })
    }
    fetchReactions()
  }

  async function submitReply() {
    if (!text.trim()) return
    setPosting(true)
    await supabase.from('comments').insert({
      post_id: post.id,
      author_id: anon ? null : session.user.id,
      content: text.trim(),
      is_anonymous: anon,
    })
    setText('')
    setPosting(false)
  }

  return (
    <div style={{
      minHeight:'calc(100vh - 114px)', background:T.plum,
      display:'flex', flexDirection:'column',
      fontFamily:"'DM Sans', sans-serif"
    }}>

      {/* Back bar */}
      <div style={{
        padding:'12px 16px',
        borderBottom:'1px solid rgba(255,255,255,0.07)',
        display:'flex', alignItems:'center', gap:12, flexShrink:0
      }}>
        <button onClick={onBack} style={{
          background:'none', border:'none', color:T.tealLt,
          fontSize:14, cursor:'pointer', fontFamily:"'DM Sans', sans-serif",
          display:'flex', alignItems:'center', gap:6, padding:0
        }}>
          ← Back to feed
        </button>
        <span style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>
          {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
        </span>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'16px' }}>

        {/* Original post */}
        <div style={{
          background:'rgba(255,255,255,0.06)', borderRadius:14,
          padding:'16px', marginBottom:16,
          border:`1px solid ${T.teal}44`
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <div style={{
              width:36, height:36, borderRadius:'50%',
              background: post.is_anonymous ? T.gray : (post.profiles?.avatar_color || T.teal),
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:14, fontWeight:700, color:'white'
            }}>
              {post.is_anonymous ? '?' : (post.profiles?.display_name || 'U')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'white' }}>
                {post.is_anonymous ? 'Anonymous' : (post.profiles?.display_name || 'Caregiver')}
              </div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)' }}>
                {timeAgo(post.created_at)}
              </div>
            </div>
          </div>

          <p style={{
            fontSize:14, color:T.parchment,
            lineHeight:1.7, margin:'0 0 16px'
          }}>
            {post.content}
          </p>

          {/* Reactions */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {REACTIONS.map(r => {
              const count = reactions[r.emoji] || 0
              const active = myReactions.includes(r.emoji)
              return (
                <button
                  key={r.label}
                  onClick={() => toggleReaction(r.emoji)}
                  style={{
                    background: active ? `${T.teal}44` : 'rgba(255,255,255,0.06)',
                    border: `1.5px solid ${active ? T.teal : 'rgba(255,255,255,0.12)'}`,
                    borderRadius:20, padding:'6px 12px',
                    display:'flex', alignItems:'center', gap:5,
                    cursor:'pointer', transition:'all 0.15s',
                  }}>
                  <span style={{ fontSize:16 }}>{r.emoji}</span>
                  {count > 0 && (
                    <span style={{
                      fontSize:12, fontWeight:700,
                      color: active ? T.tealLt : 'rgba(255,255,255,0.5)'
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Reply prompt */}
        <div
          onClick={() => inputRef.current?.focus()}
          style={{
            background:`${T.teal}11`,
            border:`1px dashed ${T.teal}55`,
            borderRadius:10, padding:'10px 14px',
            marginBottom:16, cursor:'pointer',
            display:'flex', alignItems:'center', gap:8
          }}>
          <div style={{
            width:26, height:26, borderRadius:'50%',
            background: profile?.avatar_color || T.teal,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:11, fontWeight:700, color:'white', flexShrink:0
          }}>
            {(profile?.display_name || '?')[0].toUpperCase()}
          </div>
          <span style={{ fontSize:13, color:'rgba(255,255,255,0.35)' }}>
            Write a reply...
          </span>
        </div>

        {/* Replies */}
        {replies.length === 0 && (
          <div style={{
            textAlign:'center', padding:'24px',
            color:'rgba(255,255,255,0.2)', fontSize:13
          }}>
            No replies yet. Be the first to respond 🤍
          </div>
        )}

        {replies.map(r => (
          <div key={r.id} style={{ display:'flex', gap:10, marginBottom:16 }}>
            <div style={{
              width:30, height:30, borderRadius:'50%', flexShrink:0,
              background: r.is_anonymous ? T.gray : (r.profiles?.avatar_color || T.teal),
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:12, fontWeight:700, color:'white', marginTop:2
            }}>
              {r.is_anonymous ? '?' : (r.profiles?.display_name || 'U')[0].toUpperCase()}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                <span style={{ fontSize:12, fontWeight:600, color:'white' }}>
                  {r.is_anonymous ? 'Anonymous' : (r.profiles?.display_name || 'Caregiver')}
                </span>
                <span style={{ fontSize:10, color:'rgba(255,255,255,0.25)' }}>
                  {timeAgo(r.created_at)}
                </span>
              </div>
              <div style={{
                background:'rgba(255,255,255,0.05)',
                borderRadius:'4px 12px 12px 12px',
                padding:'10px 12px',
                border:'1px solid rgba(255,255,255,0.07)'
              }}>
                <p style={{
                  fontSize:13, color:'rgba(255,255,255,0.82)',
                  lineHeight:1.65, margin:0
                }}>
                  {r.content}
                </p>
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply input — always visible above bottom nav */}
      <div style={{
        padding:'12px 16px 16px',
        borderTop:'1px solid rgba(255,255,255,0.1)',
        background:'#1E0E3E', flexShrink:0
      }}>
        {/* Anonymous toggle */}
        <div
          style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, cursor:'pointer' }}
          onClick={() => setAnon(!anon)}
        >
          <div style={{
            width:28, height:16, borderRadius:8,
            background: anon ? T.teal : 'rgba(255,255,255,0.15)',
            position:'relative', transition:'all 0.2s'
          }}>
            <div style={{
              position:'absolute', width:12, height:12, borderRadius:'50%',
              background:'white', top:2, left: anon ? 14 : 2, transition:'all 0.2s'
            }} />
          </div>
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.45)' }}>
            Reply anonymously
          </span>
        </div>

        {/* Input row */}
        <div style={{ display:'flex', gap:8 }}>
          <div style={{
            width:30, height:30, borderRadius:'50%', flexShrink:0,
            background: anon ? T.gray : (profile?.avatar_color || T.teal),
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:12, fontWeight:700, color:'white', alignSelf:'center'
          }}>
            {anon ? '?' : (profile?.display_name || '?')[0].toUpperCase()}
          </div>
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitReply()}
            placeholder="Write a reply..."
            style={{
              flex:1, background:'rgba(255,255,255,0.08)',
              border:'1.5px solid rgba(255,255,255,0.15)',
              borderRadius:24, padding:'10px 16px',
              fontSize:13, color:'white',
              fontFamily:"'DM Sans', sans-serif", outline:'none'
            }}
          />
          <button
            onClick={submitReply}
            disabled={!text.trim() || posting}
            style={{
              background: text.trim() ? T.teal : 'rgba(255,255,255,0.08)',
              border:'none', borderRadius:'50%',
              width:40, height:40, flexShrink:0,
              color:'white', fontSize:16, cursor: text.trim() ? 'pointer' : 'default',
              display:'flex', alignItems:'center', justifyContent:'center',
              transition:'all 0.15s'
            }}>
            {posting ? '...' : '↑'}
          </button>
        </div>
      </div>
    </div>
  )
}
