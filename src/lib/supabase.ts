import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const configError = !url || !key
  ? 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local.'
  : null

export const supabase = createClient(url ?? 'http://localhost', key ?? 'missing')

export type DocRow = {
  id: string
  owner_id: string
  title: string
  content: string
  updated_at: string
  owner?: { email: string } | null
}

// Supabase errors from RAISE EXCEPTION carry the message we wrote in SQL.
export function errorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) return String((err as any).message)
  return 'Something went wrong. Please try again.'
}
