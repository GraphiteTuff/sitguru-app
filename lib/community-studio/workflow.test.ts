import assert from 'node:assert/strict';
import {test} from 'node:test';

test('isolated submission → parent decision → moderation → scheduling → publication → revocation',async(t)=>{
  const names=['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','SITGURU_ISOLATED_BACKEND','VERCEL_ENV'];
  const previous=names.map(key=>process.env[key]);
  Object.assign(process.env,{NEXT_PUBLIC_SUPABASE_URL:'http://isolated.test',NEXT_PUBLIC_SUPABASE_ANON_KEY:'synthetic-key',SUPABASE_SERVICE_ROLE_KEY:'synthetic-key',SITGURU_ISOLATED_BACKEND:'true',VERCEL_ENV:'preview'});
  t.after(()=>names.forEach((key,index)=>{if(previous[index]===undefined)delete process.env[key];else process.env[key]=previous[index];}));
  const guru='11111111-1111-4111-8111-111111111111',parent='22222222-2222-4222-8222-222222222222',booking='33333333-3333-4333-8333-333333333333',id='44444444-4444-4444-8444-444444444444';
  const tables:Record<string,Record<string,unknown>[]>={bookings:[{id:booking,guru_id:guru,customer_id:parent,status:'completed'}],community_studio_submissions:[]};
  let version=0,calls=0;
  t.mock.method(globalThis,'fetch',async(input:RequestInfo|URL,init?:RequestInit)=>{
    const request=new Request(input,init),url=new URL(request.url);assert.equal(url.hostname,'isolated.test','Test must never contact real infrastructure');calls++;
    const table=url.pathname.split('/').pop()||'';let rows=tables[table]||[];
    const matches=(row:Record<string,unknown>)=>[...url.searchParams].every(([key,value])=>{
      if(value.startsWith('eq.'))return String(row[key])===value.slice(3);
      if(value.startsWith('lte.'))return String(row[key])<=value.slice(4);
      if(value==='not.is.null')return row[key]!=null;
      if(value.startsWith('in.('))return value.slice(4,-1).split(',').includes(String(row[key]));
      return true;
    });
    if(request.method==='POST') {const raw=await request.json();const row={id,created_at:new Date().toISOString(),updated_at:`version-${++version}`,...raw};rows.push(row);tables[table]=rows;rows=[row];}
    else if(request.method==='PATCH'){const patch=await request.json();rows=rows.filter(matches).map(row=>{Object.assign(row,patch,{updated_at:`version-${++version}`});return row;});}
    else rows=rows.filter(matches);
    const headers=new Headers({'Content-Type':'application/json','Content-Range':`0-0/${rows.length}`});
    if(request.method==='HEAD')return new Response(null,{status:200,headers});
    return new Response(JSON.stringify(request.headers.get('accept')?.includes('vnd.pgrst.object')?rows[0]||null:rows),{status:200,headers});
  });
  const {saveCommunitySubmissionForActor,reviewCommunitySubmissionForActor,loadPublishedCommunityItems}=await import('./operations');
  const {decideParentPermission}=await import('./parent-permissions');
  const actor=(userId:string,moderator=false)=>({user:{id:userId,user_metadata:{}},intern:null,admin:null,canModerate:moderator,isSuperUser:moderator,guruIds:[userId],isGuru:userId===guru}) as unknown as NonNullable<Awaited<ReturnType<typeof import('./service').communityActor>>>;
  const form=(values:Record<string,string>)=>{const data=new FormData();Object.entries(values).forEach(([key,value])=>data.set(key,value));return data;};
  const submitted=await saveCommunitySubmissionForActor(form({title:'A very happy care visit',kind:'pack',story:'A joyful afternoon with our favorite walking buddy.',intent:'submit',publicConsent:'on',socialConsent:'on',featuresClientPet:'on',bookingId:booking}),actor(guru));
  assert.equal(submitted.ok,true,submitted.error);
  let row=tables.community_studio_submissions[0];assert.equal(row.parent_user_id,parent);assert.equal(row.parent_permission_status,'pending');
  const review=(action:string)=>reviewCommunitySubmissionForActor(form({id,updatedAt:String(row.updated_at),action,publishAt:'2030-01-07T12:00',weekOf:'2030-01-07'}),actor('manager',true));
  assert.equal((await review('approve')).ok,false,'Guru checkbox must not authorize publication');
  await assert.rejects(()=>decideParentPermission(actor('unrelated'),{id,updatedAt:String(row.updated_at),decision:'approve',publicConsent:true,socialConsent:true}));
  await decideParentPermission(actor(parent),{id,updatedAt:String(row.updated_at),decision:'approve',publicConsent:true,socialConsent:false});
  assert.equal((await review('approve')).ok,true);assert.equal((await review('schedule')).ok,true);
  assert.deepEqual(await loadPublishedCommunityItems(),[],'Future scheduled content stays private');
  assert.equal((await review('publish')).ok,true);const published=await loadPublishedCommunityItems();assert.equal(published.length,1);assert.equal(published[0].socialConsent,false);assert.equal(published[0].submitterName,'');
  await decideParentPermission(actor(parent),{id,updatedAt:String(row.updated_at),decision:'revoke',publicConsent:false,socialConsent:false});
  assert.deepEqual(await loadPublishedCommunityItems(),[],'Revoked rights remove public visibility');
  assert.ok(calls>0);
});
