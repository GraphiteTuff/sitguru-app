import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import MobileScreen from '@/components/mobile/MobileScreen';
import RoleGate from '@/components/RoleGate';
import { useAuth } from '@/hooks/useAuth';
import { sitguruApiFetch } from '@/lib/data/api';
import { TOUCH_MIN } from '@/constants/mobile-layout';

type GuideSummary = {
  slug:string;
  title:string;
  summary:string;
  category:string;
  stepCount:number;
  excerpt:string;
};
type Guide = {
  slug:string;
  title:string;
  summary:string;
  category:string;
  route:string;
  steps:string[];
  result:string;
  tips:string[];
  faqs:Array<{q:string;a:string}>;
  troubleshooting:Array<{issue:string;fix:string}>;
};
type ListResult={articles?:GuideSummary[];count?:number;total?:number;error?:string};
type DetailResult={article?:Guide;error?:string};
const EXAMPLES=[
  'How do I approve Lola\'s check-in?',
  'Why can\'t I see an intern?',
  'Where are the brand files?',
  'How do I use Planner and Teams?',
];
function HelpBody() {
  const [query,setQuery]=useState('');
  const [results,setResults]=useState<GuideSummary[]>([]);
  const [guide,setGuide]=useState<Guide|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [reload,setReload]=useState(0);
  const fetchResults=useCallback(async (text:string)=>{
    setLoading(true);setError('');
    const response=await sitguruApiFetch<ListResult>(
      '/api/manager/help?q='+encodeURIComponent(text),
      {method:'GET',cache:'no-store'},
    );
    if(response.error||!response.data){
      setError(response.error||'Help search is unavailable.');
      setResults([]);
    } else {
      setResults(response.data.articles||[]);
    }
    setLoading(false);
  },[]);
  useEffect(()=>{
    if(guide)return;
    const delay=setTimeout(()=>{void fetchResults(query);},query?220:0);
    return ()=>clearTimeout(delay);
  },[query,guide,reload,fetchResults]);

  async function openGuide(slug:string) {
    setLoading(true);setError('');
    const response=await sitguruApiFetch<DetailResult>(
      '/api/manager/help?slug='+encodeURIComponent(slug),
      {method:'GET',cache:'no-store'},
    );
    if(response.error||!response.data?.article){
      setError(response.error||'The guide could not be loaded.');
    }else{
      setGuide(response.data.article);
    }
    setLoading(false);
  }
  function back(){
    setGuide(null);
    setError('');
  }
  return (
    <MobileScreen>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>SITGURU · MANAGER DESK</Text>
          <Text style={styles.title}>{guide?'Manager How-To':'Manager Help Center'}</Text>
          <Text style={styles.subTitle}>{guide?'A complete guide with steps, FAQs and troubleshooting.':'Ask a question in your own words. Search the same guides as the Manager web portal.'}</Text>
        </View>
        {guide?(
          <View style={styles.stack}>
            <Pressable accessibilityRole="button" onPress={back} style={styles.outlineButton}>
              <Text style={styles.link}>← Back to all help topics</Text>
            </Pressable>
            <View style={styles.card}>
              <Text style={styles.eyebrow}>{guide.category}</Text>
              <Text style={styles.heading}>{guide.title}</Text>
              <Text style={styles.body}>{guide.summary}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.heading}>Step-by-step instructions</Text>
              {guide.steps.map((step,i)=>(
                <View key={i} style={styles.step}>
                  <View style={styles.numberCircle}><Text style={styles.number}>{i+1}</Text></View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
              <Pressable accessibilityRole="link" style={styles.button} onPress={()=>{void Linking.openURL('https://www.sitguru.com'+guide.route);}}>
                <Text style={styles.buttonText}>Open related SitGuru page ↗</Text>
              </Pressable>
            </View>
            <View style={[styles.card,styles.success]}>
              <Text style={styles.heading}>What success looks like</Text>
              <Text style={styles.body}>{guide.result}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.heading}>Frequently asked questions</Text>
              {guide.faqs.map((faq,i)=>(
                <View key={i} style={styles.faq}>
                  <Text style={styles.question}>{faq.q}</Text>
                  <Text style={styles.body}>{faq.a}</Text>
                </View>
              ))}
            </View>
            <View style={styles.card}>
              <Text style={styles.heading}>Troubleshooting</Text>
              {guide.troubleshooting.map((issue,i)=>(
                <View key={i} style={styles.faq}>
                  <Text style={styles.question}>{issue.issue}</Text>
                  <Text style={styles.body}>{issue.fix}</Text>
                </View>
              ))}
              {guide.tips.map((tip,i)=><Text key={i} style={styles.tip}>Manager tip: {tip}</Text>)}
            </View>
          </View>
        ):(
          <>
            <View style={styles.card}>
              <Text style={styles.searchLabel}>SEARCH ALL MANAGER HELP TOPICS</Text>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="How do I approve an intern's check-in?"
                placeholderTextColor="#64748B"
                autoCapitalize="sentences"
                accessibilityLabel="Search Manager Help"
                returnKeyType="search"
                style={styles.search}
              />
              <Text style={styles.muted}>Find instructions, FAQ answers, and troubleshooting instantly.</Text>
            </View>
            {!query?(
              <View style={styles.card}>
                <Text style={styles.heading}>Popular questions</Text>
                {EXAMPLES.map(example=>(
                  <Pressable key={example} accessibilityRole="button" onPress={()=>setQuery(example)} style={styles.questionButton}>
                    <Text style={styles.link}>{example}  →</Text>
                  </Pressable>
                ))}
              </View>
            ):null}
            <View style={styles.resultsHeader}>
              <Text style={styles.heading}>Help articles</Text>
              <Text style={styles.muted}>{results.length} results</Text>
            </View>
            {results.map(row=>(
              <Pressable key={row.slug} accessibilityRole="button" onPress={()=>void openGuide(row.slug)} style={styles.card}>
                <Text style={styles.eyebrow}>{row.category}</Text>
                <Text style={styles.articleTitle}>{row.title}</Text>
                <Text style={styles.body}>{query?row.excerpt:row.summary}</Text>
                <Text style={styles.link}>{row.stepCount} steps · Open full guide →</Text>
              </Pressable>
            ))}
            {!loading&&!error&&results.length===0?(
              <View style={styles.card}>
                <Text style={styles.heading}>No exact result</Text>
                <Text style={styles.body}>Try a shorter question such as 'approve check-in', 'Planner sync', or 'Lola access'.</Text>
                <Pressable onPress={()=>setQuery('')} style={styles.button}><Text style={styles.buttonText}>Clear search</Text></Pressable>
              </View>
            ):null}
          </>
        )}
        {loading?<View style={styles.center}><ActivityIndicator color="#2563EB"/><Text style={styles.muted}>Searching SitGuru Help…</Text></View>:null}
        {error?<View style={styles.card}><Text style={styles.error}>{error}</Text><Pressable style={styles.outlineButton} onPress={()=>setReload(x=>x+1)}><Text style={styles.link}>Try again</Text></Pressable></View>:null}
        <Pressable accessibilityRole="button" onPress={()=>router.push('/growth-insights')} style={styles.outlineButton}>
          <Text style={styles.link}>← Back to Growth Insights</Text>
        </Pressable>
      </View>
    </MobileScreen>
  );
}
export default function ManagerHelpScreen(){
  const {roles}=useAuth();
  return (
    <RoleGate requiredRole={roles.includes('admin')?'admin':'manager'} title="Manager Help Center">
      <HelpBody/>
    </RoleGate>
  );
}
const styles=StyleSheet.create({
  content:{paddingHorizontal:16,paddingTop:18,paddingBottom:48,gap:14},
  stack:{gap:14},
  header:{paddingVertical:6,gap:7},
  title:{fontSize:26,fontWeight:'900',color:'#0F2744'},
  subTitle:{fontSize:14,lineHeight:21,fontWeight:'600',color:'#475569'},
  eyebrow:{fontSize:10,fontWeight:'900',letterSpacing:1.2,color:'#2563EB'},
  card:{padding:16,borderRadius:18,backgroundColor:'#FFFFFF',borderWidth:1,borderColor:'#E2E8F0',gap:9},
  heading:{fontSize:18,fontWeight:'900',color:'#0F2744'},
  articleTitle:{fontSize:16,fontWeight:'900',color:'#0F2744'},
  body:{fontSize:14,fontWeight:'600',lineHeight:22,color:'#334155'},
  searchLabel:{fontSize:11,fontWeight:'900',color:'#0F2744'},
  search:{minHeight:TOUCH_MIN,borderRadius:12,borderWidth:2,borderColor:'#BFDBFE',paddingHorizontal:12,color:'#0F2744',fontSize:15,fontWeight:'600',backgroundColor:'#F8FAFC'},
  muted:{fontSize:12,fontWeight:'600',color:'#64748B'},
  link:{fontSize:13,fontWeight:'900',color:'#2563EB'},
  error:{fontSize:13,fontWeight:'700',color:'#BE123C'},
  center:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,paddingVertical:12},
  resultsHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10},
  questionButton:{minHeight:TOUCH_MIN,justifyContent:'center',borderTopWidth:1,borderTopColor:'#F1F5F9',paddingVertical:8},
  step:{flexDirection:'row',alignItems:'flex-start',gap:12,paddingVertical:6},
  numberCircle:{width:30,height:30,borderRadius:10,backgroundColor:'#EFF6FF',alignItems:'center',justifyContent:'center'},
  number:{fontSize:13,fontWeight:'900',color:'#2563EB'},
  stepText:{flex:1,fontSize:14,lineHeight:21,fontWeight:'600',color:'#0F2744'},
  button:{minHeight:TOUCH_MIN,borderRadius:13,backgroundColor:'#2563EB',alignItems:'center',justifyContent:'center',paddingHorizontal:13},
  buttonText:{fontSize:13,fontWeight:'900',color:'#FFFFFF'},
  outlineButton:{minHeight:TOUCH_MIN,borderRadius:13,borderWidth:1,borderColor:'#CBD5E1',backgroundColor:'#FFFFFF',alignItems:'center',justifyContent:'center',paddingHorizontal:13},
  success:{backgroundColor:'#F0FDF4',borderColor:'#DCFCE7'},
  faq:{paddingTop:12,borderTopWidth:1,borderTopColor:'#F1F5F9',gap:5},
  question:{fontSize:14,fontWeight:'900',color:'#0F2744'},
  tip:{fontSize:13,lineHeight:20,fontWeight:'600',color:'#166534'},
});
