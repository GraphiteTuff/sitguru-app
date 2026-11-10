import fs from 'node:fs';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
const b=fs.readFileSync('.release-local/status.json');const s=JSON.parse(b.toString(b[0]===255?'utf16le':'utf8').replace(/^\uFEFF/,''));
assert.equal(new URL(s.API_URL).hostname,'127.0.0.1');
const admin=createClient(s.API_URL,s.SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const actors={};const checks=[];
for(const name of ['guru','parent','other','manager']){
 const email=`${name}@example.test`, password=randomUUID()+'-Qa9!';
 const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true});assert.ifError(error);
 const client=createClient(s.API_URL,s.ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 const login=await client.auth.signInWithPassword({email,password});assert.ifError(login.error);
 actors[name]={id:data.user.id,token:login.data.session.access_token};
}
checks.push('4 real local Auth users and password/JWT sessions');
const booking=randomUUID();assert.ifError((await admin.from('bookings').insert({id:booking,guru_id:actors.guru.id,customer_id:actors.parent.id,status:'completed'})).error);
const origin='http://127.0.0.1:3103';
async function api(path,actor,body){const r=await fetch(origin+path,{method:body?'POST':'GET',headers:{...(actor?{Authorization:`Bearer ${actors[actor].token}`}:{}) ,...(body&&! (body instanceof FormData)?{'Content-Type':'application/json'}:{})},body:body instanceof FormData?body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()};}
const form=v=>{const f=new FormData();Object.entries(v).forEach(([k,x])=>f.set(k,String(x)));return f;};
assert.equal((await api('/api/community-studio?mode=manager','other')).status,403);checks.push('Unprivileged JWT cannot open Manager queue');
assert.equal((await api('/api/community-studio')).status,401);checks.push('Anonymous member API denied');
// Exercise real signed private storage and image sanitization, not a mocked fetch.
const sharp=(await import('sharp')).default;const image=await sharp({create:{width:12,height:12,channels:3,background:'#337755'}}).jpeg().toBuffer();
const prepared=await api('/api/community-studio/upload','guru',{action:'prepare',name:'fixture.jpg',size:image.length});assert.equal(prepared.status,200,JSON.stringify(prepared.data));
assert.equal(new URL(prepared.data.signedUrl).hostname,'127.0.0.1');
const uploaded=await fetch(prepared.data.signedUrl,{method:'PUT',headers:{'Content-Type':'image/jpeg'},body:image});assert.equal(uploaded.ok,true);
const verified=await api('/api/community-studio/upload','guru',{action:'verify',uploadId:prepared.data.uploadId});assert.equal(verified.status,200,JSON.stringify(verified.data));
assert.equal((await api('/api/community-studio/upload','other',{action:'verify',uploadId:prepared.data.uploadId})).status,400);checks.push('Real signed upload, sanitizer, storage transfer and foreign receipt rejection');
const submitted=await api('/api/community-studio','guru',form({title:'Local release pet story',kind:'gallery',story:'A synthetic happy dog on an isolated local walk.',intent:'submit',publicConsent:'on',socialConsent:'on',featuresClientPet:'on',bookingId:booking,mediaPath:verified.data.mediaPath}));assert.equal(submitted.status,200,JSON.stringify(submitted.data));
let row=(await admin.from('community_studio_submissions').select('*').eq('submitter_user_id',actors.guru.id).single()).data;assert.ok(row);assert.equal(row.parent_permission_status,'pending');
const review=action=>api('/api/community-studio','manager',form({operation:'review',id:row.id,updatedAt:row.updated_at,action}));
assert.equal((await review('approve')).status,400);checks.push('Guru consent alone cannot authorize approval');
assert.equal((await fetch(origin+`/api/community-studio/media/${row.id}`,{redirect:'manual'})).status,404);
checks.push('Pending private media is not available anonymously');
const decide=(who,decision,social=false)=>api('/api/community-studio/permissions',who,{id:row.id,updatedAt:row.updated_at,decision,publicConsent:decision==='approve',socialConsent:social});
assert.equal((await decide('other','approve')).status,400);
assert.equal((await decide('parent','approve')).status,200);checks.push('Only booking Pet Parent can approve, separate social refusal recorded');
row=(await admin.from('community_studio_submissions').select('*').eq('id',row.id).single()).data;
assert.equal((await review('approve')).status,200);row=(await admin.from('community_studio_submissions').select('*').eq('id',row.id).single()).data;
assert.equal((await review('publish')).status,200);
let publicItems=(await api('/api/community-studio?mode=public')).data.items;assert.equal(publicItems.length,1);assert.equal(publicItems[0].socialConsent,false);assert.equal(publicItems[0].submitterName,'');checks.push('Actual manager approval/publication and public privacy filtering');
row=(await admin.from('community_studio_submissions').select('*').eq('id',row.id).single()).data;
assert.equal((await decide('parent','revoke')).status,200);assert.equal((await api('/api/community-studio?mode=public')).data.items.length,0);checks.push('Actual parent revocation removes public story');
for(const name of ['guru','other']){const r=await fetch(s.API_URL+'/rest/v1/community_studio_submissions?select=*',{headers:{apikey:s.ANON_KEY,Authorization:`Bearer ${actors[name].token}`}});assert.equal(r.ok,false);}checks.push('Real authenticated Data API direct reads denied by grants/RLS');
fs.writeFileSync('docs/development/release-authenticated-results.json',JSON.stringify({checks,scope:'Local Supabase, real Auth/API/storage; test-only booking prerequisite. Intern assignment scope and realtime not yet verified.'},null,2)+'\n');
console.log(JSON.stringify({passed:checks.length,checks}));
