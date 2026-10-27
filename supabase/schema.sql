-- Docs Space schema. Run once in the Supabase SQL editor (safe on a fresh project).

-- ---------- Tables ----------
create table public.profiles (
  id    uuid primary key references auth.users(id) on delete cascade,
  email text not null unique
);

create table public.documents (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  title      text not null default 'Untitled document'
             check (char_length(trim(title)) between 1 and 200),
  content    text not null default '',          -- TipTap HTML
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.document_shares (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (document_id, user_id)
);

-- ---------- Triggers ----------
-- Create a profile row whenever someone signs up.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, lower(new.email));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- Backfill users created before this script ran.
insert into public.profiles (id, email)
select id, lower(email) from auth.users on conflict do nothing;

create function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger documents_touch before update on public.documents
  for each row execute function public.touch_updated_at();

-- ---------- Helpers (security definer = bypass RLS, which prevents policy recursion) ----------
create function public.is_doc_owner(doc uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from documents where id = doc and owner_id = auth.uid());
$$;

create function public.can_access_doc(doc uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from documents where id = doc and owner_id = auth.uid())
      or exists (select 1 from document_shares where document_id = doc and user_id = auth.uid());
$$;

-- ---------- Row Level Security ----------
alter table public.profiles        enable row level security;
alter table public.documents       enable row level security;
alter table public.document_shares enable row level security;

-- Profiles: you see yourself, owners of docs you can open, and people you shared with.
create policy profiles_select on public.profiles for select to authenticated using (
  id = auth.uid()
  or exists (select 1 from documents d where d.owner_id = profiles.id and public.can_access_doc(d.id))
  or exists (select 1 from document_shares s where s.user_id = profiles.id and public.is_doc_owner(s.document_id))
);

-- Documents: owner or shared user can read and edit; only the owner can create-as-self and delete.
-- owner_id check is inline: on INSERT ... RETURNING the helper can't see the brand-new row yet.
create policy documents_select on public.documents for select to authenticated
  using (owner_id = auth.uid() or public.can_access_doc(id));
create policy documents_insert on public.documents for insert to authenticated
  with check (owner_id = auth.uid());
create policy documents_update on public.documents for update to authenticated
  using (public.can_access_doc(id)) with check (public.can_access_doc(id));
create policy documents_delete on public.documents for delete to authenticated
  using (owner_id = auth.uid());

-- Editors may change title/content only (never owner_id).
revoke update on public.documents from authenticated, anon;
grant update (title, content) on public.documents to authenticated;

-- Shares: visible to the recipient and the owner; only the owner can revoke.
-- No insert policy: shares are created only through share_document() below.
create policy shares_select on public.document_shares for select to authenticated
  using (user_id = auth.uid() or public.is_doc_owner(document_id));
create policy shares_delete on public.document_shares for delete to authenticated
  using (public.is_doc_owner(document_id));

-- ---------- RPC: share a document by email ----------
create function public.share_document(doc uuid, target_email text) returns void
language plpgsql security definer set search_path = public as $$
declare target uuid;
begin
  if not public.is_doc_owner(doc) then
    raise exception 'Only the owner can share this document';
  end if;
  select id into target from profiles where email = lower(trim(target_email));
  if target is null then
    raise exception 'No user found with email %', target_email;
  end if;
  if target = auth.uid() then
    raise exception 'You already own this document';
  end if;
  insert into document_shares (document_id, user_id) values (doc, target)
  on conflict (document_id, user_id) do nothing;
  if not found then
    raise exception 'Already shared with %', target_email;
  end if;
end $$;

revoke execute on function public.share_document(uuid, text) from anon, public;
grant execute on function public.share_document(uuid, text) to authenticated;
