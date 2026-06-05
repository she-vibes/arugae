import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const T = {
  plum:'#1E0E3E', teal:'#0B7B82', tealLt:'#12A8B0',
  ember:'#C4622D', parchment:'#FAF3EC', gray:'#94A3B8'
}

const SAMPLE_CONVS = [
  {
    id: 'sample-1',
    peer: { id:'dummy-1', display_name:'Priya M.', avatar_color:'#0B7B82' },
    preview: 'Thank you for sharing that resource about home physio...',
    time: '2h ago',
    sampleMessages: [
      { id:1, role:'them', content:'Hi! I saw your post about the Alzheimers support group. How did you find it?', time:'Yesterday' },
      { id:2, role:'me', content:'It was really helpful actually. They meet every Saturday in Adyar.', time:'Yesterday' },
      { id:3, role:'them', content:'That\'s close to me. Thank you for sharing that resource about home physio too.', time:'2h ago' },
    ]
  },
  {
    id: 'sample-2',
    peer: { id:'dummy-2', display_name:'Rahul S.', avatar_color:'#7C3AED' },
    preview: 'How is your mother doing after the fall?',
    time: '1d ago',
    sampleMessages: [
      { id:1, role:'them', content:'How is your mother doing after the fall?', time:'1d ago' },
      { id:2, role:'me', content:'She is slowly getting her confidence back. Physio is helping.', time:'1d ago' },
    ]
  },
  {
    id: 'sample-3',
    peer: { id:'dummy-3', display_name:'Meena K.', avatar_color:'#C4622D' },
    preview: 'The hospital bed made such a difference for us too.',
    time: '3d ago',
    sampleMessages: [
      { id:1, role:'them', content:'The hospital bed made such a difference for us too. Which model did you get?', time:'3d ago' },
    ]
  },
]

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 60000)
  if (diff < 1) return 'just now'
  if (diff < 60) return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff/60)}h ago`
  return `${Math.floor(diff/1440)}d ago`
}

export default function Messages({ session, profile, initialPeer }) {
  const [activePeer, setActivePeer] = useState(null)
  const [activeConv, setActiveConv] = useState(null)
  const [conversations, setConversations] = useState(SAMPLE_CONVS)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [convId, setConvId] = useState(null)
  const bottomRef = useRef(null)
  const channel = useRef(null)

  useEffect(() => {
    if (initialPeer) openConversation(initialPeer)
    fetchRealConversations()
  }, [])

  async function fetchRealConversations() {
    const { data } = await supabase
      .from('conversations')
      .select('id, participant_a, participant_b, created_at')
      .or(`participant_a.eq.${session.user.id},participant_b.eq.${session.user.id}`)
      .order('created_at', { ascending: false })

    if (!data?.length) return

    const convWithPeers = await Promise.all(data.map(async conv => {
      const peerId = conv.participant_a === session.user.id ? conv.participant_b : conv.participant_a
      const { data: peer } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_color')
        .eq('id', peerId)
        .single()
      return { id: conv.id, peer, time: timeAgo(conv.created_at), preview: '', sampleMessages: [] }
    }))

    const validConvs = convWithPeers.filter(c => c.peer)
    setConversations(prev => [...validConvs, ...SAMPLE_CONVS])
  }

  async function openConversation(peer, sampleConv = null) {
    setActivePeer(peer)

    if (sampleConv) {
      setMessages(sampleConv.sampleMessages.map((m, i) => ({
        id: i,
        sender_id: m.role === 'me' ? session.user.id : peer.id,
        content: m.content,
        created_at: new Date(Date.now() - (sampleConv.sampleMessages.length - i) * 3600000).toISOString(),
        _sample: true,
      })))
      setConvId(null)
      return
    }

    setMessages([])

    // Real conversation
    let { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(participant_a.eq.${session.user.id},participant_b.eq.${peer.id}),and(participant_a.eq.${peer.id},participant_b.eq.${session.user.id})`)
      .single()

    if (!conv) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ participant_a: session.user.id, participant_b: peer.id })
        .select()
        .single()
      conv = newConv
    }

    if (!conv) return
    setConvId(conv.id)

    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true })

    if (msgs) setMessages(msgs)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)

    if (channel.current) supabase.removeChannel(channel.current)
    channel.current = supabase
      .channel('conv-' + conv.id)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conv.id}` },
        async payload => {
          const { data: msg } = await supabase
            .from('messages')
            .select('*')
            .eq('id', payload.new.id)
            .single()
          if (msg) {
            setMessages(prev => [...prev, msg])
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
          }
        }
      )
      .subscribe()
  }

  async function sendMessage() {
    if (!text.trim()) return
    setSending(true)

    const optimistic = {
      id: 'temp-' + Date.now(),
      sender_id: session.user.id,
      content: text.trim(),
      created_at: new Date().toISOString(),
      _optimistic: true,
    }
    setMessages(prev => [...prev, optimistic])
    const saved = text.trim()
    setText('')

    if (convId) {
      await supabase.from('messages').insert({
        conversation_id: convId,
        sender_id: session.user.id,
        content: saved,
      })
    }

    setSending(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  // Active conversation
  if (activePeer) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        height: '100%', background: T.plum,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{
          padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          <button onClick={() => { setActivePeer(null); setMessages([]) }} style={{
            background: 'none', border: 'none', color: T.tealLt,
            fontSize: 18, cursor: 'pointer', padding: 0,
          }}>←</button>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: activePeer.avatar_color || T.teal,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0,
          }}>
            {(activePeer.display_name || '?')[0].toUpperCase()}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>
            {activePeer.display_name}
          </div>
        </div>

        <div style={{
          flex: 1, overflowY: 'auto', padding: '16px',
          display: 'flex', flexDirection: 'column', gap: 8,
          WebkitOverflowScrolling: 'touch',
        }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
              Start the conversation 🤍
            </div>
          )}
          {messages.map((msg, i) => {
            const isMine = msg.sender_id === session.user.id
            return (
              <div key={msg.id || i} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%',
                  background: isMine ? T.teal : 'rgba(255,255,255,0.08)',
                  borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  padding: '10px 14px',
                  opacity: msg._optimistic ? 0.7 : 1,
                }}>
                  <p style={{ fontSize: 13, color: 'white', lineHeight: 1.6, margin: 0 }}>{msg.content}</p>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4, textAlign: isMine ? 'right' : 'left' }}>
                    {msg._optimistic ? 'sending...' : timeAgo(msg.created_at)}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        <div style={{ padding: '10px 16px 16px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0, background: T.plum }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Send a message..."
              style={{
                flex: 1, background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 24, padding: '10px 16px',
                fontSize: 13, color: 'white',
                fontFamily: "'DM Sans', sans-serif", outline: 'none', minWidth: 0,
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!text.trim() || sending}
              style={{
                background: text.trim() ? T.teal : 'rgba(255,255,255,0.08)',
                border: 'none', borderRadius: '50%',
                width: 42, height: 42, flexShrink: 0,
                color: 'white', fontSize: 16, cursor: text.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              {sending ? '...' : '↑'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Conversation list
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      minHeight: '100%', background: T.plum,
      fontFamily: "'DM Sans', sans-serif", padding: '16px',
    }}>
      <div style={{
        fontFamily: 'Georgia, serif', fontSize: 22,
        fontWeight: 900, color: T.parchment, marginBottom: 16,
      }}>
        Messages
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {conversations.map(conv => conv.peer && (
          <div
            key={conv.id}
            onClick={() => openConversation(conv.peer, conv.sampleMessages?.length ? conv : null)}
            style={{
              background: 'rgba(255,255,255,0.04)', borderRadius: 14,
              padding: '14px 16px', border: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
            }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
              background: conv.peer.avatar_color || T.teal,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 700, color: 'white',
            }}>
              {(conv.peer.display_name || '?')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 2 }}>
                {conv.peer.display_name}
              </div>
              <div style={{
                fontSize: 11, color: 'rgba(255,255,255,0.35)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {conv.preview || 'Tap to open conversation'}
              </div>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
              {conv.time}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
