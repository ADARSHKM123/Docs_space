# Submission: Docs Space

**Candidate:** Adarsh K M
**Role:** Full Stack Product Engineer, Ajaia LLC

## Links
- **Live app:** https://docs-space.vercel.app/
- **Source code:** https://github.com/ADARSHKM123/Docs_space
- **Walkthrough video:** _TODO: paste link_ (also in `VIDEO.txt`)

## Test accounts
| Email | Password |
|---|---|
| alice@test.com | `Test@12345` |
| bob@test.com | `Test@12345` |
| carol@test.com | `Test@12345` |

**Sharing in 1 minute:** sign in as Alice → **+ New document** → type → **Share** → `bob@test.com`. Sign in as Bob → **Shared with me** → open and edit. Carol sees nothing.

## What's included
| File | Contents |
|---|---|
| `README.md` | Features, local setup and run instructions, deploy steps, test accounts |
| `ARCHITECTURE.md` | Architecture, data model, access rules, tradeoffs |
| `AI_WORKFLOW.md` | AI tools used, what was accepted, changed or rejected, how it was verified |
| `ai-log.md` | Running log of AI output I changed or rejected |
| `SUBMISSION.md` | This file |
| `VIDEO.txt` | Walkthrough video link |
| `supabase/schema.sql` | Tables, Row Level Security policies, share function |
| `src/` | React + TipTap app; tests in `src/lib/*.test.ts` |

## Stack
React 19 + Vite + TypeScript, TipTap editor, Supabase (Auth, Postgres, Row Level Security), Vitest, deployed on Vercel.

## What's working
- Create, rename, edit, delete and reopen documents, with 1-second debounced autosave and a save-status indicator
- Rich text: bold, italic, underline, H1–H3, bulleted and numbered lists, undo/redo
- Upload `.txt` or `.md` (max 1 MB) as a new editable document; other types are rejected with a clear message
- Sharing by email (owner only); "My documents" and "Shared with me" lists with an owner label; revoke access
- Access enforced in the database by RLS, not only in the UI. Shared users can edit only the title and content.
- Persistence in Postgres; formatting survives refresh
- 8 automated tests (file import, including XSS cases, and input validation)

## What's incomplete or intentionally cut
- No real-time co-editing: concurrent edits are last-write-wins
- One permission level (can edit); no viewer-only role
- No version history, comments or export
- No `.docx` or `.pdf` import

## With another 2–4 hours
1. Live updates and presence with Supabase Realtime
2. Viewer / editor roles on shares
3. Export to Markdown or PDF
4. Playwright end-to-end test for the two-user sharing flow
