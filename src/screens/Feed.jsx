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

    supabase
      .from('circles')
      .select('id')
      .eq('slug', activeCircle.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          console.error('Circle lookup failed:', activeCircle.id, error)
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
  }, [activeCircle])

  async function fetchPosts(cid) {
    const { data, error } = await supabase
      .from('posts')
      .select('*, circles(name, icon, slug), profiles(display_name, avatar_color)')
      .eq('circle_id', cid)
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) { console.error('fetchPosts error:', error); return }
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
      supabase.removeChannel​​​​​​​​​​​​​​​​
