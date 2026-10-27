# AI Workflow Note

## 1. Tools used
- **Claude (chat):** scoping, stack choice, milestone plan, schema and RLS review, deployment guidance.
- **Claude Code:** implementation, one milestone at a time, with a short plan before code and a review after each step.

## 2. Where AI materially sped me up
- **Schema + RLS:** drafted tables, triggers, helper functions and policies (`security definer` helpers such as `can_access_doc` avoid policy recursion).
- **Sharing:** a `share_document` RPC with clear error messages ("No user found", "Already shared").
- **Editor and import:** TipTap toolbar and autosave wiring, plus `.txt` / `.md` to HTML import.
- **Milestone planning:** splitting the 4-hour timebox into reviewable milestones with pre-decided scope cuts.

## 3. What I changed or rejected

| AI suggested / did | What I did | Why |
|---|---|---|
| Next.js full-stack setup | Changed to React + Vite + Supabase | I am not comfortable debugging Next.js under a 4-hour clock; Supabase provides auth, Postgres and RLS without a separate backend |
| Vercel Supabase integration | Skipped it; set `VITE_` env vars manually | The integration injects different variable names than my Vite app uses, and I already had a configured project |
| `.docx` upload, viewer/editor roles | Cut deliberately | Protects the core features: editing, sharing, persistence, deployment |

## 4. Guardrails I put on the AI
- **No commits without my approval.** After the AI committed on its own early on, I made approval before every commit a standing rule, and I chose exactly which files went into each commit.
- **Secrets blocked.** I added `.claude/settings.json`, which denies the AI read and edit access to `.env`, `.env.local` and `.env.*.local`.
- **Project context file.** `CLAUDE.md` records the architecture rules (for example, that access logic lives in the database's RLS, not the UI), so every AI session follows them.
- **I ran the tests myself.** The AI wrote step-by-step test instructions; I executed them and reported back, instead of letting it run the app unattended.

## 5. How I verified
- **Manual two-user testing (Alice, Bob, Carol)** caught a real bug: creating a document failed with "new row violates row-level security policy". The select policy used only `can_access_doc()`, which cannot see a row inserted in the same statement (needed for `insert ... returning`). Fixed by adding an inline `owner_id = auth.uid()` check to the select policy.
- **Automated tests:** 8 Vitest tests cover the Markdown/text import converter (including XSS cases) and title and email validation.
- **Access logic:** enforced in the database by RLS policies and the RPC, not only in the UI.
- **Reading AI output:** I asked the AI to explain shortcuts and risks in the code it wrote, and kept a running `ai-log.md` of every correction.

## 6. Approach
Plan first, build one milestone at a time, review the code, then move on. AI drafted; I made the scope, security and tradeoff decisions.
