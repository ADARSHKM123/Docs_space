import { useEffect, useState, type FormEvent } from 'react'
import { supabase, errorMessage } from './lib/supabase'
import { validateEmail } from './lib/validation'

type Share = { id: string; user: { email: string } | null }

export default function ShareDialog({ docId, onClose }: { docId: string; onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [shares, setShares] = useState<Share[]>([])
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    const { data, error } = await supabase
      .from('document_shares').select('id, user:profiles(email)').eq('document_id', docId)
    if (error) setError(errorMessage(error))
    else setShares((data ?? []) as unknown as Share[])
  }
  useEffect(() => { load() }, [docId])

  async function share(e: FormEvent) {
    e.preventDefault()
    setNotice(null)
    const invalid = validateEmail(email)
    if (invalid) return setError(invalid)
    setBusy(true)
    setError(null)
    // The database function checks ownership and looks the user up by email.
    const { error } = await supabase.rpc('share_document', { doc: docId, target_email: email.trim() })
    setBusy(false)
    if (error) return setError(errorMessage(error))
    setNotice(`Shared with ${email.trim()}`)
    setEmail('')
    load()
  }

  async function revoke(id: string) {
    const { error } = await supabase.from('document_shares').delete().eq('id', id)
    if (error) setError(errorMessage(error))
    else setShares(s => s.filter(x => x.id !== id))
  }

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="card dialog" onClick={e => e.stopPropagation()} role="dialog" aria-label="Share document">
        <h2>Share document</h2>
        <p className="muted small">People you add can view and edit. Only you can share or delete.</p>
        <form onSubmit={share} className="row">
          <input type="email" placeholder="person@example.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
          <button className="primary" disabled={busy}>{busy ? 'Sharing…' : 'Share'}</button>
        </form>
        {error && <p className="error small">{error}</p>}
        {notice && <p className="ok small">{notice}</p>}
        <h3>People with access</h3>
        {shares.length === 0 ? <p className="muted small">Only you.</p> : (
          <ul className="sharelist">
            {shares.map(s => (
              <li key={s.id}>
                <span>{s.user?.email}</span>
                <button className="small" onClick={() => revoke(s.id)}>Remove</button>
              </li>
            ))}
          </ul>
        )}
        <div className="row end"><button onClick={onClose}>Done</button></div>
      </div>
    </div>
  )
}
