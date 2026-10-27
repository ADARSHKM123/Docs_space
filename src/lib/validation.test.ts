import { describe, it, expect } from 'vitest'
import { validateTitle, validateEmail } from './validation'

describe('validation', () => {
  it('validates titles', () => {
    expect(validateTitle('  Plan  ')).toBeNull()
    expect(validateTitle('   ')).toBe('Title cannot be empty')
    expect(validateTitle('x'.repeat(201))).toMatch(/200 characters/)
  })
  it('validates emails', () => {
    expect(validateEmail('bob@test.com')).toBeNull()
    expect(validateEmail('')).toBe('Enter an email address')
    expect(validateEmail('bob@')).toMatch(/does not look like/)
  })
})
