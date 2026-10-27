import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { supabase, errorMessage, type DocRow } from './lib/supabase'
import { convertFile, SUPPORTED_EXTENSIONS } from './lib/importFile'

type Tab = 'mine' | 'shared'

export default function DocList({ userId }: { userId: string }) {
  const [tab, setTab] = useState<Tab>('mine')
  const [docs, setDocs] = useState<DocRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  async function load() {
    setLoading(true)
    setError(null)
    let q = supabase
      .from('documents')
      .select('id, owner_id, title, updated_at, owner:profiles!documents_owner_id_fkey(email)')
      .order('updated_at', { ascending: false })
    q = tab === 'mine' ? q.eq('owner_id', userId) : q.neq('owner_id', userId)
    const { data, error } = await q
    if (error) setError(errorMessage(error))
    else setDocs((data ?? []) as unknown as DocRow[])
    setLoading(false)
  }

  useEffect(() => { load() }, [tab])

  async function createDoc(title = 'Untitled document', content = '') {
    const { data, error } = await supabase
      .from('documents').insert({ title, content, owner_id: userId }).select('id').single()
    if (error) return setError(errorMessage(error))
    location.hash = `#/doc/${data.id}`
  }

  async function onUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-uploading the same file
    if (!file) return
    try {
      const { title, html } = convertFile(file.name, file.size, await file.text())
      await createDoc(title, html)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  async function deleteDoc(doc: DocRow) {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return
    const { error } = await supabase.from('documents').delete().eq('id', doc.id)
    if (error) setError(errorMessage(error))
    else setDocs(d => d.filter(x => x.id !== doc.id))
  }

  return (
    <div className="page">
      <div className="toolbar-row">
        <div className="tabs">
          <button className={tab === 'mine' ? 'active' : ''} onClick={() => setTab('mine')}>My documents</button>
          <button className={tab === 'shared' ? 'active' : ''} onClick={() => setTab('shared')}>Shared with me</button>
        </div>
        <span className="spacer" />
        <button onClick={() => fileInput.current?.click()} title="Supported: .txt, .md (max 1 MB)">Upload file</button>
        <input ref={fileInput} type="file" accept={SUPPORTED_EXTENSIONS.join(',')} hidden onChange={onUpload} />
        <button className="primary" onClick={() => createDoc()}>+ New document</button>
      </div>
      <p className="muted small">Upload turns a {SUPPORTED_EXTENSIONS.join(' or ')} file (max 1 MB) into a new editable document.</p>

      {error && <p className="error">{error}</p>}
      {loading ? <p className="muted">Loading…</p> : docs.length === 0 ? (
        <p className="muted empty">{tab === 'mine' ? 'No documents yet. Create one or upload a file.' : 'Nothing has been shared with you yet.'}</p>
      ) : (
        <ul className="doclist">
          {docs.map(d => (
            <li key={d.id}>
              <a href={`#/doc/${d.id}`} className="doclink">
                <strong>{d.title}</strong>
                <span className="muted small">
                  {tab === 'shared' && <span className="badge">Owner: {d.owner?.email ?? 'unknown'}</span>}
                  Edited {new Date(d.updated_at).toLocaleString()}
                </span>
              </a>
              {tab === 'mine' && <button className="danger small" onClick={() => deleteDoc(d)}>Delete</button>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
