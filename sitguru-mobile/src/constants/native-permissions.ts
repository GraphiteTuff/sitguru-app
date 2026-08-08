/**
 * Canonical native permission dialog copy for SitGuru.
 * Keep in sync with app.json plugin / infoPlist / AndroidManifest entries.
 */

export const SITGURU_BRAND_GREEN = '#0D5C3A';

export const NativePermissionCopy = {
  locationWhenInUse:
    'Allow SitGuru to track live care routes only during active booked visits.',
  locationAlways:
    'Allow SitGuru to continue sharing your care route in the background during an active visit.',
  locationAlwaysAndWhenInUse:
    'Allow SitGuru to share live care routes with Pet Parents during active booked visits, including when the app is in the background.',
  camera:
    'Allow SitGuru to take care photos and scan vaccine papers for Pet Passports.',
  photos:
    'Allow SitGuru to attach photos in chat, PawReports, and Pet Passports.',
  microphone:
    'Allow SitGuru to record voice notes for Pet Parents and Gurus during care handoffs.',
  faceId:
    'Allow SitGuru to use Face ID for faster, secure access to your account.',
  notifications:
    'SitGuru sends booking requests, live walk updates, chat activity, and payment alerts. You can refine these in Notification settings.',
} as const;

export type NativePermissionKey = keyof typeof NativePermissionCopy;
