import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const T = {
  plum:'#1E0E3E', teal:'#0B7B82', tealLt:'#12A8B0',
  ember:'#C4622D', parchment:'#FAF3EC', gray:'#94A3B8'
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 60000)
  if (diff < 1) return 'just now'
  if (diff < 60) return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff/60)}h ago`
  return `${Math.floor(diff/1440)}d ago`
}

export default function Messages({ session, profile, initialPeer, onBack }) {
  const [conversations, setConversations] = useState([])
  const [activePeer, setActivePeer] = useState(initialPeer || null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [convId, setConvId] = useState(null)
  const bottomRef = useRef(null)
  const channel = useRef(null)

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (activePeer) openConversation(activePeer)
  }, [activePeer])

  async function fetchConversations() {
    const { data } = await supabase
      .from('conversations')
      .select(`
        id,
        participant_a,
        participant_b,
        created_at
      `)
      .or(`participant_a.eq.${session.user.id},participant_b.eq.${session.user.id})`)
      .order('created_at', { ascending: false })

    if (!data) return

    // Fetch peer profiles
    const convWithPeers = await Promise.all(data.map(async conv => {
      const peerId = conv.participant_a === session.user.id
        ? conv.participant_b : conv.participant_a
      const { data: peer } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_color')
        .eq('id', peerId)
        .single()
      return { ...conv, peer }
    }))
    setConversations(convWithPeers)
  }

  async function openConversation(peer) {
    setActivePeer(peer)
    setMessages([])

    // Find or create conversation
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

    // Fetch messages
    const { data: msgs } = await supabase
      .from('messages')
      .select('*, profiles(display_name, avatar_color)')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true })

    if (msgs) setMessages(msgs)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)

    // Realtime
    if (channel.current) supabase.removeChannel(channel.current)
    channel.current = supabase
      .channel('conv-' + conv.id)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conv.id}` },
        async payload => {
          const { data: msg } = await supabase
            .from('messages')
            .select('*, profiles(display_name, avatar_color)')
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
    if (!text.trim() || !convId) return
    setSending(true)
    await supabase.from('messages').insert({
      conversation_id: convId,
      sender_id: session.user.id,
      content: text.trim(),
    })
    setText('')
    setSending(false)
  }

  // Conversation list view
  if (!activePeer) {
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

        {conversations.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            color: 'rgba(255,255,255,0.2)', fontSize: 13, lineHeight: 1.8,
          }}>
            No messages yet.<br />
            <span style={{ color: T.tealLt }}>Find peers and start a conversation 🤍</span>
          </div>
        )}

        {conversations.map(conv => conv.peer && (
          <div
            key={conv.id}
            onClick={() => openConversation(conv.peer)}
            style={{
              background: 'rgba(255,255,255,0.04)', borderRadius: 14,
              padding: '14px 16px', marginBottom: 10,
              border: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
            }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: conv.peer.avatar_color || T.teal,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 700, color: 'white', flexShrink: 0,
            }}>
              {(conv.peer.display_name || '?')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>
                {conv.peer.display_name}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                {timeAgo(conv.created_at)}
              </div>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 16 }}>→</span>
          </div>
        ))}
      </div>
    )
  }

  // Active conversation view
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', background: T.plum,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
      }}>
        <button onClick={() => setActivePeer(null)} style={{
          background: 'none', border: 'none', color: T.tealLt,
          fontSize: 18, cursor: 'pointer', padding: 0,
        }}>←</button>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: activePeer.avatar_color || T.teal,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: 'white',
        }}>
          {(activePeer.display_name || '?')[0].toUpperCase()}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>
          {activePeer.display_name}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
            Start the conversation 🤍
          </div>
        )}
        {messages.map(msg => {
          const isMine = msg.sender_id === session.user.id
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '80%',
                background: isMine ? T.teal : 'rgba(255,255,255,0.08)',
                borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                padding: '10px 14px',
                border: isMine ? 'none' : '1px solid rgba(255,255,255,0.08)',
              }}>
                <p style={{ fontSize: 13, color: 'white', lineHeight: 1.6, margin: 0 }}>
                  {msg.content}
                </p>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4, textAlign: isMine ? 'right' : 'left' }}>
                  {timeAgo(msg.created_at)}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '10px 16px 14px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Send a message..."
            style={{
              flex: 1, background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 24, padding: '10px 16px',
              fontSize: 13, color: 'white',
              fontFamily: "'DM Sans', sans-serif", outline: 'none',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!text.trim() || sending}
            style={{
              background: text.trim() ? T.teal : 'rgba(255,255,255,0.08)',
              border: 'none', borderRadius: '50%',
              width: 40, height: 40, flexShrink: 0,
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
