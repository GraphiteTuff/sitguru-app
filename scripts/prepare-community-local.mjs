import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const baseline=fs.readFileSync('supabase/migrations/20260905_internship_program.sql','utf8');
// Test-only booking prerequisite: repository does not contain its complete original DDL.
// This is NOT a production schema snapshot or a production migration.
const bookings='create table public.bookings(id uuid primary key, guru_id uuid, customer_id uuid, status text);';
const sql=baseline+'\n'+bookings+'\n'+['20261109_community_studio.sql','20261110_community_permissions_media.sql'].map(n=>fs.readFileSync('supabase/migrations/'+n,'utf8')).join('\n');
const r=spawnSync('docker',['exec','-i','supabase_db_release-local','psql','-U','postgres','-v','ON_ERROR_STOP=1'],{input:sql,encoding:'utf8'});
console.log(r.stdout);console.error(r.stderr);process.exitCode=r.status??1;
