import { Marked } from 'marked'

export const SUPPORTED_EXTENSIONS = ['.txt', '.md'] as const
export const MAX_FILE_BYTES = 1024 * 1024 // 1 MB

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function extensionOf(name: string): string {
  const i = name.lastIndexOf('.')
  return i === -1 ? '' : name.slice(i).toLowerCase()
}

/** "meeting-notes.md" -> "meeting-notes" */
export function titleFromFilename(name: string): string {
  const ext = extensionOf(name)
  const base = ext ? name.slice(0, -ext.length) : name
  return base.trim().slice(0, 200) || 'Imported document'
}

/** Plain text: blank lines split paragraphs, single newlines become <br>. */
export function textToHtml(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

// Raw HTML inside markdown is shown as text, not rendered. TipTap's schema also drops unknown nodes.
const md = new Marked({ gfm: true, renderer: { html: ({ text }) => escapeHtml(text) } })

export function markdownToHtml(source: string): string {
  return md.parse(source.replace(/\r\n/g, '\n'), { async: false }) as string
}

export type ImportResult = { title: string; html: string }

/** Validates and converts an uploaded file. Throws Error with a user-facing message. */
export function convertFile(name: string, size: number, text: string): ImportResult {
  const ext = extensionOf(name)
  if (!(SUPPORTED_EXTENSIONS as readonly string[]).includes(ext)) {
    throw new Error(`Unsupported file type "${ext || 'none'}". Supported: ${SUPPORTED_EXTENSIONS.join(', ')}`)
  }
  if (size > MAX_FILE_BYTES) throw new Error('File is larger than 1 MB')
  if (!text.trim()) throw new Error('File is empty')
  const html = ext === '.md' ? markdownToHtml(text) : textToHtml(text)
  return { title: titleFromFilename(name), html }
}
