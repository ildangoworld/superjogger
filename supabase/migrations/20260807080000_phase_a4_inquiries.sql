-- Phase A4: user inquiries and admin replies

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  content text not null,
  status text not null default 'OPEN'
    check (status in ('OPEN', 'ANSWERED', 'CLOSED')),
  answer_content text,
  answered_by uuid references auth.users (id) on delete set null,
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  constraint inquiries_title_length check (
    char_length(title) between 1 and 100
  ),
  constraint inquiries_content_length check (
    char_length(content) between 1 and 5000
  ),
  constraint inquiries_answer_length check (
    answer_content is null
    or char_length(answer_content) between 1 and 5000
  ),
  constraint inquiries_answered_fields_consistent check (
    (
      status = 'OPEN'
      and answer_content is null
      and answered_by is null
      and answered_at is null
    )
    or (
      status = 'ANSWERED'
      and answer_content is not null
      and answered_by is not null
      and answered_at is not null
    )
    or (
      status = 'CLOSED'
      and (
        (
          answer_content is null
          and answered_by is null
          and answered_at is null
        )
        or (
          answer_content is not null
          and answered_by is not null
          and answered_at is not null
        )
      )
    )
  )
);

create index inquiries_user_id_created_at_idx
  on public.inquiries (user_id, created_at desc);

create index inquiries_status_created_at_idx
  on public.inquiries (status, created_at desc);

alter table public.inquiries enable row level security;

-- Users may read and create their own inquiries only.
create policy "inquiries_select_own"
on public.inquiries for select
to authenticated
using (auth.uid() = user_id);

create policy "inquiries_insert_own"
on public.inquiries for insert
to authenticated
with check (
  auth.uid() = user_id
  and status = 'OPEN'
  and answer_content is null
  and answered_by is null
  and answered_at is null
);

-- No authenticated update/delete: answers go through service_role only.
grant select, insert on table public.inquiries to authenticated;
grant all on table public.inquiries to service_role;
