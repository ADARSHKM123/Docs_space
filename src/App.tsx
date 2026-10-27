import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, configError } from './lib/supabase'
import Login from './Login'
import DocList from './DocList'
import Editor from './Editor'

// Tiny hash router: "#/doc/<id>" opens a document, anything else shows the list.
function useHashDocId(): string | null {
  const read = () => location.hash.match(/^#\/doc\/([\w-]+)/)?.[1] ?? null
  const [id, setId] = useState(read)
  useEffect(() => {
    const onHash = () => setId(read())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return id
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const docId = useHashDocId()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (configError) return <div className="center error">{configError}</div>
  if (loading) return <div className="center">Loading…</div>
  if (!session) return <Login />

  const user = session.user
  return (
    <div className="app">
      <header className="topbar">
        <a href="#/" className="brand">Ajaia Docs</a>
        <span className="spacer" />
        <span className="muted">{user.email}</span>
        <button onClick={() => { location.hash = ''; supabase.auth.signOut() }}>Sign out</button>
      </header>
      <main>
        {docId ? <Editor key={docId} docId={docId} userId={user.id} /> : <DocList userId={user.id} />}
      </main>
    </div>
  )
}
