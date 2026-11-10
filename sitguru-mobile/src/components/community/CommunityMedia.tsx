import { Image, StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

type Props = { uri: string; mime?: string; label: string; headers?: Record<string, string> };

function CommunityVideo({ uri, headers }: Props) {
  const player = useVideoPlayer({ uri, headers }, instance => { instance.loop = false; });
  return <View style={styles.videoFrame}><VideoView player={player} style={styles.media} nativeControls contentFit="contain" fullscreenOptions={{ enable: true }} /></View>;
}

/** Media never autoplays. Private sources carry the existing account's Bearer token. */
export default function CommunityMedia(props: Props) {
  if (props.mime?.startsWith('video/')) return <CommunityVideo {...props} />;
  return <Image source={{ uri: props.uri, headers: props.headers }} style={styles.media} accessibilityLabel={props.label} />;
}

const styles = StyleSheet.create({
  media: { width: '100%', aspectRatio: 1.15, borderRadius: 18, resizeMode: 'cover' },
  videoFrame: { width: '100%', backgroundColor: '#081A13', borderRadius: 18, overflow: 'hidden' },
});
