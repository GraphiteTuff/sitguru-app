const GENERIC_NAMES = new Set([
  'a',
  'admin',
  'ambassador',
  'client',
  'customer',
  'friend',
  'guru',
  'local',
  'member',
  'owner',
  'parent',
  'pet',
  'sitter',
  'sitguru',
  'support',
  'there',
  'user',
  'you',
]);

const GENERIC_PHRASES = [
  'a customer',
  'local guru',
  'pet care guru',
  'pet parent',
  'sitguru member',
  'sitguru user',
  'this guru',
  'this pet parent',
  'your guru',
];

export type PersonNameInput = {
  first_name?: string | null;
  given_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  name?: string | null;
  email?: string | null;
};

function clean(value: unknown) {
  return String(value || '')
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleCaseWord(value: string) {
  if (!value) return '';
  if (value === value.toUpperCase() && value.length <= 3) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function isGenericPhrase(value: string) {
  const lowered = value.toLowerCase();
  return GENERIC_PHRASES.includes(lowered) || GENERIC_NAMES.has(lowered);
}

function looksLikeHandle(value: string) {
  if (value.includes('@')) return true;
  if (/\d{2,}/.test(value)) return true;
  if (value.length > 16 && !/\s/.test(value)) return true;
  return false;
}

function usableGivenName(value: unknown) {
  const text = clean(value);
  if (!text || isGenericPhrase(text) || looksLikeHandle(text)) return '';
  const first = text.split(/[\s.-]+/).filter(Boolean)[0] || '';
  if (!first || isGenericPhrase(first) || looksLikeHandle(first)) return '';
  if (!/^[A-Za-z][A-Za-z'.-]*$/.test(first)) return '';
  return titleCaseWord(first.replace(/[.,!?]+$/g, ''));
}

function firstFromEmail(email?: string | null) {
  const local = clean(email).split('@')[0] || '';
  if (!local || looksLikeHandle(local)) return '';
  const part = local.split(/[._-]+/).filter(Boolean)[0] || '';
  return usableGivenName(part);
}

export function firstNameFromPerson(
  input?: PersonNameInput | string | null,
  fallback = 'there',
) {
  if (typeof input === 'string' || input == null) {
    return usableGivenName(input) || fallback;
  }

  return (
    usableGivenName(input.first_name) ||
    usableGivenName(input.given_name) ||
    usableGivenName(input.full_name) ||
    usableGivenName(input.display_name) ||
    usableGivenName(input.name) ||
    firstFromEmail(input.email) ||
    fallback
  );
}

export function personalizedGreeting(
  prefix: string,
  input?: PersonNameInput | string | null,
) {
  const first = firstNameFromPerson(input, '');
  return first ? `${prefix}, ${first}` : `${prefix} there`;
}
