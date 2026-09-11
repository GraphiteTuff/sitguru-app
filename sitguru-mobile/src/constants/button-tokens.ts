/**
 * Shared SitGuru control metrics. Buttons and tabs should size from these
 * tokens, not from label length.
 */
export const SitGuruAccent = {
  primary: '#2FA36B',
  pressed: '#258B59',
  soft: '#E8F5ED',
  selectedPill: '#DDF1E4',
  border: '#CFE5D7',
  text: '#214C35',
} as const;

export const ButtonMetrics = {
  ctaHeight: 54,
  ctaCompactHeight: 48,
  ctaRadius: 16,
  ctaPadX: 20,
  ctaFont: 17,

  chipHeight: 44,
  chipRadius: 999,
  chipPadX: 16,
  chipFont: 14,
  chipIcon: 18,
  chipGap: 8,

  iconButton: 48,
  iconGlyph: 22,

  tabHeight: 68,
  tabIcon: 24,
  tabLabel: 12,
  tabLabelWeight: '700',
  tabGap: 4,
  tabPillWidth: 56,
  tabPillHeight: 48,
  tabTouch: 48,
} as const;
