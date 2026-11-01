type AudioSessionType =
  | "auto"
  | "playback"
  | "transient"
  | "transient-solo"
  | "ambient";

type NavigatorWithAudioSession = Navigator & {
  audioSession?: {
    type?: AudioSessionType;
  };
};

export function setAmbientAudioSession() {
  if (typeof navigator === "undefined") return;

  const session = (navigator as NavigatorWithAudioSession).audioSession;
  if (!session) return;

  try {
    session.type = "ambient";
  } catch {
    // Safari-only API. Other browsers ignore this.
  }
}

export function canPlayPageSound() {
  if (typeof document === "undefined") return false;
  if (document.visibilityState !== "visible") return false;

  const activation = navigator.userActivation;
  if (activation && !activation.hasBeenActive) return false;

  return true;
}

export function prepareSilentBackgroundVideo(video: HTMLVideoElement) {
  video.muted = true;
  video.defaultMuted = true;
  video.volume = 0;
  video.playsInline = true;
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.setAttribute("x-webkit-airplay", "deny");
  video.disableRemotePlayback = true;
  video.disablePictureInPicture = true;
}
