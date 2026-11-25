import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

// The fixtures use invented accounts. They run only in a new, isolated database.
const checks = [
  {
    migration: "20261125102545_internship_announcements.sql",
    setup: `create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create table public.internship_interns (id uuid primary key);
insert into public.internship_interns values ('ae924248-2fce-42ac-87b0-420b836a82a3');`,
    check: `do $$
begin
  if not (select relrowsecurity from pg_class where oid = 'public.internship_announcements'::regclass)
      or has_table_privilege('anon', 'public.internship_announcements', 'select, insert, update, delete')
      or has_table_privilege('authenticated', 'public.internship_announcements', 'select, insert, update, delete')
      or has_table_privilege('service_role', 'public.internship_announcements', 'update, delete') then
    raise exception 'Announcement grants are incorrect';
  end if;
end $$;
set role service_role;
insert into internship_announcements (id, intern_id, published_by, publisher_role, title, body)
values ('9fc0d4ba-d5ba-4bb7-9754-67e6293444bf', 'ae924248-2fce-42ac-87b0-420b836a82a3',
  '96d67e26-8b77-4313-b952-d7b8f63b4ba1', 'manager', 'Fixture title', 'Fixture body')
on conflict (id) do nothing;
insert into internship_announcements (id, intern_id, published_by, publisher_role, title, body)
values ('9fc0d4ba-d5ba-4bb7-9754-67e6293444bf', 'ae924248-2fce-42ac-87b0-420b836a82a3',
  '96d67e26-8b77-4313-b952-d7b8f63b4ba1', 'manager', 'Retry', 'Fixture body')
on conflict (id) do nothing;
do $$
begin
  if (select count(*) from internship_announcements) <> 1 then
    raise exception 'Announcement retry was not idempotent';
  end if;
  begin
    insert into internship_announcements (intern_id,published_by,publisher_role,title,body)
    values ('ae924248-2fce-42ac-87b0-420b836a82a3','96d67e26-8b77-4313-b952-d7b8f63b4ba1','intern','Invalid','Body');
    raise exception 'Invalid publisher accepted';
  exception when check_violation then null;
  end;
end $$;
reset role;
set role authenticated;
do $$
begin
  begin
    perform 1 from internship_announcements;
    raise exception 'Authenticated client unexpectedly sees announcement data directly';
  exception when insufficient_privilege then null;
  end;
end $$;`,
  },
  {
    migration: "20261125103107_internship_assignment_submission_history.sql",
    setup: `create table public.internship_tasks (
  id uuid primary key, intern_id uuid not null references public.internship_interns(id), status text not null,
  submitted_at timestamptz, student_notes text not null default '', work_url text not null default '',
  brief_payload jsonb not null default '{}'
);
grant select, insert, update on public.internship_tasks to service_role;`,
    check: `set role service_role;
insert into internship_tasks(id,intern_id,status)
values ('b031be5f-857a-448c-8bf0-26ec6bb48049','ae924248-2fce-42ac-87b0-420b836a82a3','todo');
update internship_tasks set status='submitted', submitted_at='2027-03-06T10:00:00Z', student_notes='First version';
update internship_tasks set status='revision_requested';
update internship_tasks set student_notes='Draft edits';
update internship_tasks set status='submitted', submitted_at='2027-03-07T10:00:00Z',
  student_notes='Second version', brief_payload='{"internWork":{"notes":"Second version"},"privateNotes":"hidden"}';
update internship_tasks set status='approved';
do $$
begin
  if (select array_agg(notes order by submitted_at) from internship_assignment_submissions)
      is distinct from array['First version', 'Second version'] then
    raise exception 'Submission snapshots were not preserved';
  end if;
  if exists(select 1 from internship_assignment_submissions where work_snapshot ? 'privateNotes') then
    raise exception 'Unexpected task metadata in snapshot';
  end if;
  if has_table_privilege('anon', 'public.internship_assignment_submissions', 'select, insert, update, delete')
      or has_table_privilege('authenticated', 'public.internship_assignment_submissions', 'select, insert, update, delete')
      or has_table_privilege('service_role', 'public.internship_assignment_submissions', 'update, delete') then
    raise exception 'Snapshot grants are incorrect';
  end if;
end $$;`,
  },
  {
    migration: "20261125103512_internship_private_assignment_evaluations.sql",
    setup: `create schema auth;
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
alter table public.internship_interns
  add column user_id uuid,
  add column portal_enabled boolean not null default true,
  add column status text not null default 'active';
update internship_interns set user_id='06428175-3715-4302-a147-d956d1356a29';
insert into internship_interns(id,user_id) values ('8b74ed51-d2ad-4f7e-9b59-ae710d65afdb','6ea65baf-7519-4daa-9e76-bcc87de296c5');
insert into internship_tasks(id,intern_id,status)
values ('df45a6b4-18a1-4457-aadf-6bdb9f49bb81','8b74ed51-d2ad-4f7e-9b59-ae710d65afdb','todo');`,
    check: `set role service_role;
insert into internship_assignment_evaluations
  (task_id, intern_id, evaluator_id, scores, maximums, feedback, private_notes, released_at)
values
  ('b031be5f-857a-448c-8bf0-26ec6bb48049','ae924248-2fce-42ac-87b0-420b836a82a3','96d67e26-8b77-4313-b952-d7b8f63b4ba1','{20,20,21,25}','{25,25,25,25}','Released A','Private A',now()),
  ('b031be5f-857a-448c-8bf0-26ec6bb48049','ae924248-2fce-42ac-87b0-420b836a82a3','96d67e26-8b77-4313-b952-d7b8f63b4ba1','{0,0,0,0}','{25,25,25,25}','Draft A','Private draft',null),
  ('df45a6b4-18a1-4457-aadf-6bdb9f49bb81','8b74ed51-d2ad-4f7e-9b59-ae710d65afdb','96d67e26-8b77-4313-b952-d7b8f63b4ba1','{10,10,10,10}','{25,25,25,25}','Released B','Private B',now());
do $$
begin
  begin
    insert into internship_assignment_evaluations(task_id,intern_id,evaluator_id,scores,maximums)
    values ('b031be5f-857a-448c-8bf0-26ec6bb48049','8b74ed51-d2ad-4f7e-9b59-ae710d65afdb','96d67e26-8b77-4313-b952-d7b8f63b4ba1','{1,1,1,1}','{25,25,25,25}');
    raise exception 'Mismatch accepted';
  exception when foreign_key_violation then null;
  end;
end $$;
reset role;
set role authenticated;
set request.jwt.claim.sub='06428175-3715-4302-a147-d956d1356a29';
do $$
begin
  if (select array_agg(feedback) from internship_assignment_evaluations) is distinct from array['Released A']
      or (select array_agg(total) from internship_assignment_evaluations) is distinct from array[86] then
    raise exception 'Grade release or cross-intern isolation incorrect';
  end if;
  begin
    perform private_notes from internship_assignment_evaluations;
    raise exception 'Private notes accessible';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from internship_assignment_evaluations;
    raise exception 'Intern could delete evaluation';
  exception when insufficient_privilege then null;
  end;
end $$;
set request.jwt.claim.sub='6ea65baf-7519-4daa-9e76-bcc87de296c5';
do $$
begin
  if (select array_agg(feedback) from internship_assignment_evaluations) is distinct from array['Released B'] then
    raise exception 'Second intern has incorrect access';
  end if;
end $$;
set request.jwt.claim.sub='';
do $$
begin
  if exists (select id from internship_assignment_evaluations) then
    raise exception 'Unsigned visitor can read grades';
  end if;
end $$;`,
  },
  {
    migration: "20261125104036_growth_partner_proposals.sql",
    setup: `create table public.partners (id uuid primary key);
alter table public.internship_interns add column full_name text;
update public.internship_interns set full_name = 'Lola Uhl' where id='ae924248-2fce-42ac-87b0-420b836a82a3';`,
    check: `set role service_role;
do $$
declare
  proposal uuid;
  manager uuid := '96d67e26-8b77-4313-b952-d7b8f63b4ba1';
  acceptance uuid := '58e3aadf-07d7-4654-871a-e66ae456d325';
begin
  select id into strict proposal from growth_partner_proposals where proposal_key='baldwin-founding-pilot';
  if (select sum(monthly_cents * term_months) from growth_partner_proposals) <> 18000 then
    raise exception 'Combined proposal amount incorrect';
  end if;
  begin
    insert into growth_partner_proposal_events(proposal_id,event_type,actor_user_id,actor_role,month_number)
    values(proposal,'payment_approved',manager,'supervisor',1);
    raise exception 'Proposal allowed premature approval';
  exception when raise_exception then
    if sqlerrm = 'Proposal allowed premature approval' then raise; end if;
  end;
  insert into growth_partner_proposal_events(id,proposal_id,event_type,actor_user_id,actor_role,evidence_url)
  values(acceptance,proposal,'accepted',manager,'supervisor','https://example.org/agreement');
  insert into growth_partner_proposal_events(id,proposal_id,event_type,actor_user_id,actor_role,evidence_url)
  values(acceptance,proposal,'accepted',manager,'supervisor','https://example.org/agreement')
  on conflict(id) do nothing;
  insert into growth_partner_proposal_events(proposal_id,event_type,actor_user_id,actor_role,month_number)
  values(proposal,'evidence',manager,'intern',1),(proposal,'verified',manager,'manager',1);
  begin
    insert into growth_partner_proposal_events(proposal_id,event_type,actor_user_id,actor_role,month_number)
    values(proposal,'payment_approved',manager,'manager',1);
    raise exception 'Manager approved payment';
  exception when raise_exception then
    if sqlerrm = 'Manager approved payment' then raise; end if;
  end;
  insert into growth_partner_proposal_events(proposal_id,event_type,actor_user_id,actor_role,month_number)
  values(proposal,'payment_approved',manager,'supervisor',1);
  if (select count(*) from growth_partner_proposal_events where proposal_id=proposal) <> 4 then
    raise exception 'Partner events incorrect';
  end if;
end $$;`,
  },
];

const docker = process.env.SITGURU_VERIFICATION_DOCKER_HOST
  ? ["--host", process.env.SITGURU_VERIFICATION_DOCKER_HOST] : [];
const container = `sitguru-internship-test-${randomUUID()}`;

function run(args, options = {}) {
  const result = spawnSync("docker", [...docker, ...args], { stdio: "inherit", ...options });
  if (result.status !== 0) throw new Error(`Docker exited with ${result.status}: ${args[0]}`, { cause: result.error });
}

run(["run", "--rm", "-d", "--name", container, "--network", "none",
  "-e", "POSTGRES_HOST_AUTH_METHOD=trust", "postgres:17"]);

try {
  const deadline = Date.now() + 30_000;
  let ready = false;
  while (!ready && Date.now() < deadline) {
    const probe = spawnSync("docker", [...docker, "exec", container, "pg_isready", "-U", "postgres", "-h", "127.0.0.1"], { stdio: "ignore" });
    ready = probe.status === 0;
    if (!ready) await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!ready) throw new Error("The disposable PostgreSQL instance did not start.");

  for (const { migration, setup, check } of checks) {
    const sql = readFileSync(new URL(`../supabase/migrations/${migration}`, import.meta.url), "utf8");
    run(["exec", "-i", container, "psql", "-U", "postgres", "-X", "-v", "ON_ERROR_STOP=1"], {
      input: [setup, sql, check].join("\n"),
      stdio: ["pipe", "inherit", "inherit"],
    });
    console.log(`Verified ${migration}`);
  }
} finally {
  run(["stop", "--timeout", "3", container]);
}
