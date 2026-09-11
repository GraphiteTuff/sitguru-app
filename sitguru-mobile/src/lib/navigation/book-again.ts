import { firstNameFromPerson } from '@/lib/people/first-name';

export type BookAgainTarget = {
  guruId?: string | null;
  guruSlug?: string | null;
  petId?: string | null;
  serviceType?: string | null;
};

type BookAgainRouter = {
  push: (href: {
    pathname: '/request-booking' | '/find-care';
    params?: Record<string, string>;
  }) => void;
};

export function firstNameFromDisplay(name?: string | null) {
  return firstNameFromPerson(name, 'this Guru');
}

export function bookAgainLabel(guruName?: string | null) {
  return `Book again with ${firstNameFromDisplay(guruName)}`;
}

export function bookAgainParams(target: BookAgainTarget) {
  const params: Record<string, string> = {};

  if (target.guruId) params.guruId = String(target.guruId);
  if (target.guruSlug) params.guruSlug = String(target.guruSlug);
  if (target.petId) params.petId = String(target.petId);
  if (target.serviceType) params.serviceType = String(target.serviceType);

  return params;
}

export function canBookAgain(target: BookAgainTarget) {
  return Boolean(target.guruId || target.guruSlug);
}

export function pushBookAgain(router: BookAgainRouter, target: BookAgainTarget) {
  const params = bookAgainParams(target);

  if (!canBookAgain(target)) {
    router.push({ pathname: '/find-care' });
    return;
  }

  router.push({ pathname: '/request-booking', params });
}
