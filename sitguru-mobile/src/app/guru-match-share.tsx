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
  id:string;code:string;status:string;guru:{name:string;city:string;state:string};
  city:string;state:string;service_key:string;channel:Channel;
  reply_text:string;shareUrl:string;cardUrl:string;metrics:Metrics;
};
type Payload={ok:boolean;matches:Guru[];campaigns:Card[];totals:Metrics;matchesNotice:string};
const services:[Service,string][]=[
  ['dog_walking','Dog Walking'],['pet_sitting','Pet Sitting'],['drop_in_visits','Drop-In Visits'],
  ['house_sitting','House Sitting'],['doggy_day_care','Doggy Day Care'],['boarding','Boarding'],
  ['cat_care','Cat Care'],['pet_taxi','Pet Taxi'],
];
const states=['PA','NJ','FL','NY','DE','MD','CA'];
const channels:Channel[]=['facebook','instagram','tiktok','x','other'];
const initial:Metrics={linkOpens:0,qrOpens:0,profileClicks:0,inquiryClicks:0,sharesReported:0,copyIntents:0};
type Params={city:string;state:string;service:Service;pet:Pet;radius:number;channel:Channel};
function Body(){
  const {width}=useWindowDimensions();
  const [form,setForm]=useState<Params>({city:'Quakertown',state:'PA',service:'dog_walking',pet:'dog',radius:10,channel:'facebook'});
  const [dashboard,setDashboard]=useState<Payload|null>(null);
  const [selected,setSelected]=useState('');
  const [active,setActive]=useState('');
  const [searched,setSearched]=useState(false);
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
  const card=dashboard?.campaigns.find(c=>c.code===active)||dashboard?.campaigns[0];
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
      {!!error&&<Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      {!!notice&&<Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text>}
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
          {g.photoUrl?<Image source={{uri:g.photoUrl}} style={styles.avatar}/>:<View style={[styles.avatar,styles.avatarBlank]}><Text style={styles.paw}>🐾</Text></View>}
          <View style={{flex:1}}>
            <Text style={styles.cardTitle}>{g.name} · {g.city}, {g.state}</Text>
            <Text style={styles.small}>{g.serviceLabel} · {g.reason}</Text>
          </View>
        </TouchTarget>)}
        {selectedGuru&&btn('Generate unique tracking link + QR card',()=>{void create();},busy,true)}
      </View>
      <Text style={styles.heading}>Tracked promotions</Text>
      {!dashboard?.campaigns.length&&<View style={styles.card}><Text style={styles.small}>No promotions yet. Choose a matching Guru above.</Text></View>}
      {dashboard?.campaigns.map(c=><View key={c.id} style={styles.card}>
        <Text style={styles.cardTitle}>{c.guru.name} · {c.city}, {c.state}</Text>
        <Text style={styles.small}>{c.channel.toUpperCase()} · {c.status.replace(/_/g,' ')}</Text>
        <Text style={styles.small}>{c.metrics.linkOpens+c.metrics.qrOpens} opens · {c.metrics.profileClicks} profile clicks · {c.metrics.inquiryClicks} inquiry clicks</Text>
        {btn('View promotion',()=>setActive(c.code))}
        {c.status==='pending_review'&&role!=='intern'&&<View style={styles.inlineRow}>
          {btn('Approve',()=>{void action(c,'approve');},busy,true)}
          {btn('Reject',()=>{void action(c,'reject');},busy)}
        </View>}
        {c.status==='approved'&&<View style={styles.inlineRow}>
          {btn('Share reply',()=>{void shareReply(c);})}
          {btn('Mark shared',()=>{void action(c,'shared');},busy,true)}
        </View>}
        {card?.id===c.id&&<>
          {c.status==='approved'?<>
            <Image source={{uri:c.cardUrl}} resizeMode="contain" style={styles.shareImage}/>
            {btn('Open downloadable card',()=>{void Linking.openURL(c.cardUrl);})}
            {btn('Preview tracked link',()=>{void Linking.openURL(c.shareUrl);})}
          </>:<Text style={styles.notice}>Public QR and sharing unlock only after manager approval.</Text>}
          <Text style={styles.reply}>{c.status==='approved'?c.reply_text:c.reply_text.replace(/https:\/\/www\.sitguru\.com\/s\/g\/\S+/g,'[link unlocks after approval]')}</Text>
        </>}
      </View>)}
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
  hero:{padding:21,borderRadius:23,gap:8},kicker:{fontSize:11,color:'#D1FAE5',fontWeight:'900',letterSpacing:1},
  heroTitle:{fontSize:28,color:'#FFFFFF',fontWeight:'900'},heroCopy:{color:'#E5F7F0',fontSize:14,fontWeight:'600',lineHeight:21},
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
  avatar:{height:58,width:58,borderRadius:12},avatarBlank:{backgroundColor:'#DCFCE7',alignItems:'center',justifyContent:'center'},
  paw:{fontSize:24},cardTitle:{fontSize:15,fontWeight:'900',color:'#0F2744'},
  small:{fontSize:12,fontWeight:'600',lineHeight:19,color:'#64748B'},
  error:{backgroundColor:'#FEF2F2',color:'#991B1B',borderRadius:12,padding:12,fontSize:13,fontWeight:'800'},
  notice:{backgroundColor:'#F0FDF4',color:'#166534',borderRadius:12,padding:12,fontSize:13,fontWeight:'700'},
  shareImage:{width:'100%',height:210,backgroundColor:'#F8FAFC',borderRadius:14},
  reply:{padding:14,backgroundColor:'#F8FAFC',borderRadius:14,fontSize:13,lineHeight:21,color:'#0F2744'},
});
