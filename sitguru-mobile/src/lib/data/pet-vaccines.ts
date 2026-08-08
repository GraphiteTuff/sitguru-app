/**
 * Structured vaccine flags stored inside `medical_notes` so we do not need
 * a new migration. Format is opaque to Gurus as plain text plus a marker block.
 */

export type VaccineKey = 'rabies' | 'dhpp' | 'bordetella';

export type VaccineRecord = {
  enabled: boolean;
  date: string;
};

export type VaccinePanelState = Record<VaccineKey, VaccineRecord>;

export const VACCINE_OPTIONS: Array<{
  key: VaccineKey;
  label: string;
  helper: string;
}> = [
  { key: 'rabies', label: 'Rabies', helper: 'Core shot for most dogs & cats' },
  { key: 'dhpp', label: 'DHPP', helper: 'Distemper / hep / parvo / parainfluenza' },
  {
    key: 'bordetella',
    label: 'Bordetella',
    helper: 'Kennel cough — useful for boarding & daycare',
  },
];

export const EMPTY_VACCINE_PANEL: VaccinePanelState = {
  rabies: { enabled: false, date: '' },
  dhpp: { enabled: false, date: '' },
  bordetella: { enabled: false, date: '' },
};

const START = '[[sitguru:vaccines]]';
const END = '[[/sitguru:vaccines]]';

export function emptyVaccinePanel(): VaccinePanelState {
  return {
    rabies: { enabled: false, date: '' },
    dhpp: { enabled: false, date: '' },
    bordetella: { enabled: false, date: '' },
  };
}

export function parseVaccinePanel(medicalNotes: string | null | undefined): {
  panel: VaccinePanelState;
  remainder: string;
} {
  const source = medicalNotes || '';
  const start = source.indexOf(START);
  const end = source.indexOf(END);

  if (start === -1 || end === -1 || end <= start) {
    return { panel: emptyVaccinePanel(), remainder: source.trim() };
  }

  const jsonSlice = source.slice(start + START.length, end).trim();
  const remainder = `${source.slice(0, start)}${source.slice(end + END.length)}`
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  try {
    const parsed = JSON.parse(jsonSlice) as Partial<VaccinePanelState>;
    return {
      panel: {
        rabies: normalizeRecord(parsed.rabies),
        dhpp: normalizeRecord(parsed.dhpp),
        bordetella: normalizeRecord(parsed.bordetella),
      },
      remainder,
    };
  } catch {
    return { panel: emptyVaccinePanel(), remainder: source.trim() };
  }
}

function normalizeRecord(value: unknown): VaccineRecord {
  if (!value || typeof value !== 'object') {
    return { enabled: false, date: '' };
  }

  const record = value as { enabled?: unknown; date?: unknown };
  return {
    enabled: Boolean(record.enabled),
    date: typeof record.date === 'string' ? record.date.trim() : '',
  };
}

export function serializeVaccinePanel(
  panel: VaccinePanelState,
  remainder = '',
): string {
  const block = `${START}${JSON.stringify({
    rabies: panel.rabies,
    dhpp: panel.dhpp,
    bordetella: panel.bordetella,
  })}${END}`;

  const cleanRemainder = remainder.trim();
  return cleanRemainder ? `${block}\n${cleanRemainder}` : block;
}

export function vaccineSummary(panel: VaccinePanelState): string {
  const active = VACCINE_OPTIONS.filter((item) => panel[item.key].enabled).map(
    (item) => {
      const date = panel[item.key].date.trim();
      return date ? `${item.label} (${date})` : item.label;
    },
  );

  return active.length ? active.join(' · ') : 'No vaccines logged yet';
}

export function hasAnyVaccine(panel: VaccinePanelState) {
  return VACCINE_OPTIONS.some((item) => panel[item.key].enabled);
}
