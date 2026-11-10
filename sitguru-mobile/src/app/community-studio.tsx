import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Image, Platform, Share, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import MobileScreen from '@/components/mobile/MobileScreen';
import StickyActionBar from '@/components/mobile/StickyActionBar';
import TouchTarget from '@/components/mobile/TouchTarget';
import CommunityMedia from '@/components/community/CommunityMedia';
import { nativePackSections } from '@/lib/data/community-pack';
import { uploadCommunityMedia } from '@/lib/data/community-upload';
import CommunitySchedulePicker from '@/components/community/CommunitySchedulePicker';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/use-theme';
import { useWorkspaceLiveSync } from '@/hooks/data/useWorkspaceLiveSync';
import { getSitGuruApiBaseUrl, sitguruApiFetch } from '@/lib/data/api';
import { COMMUNITY_COLLECTIONS, communityDevelopmentError, type CommunityItem, type CommunityKind, type CommunityWorkspace } from '@/lib/data/community-studio';

type Mode = 'public' | 'member' | 'manager';
type Mutation = { ok: boolean; error: string; message: string };

export default function CommunityStudioScreen() {
  const { session, loading } = useAuth();
  const { colors } = useTheme();
  const [mode, setMode] = useState<Mode>('public');
  const [workspace, setWorkspace] = useState<CommunityWorkspace | null>(null);
  const [fetching, setFetching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [composing, setComposing] = useState(false);
  const [editing, setEditing] = useState<CommunityItem | null>(null);
  const [kind, setKind] = useState<CommunityKind>('pack');
  const [title, setTitle] = useState('');
  const [petName, setPetName] = useState('');
  const [story, setStory] = useState('');
  const [location, setLocation] = useState('');
  const [consent, setConsent] = useState(false);
  const [socialConsent,setSocialConsent] = useState(false);
  const [featuresClientPet,setFeaturesClientPet] = useState(false);
  const [bookingId,setBookingId] = useState('');
  const [step,setStep] = useState(0);
  const [progress,setProgress] = useState(0);
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [linkedTask, setLinkedTask] = useState('');
  const [linkedContent, setLinkedContent] = useState('');
  const [reviewing, setReviewing] = useState<CommunityItem | null>(null);
  const [feedback, setFeedback] = useState('');
  const [publishAt, setPublishAt] = useState('');
  const [weekOf, setWeekOf] = useState('');
  const requestId = useRef(0);
  const developmentError = communityDevelopmentError();

  const load = useCallback(async (quiet = false) => {
    if (developmentError || (mode !== 'public' && !session)) return;
    const request = ++requestId.current;
    if (!quiet) setFetching(true);
    const result = await sitguruApiFetch<CommunityWorkspace>(`/api/community-studio?mode=${mode}`, { auth: mode !== 'public', cache: 'no-store' });
    if (request !== requestId.current) return;
    setFetching(false);
    if (result.error || !result.data) { setError(result.error || 'Community Studio could not load.'); return; }
    setWorkspace(result.data);
    setError(result.data.error || '');
  }, [developmentError, mode, session]);
  useEffect(() => { void load(); return () => { requestId.current += 1; }; }, [load]);
  useWorkspaceLiveSync({ userId: session?.user.id, enabled: !developmentError, onRefresh: () => { void load(true); } });
  useFocusEffect(useCallback(() => {
    if (mode !== 'public' || developmentError) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const activate = (visible: boolean) => {
      if (timer) clearInterval(timer);
      timer = undefined;
      if (visible) timer = setInterval(() => { void load(true); }, 30_000);
    };
    activate(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
    const subscription = AppState.addEventListener('change', (state) => {
      activate(state === 'active');
      if (state === 'active') void load(true);
    });
    return () => { if (timer) clearInterval(timer); subscription.remove(); };
  }, [developmentError, load, mode]));
  useEffect(() => { setWorkspace(null); setReviewing(null); setComposing(false); }, [session?.user.id]);

  const cardStyle = [styles.card, { backgroundColor: colors.card, borderColor: colors.border }];
  const inputStyle = [styles.input, { backgroundColor: colors.input, color: colors.inputText, borderColor: colors.border }];
  const buttonStyle = [styles.button, { backgroundColor: '#0D5C3A' }];
  const labelStyle = [styles.label, { color: colors.text }];
  const bodyStyle = [styles.body, { color: colors.textSecondary }];
  const button = (label: string, action: () => void, disabled = false) => <TouchTarget accessibilityRole="button" disabled={disabled || busy} onPress={action} style={[buttonStyle, (disabled || busy) && styles.disabled]}><Text style={styles.buttonText}>{label}</Text></TouchTarget>;

  function compose(item?: CommunityItem) {
    setEditing(item || null); setKind(item?.kind || 'pack'); setTitle(item?.title || '');
    setPetName(item?.petName || ''); setStory(item?.story || ''); setLocation(item?.location || '');
    setLinkedTask(item?.taskId || ''); setLinkedContent(item?.contentId || ''); setConsent(false); setPhoto(null);
    setStep(0);setSocialConsent(item?.socialConsent === true);setFeaturesClientPet(item?.featuresClientPet === true);setBookingId(item?.bookingId || '');setReviewing(null); setComposing(true); setError(''); setNotice('');
  }

  async function pickPhoto(camera=false) {
    try {
      if(camera) { const permission=await ImagePicker.requestCameraPermissionsAsync();if(!permission.granted){setError('Camera access is needed to capture media.');return;} }
      const options:ImagePicker.ImagePickerOptions={mediaTypes:['images','videos'],allowsEditing:false,quality:0.8,videoMaxDuration:60,preferredAssetRepresentationMode:ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible};
      const result=camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if(result.canceled || !result.assets[0])return;
      const asset=result.assets[0];
      if(asset.fileSize && asset.fileSize>25*1024*1024){setError('Choose media under 25 MB.');return;}
      setPhoto(asset);setError('');
    }catch{setError('Media selection could not open. Try your photo library.');}
  }

  async function mutate(form: FormData) {
    if (developmentError || busy) return false;
    setBusy(true); setError(''); setNotice('');
    const result = await sitguruApiFetch<Mutation>('/api/community-studio', { method: 'POST', body: form, timeoutMs: 60_000 });
    setBusy(false);
    if (result.error || !result.data?.ok) { setError(result.error || result.data?.error || 'This change could not be saved.'); return false; }
    setNotice(result.data.message); await load(); return true;
  }

  async function save(intent: 'draft' | 'submit') {
    const form = new FormData();
    for (const [key, value] of Object.entries({ title, kind, petName, story, location, intent, consent: consent ? 'on' : '', id: editing?.id || '', updatedAt: editing?.updatedAt || '', taskId: linkedTask, contentId: linkedContent })) form.append(key, value);
    form.append('publicConsent',consent?'on':'');form.append('socialConsent',socialConsent?'on':'');
    form.append('featuresClientPet',featuresClientPet?'on':'');form.append('bookingId',bookingId);
    if(photo) {
      setBusy(true);setError('');setProgress(0);
      try{const media=await uploadCommunityMedia(photo,setProgress);form.append('mediaPath',media.mediaPath);}
      catch(problem){setError(problem instanceof Error?problem.message:'Upload failed.');setBusy(false);return;}
      setBusy(false);
    }
    if (await mutate(form)) { setComposing(false); setEditing(null); setPhoto(null); }
  }

  async function review(action: string) {
    if (!reviewing) return;
    const form = new FormData();
    for (const [key, value] of Object.entries({ operation: 'review', id: reviewing.id, updatedAt: reviewing.updatedAt, action, feedback, publishAt, weekOf })) form.append(key, value);
    if (await mutate(form)) setReviewing(null);
  }

  const imageSource = (item: CommunityItem) => ({ uri: `${getSitGuruApiBaseUrl()}${item.imageUrl}`, headers: session && mode !== 'public' ? { Authorization: `Bearer ${session.access_token}` } : undefined });

  const sections=nativePackSections(workspace?.items || []);
  const visibleItems=mode==='public'?sections.gallery:workspace?.items;
  return <MobileScreen refreshing={fetching} onRefresh={() => { void load(); }} footer={session && !developmentError && (workspace?.ready !== false || mode === 'public') ? <StickyActionBar>{composing ? button(busy ? 'Saving…' : step<2?'Continue':'Submit for manager review', () => {if(step<2)setStep(step+1);else void save('submit');}, busy || (step===0 && kind!=='pack'&&!photo&&!editing?.imageUrl)||(step===1&&(!title.trim()||story.trim().length<20))||(step===2&&(!consent||(featuresClientPet&&!bookingId)))) : button('Share a community story', () => { setMode('member'); compose(); })}</StickyActionBar> : undefined}>
    <TouchTarget accessibilityRole="button" onPress={() => router.back()} style={styles.back}><Text style={[styles.label, { color: colors.primary }]}>← Back</Text></TouchTarget>
    <View style={[styles.hero, { backgroundColor: '#0D5C3A' }]}><Text style={styles.kicker}>COMMUNITY STUDIO</Text><Text style={styles.title}>The SitGuru Pack</Text><Text style={styles.heroBody}>Every pet has a story. Celebrate yours with the people who care.</Text></View>
    {developmentError ? <Text accessibilityRole="alert" style={[styles.message, { color: colors.danger, backgroundColor: colors.card }]}>{developmentError}</Text> : <>
      {button('Submit photo or video',()=>{if(!session)router.push('/login');else {setMode('member');compose();}})}
      {session && <View style={styles.tabs}>{([{ id: 'public', label: 'The Pack' }, { id: 'member', label: 'My stories' }, { id: 'manager', label: 'Review' }] as const).filter(tab=>tab.id!=='manager'||workspace?.canModerate||mode==='manager').map((tab) => <TouchTarget key={tab.id} accessibilityRole="tab" accessibilityState={{ selected: mode === tab.id }} onPress={() => { setMode(tab.id); setWorkspace(null); setComposing(false); setReviewing(null); setError(''); }} style={[styles.tab, { backgroundColor: mode === tab.id ? colors.primarySoft : colors.card, borderColor: colors.border }]}><Text style={[styles.label, { color: mode === tab.id ? colors.primary : colors.text }]}>{tab.label}</Text></TouchTarget>)}</View>}
      {session && button('Pet Parent permission requests',()=>router.push('/community-permissions'))}
      {loading || (fetching && !workspace) ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text accessibilityRole="alert" style={[styles.message, { color: colors.danger, backgroundColor: colors.card }]}>{error}</Text> : null}
      {notice ? <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.success, backgroundColor: colors.card }]}>{notice}</Text> : null}
      {!session && mode !== 'public' ? <View style={cardStyle}><Text style={bodyStyle}>Sign in to save stories or open your authorized moderation queue.</Text>{button('Sign in', () => router.push('/login'))}</View> : null}
      {composing && session ? <View style={cardStyle}>
        <Text style={[styles.heading,{color:colors.text}]}>{['1. Choose media','2. Add your caption or story','3. Permissions & submit'][step]}</Text>
        {step===1 && <><Text style={labelStyle}>Story details</Text>
        <View style={styles.collections}>{COMMUNITY_COLLECTIONS.map((collection) => <TouchTarget key={collection.id} accessibilityRole="radio" accessibilityState={{ checked: kind === collection.id }} onPress={() => setKind(collection.id)} style={[styles.collection, { backgroundColor: kind === collection.id ? colors.primarySoft : colors.input, borderColor: kind === collection.id ? colors.primary : colors.border }]}><Text style={[styles.label, { color: colors.text }]}>{collection.label}</Text></TouchTarget>)}</View>
        <Text style={labelStyle}>Story title</Text><TextInput accessibilityLabel="Story title" value={title} onChangeText={setTitle} maxLength={160} style={inputStyle} />
        <Text style={labelStyle}>Pet or Guru name</Text><TextInput accessibilityLabel="Pet or Guru name" value={petName} onChangeText={setPetName} maxLength={100} style={inputStyle} />
        <Text style={labelStyle}>Your story</Text><TextInput accessibilityLabel="Your community story" value={story} onChangeText={setStory} multiline maxLength={5000} textAlignVertical="top" style={[inputStyle, styles.storyInput]} /><Text style={bodyStyle}>{story.length}/5000 · at least 20 characters to submit</Text>
        <Text style={labelStyle}>City or community (optional)</Text><TextInput accessibilityLabel="City or community" value={location} onChangeText={setLocation} maxLength={120} placeholder="City only — keep your address private" placeholderTextColor={colors.inputPlaceholder} style={inputStyle} />
        </>}
        {step===0 && <>
          {photo?<CommunityMedia uri={photo.uri} mime={photo.mimeType || (photo.type==='video'?'video/mp4':'image/jpeg')} label="Selected community media"/>:editing?.imageUrl?<CommunityMedia {...imageSource(editing)} uri={imageSource(editing).uri} mime={editing.mediaMime} label={editing.title}/>:null}
          {button('Choose photo or video',()=>void pickPhoto())}{button('Use camera',()=>void pickPhoto(true))}
          {button('Share a story without media',()=>{setKind('pack');setPhoto(null);setStep(1);})}
          <Text style={bodyStyle}>Photos, MP4 or MOV videos up to 25 MB. Pet of the Week needs a photo.</Text>
        </>}
        {step===2 && <>
        {workspace?.tasks?.length ? <View style={styles.section}><Text style={labelStyle}>Link an assignment (optional)</Text>{workspace.tasks.map((task) => <TouchTarget key={task.id} accessibilityRole="checkbox" accessibilityState={{ checked: linkedTask === task.id }} onPress={() => setLinkedTask(linkedTask === task.id ? '' : task.id)} style={[styles.linkRow, { borderColor: colors.border }]}><Text style={bodyStyle}>{linkedTask === task.id ? '✓ ' : '○ '}{task.title}</Text></TouchTarget>)}</View> : null}
        {workspace?.content?.length ? <View style={styles.section}><Text style={labelStyle}>Link Content Studio work (optional)</Text>{workspace.content.map((item) => <TouchTarget key={item.id} accessibilityRole="checkbox" accessibilityState={{ checked: linkedContent === item.id }} onPress={() => setLinkedContent(linkedContent === item.id ? '' : item.id)} style={[styles.linkRow, { borderColor: colors.border }]}><Text style={bodyStyle}>{linkedContent === item.id ? '✓ ' : '○ '}{item.title}</Text></TouchTarget>)}</View> : null}
        <View style={styles.consent}><Switch accessibilityLabel="Required website display permission" value={consent} onValueChange={setConsent} /><Text style={[bodyStyle, styles.flex]}>I allow public display on SitGuru after permission checks and manager review.</Text></View>
        <View style={styles.consent}><Switch accessibilityLabel="Optional social media reuse" value={socialConsent} onValueChange={setSocialConsent}/><Text style={[bodyStyle,styles.flex]}>Optional: allow reuse on SitGuru’s social channels.</Text></View>
        <View style={styles.consent}><Switch accessibilityLabel="Client pet content" value={featuresClientPet} onValueChange={setFeaturesClientPet}/><Text style={[bodyStyle,styles.flex]}>This features a client’s pet. Their verified Pet Parent must approve.</Text></View>
        {featuresClientPet && <View><Text style={bodyStyle}>Choose your assigned care booking. A checkbox is not Pet Parent authorization.</Text>{workspace?.bookings?.map(booking=>button((bookingId===booking.id?'✓ ':'')+booking.label,()=>setBookingId(booking.id)))}</View>}
        </>}
        {step>0&&button('Back',()=>setStep(step-1))}
        {busy&&<Text accessibilityLiveRegion="polite" style={bodyStyle}>Uploading / checking media: {progress}%</Text>}
        {button('Save private draft', () => { void save('draft'); }, !title.trim())}{button('Cancel', () => setComposing(false))}
      </View> : null}
      {reviewing && workspace?.canModerate ? <View style={cardStyle}>
        <Text style={[styles.heading, { color: colors.text }]}>Review: {reviewing.title}</Text><Text style={labelStyle}>Feedback</Text><TextInput accessibilityLabel="Manager feedback" multiline value={feedback} onChangeText={setFeedback} maxLength={3000} style={[inputStyle, styles.storyInput]} />
        {reviewing.status === 'pending' ? <>{button('Approve', () => { void review('approve'); })}{button('Request changes', () => { void review('request_changes'); }, !feedback.trim())}{button('Reject', () => { void review('reject'); }, !feedback.trim())}</> : null}
        {['approved', 'scheduled'].includes(reviewing.status) ? <><CommunitySchedulePicker publishAt={publishAt} onPublishAt={setPublishAt} petOfWeek={reviewing.kind === 'pet_of_week'} weekOf={weekOf} onWeekOf={setWeekOf} disabled={busy} />{button('Schedule publication', () => { void review('schedule'); }, !publishAt || (reviewing.kind === 'pet_of_week' && !weekOf))}{button('Publish now', () => { void review('publish'); }, reviewing.kind === 'pet_of_week' && !weekOf)}</> : null}
        {button('Archive story', () => { void review('archive'); })}{button('Close review', () => setReviewing(null))}
      </View> : null}
      {!composing && mode==='public' && <><Text style={[styles.heading,{color:colors.text}]}>Pet of the Week</Text>{sections.featured?<View style={cardStyle}><CommunityMedia {...imageSource(sections.featured)} uri={imageSource(sections.featured).uri} mime={sections.featured.mediaMime} label={sections.featured.petName}/><Text style={[styles.heading,{color:colors.text}]}>{sections.featured.petName}</Text><Text style={bodyStyle}>{sections.featured.story}</Text>{button('Share this pet',()=>{void Share.share({message:sections.featured?.title+'\n'+getSitGuruApiBaseUrl()+'/pack'});})}</View>:<Text style={bodyStyle}>Our next featured pet is on the way.</Text>}<Text style={[styles.heading,{color:colors.text}]}>Community Gallery</Text></>}
      {!composing ? visibleItems?.map((item) => <View key={item.id} style={cardStyle}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>{COMMUNITY_COLLECTIONS.find((collection) => collection.id === item.kind)?.label}</Text>
        {item.imageUrl ? <CommunityMedia {...imageSource(item)} uri={imageSource(item).uri} mime={item.mediaMime} label={item.petName || item.title}/> : null}
        <Text style={[styles.heading, { color: colors.text }]}>{item.title}</Text><Text style={bodyStyle}>{item.story}</Text>
        {item.petName || item.location ? <Text style={bodyStyle}>{[item.petName, item.location].filter(Boolean).join(' · ')}</Text> : null}
        {mode !== 'public' ? <Text style={[styles.badge, { color: colors.primary }]}>{item.status.replace(/_/g, ' ')}</Text> : null}
        {item.feedback ? <View style={[styles.message, { backgroundColor: colors.primarySoft }]}><Text style={labelStyle}>Manager feedback</Text><Text style={bodyStyle}>{item.feedback}</Text></View> : null}
        {item.canEdit ? button('Edit story', () => compose(item)) : null}
        {item.canReview && workspace?.canModerate ? button('Review story', () => { setReviewing(item); setFeedback(item.feedback); setWeekOf(item.weekOf); setPublishAt(item.publishAt ? item.publishAt.slice(0, 16) : ''); setError(''); }) : null}
        {item.status === 'published' ? button('Share story', () => { void Share.share({ message: `${item.title}\n${getSitGuruApiBaseUrl()}/pack#story-${item.id}` }).catch(() => setError('Sharing could not open.')); }) : null}
      </View>) : null}
      {workspace && !fetching && !workspace.items.length && !composing && !error ? <View style={cardStyle}><Text style={[styles.heading, { color: colors.text }]}>{mode === 'public' ? 'A new chapter for the Pack' : 'Your queue is clear'}</Text><Text style={bodyStyle}>{mode === 'public' ? 'Approved community stories will appear here when published.' : 'Saved stories and review updates will appear here automatically.'}</Text></View> : null}
    </>}
  </MobileScreen>;
}

const styles = StyleSheet.create({
  back: { alignSelf: 'flex-start', paddingHorizontal: 8 },
  hero: { borderRadius: 26, padding: 24, gap: 10 },
  kicker: { color: '#CFF3DE', fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  title: { color: '#FFFFFF', fontSize: 32, fontWeight: '800', lineHeight: 38 },
  heroBody: { color: '#F2FFF7', fontSize: 15, lineHeight: 23 },
  card: { borderWidth: 1, borderRadius: 22, padding: 18, gap: 12 },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 6 },
  collections: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  collection: { flexBasis: '46%', flexGrow: 1, borderWidth: 1, borderRadius: 14, paddingHorizontal: 10 },
  heading: { fontSize: 20, fontWeight: '800', lineHeight: 27 },
  label: { fontSize: 13, fontWeight: '700' },
  body: { fontSize: 14, lineHeight: 22 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  storyInput: { minHeight: 128 },
  photo: { width: '100%', aspectRatio: 1.25, borderRadius: 16, resizeMode: 'cover' },
  button: { minHeight: 50, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12, width: '100%' },
  buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  disabled: { opacity: 0.5 },
  message: { padding: 14, borderRadius: 14, fontSize: 14, lineHeight: 22 },
  consent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  badge: { fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },
  section: { gap: 8 },
  linkRow: { alignItems: 'flex-start', borderBottomWidth: 1, paddingVertical: 8 },
});
