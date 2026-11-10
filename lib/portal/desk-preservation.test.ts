import assert from 'node:assert/strict';
import {test} from 'node:test';
import {MANAGER_PORTAL_BRAND,MANAGER_PORTAL_SIDEBAR} from '../admin/growth/manager-portal';
import {INTERN_PORTAL_BRAND,INTERN_PORTAL_SIDEBAR,INTERN_PORTAL_MOBILE_MORE} from '../internship/intern-portal-nav';
import {canReadPrivateInternRecord,internshipActorKind} from '../internship/manager-access';

test('Desk identities and established Manager navigation groups are retained',()=>{
  assert.equal(MANAGER_PORTAL_BRAND.deskTitle,"Manager's Desk");
  assert.equal(MANAGER_PORTAL_BRAND.homePath,'/manager');
  // Preserve the existing displayed Intern brand; do not rename the dashboard.
  assert.equal(INTERN_PORTAL_BRAND.title,'Intern Portal');
  assert.deepEqual([...new Set(MANAGER_PORTAL_SIDEBAR.map(item=>item.group))],['My Manager Portal','My Growth Work','Team Management']);
  assert.deepEqual(MANAGER_PORTAL_SIDEBAR.filter(item=>item.group==='Team Management').map(item=>item.label),['My Team','Intern Team','Assignments','Check-Ins','Milestones']);
});
test('new capabilities stay adjacent to approved peers without replacing Intern destinations',()=>{
  const manager=MANAGER_PORTAL_SIDEBAR.map(item=>item.label);
  assert.equal(manager[manager.indexOf('Content Studio')+1],'Community Studio');
  assert.equal(manager[manager.indexOf('Campus Growth')+1],'Market Density');
  assert.deepEqual(INTERN_PORTAL_SIDEBAR.filter(item=>item.id!=='community').map(item=>item.id),[
    'home','portal','work','content','assignments','milestones','hours','checkins','messages','results','calendar','metrics','growth','toolkit','campus','training','resources','help',
  ]);
  assert.ok(INTERN_PORTAL_MOBILE_MORE.some(item=>item.href==='/intern/community-studio'));
});
test('shared Desk enhancements do not grant Admin or another interns access',()=>{
  assert.equal(internshipActorKind({role:'social_community_manager'}),'manager');
  assert.equal(internshipActorKind({isIntern:true}),'intern');
  assert.equal(canReadPrivateInternRecord({actor:'manager',actorUserId:'manager-a',managerUserId:'manager-b',targetInternId:'intern-a'}),false);
  assert.equal(canReadPrivateInternRecord({actor:'intern',actorInternId:'intern-a',targetInternId:'intern-b'}),false);
  assert.equal(canReadPrivateInternRecord({actor:'intern',actorInternId:'intern-a',targetInternId:'intern-a'}),true);
});
