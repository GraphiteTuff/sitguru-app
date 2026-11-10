import type { Metadata } from 'next';
import PackCommunityPage from '@/components/community-studio/PackCommunityPage';
import { loadPublishedCommunity, loadCommunityWorkspace } from '@/lib/community-studio/actions';
import { communityActor, communityConfigured } from '@/lib/community-studio/service';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {title:'The SitGuru Pack',description:'Pet of the Week, everyday pet moments, and the people who care. Share a photo, video, or story with the SitGuru Pack.'};
export default async function PackPage() {
  const actor = communityConfigured() ? await communityActor() : null;
  const [items,workspace] = await Promise.all([loadPublishedCommunity(),actor ? loadCommunityWorkspace('member') : undefined]);
  return <PackCommunityPage items={items} workspace={workspace} authenticated={Boolean(actor)}/>;
}
