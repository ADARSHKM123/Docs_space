import { useState, type FormEvent } from 'react'
import { supabase } from './lib/supabase'

const DEMO_USERS = ['alice@test.com', 'bob@test.com', 'carol@test.com']

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) setError(error.message === 'Invalid login credentials' ? 'Wrong email or password' : error.message)
    setBusy(false)
  }

  return (
    <div className="center">
      <form className="card login" onSubmit={submit}>
        <h1>Ajaia Docs</h1>
        <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus /></label>
        <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
        {error && <p className="error">{error}</p>}
        <button className="primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <p className="muted small">
          Demo accounts:{' '}
          {DEMO_USERS.map(u => (
            <button type="button" key={u} className="link" onClick={() => setEmail(u)}>{u}</button>
          ))}
          <br />Password is in the README.
        </p>
      </form>
    </div>
  )
}
