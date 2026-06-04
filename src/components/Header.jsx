import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const T = {
  plum:'#1E0E3E', teal:'#0B7B82', tealLt:'#12A8B0',
  ember:'#C4622D', parchment:'#FAF3EC', gray:'#94A3B8'
}

export default function Header({ profile, activeCircle, onManageCircles }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifs, setNotifs] = useState({ reactions: 0, replies: 0 })

  useEffect(() => {
    if (!profile?.id) return
    fetchNotifications()
    const channel = supabase
      .channel('notif-' + profile.id)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'reactions' }, fetchNotifications)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'comments' }, fetchNotifications)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [profile?.id])

  async function fetchNotifications() {
    // Reactions on my posts
    const { data: myPosts } = await supabase
      .from('posts')
      .select('id')
      .eq('author_id', profile.id)

    if (!myPosts?.length) return

    const postIds = myPosts.map(p => p.id)

    const { count: reactionCount } = await supabase
      .from('reactions')
      .select('*', { count:'exact', head:true })
      .in('post_id', postIds)
      .neq('user_id', profile.id)

    const { count: replyCount } = await supabase
      .from('comments')
      .select('*', { count:'exact', head:true })
      .in('post_id', postIds)
      .neq('author_id', profile.id)

    setNotifs({
      reactions: reactionCount || 0,
      replies: replyCount || 0,
    })
  }

  const totalNotifs = notifs.reactions + notifs.replies

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <>
      <div style={{
        padding:'12px 20px',
        borderBottom:'1px solid rgba(255,255,255,0.07)',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        background:'#1E0E3E', position:'sticky', top:0, zIndex:30, flexShrink:0
      }}
        role="banner"
      >
        {/* Logo */}
        <div>
          <div style={{
            fontFamily:'Georgia, serif', fontSize:18,
            fontWeight:900, color:T.parchment, letterSpacing:'-0.02em'
          }}
            aria-label="Arugae home"
          >
            arugae
          </div>
          {activeCircle && (
            <div style={{ fontSize:10, color:T.tealLt, marginTop:1 }}
              aria-label={`Current circle: ${activeCircle.label}`}
            >
              {activeCircle.icon} {activeCircle.label} Circle
            </div>
          )}
        </div>

        {/* Profile icon with badge */}
        <div style={{ position:'relative' }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={`Profile menu. ${totalNotifs} notifications`}
            aria-expanded={menuOpen}
            aria-haspopup="true"
            style={{
              width:36, height:36, borderRadius:'50%',
              background: profile?.avatar_color || T.teal,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:14, fontWeight:700, color:'white', cursor:'pointer',
              border:`2px solid ${menuOpen ? T.tealLt : 'transparent'}`,
              transition:'border 0.15s', position:'relative',
              outline:'none',
            }}>
            {(profile?.display_name || '?')[0].toUpperCase()}

            {/* Notification badge */}
            {totalNotifs > 0 && (
              <div style={{
                position:'absolute', top:-4, right:-4,
                background: T.ember, borderRadius:'50%',
                width:16, height:16,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:9, fontWeight:800, color:'white',
                border:'2px solid #1E0E3E',
              }}
                aria-hidden="true"
              >
                {totalNotifs > 9 ? '9+' : totalNotifs}
              </div>
            )}
          </button>

          {menuOpen && (
            <div
              role="menu"
              aria-label="Profile menu"
              style={{
                position:'absolute', right:0, top:44,
                background:'#2D1A52', borderRadius:12,
                border:'1px solid rgba(255,255,255,0.1)',
                boxShadow:'0 8px 32px rgba(0,0,0,0.4)',
                minWidth:220, zIndex:50, overflow:'hidden',
              }}>
              {/* User info */}
              <div style={{
                padding:'14px 16px',
                borderBottom:'1px solid rgba(255,255,255,0.07)'
              }}>
                <div style={{ fontSize:13, fontWeight:700, color:'white' }}>
                  {profile?.display_name || 'Caregiver'}
                </div>
                <div style={{ fontSize:11, color:T.gray, marginTop:2 }}>
                  {profile?.conditions?.length || 0} circle{profile?.conditions?.length !== 1 ? 's' : ''} enrolled
                </div>

                {/* Notification breakdown */}
                {totalNotifs > 0 && (
                  <div style={{
                    marginTop:10, display:'flex', gap:8
                  }}>
                    {notifs.reactions > 0 && (
                      <span style={{
                        fontSize:11, background:'rgba(245,137,74,0.15)',
                        color:T.ember, padding:'3px 8px', borderRadius:20,
                        border:'1px solid rgba(245,137,74,0.3)'
                      }}>
                        ❤️ {notifs.reactions} reaction{notifs.reactions !== 1 ? 's' : ''}
                      </span>
                    )}
                    {notifs.replies > 0 && (
                      <span style={{
                        fontSize:11, background:'rgba(11,123,130,0.15)',
                        color:T.tealLt, padding:'3px 8px', borderRadius:20,
                        border:'1px solid rgba(11,123,130,0.3)'
                      }}>
                        💬 {notifs.replies} repl{notifs.replies !== 1 ? 'ies' : 'y'}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Manage circles — only when inside a circle */}
              {activeCircle && onManageCircles && (
                <div
                  role="menuitem"
                  tabIndex={0}
                  onClick={() => { onManageCircles(); setMenuOpen(false) }}
                  onKeyDown={e => e.key === 'Enter' && onManageCircles()}
                  style={{
                    padding:'12px 16px', fontSize:13, color:'white',
                    cursor:'pointer', display:'flex', alignItems:'center', gap:10,
                    borderBottom:'1px solid rgba(255,255,255,0.07)'
                  }}>
                  <span aria-hidden="true">⭕</span> Manage Circles
                </div>
              )}

              {/* Sign out */}
              <div
                role="menuitem"
                tabIndex={0}
                onClick={handleSignOut}
                onKeyDown={e => e.key === 'Enter' && handleSignOut()}
                style={{
                  padding:'12px 16px', fontSize:13,
                  color:'rgba(255,255,255,0.5)',
                  cursor:'pointer', display:'flex', alignItems:'center', gap:10
                }}>
                <span aria-hidden="true">👋</span> I'll be right back
              </div>
            </div>
          )}
        </div>
      </div>

      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
          style={{ position:'fixed', inset:0, zIndex:29 }}
        />
      )}
    </>
  )
}
