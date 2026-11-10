import { useEffect, useState } from 'react';
import { Text, View, Switch } from 'react-native';
import MobileScreen from '@/components/mobile/MobileScreen';
import TouchTarget from '@/components/mobile/TouchTarget';
import CommunityMedia from '@/components/community/CommunityMedia';
import { useTheme } from '@/hooks/use-theme';
import { sitguruApiFetch, getSitGuruApiBaseUrl } from '@/lib/data/api';
import { useAuth } from '@/hooks/useAuth';
import { communityDevelopmentError, type CommunityParentPermission } from '@/lib/data/community-studio';

export default function CommunityPermissionsScreen() {
  const {session}=useAuth();const {colors}=useTheme();
  const [items,setItems]=useState<CommunityParentPermission[]>([]);const [error,setError]=useState('');
  const [social,setSocial]=useState<Record<string,boolean>>({});const [busy,setBusy]=useState(false);
  const blocked=communityDevelopmentError();
  async function load(){if(blocked||!session)return;const result=await sitguruApiFetch<{items:CommunityParentPermission[]}>('/api/community-studio/permissions',{cache:'no-store'});if(result.error)setError(result.error);else setItems(result.data?.items||[]);}
  useEffect(()=>{void load();},[session?.user.id,blocked]);
  async function decide(item:CommunityParentPermission,decision:string){
    if(blocked)return;setBusy(true);setError('');
    const result=await sitguruApiFetch('/api/community-studio/permissions',{method:'POST',body:{id:item.id,updatedAt:item.updatedAt,decision,publicConsent:decision==='approve',socialConsent:social[item.id]===true}});
    setBusy(false);if(result.error)setError(result.error);else await load();
  }
  return <MobileScreen><Text style={{fontSize:28,fontWeight:'800',color:colors.text}}>Your pet. Your permission.</Text><Text style={{color:colors.textSecondary,lineHeight:24}}>Review the exact story and media. Website display and optional social reuse are separate choices. You can withdraw permission here.</Text>{blocked||error?<Text accessibilityRole="alert" style={{color:colors.danger}}>{blocked||error}</Text>:null}{!session?<Text style={{color:colors.text}}>Sign in with the Pet Parent account linked to your booking.</Text>:null}{items.map(item=><View key={item.id} style={{backgroundColor:colors.card,borderRadius:20,padding:18,gap:14}}><Text style={{fontSize:20,fontWeight:'800',color:colors.text}}>{item.title}</Text>{item.mediaUrl?<CommunityMedia uri={getSitGuruApiBaseUrl()+item.mediaUrl} mime={item.mediaMime} label={item.title} headers={session?{Authorization:`Bearer ${session.access_token}`} : undefined}/>:null}<Text style={{color:colors.textSecondary,lineHeight:24}}>{item.story}</Text><Text style={{color:colors.text}}>{item.status}</Text>{item.socialConsent?<View style={{flexDirection:'row',gap:12,alignItems:'center'}}><Switch accessibilityLabel="Optional social media reuse" value={social[item.id]||false} onValueChange={value=>setSocial({...social,[item.id]:value})}/><Text style={{flex:1,color:colors.text}}>Also allow reuse on SitGuru’s social channels.</Text></View>:null}{(item.status==='approved'?['revoke']:['approve','decline']).map(decision=><TouchTarget key={decision} disabled={busy} onPress={()=>void decide(item,decision)} style={{minHeight:50,padding:14,borderRadius:12,backgroundColor:colors.primary}}><Text style={{color:'white',fontWeight:'800'}}>{decision==='approve'?'Allow display on SitGuru':decision==='revoke'?'Withdraw permission':'Decline'}</Text></TouchTarget>)}</View>)}{session&&!items.length&&!blocked?<Text style={{color:colors.textSecondary}}>No permission requests are waiting for this account.</Text>:null}</MobileScreen>;
}
