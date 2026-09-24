create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null check (char_length(trim(subject)) > 0),
  title text not null check (char_length(trim(title)) > 0),
  due_date date not null,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "Users can view their own tasks"
on public.tasks for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can add their own tasks"
on public.tasks for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own tasks"
on public.tasks for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own tasks"
on public.tasks for delete
to authenticated
using ((select auth.uid()) = user_id);

create index tasks_user_id_due_date_idx on public.tasks (user_id, due_date);
