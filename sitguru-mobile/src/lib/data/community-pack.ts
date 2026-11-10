import type { CommunityItem } from './community-studio';

export function nativeCommunityWeek(now = new Date()) {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const monday = new Date(`${day}T12:00:00Z`);
  monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7);
  return monday.toISOString().slice(0, 10);
}

export function nativePackSections(items: CommunityItem[], now = new Date()) {
  const week = nativeCommunityWeek(now);
  const featured = items.find(item => item.kind === 'pet_of_week' && item.weekOf === week && item.status === 'published');
  return { featured, gallery: items.filter(item => item.status === 'published' && item.id !== featured?.id) };
}
