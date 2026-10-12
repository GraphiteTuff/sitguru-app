export const HOME_HERO_VIDEO_LABELS = [
  'SitGuru Howl-ween',
  'Dog Walking',
  'Drop-In Visits',
  'Join the SitGuru Community',
] as const;

export const HOME_HERO_CLIP_SETTINGS = [
  {
    label: HOME_HERO_VIDEO_LABELS[0],
    playbackRate: 1,
    hasAudioControl: true,
    framing: 'howlween',
  },
  {
    label: HOME_HERO_VIDEO_LABELS[1],
    playbackRate: 1,
    hasAudioControl: false,
    framing: 'standard',
  },
  {
    label: HOME_HERO_VIDEO_LABELS[2],
    playbackRate: 1,
    hasAudioControl: false,
    framing: 'standard',
  },
  {
    label: HOME_HERO_VIDEO_LABELS[3],
    playbackRate: 0.9,
    hasAudioControl: false,
    framing: 'standard',
  },
] as const;

export type HomeHeroClipSettings = (typeof HOME_HERO_CLIP_SETTINGS)[number];
