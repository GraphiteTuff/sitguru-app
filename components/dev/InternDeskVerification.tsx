'use client';
import {useRouter} from 'next/navigation';
import InternPortalHome from '@/components/internship/InternPortalHome';
import type {InternshipWorkspaceData} from '@/lib/internship/types';
import type {HourSummary} from '@/lib/internship/hours';

export default function InternDeskVerification({data,hourSummary}:{data:InternshipWorkspaceData;hourSummary:HourSummary}) {
  const router=useRouter();
  return <InternPortalHome data={data} hourSummary={hourSummary} firstName="Fixture" weeklyDone={false} currentAssignmentTitle="Synthetic community assignment" preview
    onOpenWork={()=>router.push('/intern/work')} onOpenCheckIn={()=>router.push('/intern/check-ins')}
    onOpenHours={()=>router.push('/intern/time')} onOpenMilestones={()=>router.push('/intern/milestones')}/>;
}
