/**
 * Social Intelligence styling mirrors lib/portal/desk-ui.ts (Manager's Desk).
 * Shared brand language across web, Admin, Intern and Expo screens.
 * Keep these colors aligned when the Manager Portal design tokens change.
 */
export const SocialDeskColors = {
  page: '#F4F7FB',
  navy: '#0F2744',
  evergreen: '#0D5C3A',
  primary: '#2563EB',
  primaryHover: '#1D4ED8',
  white: '#FFFFFF',
  textSoft: '#475569',
  muted: '#64748B',
  border: '#E2E8F0',
  paleBlue: '#EFF6FF',
  softBlue: '#DBEAFE',
  control: '#EEF2F6',
  lightSurface: '#F8FAFC',
  red: '#BE123C',
} as const;

export const SocialDeskKpiTones = {
  views: { surface: '#F5F3FF', border: '#EDE9FE', value: '#6D28D9' },
  visits: { surface: '#EFF6FF', border: '#DBEAFE', value: '#1D4ED8' },
  clicks: { surface: '#FFF4ED', border: '#FFEDD5', value: '#C2410C' },
  signups: { surface: '#F0FDF4', border: '#DCFCE7', value: '#166534' },
  bookings: { surface: '#F0FDFA', border: '#CCFBF1', value: '#0F766E' },
  revenue: { surface: '#F8FAFC', border: '#E2E8F0', value: '#0F2744' },
} as const;
