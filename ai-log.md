# AI log (what I changed or rejected, and why)

- Vite scaffold CLI stalled on an interactive prompt → set up the config files by hand.
- AI plan: client inserts into document_shares and reads all profiles → changed to a `share_document` security-definer RPC (no email enumeration, clear errors).
- RLS update policy alone let an editor change `owner_id` → added a column grant (title, content only).
- Markdown import pre-escaped input (double-escaped code) → marked renderer override that escapes only raw HTML. Added XSS tests.
- Removed dompurify and react-router-dom: not needed for 2 screens and a TipTap schema that already strips unknown tags.
- TipTap v3 StarterKit already includes Underline (the separate package is redundant); disabled Link since it's not in scope.
- Bug found in live testing: creating a doc failed with "new row violates row-level security policy". The select policy only used can_access_doc(), which cannot see a row inserted in the same statement (needed for insert ... returning). Fixed by adding an inline `owner_id = auth.uid()` check to the select policy.
