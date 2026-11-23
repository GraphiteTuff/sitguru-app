import {router} from 'expo-router';
import {useCallback,useEffect,useState} from 'react';
import {ActivityIndicator,Linking,StyleSheet,Text,View} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import RoleGate from '@/components/RoleGate';
import MobileScreen from '@/components/mobile/MobileScreen';
import TouchTarget from '@/components/mobile/TouchTarget';
import {useAuth} from '@/hooks/useAuth';
import {sitguruApiFetch} from '@/lib/data/api';
type Summary={drafts:number;pending:number;changes:number;approved:number;scheduled:number;published:number;escalated:number};
type Item={id:string;title:string;platform:string;internName:string;status:string;contentType:string;published:boolean;plannedAt:string;createdAt:string};
type Result={ok:boolean;workspace:'intern'|'manager';summary:Summary;items:Item[];webPath:string;note:string};
function Studio(){
  const [data,setData]=useState<Result|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const load=useCallback(async()=>{
    setLoading(true);setError('');
    const r=await sitguruApiFetch<Result>('/api/content-studio/snapshot',{cache:'no-store'});
    if(r.error||!r.data)setError(r.error||'Content Studio data unavailable.');
    else setData(r.data);
    setLoading(false);
  },[]);
  useEffect(()=>{void load();},[load]);
  const rows=data?.summary;
  return <MobileScreen refreshing={loading} onRefresh={()=>{void load();}}>
    <View style={styles.root}>
      <TouchTarget onPress={()=>router.back()} style={styles.back}><Text style={styles.link}>← Back</Text></TouchTarget>
      <LinearGradient colors={['#0F2744','#164B61','#0D5C3A']} style={styles.hero}>
        <Text style={styles.eyebrow}>🐾 SITGURU · COMMUNITY GROWTH</Text>
        <Text style={styles.heroTitle}>Content Studio</Text>
        <Text style={styles.heroSub}>The same live assignments, approval stages and published status as the Manager and Intern desktop portals.</Text>
      </LinearGradient>
      <View style={styles.row}>
        <TouchTarget onPress={()=>router.push('/guru-match-share')} style={styles.action}><Text style={styles.actionText}>Guru Match &amp; Share</Text></TouchTarget>
        <TouchTarget onPress={()=>router.push('/social-intelligence')} style={styles.action}><Text style={styles.actionText}>Social Intelligence</Text></TouchTarget>
      </View>
      {loading&&<ActivityIndicator color="#2563EB"/>}
      {!!error&&<Text style={styles.error}>{error}</Text>}
      {rows&&<View style={styles.grid}>
        {([
          ['Drafts',rows.drafts],['Ava review',rows.pending],['CEO review',rows.escalated],
          ['Approved',rows.approved],['Scheduled',rows.scheduled],['Published',rows.published],
        ] as [string,number][]).map(([title,value],i)=>
          <View key={title} style={[styles.stat,{backgroundColor:i%2===0?'#EFF6FF':'#F0FDF4'}]}>
            <Text style={styles.statName}>{title}</Text>
            <Text style={styles.statValue}>{value}</Text>
          </View>)}
      </View>}
      <Text style={styles.heading}>Recent Content Studio work</Text>
      {data?.items.length===0&&<Text style={styles.note}>No assigned content has been submitted yet.</Text>}
      {data?.items.map(item=><View key={item.id} style={styles.card}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.note}>{item.internName} · {item.platform||'Platform not chosen'} · {item.contentType.replace(/_/g,' ')}</Text>
        <Text style={styles.status}>{item.status}</Text>
        {item.published&&<Text style={styles.published}>Published link recorded</Text>}
        {!!item.plannedAt&&<Text style={styles.note}>Planned: {item.plannedAt.slice(0,10)}</Text>}
      </View>)}
      {!!data&&<>
        <TouchTarget accessibilityRole="button"
          onPress={()=>{void Linking.openURL('https://www.sitguru.com'+data.webPath);}}
          style={styles.primary}><Text style={styles.primaryText}>Open complete Content Studio workflow ↗</Text></TouchTarget>
        <Text style={styles.note}>{data.note} Publishing and approvals are not performed in this native summary screen.</Text>
      </>}
    </View>
  </MobileScreen>;
}
export default function ContentStudioScreen(){
  const {roles}=useAuth();
  const requiredRole=roles.includes('admin')?'admin':roles.includes('manager')?'manager':roles.includes('intern')?'intern':'admin';
  return <RoleGate requiredRole={requiredRole} title="Content Studio"><Studio/></RoleGate>;
}
const styles=StyleSheet.create({
  root:{padding:12,paddingBottom:36,gap:13,backgroundColor:'#F4F7FB',borderRadius:20},
  back:{minHeight:44,justifyContent:'center'},link:{fontWeight:'800',color:'#2563EB'},
  hero:{padding:22,borderRadius:22,gap:8},
  eyebrow:{color:'#D1FAE5',fontSize:11,fontWeight:'900',letterSpacing:1},
  heroTitle:{fontSize:29,fontWeight:'900',color:'#FFFFFF'},
  heroSub:{color:'#ECFDF5',fontSize:13,fontWeight:'700',lineHeight:21},
  row:{flexDirection:'row',gap:9,flexWrap:'wrap'},
  action:{minHeight:48,flex:1,minWidth:135,padding:12,justifyContent:'center',alignItems:'center',backgroundColor:'#DBEAFE',borderRadius:12},
  actionText:{fontWeight:'900',fontSize:12,color:'#1D4ED8',textAlign:'center'},
  grid:{flexDirection:'row',flexWrap:'wrap',gap:9},
  stat:{flexGrow:1,width:'46%',padding:13,borderRadius:16,borderColor:'#DBEAFE',borderWidth:1},
  statName:{fontSize:12,fontWeight:'900',color:'#475569'},
  statValue:{fontSize:26,fontWeight:'900',color:'#0F2744',marginTop:4},
  heading:{fontSize:18,fontWeight:'900',color:'#0F2744'},
  card:{padding:16,borderRadius:18,borderWidth:1,borderColor:'#E2E8F0',backgroundColor:'#FFFFFF',gap:7},
  itemTitle:{fontSize:15,fontWeight:'900',color:'#0F2744'},
  note:{fontSize:12,fontWeight:'600',color:'#64748B',lineHeight:18},
  status:{fontSize:12,fontWeight:'900',color:'#1D4ED8',textTransform:'capitalize'},
  published:{fontSize:12,fontWeight:'800',color:'#0D5C3A'},
  primary:{minHeight:50,backgroundColor:'#2563EB',borderRadius:13,alignItems:'center',justifyContent:'center',padding:12},
  primaryText:{fontWeight:'900',color:'#FFFFFF',fontSize:13,textAlign:'center'},
  error:{backgroundColor:'#FEF2F2',color:'#991B1B',padding:12,borderRadius:12},
});
