# AI log (what I changed or rejected, and why)

- Vite scaffold CLI stalled on an interactive prompt → set up the config files by hand.
- AI plan: client inserts into document_shares and reads all profiles → changed to a `share_document` security-definer RPC (no email enumeration, clear errors).
- RLS update policy alone let an editor change `owner_id` → added a column grant (title, content only).
- Markdown import pre-escaped input (double-escaped code) → marked renderer override that escapes only raw HTML. Added XSS tests.
- Removed dompurify and react-router-dom: not needed for 2 screens and a TipTap schema that already strips unknown tags.
- TipTap v3 StarterKit already includes Underline (the separate package is redundant); disabled Link since it's not in scope.
