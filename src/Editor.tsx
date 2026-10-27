import { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent, type Editor as TipTap } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { supabase, errorMessage, type DocRow } from './lib/supabase'
import { validateTitle } from './lib/validation'
import ShareDialog from './ShareDialog'

type SaveState = 'saved' | 'unsaved' | 'saving' | 'error'
const SAVE_DELAY_MS = 1000

export default function Editor({ docId, userId }: { docId: string; userId: string }) {
  const [doc, setDoc] = useState<DocRow | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [titleError, setTitleError] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showShare, setShowShare] = useState(false)

  // Pending changes are collected here and flushed by one debounced save.
  const pending = useRef<{ title?: string; content?: string }>({})
  const timer = useRef<number | undefined>(undefined)

  async function flush() {
    window.clearTimeout(timer.current)
    const changes = pending.current
    if (!Object.keys(changes).length) return
    pending.current = {}
    setSaveState('saving')
    const { error } = await supabase.from('documents').update(changes).eq('id', docId)
    if (error) {
      pending.current = { ...changes, ...pending.current } // keep for retry
      setSaveError(errorMessage(error))
      setSaveState('error')
    } else {
      setSaveError(null)
      setSaveState(Object.keys(pending.current).length ? 'unsaved' : 'saved')
    }
  }

  function queue(changes: { title?: string; content?: string }) {
    pending.current = { ...pending.current, ...changes }
    setSaveState('unsaved')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(flush, SAVE_DELAY_MS)
  }

  const editor = useEditor({
    extensions: [StarterKit.configure({ link: false })],
    content: '',
    shouldRerenderOnTransaction: true, // keep toolbar active-states in sync
    onUpdate: ({ editor }) => queue({ content: editor.getHTML() }),
  })

  // Load the document once the editor exists.
  useEffect(() => {
    if (!editor) return
    supabase
      .from('documents')
      .select('id, owner_id, title, content, updated_at, owner:profiles!documents_owner_id_fkey(email)')
      .eq('id', docId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) return setLoadError(errorMessage(error))
        if (!data) return setLoadError('Document not found, or you do not have access to it.')
        const row = data as unknown as DocRow
        setDoc(row)
        setTitle(row.title)
        editor.commands.setContent(row.content, { emitUpdate: false })
      })
  }, [editor, docId])

  // Save on leave: flush when unmounting, warn on tab close with unsaved work.
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(pending.current).length) { flush(); e.preventDefault() }
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => { window.removeEventListener('beforeunload', beforeUnload); flush() }
  }, [])

  function onTitleChange(value: string) {
    setTitle(value)
    const err = validateTitle(value)
    setTitleError(err)
    if (!err) queue({ title: value.trim() })
  }

  if (loadError) return <div className="page"><p className="error">{loadError}</p><a href="#/">← Back to documents</a></div>
  if (!doc || !editor) return <div className="page muted">Loading…</div>

  const isOwner = doc.owner_id === userId
  const status = { saved: 'All changes saved', unsaved: 'Unsaved changes…', saving: 'Saving…', error: 'Save failed' }[saveState]

  return (
    <div className="page editor-page">
      <div className="toolbar-row">
        <a href="#/">← Documents</a>
        <input
          className={`title-input ${titleError ? 'invalid' : ''}`}
          value={title}
          onChange={e => onTitleChange(e.target.value)}
          aria-label="Document title"
          maxLength={200}
        />
        <span className={`status ${saveState}`}>{status}</span>
        {saveState === 'error' && <button className="small" onClick={flush}>Retry</button>}
        {isOwner
          ? <button className="primary" onClick={() => setShowShare(true)}>Share</button>
          : <span className="badge">Shared by {doc.owner?.email}</span>}
      </div>
      {titleError && <p className="error small">{titleError}</p>}
      {saveError && <p className="error small">{saveError}</p>}

      <Toolbar editor={editor} />
      <div className="paper"><EditorContent editor={editor} /></div>

      {showShare && <ShareDialog docId={docId} onClose={() => setShowShare(false)} />}
    </div>
  )
}

function Toolbar({ editor }: { editor: TipTap }) {
  const btn = (label: string, active: boolean, run: () => void, title: string) => (
    <button type="button" className={active ? 'active' : ''} onMouseDown={e => e.preventDefault()} onClick={run} title={title}>
      {label}
    </button>
  )
  const c = () => editor.chain().focus()
  return (
    <div className="format-bar">
      {btn('B', editor.isActive('bold'), () => c().toggleBold().run(), 'Bold (Ctrl+B)')}
      {btn('I', editor.isActive('italic'), () => c().toggleItalic().run(), 'Italic (Ctrl+I)')}
      {btn('U', editor.isActive('underline'), () => c().toggleUnderline().run(), 'Underline (Ctrl+U)')}
      <span className="sep" />
      {btn('Text', editor.isActive('paragraph'), () => c().setParagraph().run(), 'Normal text')}
      {btn('H1', editor.isActive('heading', { level: 1 }), () => c().toggleHeading({ level: 1 }).run(), 'Heading 1')}
      {btn('H2', editor.isActive('heading', { level: 2 }), () => c().toggleHeading({ level: 2 }).run(), 'Heading 2')}
      {btn('H3', editor.isActive('heading', { level: 3 }), () => c().toggleHeading({ level: 3 }).run(), 'Heading 3')}
      <span className="sep" />
      {btn('• List', editor.isActive('bulletList'), () => c().toggleBulletList().run(), 'Bulleted list')}
      {btn('1. List', editor.isActive('orderedList'), () => c().toggleOrderedList().run(), 'Numbered list')}
      <span className="sep" />
      {btn('↶', false, () => c().undo().run(), 'Undo (Ctrl+Z)')}
      {btn('↷', false, () => c().redo().run(), 'Redo (Ctrl+Y)')}
    </div>
  )
}
