export type CommunityRights = {
  public_consent?: unknown; social_consent?: unknown; media_safe?: unknown; image_path?: unknown;
  features_client_pet?: unknown; parent_permission_status?: unknown; parent_user_id?: unknown;
  parent_social_consent?: unknown;
};
export function publicationRightsValid(row: CommunityRights) {
  return row.public_consent === true && (!row.image_path || row.media_safe === true) &&
    (row.features_client_pet !== true || (Boolean(row.parent_user_id) && row.parent_permission_status === 'approved'));
}
export function socialReuseAllowed(row: CommunityRights) {
  return publicationRightsValid(row) && row.social_consent === true &&
    (row.features_client_pet !== true || row.parent_social_consent === true);
}
export function parentDecisionPatch(decision: string, website: boolean, social: boolean) {
  if (!['approve','decline','revoke'].includes(decision)) throw new Error('Choose a valid permission decision.');
  if (decision === 'approve' && !website) throw new Error('Website permission is required to approve.');
  return {
    parent_permission_status: decision === 'approve' ? 'approved' : decision === 'decline' ? 'declined' : 'revoked',
    parent_social_consent: decision === 'approve' && social,
    parent_decided_at: new Date().toISOString(),
    // Every decision invalidates earlier editorial approval; Ava reviews the confirmed rights.
    status: decision === 'approve' ? 'pending' : 'changes_requested',
    approved_at: null, approved_by: null, publish_at: null,
  };
}
