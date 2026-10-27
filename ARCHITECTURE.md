# Architecture

```
Browser (React + Vite + TipTap)  ──supabase-js──▶  Supabase
  Login / DocList / Editor / ShareDialog            ├─ Auth (email + password)
  lib/importFile.ts  (txt/md → HTML, in browser)    ├─ Postgres: profiles, documents, document_shares
                                                    └─ RLS policies + share_document() RPC
Hosted on Vercel (static build)
```

There's no custom backend server. Supabase provides auth, the database and an auto-generated API. The **access logic lives in the database**, so it holds even if someone calls the API directly and skips the UI.

## Data model
- `profiles(id, email)`, one per auth user, created by a trigger on signup.
- `documents(id, owner_id, title, content HTML, created_at, updated_at)`
- `document_shares(document_id, user_id)` with a unique pair constraint.

## Access rules (RLS)
| Action | Who |
|---|---|
| Read / edit a document | owner, or a user it is shared with |
| Edit columns | `title` and `content` only (column grant, so an editor cannot change `owner_id`) |
| Delete a document | owner |
| Share | owner, only through the `share_document(doc, email)` function |
| Revoke a share | owner |
| See a profile's email | yourself, owners of docs shared with you, people you shared with |

Policies call two small `security definer` helpers (`can_access_doc`, `is_doc_owner`) to avoid the infinite recursion that happens when the `documents` and `document_shares` policies reference each other.

Sharing goes through an RPC instead of a direct insert. That way users never need permission to read every email address, and errors like "no such user", "already shared" and "can't share with yourself" come back as clear messages.

## Key decisions and tradeoffs
- **HTML storage:** it's simple and keeps formatting exactly. A JSON document model would allow structured diffing, but there was no time for it.
- **Debounced autosave (1 s) with last write wins:** fine for a single editor at a time. Concurrent edits would need Supabase Realtime plus a CRDT (Yjs).
- **Upload parsed client-side:** no server, no file storage. Markdown raw HTML is escaped, and TipTap's schema drops unknown tags. That's the XSS defence.
- **Hash routing, no router library:** two screens don't justify one.
- **Prioritised:** access-control correctness, persistence and clear errors over visual polish and stretch features.
