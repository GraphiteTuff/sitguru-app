import { redirect } from 'next/navigation';
import { communityActor, communityConfigured } from '@/lib/community-studio/service';
import ParentPermissions from '@/components/community-studio/ParentPermissions';
export const dynamic = 'force-dynamic';
export default async function ParentPermissionPage() {
  if (!communityConfigured() || !(await communityActor())) redirect('/login?next=%2Fpack%2Fpermissions');
  return <ParentPermissions/>;
}
