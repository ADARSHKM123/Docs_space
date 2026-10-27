# AI workflow note

_TODO (Adarsh): edit this in your own words before submitting._

**Tools:** Claude (planning and scoping in chat), Claude Code (writing code in the repo, running tests and builds).

**Where AI sped things up**
- Turning the brief into a timed milestone plan with cuts decided in advance.
- Writing the schema, RLS policies, React components and tests in minutes.
- Writing first drafts of the README and architecture notes.

**What I changed or rejected**
- The first plan let the client insert share rows directly and read all profiles. I moved sharing into a `share_document` RPC so emails aren't exposed and errors are explicit.
- The first plan seeded users with SQL inserts into `auth.users`. I switched to the dashboard's "Add user", which is safer and supported.
- Added a column-level grant so a shared editor can't reassign `owner_id`. The policy alone allowed it.
- The first Markdown import pre-escaped the source, which double-escaped code blocks. I replaced it with a renderer override that escapes only raw HTML.
- Dropped DOMPurify and react-router as unnecessary for this scope.
- See `ai-log.md` for the running list.

**How I verified**
- Unit tests (`npm test`) for import conversion and validation, including XSS cases.
- Typecheck and production build.
- Manual two-user test: Alice shares with Bob, Bob edits, Carol can't see the doc (also checked with a direct API query as Carol).
