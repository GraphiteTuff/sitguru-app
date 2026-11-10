import fs from 'node:fs';
import {spawn} from 'node:child_process';
const b=fs.readFileSync('.release-local/status.json');const s=JSON.parse(b.toString(b[0]===255?'utf16le':'utf8').replace(/^\uFEFF/,''));
if(new URL(s.API_URL).hostname!=='127.0.0.1')throw new Error('Local API required');
if(fs.readdirSync('.').some(n=>/^\.env(?:\.|$)/.test(n)))throw new Error('Environment files are forbidden');
const env=Object.fromEntries(Object.entries(process.env).filter(([k])=>['PATH','Path','PATHEXT','SystemRoot','SYSTEMROOT','ComSpec','COMSPEC','TEMP','TMP','USERPROFILE','APPDATA','LOCALAPPDATA','NUMBER_OF_PROCESSORS'].includes(k)));
Object.assign(env,{NODE_ENV:'development',NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_SUPABASE_URL:s.API_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY:s.ANON_KEY,SUPABASE_SERVICE_ROLE_KEY:s.SERVICE_ROLE_KEY,SITGURU_ISOLATED_BACKEND:'true',SITGURU_LOCAL_PREVIEW_DIST:'.next-fixture-3103',ADMIN_EMAILS:'manager@example.test'});
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port','3103'],{stdio:'inherit',env});
process.on('SIGINT',()=>child.kill('SIGINT'));process.on('SIGTERM',()=>child.kill('SIGTERM'));child.on('exit',code=>process.exit(code??1));
