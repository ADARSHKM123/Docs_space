# Docs Space

A lightweight collaborative document editor: create, edit with rich text, upload files, and share documents with other users.

**Live demo:** _TODO: Vercel URL_
**Walkthrough video:** see `VIDEO.txt`

## Test accounts

| Email | Password |
|---|---|
| alice@test.com | `Test@12345` |
| bob@test.com | `Test@12345` |
| carol@test.com | `Test@12345` |

**Try sharing:** sign in as Alice → New document → type something → **Share** → `bob@test.com`. Sign out, sign in as Bob → **Shared with me** → open it and edit. Alice sees Bob's edits after refresh.

## Features

- **Documents:** create, rename (inline title), edit, delete (owner only), reopen. Autosaves ~1 s after you stop typing, with a "Saving… / All changes saved" indicator and retry on failure.
- **Formatting:** bold, italic, underline, H1–H3, bulleted and numbered lists, undo/redo. Content is stored as HTML, so formatting survives reloads.
- **File upload:** `.txt` and `.md` only, max 1 MB. Each upload becomes a **new editable document** titled after the file. Markdown keeps headings, emphasis and lists. Other types are rejected with a clear message.
- **Sharing:** the owner shares by email. Recipients can view and edit, and the document appears under **Shared with me** with an owner label. Only the owner can share, revoke access or delete.
- **Access control is enforced by the database** (Postgres Row Level Security), not just hidden in the UI.

## Run locally

Requires Node 20+ and a free Supabase project.

1. **Supabase setup**
   - Create a project. In **Authentication → Providers → Email**, turn off **Confirm email**.
   - In **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql).
   - In **Authentication → Users → Add user**, create the three test users above (tick *Auto confirm*).
2. **App**
   ```bash
   npm install
   cp .env.example .env.local   # fill in Project URL and anon key (Settings → API)
   npm run dev
   ```
3. **Tests:** `npm test` (Vitest: file import conversion and input validation).

## Deploy (Vercel)

Import the GitHub repo in Vercel (framework: Vite), add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables, and deploy. The app uses hash routing, so no rewrite config is needed.

## What's working / not

- **Working:** everything listed under Features.
- **Not built:** real-time co-editing (last write wins if two people edit at once), viewer-only roles, version history, export, `.docx` import.
- **Next 2–4 hours:** realtime presence and live updates via Supabase Realtime; a view/edit role on shares; Markdown/PDF export; Playwright end-to-end tests for the sharing flow.

See [ARCHITECTURE.md](ARCHITECTURE.md) and [AI_WORKFLOW.md](AI_WORKFLOW.md).
