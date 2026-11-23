import {router} from 'expo-router';
import {useCallback,useEffect,useState} from 'react';
import {ActivityIndicator,Image,Linking,Share,StyleSheet,Text,TextInput,useWindowDimensions,View} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import RoleGate from '@/components/RoleGate';
import MobileScreen from '@/components/mobile/MobileScreen';
import TouchTarget from '@/components/mobile/TouchTarget';
import {useAuth} from '@/hooks/useAuth';
import {sitguruApiFetch} from '@/lib/data/api';
import {SocialDeskColors} from '@/constants/social-intelligence-desk';

type Service='dog_walking'|'pet_sitting'|'drop_in_visits'|'house_sitting'|'doggy_day_care'|'boarding'|'cat_care'|'pet_taxi';
type Pet='any'|'dog'|'cat';
type Channel='facebook'|'instagram'|'tiktok'|'x'|'other';
type Guru={
  id:string;name:string;slug:string;city:string;state:string;photoUrl:string|null;
  serviceLabel:string;distanceMiles:number|null;reason:string;experienceYears:number|null;
};
type Metrics={linkOpens:number;qrOpens:number;profileClicks:number;inquiryClicks:number;sharesReported:number;copyIntents:number};
type Card={
  id:string;code:string;status:string;group_id:string|null;guru:{name:string;city:string;state:string};
  city:string;state:string;service_key:string;channel:Channel;
  reply_text:string;shareUrl:string;cardUrl:string;metrics:Metrics;
};
type DirectoryGuru={id:string;name:string;slug:string;city:string;state:string;photoUrl:string|null;serviceKeys:string[];canPromote:boolean;canFeatureGuru:boolean;promotionKind:"guru"|"community";reason:string};
type SocialGroup={id:string;name:string;city:string;state:string;channel:Channel;group_url:string;created_at:string};
type Payload={ok:boolean;matches:Guru[];directory:DirectoryGuru[];groups:SocialGroup[];campaigns:Card[];totals:Metrics;matchesNotice:string};
type PreparedShare={id:string;code:string;status:string;replyText:string;shareUrl:string;cardUrl:string;qrUrl:string};
type ReadyMini={guruId:string;service:string;channel:Channel;groupId:string;share:PreparedShare};
const PAGE_SIZE=10;
const services:[Service,string][]=[
  ['dog_walking','Dog Walking'],['pet_sitting','Pet Sitting'],['drop_in_visits','Drop-In Visits'],
  ['house_sitting','House Sitting'],['doggy_day_care','Doggy Day Care'],['boarding','Boarding'],
  ['cat_care','Cat Care'],['pet_taxi','Pet Taxi'],
];
const states=['PA','NJ','FL','NY','DE','MD','CA'];
const channels:Channel[]=['facebook','instagram','tiktok','x','other'];
const initial:Metrics={linkOpens:0,qrOpens:0,profileClicks:0,inquiryClicks:0,sharesReported:0,copyIntents:0};
type Params={city:string;state:string;service:Service;pet:Pet;radius:number;channel:Channel};
function GuruAvatar({name,photoUrl}:{name:string;photoUrl:string|null}){
  const [failed,setFailed]=useState(false);
  useEffect(()=>setFailed(false),[photoUrl]);
  const initials=name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0].toUpperCase()).join('')||'SG';
  return photoUrl&&!failed?
    <Image source={{uri:photoUrl}} style={styles.avatar} onError={()=>setFailed(true)}
      accessibilityLabel={name+' profile photo'}/>:
    <View style={[styles.avatar,styles.avatarBlank]} accessibilityLabel={name+' initials avatar'}>
      <Text style={styles.paw}>{initials}</Text>
    </View>;
}
function Body(){
  const {width}=useWindowDimensions();
  const [form,setForm]=useState<Params>({city:'Quakertown',state:'PA',service:'dog_walking',pet:'dog',radius:10,channel:'facebook'});
  const [dashboard,setDashboard]=useState<Payload|null>(null);
  const [selected,setSelected]=useState('');
  const [active,setActive]=useState('');
  const [searched,setSearched]=useState(false);
  const [directoryQuery,setDirectoryQuery]=useState('');
  const [onlyBookable,setOnlyBookable]=useState(false);
  const [directoryState,setDirectoryState]=useState('all');
  const [directorySort,setDirectorySort]=useState<'state'|'name'>('state');
  const [groupSearch,setGroupSearch]=useState('');
  const [selectedGroupId,setSelectedGroupId]=useState('');
  const [groupFormOpen,setGroupFormOpen]=useState(false);
  const [groupForm,setGroupForm]=useState({name:'',city:'',state:'PA',channel:'facebook' as Channel,groupUrl:''});
  const [showAdvanced,setShowAdvanced]=useState(false);
  const [directoryPage,setDirectoryPage]=useState(0);
  const [historyPage,setHistoryPage]=useState(0);
  const [historyOpen,setHistoryOpen]=useState(false);
  const [expandedGuru,setExpandedGuru]=useState('');
  const [miniService,setMiniService]=useState('');
  const [miniChannel,setMiniChannel]=useState<Channel>('facebook');
  const [readyMini,setReadyMini]=useState<ReadyMini|null>(null);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [role,setRole]=useState<'admin'|'manager'|'intern'>('intern');
  const auth=useAuth();
  useEffect(()=>{
    setRole(auth.roles.includes('admin')?'admin':auth.roles.includes('manager')?'manager':'intern');
  },[auth.roles]);
  const reload=useCallback(async(search=false)=>{
    setLoading(true);setError('');
    const q=new URLSearchParams();
    if(search){
      q.set('city',form.city);q.set('state',form.state);q.set('service',form.service);
      q.set('pet',form.pet);q.set('radius',String(form.radius));
    }
    const result=await sitguruApiFetch<Payload>('/api/guru-match?'+q.toString(),{cache:'no-store'});
    setLoading(false);
    if(result.error||!result.data){setError(result.error||'Outreach results are unavailable.');return;}
    setDashboard(result.data);setSearched(search);
  },[form]);
  useEffect(()=>{void (async()=>{
    const res=await sitguruApiFetch<Payload>('/api/guru-match',{cache:'no-store'});
    if(res.data)setDashboard(res.data);
    else setError(res.error||'Could not load Guru Match & Share.');
    setLoading(false);
  })();},[]);
  const selectedGuru=dashboard?.matches.find(g=>g.id===selected);
  const card=dashboard?.campaigns.find(c=>c.code===active);
  const directory=dashboard?.directory||[];
  const readyToShare=directory.filter(g=>g.canPromote).length;
  const groups=dashboard?.groups||[];
  const selectedGroup=groups.find(group=>group.id===selectedGroupId);
  const statesInDirectory=[...new Set([...directory.map(g=>g.state),...groups.map(g=>g.state)].filter(Boolean))].sort();
  const filteredGroups=groups.filter(g=>!groupSearch.trim()||
    (g.name+' '+g.city+' '+g.state).toLowerCase().includes(groupSearch.toLowerCase().trim()));
  const listed=directory.filter(g=>(directoryState==='all'||g.state===directoryState)&&(!onlyBookable||g.canFeatureGuru)&&
    (!directoryQuery.trim()||(`${g.name} ${g.city} ${g.state} ${g.serviceKeys.join(' ')}`).toLowerCase().includes(directoryQuery.toLowerCase().trim())))
    .sort((a,b)=>directorySort==='name'?a.name.localeCompare(b.name):
      a.state.localeCompare(b.state)||a.city.localeCompare(b.city)||a.name.localeCompare(b.name));
  const listPageCount=Math.max(1,Math.ceil(listed.length/PAGE_SIZE));
  const visibleDirectory=listed.slice(directoryPage*PAGE_SIZE,(directoryPage+1)*PAGE_SIZE);
  const historyCount=Math.max(1,Math.ceil((dashboard?.campaigns.length||0)/PAGE_SIZE));
  const recentCampaigns=(dashboard?.campaigns||[]).slice(historyPage*PAGE_SIZE,(historyPage+1)*PAGE_SIZE);
  const prepareMini=async(g:DirectoryGuru,channel:Channel,service:string,groupId=selectedGroupId)=>{
    if(!g.canPromote||!service)return;
    setBusy(true);setError('');setReadyMini(null);
    const result=await sitguruApiFetch<{ok:boolean;share:PreparedShare}>('/api/guru-match',{
      method:'POST',body:{action:'prepare',guruId:g.id,channel,service,groupId:groupId||undefined},cache:'no-store',
    });
    setBusy(false);
    if(result.error||!result.data?.share){setError(result.error||'Unable to prepare this Guru card.');return;}
    setReadyMini({guruId:g.id,channel,service,groupId,share:result.data.share});
  };
  const toggleMini=(g:DirectoryGuru)=>{
    if(expandedGuru===g.id){setExpandedGuru('');setReadyMini(null);return;}
    setExpandedGuru(g.id);setMiniChannel(selectedGroup?.channel||'facebook');
    const service=g.serviceKeys[0]||'custom_care';
    setMiniService(service);setReadyMini(null);
    if(g.canPromote)void prepareMini(g,selectedGroup?.channel||'facebook',service);
  };
  const logMiniShared=async()=>{
    if(!readyMini)return;
    setBusy(true);setError('');
    const result=await sitguruApiFetch<{ok:boolean}>('/api/guru-match',{
      method:'POST',body:{action:'shared',id:readyMini.share.id},cache:'no-store',
    });
    setBusy(false);
    if(result.error){setError(result.error);return;}
    setNotice('This manual social share was recorded.');
    await reload(searched);
  };
  const shareMini=async()=>{
    if(!readyMini)return;
    try{await Share.share({title:'Meet a SitGuru Guru',message:readyMini.share.replyText,url:readyMini.share.shareUrl});}
    catch{setNotice('Share canceled. Your Guru card is still available.');}
  };
  const quickShare=async(g:DirectoryGuru)=>{
    if(!g.canPromote||busy)return;
    const service=g.serviceKeys[0]||'custom_care';
    const channel=selectedGroup?.channel||form.channel;
    setExpandedGuru(g.id);setMiniService(service);setMiniChannel(channel);
    setReadyMini(null);setBusy(true);setError("");
    const result=await sitguruApiFetch<{ok:boolean;share:PreparedShare}>('/api/guru-match',{
      method:'POST',body:{action:'prepare',guruId:g.id,service,channel,groupId:selectedGroupId||undefined},
      cache:'no-store',
    });
    setBusy(false);
    if(result.error||!result.data?.share){setError(result.error||"The share card is unavailable.");return;}
    const share=result.data.share;
    setReadyMini({guruId:g.id,service,channel,groupId:selectedGroupId,share});
    if(selectedGroup){
      setNotice("Use the share sheet to copy the prepared message. The group will open afterward so staff can post it.");
      try{
        await Share.share({title:'SitGuru local Guru',message:share.replyText,url:share.shareUrl});
        await Linking.openURL(selectedGroup.group_url);
      }catch{setNotice("The local group and ready-to-copy message are available in the expanded card.");}
    }else{
      try{await Share.share({title:'Meet a SitGuru Guru',message:share.replyText,url:share.shareUrl});}
      catch{setNotice("The approved card is ready for sharing.");}
    }
  };
  const saveLocalGroup=async()=>{
    if(!groupForm.name.trim()||!groupForm.city.trim()||!groupForm.groupUrl.trim()){
      setError("Group name, city and URL are required.");return;
    }
    setBusy(true);setError("");
    const result=await sitguruApiFetch<{ok:boolean;id:string}>('/api/guru-match',{
      method:'POST',body:{action:'add_group',...groupForm},cache:'no-store',
    });
    setBusy(false);
    if(result.error||!result.data?.id){setError(result.error||"Could not save the local group.");return;}
    setSelectedGroupId(result.data.id);setDirectoryState(groupForm.state);
    setGroupFormOpen(false);setGroupForm({name:'',city:'',state:'PA',channel:'facebook',groupUrl:''});
    setDirectoryPage(0);setNotice("Local social group saved for all authorized staff.");
    await reload(searched);
  };
  const setField=<K extends keyof Params>(field:K,value:Params[K])=>{
    setForm(old=>({...old,[field]:value}));setSelected('');setSearched(false);
  };
  const create=async()=>{
    if(!selectedGuru||busy)return;
    setBusy(true);setError('');setNotice('');
    const result=await sitguruApiFetch<{ok:boolean;share:{code:string;status:string}}>('/api/guru-match',{
      method:'POST',body:{action:'create',guruId:selectedGuru.id,...form},cache:'no-store',
    });
    setBusy(false);
    if(result.error||!result.data?.share){setError(result.error||'Could not create this promotion.');return;}
    setActive(result.data.share.code);
    setNotice(result.data.share.status==='approved'?'Approved share card created.':'Submitted for manager approval. External sharing stays locked.');
    await reload(true);
  };
  const action=async(c:Card,mode:'approve'|'reject'|'shared')=>{
    if(busy)return;
    setBusy(true);setError('');setNotice('');
    const result=await sitguruApiFetch<{ok:boolean}>('/api/guru-match',{
      method:mode==='shared'?'POST':'PATCH',
      body:{id:c.id,action:mode},cache:'no-store',
    });
    setBusy(false);
    if(result.error){setError(result.error);return;}
    setNotice(mode==='approve'?'Manager approval saved.':mode==='reject'?'Promotion rejected.':'Share marked as manually posted.');
    await reload(searched);
  };
  async function shareReply(c:Card){
    if(c.status!=='approved')return;
    try{
      const response=await Share.share({message:c.reply_text});
      if(response.action===Share.sharedAction){
        setNotice('Share dialog completed. Mark shared after you confirm the post was published.');
      }
    }catch{setError('Sharing was cancelled or unavailable.');}
  }
  const pill=(label:string,chosen:boolean,act:()=>void)=>(
    <TouchTarget accessibilityRole="button" accessibilityState={{selected:chosen}}
      onPress={act} style={[styles.pill,chosen&&styles.pillSelected]}>
      <Text style={[styles.pillText,chosen&&styles.pillTextSelected]}>{label}</Text>
    </TouchTarget>
  );
  const btn=(label:string,act:()=>void,disabled=false,green=false)=>
    <TouchTarget accessibilityRole="button" disabled={disabled||busy} onPress={act}
      style={[styles.action,green&&styles.actionGreen,(disabled||busy)&&styles.disabled]}>
      <Text style={styles.actionText}>{label}</Text>
    </TouchTarget>;
  const metrics=dashboard?.totals||initial;
  return <MobileScreen refreshing={loading} onRefresh={()=>{void reload(searched);}}>
    <View style={styles.root}>
      <TouchTarget onPress={()=>router.back()} style={styles.back}><Text style={styles.backText}>← Back</Text></TouchTarget>
      <LinearGradient colors={['#0F2744','#164B61','#0D5C3A']} style={styles.hero}>
        <Text style={styles.kicker}>🐾 SITGURU · COMMUNITY STUDIO</Text>
        <Text style={styles.heroTitle}>Guru Match & Share</Text>
        <Text style={styles.heroCopy}>Match local Gurus, generate tracked QR cards and report engagement on every screen.</Text>
      </LinearGradient>
      <View style={styles.inlineRow}>
        {btn('Content Studio',()=>router.push('/content-studio'))}
        {btn('Social Intelligence',()=>router.push('/social-intelligence'))}
      </View>
      {!!error&&<Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      {!!notice&&<Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text>}
      <View style={styles.card}>
        <Text style={styles.heading}>Find & Share a Guru</Text>
        <Text style={styles.small}>{directory.length} listed · {readyToShare} ready. Search by city/state and tap Share next to any approved Guru.</Text>
        <Text style={styles.label}>Local social groups</Text>
        <TextInput value={groupSearch} onChangeText={setGroupSearch} style={styles.input}
          accessibilityLabel="Search saved social groups by name or city"
          placeholder="Search social group or city"/>
        <View style={styles.chips}>
          {pill('No group',!selectedGroupId,()=>{
            setSelectedGroupId('');setReadyMini(null);setExpandedGuru('');
          })}
          {filteredGroups.slice(0,10).map(group=><View key={group.id}>
            {pill(group.city+', '+group.state+' · '+group.name,selectedGroupId===group.id,()=>{
              setSelectedGroupId(group.id);setDirectoryState(group.state);
              setForm(old=>({...old,channel:group.channel}));setDirectoryPage(0);
              setReadyMini(null);setExpandedGuru('');
            })}
          </View>)}
        </View>
        {selectedGroup&&<View style={styles.groupNotice}>
          <Text style={styles.small}>{selectedGroup.name} · {selectedGroup.city}, {selectedGroup.state}</Text>
          {btn('Open selected group',()=>{void Linking.openURL(selectedGroup.group_url);})}
        </View>}
        {!groups.length&&<Text style={styles.small}>There are no saved groups yet. A Manager or Admin can add group links for staff to reuse.</Text>}
        {role!=='intern'&&btn(groupFormOpen?'Close Add Group':'Add a local group',()=>setGroupFormOpen(v=>!v))}
        {groupFormOpen&&role!=='intern'&&<View style={styles.miniExpanded}>
          <Text style={styles.label}>Group name</Text>
          <TextInput value={groupForm.name} onChangeText={v=>setGroupForm(o=>({...o,name:v}))}
            style={styles.input} placeholder="Community group name"/>
          <Text style={styles.label}>City</Text>
          <TextInput value={groupForm.city} onChangeText={v=>setGroupForm(o=>({...o,city:v}))}
            style={styles.input} placeholder="City"/>
          <Text style={styles.label}>State (two-letter code)</Text>
          <TextInput value={groupForm.state} style={styles.input}
            accessibilityLabel="Social group state code" maxLength={2}
            autoCapitalize="characters" autoCorrect={false} placeholder="PA"
            onChangeText={v=>setGroupForm(o=>({...o,state:v.toUpperCase().replace(/[^A-Z]/g,'').slice(0,2)}))}/>
          <Text style={styles.label}>Community platform</Text>
          <View style={styles.chips}>{(['facebook','x','other'] as Channel[]).map(v=><View key={v}>
            {pill(v.toUpperCase(),groupForm.channel===v,()=>setGroupForm(o=>({...o,channel:v})))}
          </View>)}</View>
          <Text style={styles.label}>Direct group URL</Text>
          <TextInput value={groupForm.groupUrl} onChangeText={v=>setGroupForm(o=>({...o,groupUrl:v}))}
            style={styles.input} placeholder="https://www.facebook.com/groups/..."
            autoCapitalize="none" autoCorrect={false} keyboardType="url"/>
          {btn('Save group for staff',()=>{void saveLocalGroup();},busy,true)}
        </View>}
        <Text style={styles.label}>Filter by state</Text>
        <View style={styles.chips}>
          {pill('All states',directoryState==='all',()=>{
            setDirectoryState('all');setDirectoryPage(0);setSelectedGroupId('');setExpandedGuru('');
          })}
          {statesInDirectory.map(v=><View key={v}>{pill(v,directoryState===v,()=>{
            setDirectoryState(v);setDirectoryPage(0);setExpandedGuru('');
            if(selectedGroup?.state!==v)setSelectedGroupId('');
          })}</View>)}
        </View>
        <View style={styles.chips}>
          {pill('Sort state A–Z',directorySort==='state',()=>{setDirectorySort('state');setDirectoryPage(0);})}
          {pill('Sort by name',directorySort==='name',()=>{setDirectorySort('name');setDirectoryPage(0);})}
        </View>
        <TextInput value={directoryQuery} onChangeText={value=>{setDirectoryQuery(value);setDirectoryPage(0);}}
          style={styles.input} accessibilityLabel="Search all Guru cards" placeholder="Search name, city or service" />
        <View style={styles.chips}>
          {pill('All listed',!onlyBookable,()=>{setOnlyBookable(false);setDirectoryPage(0);})}
          {pill('Guru profile cards',onlyBookable,()=>{setOnlyBookable(true);setDirectoryPage(0);})}
        </View>
        <Text style={styles.small}>Showing {visibleDirectory.length} of {listed.length} Gurus</Text>
        {visibleDirectory.map(g=>{
          const expanded=expandedGuru===g.id;
          const mini=readyMini?.guruId===g.id && readyMini.service===miniService &&
            readyMini.channel===miniChannel && readyMini.groupId===selectedGroupId ? readyMini.share : null;
          return <View key={g.id} style={styles.guruMini}>
            <TouchTarget accessibilityRole="button" accessibilityState={{expanded}}
              onPress={()=>toggleMini(g)} style={styles.guruMiniHeader}>
              <GuruAvatar name={g.name} photoUrl={g.photoUrl}/>
              <View style={{flex:1,gap:3}}>
                <Text style={styles.cardTitle}>{g.name}</Text>
                <Text style={styles.small}>{g.city||'Location missing'}, {g.state}</Text>
                <Text style={g.canPromote?styles.good:styles.warning}>
                  {g.canFeatureGuru?'Guru profile card ready':g.canPromote?'SitGuru discovery card ready':g.reason}
                </Text>
              </View>
              <Text style={styles.expandIcon}>{expanded?'−':'+'}</Text>
            </TouchTarget>
            {g.canPromote&&
              <View style={styles.quickShareRow}>
                {btn(selectedGroup?'Share to local group':'Share Guru',()=>{void quickShare(g);},busy,true)}
              </View>}
            {expanded&&<View style={styles.miniExpanded}>
              {g.canPromote ? <>
                <Text style={styles.label}>{g.canFeatureGuru?"Choose Guru service":"SitGuru discovery card"}</Text>
                {g.serviceKeys.length>0
                  ?<View style={styles.chips}>{g.serviceKeys.map(s=><View key={s}>
                    {pill(s.replace(/_/g,' '),miniService===s,()=>{
                      setMiniService(s);void prepareMini(g,miniChannel,s);
                    })}
                  </View>)}</View>
                  :<Text style={styles.small}>General SitGuru pet-care discovery · no booking claim</Text>}
                <Text style={styles.label}>Choose social channel</Text>
                {selectedGroup
                  ? <Text style={styles.small}>{selectedGroup.channel.toUpperCase()} · {selectedGroup.name}</Text>
                  : <View style={styles.chips}>{channels.map(c=><View key={c}>
                    {pill(c.toUpperCase(),miniChannel===c,()=>{
                      setMiniChannel(c);void prepareMini(g,c,miniService);
                    })}
                  </View>)}</View>}
                {busy&&!mini&&<ActivityIndicator color={SocialDeskColors.primary}/>}
                {mini&&<>
                  <Image source={{uri:mini.cardUrl}} resizeMode="contain" style={styles.shareImage}
                    accessibilityLabel={g.canFeatureGuru?g.name+' promotional card and QR code':'SitGuru discovery card and QR code'}/>
                  <View style={styles.inlineRow}>
                    {btn('Share to social app',()=>{void shareMini();})}
                    {btn('Open PNG',()=>{void Linking.openURL(mini.cardUrl);})}
                  </View>
                  <Text selectable style={styles.reply}>{mini.replyText}</Text>
                  <Text selectable style={styles.small}>{mini.shareUrl}</Text>
                  <Text style={styles.small}>For Instagram and TikTok, post the image using the native app and add the tracked link to a permitted caption or reply. Posting is not automatic.</Text>
                  {btn('Mark post as shared',()=>{void logMiniShared();},busy,true)}
                </>}
                {!mini&&!busy&&btn('Retry preparing card',()=>{void prepareMini(g,miniChannel,miniService);})}
              </>:<Text style={styles.warning}>
                {g.reason}
              </Text>}
              {g.canFeatureGuru&&!!g.slug&&btn('View Guru profile',()=>{void Linking.openURL('https://www.sitguru.com/guru/'+g.slug);})}
            </View>}
          </View>;
        })}
        <View style={styles.inlineRow}>
          {btn('Previous',()=>{setDirectoryPage(v=>Math.max(0,v-1));setExpandedGuru('');},directoryPage===0)}
          {btn('Next',()=>{setDirectoryPage(v=>v+1);setExpandedGuru('');},directoryPage+1>=listPageCount)}
        </View>
        <Text style={styles.small}>Page {directoryPage+1} of {listPageCount}</Text>
      </View>
      <TouchTarget accessibilityRole="button" onPress={()=>setShowAdvanced(v=>!v)}
        accessibilityState={{expanded:showAdvanced}} style={styles.historyToggle}>
        <Text style={styles.heading}>Advanced matching & analytics</Text>
        <Text style={styles.expandIcon}>{showAdvanced?'−':'+'}</Text>
      </TouchTarget>
      {showAdvanced&&<View style={{gap:12}}>
      <Text style={styles.heading}>90-day outreach activity</Text>
      <View style={styles.metrics}>
        {([
          ['Link opens',metrics.linkOpens],['QR opens',metrics.qrOpens],
          ['Profile clicks',metrics.profileClicks],['Inquiry clicks',metrics.inquiryClicks],
          ['Share reports',metrics.sharesReported],['Reply copies',metrics.copyIntents],
        ] as [string,number][]).map(([title,n],i)=><View key={title} style={[styles.metric,{width:width>630?'31%':'47%',backgroundColor:i%2===0?'#EFF6FF':'#F0FDF4'}]}>
          <Text style={styles.metricLabel}>{title}</Text><Text style={styles.metricValue}>{n.toLocaleString('en-US')}</Text>
        </View>)}
      </View>
      <View style={styles.card}>
        <Text style={styles.heading}>Match a Pet Parent request</Text>
        <Text style={styles.label}>City</Text>
        <TextInput value={form.city} onChangeText={v=>setField('city',v)}
          accessibilityLabel="Pet Parent city" style={styles.input} autoCapitalize="words" maxLength={80}
          placeholder="Enter city"/>
        <Text style={styles.label}>State (two-letter code)</Text>
        <TextInput value={form.state} onChangeText={v=>setField('state',v.toUpperCase().replace(/[^A-Z]/g,'').slice(0,2))}
          accessibilityLabel="Pet Parent state code" autoCapitalize="characters" autoCorrect={false}
          style={styles.input} maxLength={2} placeholder="PA"/>
        <View style={styles.chips}>{states.map(s=><View key={s}>{pill(s,s===form.state,()=>setField('state',s))}</View>)}</View>
        <Text style={styles.label}>Required service</Text>
        <View style={styles.chips}>{services.map(([id,title])=><View key={id}>{pill(title,id===form.service,()=>setField('service',id))}</View>)}</View>
        <Text style={styles.label}>Pet type</Text>
        <View style={styles.chips}>{(['any','dog','cat'] as Pet[]).map(p=><View key={p}>{pill(p==='any'?'Any / confirm':p==='dog'?'Dog':'Cat',p===form.pet,()=>setField('pet',p))}</View>)}</View>
        <Text style={styles.label}>Maximum distance</Text>
        <View style={styles.chips}>{[5,10,15,25,50].map(m=><View key={m}>{pill(m+' mi',m===form.radius,()=>setField('radius',m))}</View>)}</View>
        <Text style={styles.label}>Sharing channel</Text>
        <View style={styles.chips}>{channels.map(c=><View key={c}>{pill(c.toUpperCase(),c===form.channel,()=>setField('channel',c))}</View>)}</View>
        {btn(loading?'Searching...':'Find eligible Gurus',()=>{void reload(true);},loading)}
        {searched&&<Text style={styles.small}>{dashboard?.matches.length||0} qualified matches. These results must meet service, location and documented pet compatibility rules.</Text>}
        {searched&&!dashboard?.matches.length&&<Text style={styles.notice}>No eligible matches. Do not promote an unrelated Guru; offer a general SitGuru search instead.</Text>}
        {searched&&dashboard?.matches.map(g=><TouchTarget key={g.id} accessibilityRole="button" onPress={()=>setSelected(g.id)}
          style={[styles.guru,selected===g.id&&styles.guruSelected]}>
          <GuruAvatar name={g.name} photoUrl={g.photoUrl}/>
          <View style={{flex:1}}>
            <Text style={styles.cardTitle}>{g.name} · {g.city}, {g.state}</Text>
            <Text style={styles.small}>{g.serviceLabel} · {g.reason}</Text>
          </View>
        </TouchTarget>)}
        {selectedGuru&&btn('Generate unique tracking link + QR card',()=>{void create();},busy,true)}
      </View>
      </View>}
      <TouchTarget accessibilityRole="button"
        onPress={()=>{setHistoryOpen(x=>!x);setActive('');}}
        style={styles.historyToggle}>
        <Text style={styles.heading}>Past outreach & approvals ({dashboard?.campaigns.length||0})</Text>
        <Text style={styles.expandIcon}>{historyOpen?'−':'+'}</Text>
      </TouchTarget>
      {historyOpen&&<View style={styles.card}>
        <Text style={styles.small}>Compact history with {PAGE_SIZE} items per page. Campaign metrics remain tracked.</Text>
        {recentCampaigns.map(c=><View key={c.id} style={styles.guruMini}>
          <TouchTarget accessibilityRole="button" accessibilityState={{expanded:card?.id===c.id}}
            onPress={()=>setActive(active===c.code?'':c.code)} style={styles.guruMiniHeader}>
            <View style={{flex:1}}>
              <Text style={styles.cardTitle}>{c.guru.name} · {c.city}, {c.state}</Text>
              <Text style={styles.small}>{groups.find(g=>g.id===c.group_id)?.name||c.channel.toUpperCase()} · {c.status.replace(/_/g,' ')} · {c.metrics.linkOpens+c.metrics.qrOpens} opens</Text>
            </View>
            <Text style={styles.expandIcon}>{card?.id===c.id?'−':'+'}</Text>
          </TouchTarget>
          {c.status==='pending_review'&&role!=='intern'&&<View style={styles.inlineRow}>
            {btn('Approve',()=>{void action(c,'approve');},busy,true)}
            {btn('Reject',()=>{void action(c,'reject');},busy)}
          </View>}
          {card?.id===c.id&&<View style={styles.miniExpanded}>
            {c.status==='approved'?<>
              <Image source={{uri:c.cardUrl}} resizeMode="contain" style={styles.shareImage}/>
              <View style={styles.inlineRow}>
                {btn('Share',()=>{void shareReply(c);})}
                {btn('Mark shared',()=>{void action(c,'shared');},busy,true)}
              </View>
              {btn('Open PNG',()=>{void Linking.openURL(c.cardUrl);})}
              {btn('Open tracked link',()=>{void Linking.openURL(c.shareUrl);})}
            </>:<Text style={styles.warning}>Content requires Manager approval to publish.</Text>}
            <Text selectable style={styles.reply}>{c.status==='approved'?c.reply_text:c.reply_text.replace(/https:\/\/www\.sitguru\.com\/s\/g\/\S+/g,'[link available after approval]')}</Text>
          </View>}
        </View>)}
        <View style={styles.inlineRow}>
          {btn('Previous',()=>{setHistoryPage(v=>Math.max(0,v-1));setActive('');},historyPage===0)}
          {btn('Next',()=>{setHistoryPage(v=>v+1);setActive('');},historyPage+1>=historyCount)}
        </View>
        <Text style={styles.small}>Page {historyPage+1} of {historyCount}</Text>
      </View>}
      {loading&&<ActivityIndicator color={SocialDeskColors.primary}/>}
      <Text style={styles.small}>Counts are recorded actions, not unique people. Inquiry clicks do not mean confirmed requests, bookings or revenue. Availability must be confirmed with the Guru.</Text>
    </View>
  </MobileScreen>;
}
export default function GuruMatchShareScreen(){
  const {roles}=useAuth();
  const role=roles.includes('admin')?'admin':roles.includes('manager')?'manager':roles.includes('intern')?'intern':'admin';
  return <RoleGate requiredRole={role} title="Guru Match & Share"><Body/></RoleGate>;
}
const styles=StyleSheet.create({
  root:{padding:12,gap:13,backgroundColor:'#F4F7FB',borderRadius:20,paddingBottom:40},
  back:{minHeight:44,justifyContent:'center'},backText:{color:'#2563EB',fontWeight:'800'},
  hero:{padding:14,borderRadius:18,gap:4},kicker:{fontSize:11,color:'#D1FAE5',fontWeight:'900',letterSpacing:1},
  heroTitle:{fontSize:24,color:'#FFFFFF',fontWeight:'900'},heroCopy:{color:'#E5F7F0',fontSize:14,fontWeight:'600',lineHeight:21},
  heading:{fontSize:19,color:'#0F2744',fontWeight:'900',marginTop:5},
  card:{borderWidth:1,borderColor:'#DFE7EE',backgroundColor:'#FFFFFF',borderRadius:21,padding:15,gap:11},
  label:{fontSize:12,fontWeight:'900',color:'#0F2744',marginTop:2},
  input:{minHeight:49,borderRadius:13,borderWidth:1,borderColor:'#CBD5E1',paddingHorizontal:13,color:'#0F2744',fontSize:16,fontWeight:'700'},
  chips:{flexDirection:'row',flexWrap:'wrap',gap:7},
  pill:{borderRadius:18,backgroundColor:'#F1F5F9',minHeight:40,justifyContent:'center',paddingHorizontal:13,borderWidth:1,borderColor:'#E2E8F0'},
  pillSelected:{backgroundColor:'#DBEAFE',borderColor:'#2563EB'},
  pillText:{fontSize:12,color:'#334155',fontWeight:'800'},
  pillTextSelected:{color:'#1D4ED8'},
  action:{minHeight:48,flex:1,backgroundColor:'#2563EB',borderRadius:12,alignItems:'center',justifyContent:'center',paddingHorizontal:14,paddingVertical:10},
  actionGreen:{backgroundColor:'#0D5C3A'},disabled:{opacity:0.55},
  actionText:{color:'#FFFFFF',fontWeight:'900',fontSize:12,textAlign:'center'},
  inlineRow:{flexDirection:'row',flexWrap:'wrap',gap:9},
  metrics:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',rowGap:9},
  metric:{borderRadius:16,padding:12,borderWidth:1,borderColor:'#D8E4F2'},
  metricLabel:{fontSize:11,fontWeight:'800',color:'#475569'},
  metricValue:{fontWeight:'900',fontSize:25,color:'#0F2744',marginTop:4},
  guru:{padding:10,borderRadius:15,borderWidth:1,borderColor:'#E2E8F0',flexDirection:'row',gap:9,alignItems:'center'},
  guruSelected:{borderColor:'#2563EB',backgroundColor:'#EFF6FF'},
  guruMini:{borderWidth:1,borderColor:'#E2E8F0',borderRadius:16,backgroundColor:'#FFFFFF',overflow:'hidden'},
  guruMiniHeader:{flexDirection:'row',alignItems:'center',gap:12,padding:12,minHeight:80},
  miniExpanded:{borderTopWidth:1,borderTopColor:'#E2E8F0',backgroundColor:'#F8FAFC',padding:12,gap:10},
  expandIcon:{fontSize:26,fontWeight:'700',color:'#2563EB',paddingHorizontal:6},
  good:{fontSize:12,fontWeight:'800',color:'#166534'},
  warning:{fontSize:12,fontWeight:'800',color:'#92400E'},
  historyToggle:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderWidth:1,borderColor:'#E2E8F0',borderRadius:16,padding:13,backgroundColor:'#FFFFFF'},
  quickShareRow:{paddingHorizontal:12,paddingBottom:10,flexDirection:'row'},
  groupNotice:{gap:6,padding:10,borderRadius:12,backgroundColor:'#EFF6FF'},
  avatar:{height:58,width:58,borderRadius:12},avatarBlank:{backgroundColor:'#DCFCE7',alignItems:'center',justifyContent:'center'},
  paw:{fontSize:24},cardTitle:{fontSize:15,fontWeight:'900',color:'#0F2744'},
  small:{fontSize:12,fontWeight:'600',lineHeight:19,color:'#64748B'},
  error:{backgroundColor:'#FEF2F2',color:'#991B1B',borderRadius:12,padding:12,fontSize:13,fontWeight:'800'},
  notice:{backgroundColor:'#F0FDF4',color:'#166534',borderRadius:12,padding:12,fontSize:13,fontWeight:'700'},
  shareImage:{width:'100%',height:210,backgroundColor:'#F8FAFC',borderRadius:14},
  reply:{padding:14,backgroundColor:'#F8FAFC',borderRadius:14,fontSize:13,lineHeight:21,color:'#0F2744'},
});
