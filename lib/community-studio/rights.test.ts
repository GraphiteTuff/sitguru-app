import assert from 'node:assert/strict';
import {test} from 'node:test';
import {publicationRightsValid,socialReuseAllowed,parentDecisionPatch} from './rights';
test('legacy combined consent is not a separate website or social grant',()=>{
  assert.equal(publicationRightsValid({}),false);
  assert.equal(socialReuseAllowed({public_consent:true}),false);
});
test('client media needs an identified parent and explicit approval, not a Guru checkbox',()=>{
  const row={public_consent:true,social_consent:true,media_safe:true,image_path:'safe.mp4',features_client_pet:true,parent_permission_status:'pending',parent_user_id:'parent'};
  assert.equal(publicationRightsValid(row),false);
  assert.equal(publicationRightsValid({...row,parent_permission_status:'approved',parent_user_id:''}),false);
  assert.equal(publicationRightsValid({...row,parent_permission_status:'approved'}),true);
  assert.equal(socialReuseAllowed({...row,parent_permission_status:'approved'}),false);
  assert.equal(socialReuseAllowed({...row,parent_permission_status:'approved',parent_social_consent:true}),true);
  assert.equal(publicationRightsValid({...row,parent_permission_status:'revoked'}),false);
});
test('parent decisions remove editorial approval; revocation stops publication',()=>{
  assert.throws(()=>parentDecisionPatch('approve',false,true));
  const approved=parentDecisionPatch('approve',true,false);
  assert.equal(approved.parent_permission_status,'approved');assert.equal(approved.parent_social_consent,false);
  const revoked=parentDecisionPatch('revoke',false,false);
  assert.equal(revoked.approved_at,null);assert.equal(revoked.publish_at,null);assert.equal(revoked.status,'changes_requested');
});
