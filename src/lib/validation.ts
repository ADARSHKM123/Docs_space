export const MAX_TITLE = 200

/** Trims a title; returns an error message or null. */
export function validateTitle(title: string): string | null {
  const t = title.trim()
  if (!t) return 'Title cannot be empty'
  if (t.length > MAX_TITLE) return `Title must be ${MAX_TITLE} characters or fewer`
  return null
}

export function validateEmail(email: string): string | null {
  const e = email.trim()
  if (!e) return 'Enter an email address'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return 'That does not look like an email address'
  return null
}
