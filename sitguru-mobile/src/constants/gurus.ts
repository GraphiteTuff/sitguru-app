export type GuruBookingStatus =
  | 'not_listed'
  | 'listed_only'
  | 'requestable'
  | 'bookable';

export type GuruRow = {
  id: string;
  name: string;
  role: string;
  profile_completed: boolean;
  is_active: boolean;
  booking_status: GuruBookingStatus;
  rate: number;
  service_area: string;
  service_city: string;
  service_state: string;
  service_zip: string;
  service_area_enabled: boolean;
  rating: string;
  reviews: string;
  services: string[];
  badges: string[];
};

export type GuruBookingStatusOption = {
  value: GuruBookingStatus;
  label: string;
  description: string;
};

export type GuruPublicCta = {
  disabled: boolean;
  label: string;
  intent: 'book' | 'request' | 'quote' | 'closed' | 'hidden';
};

export const guruBookingStatusOptions: GuruBookingStatusOption[] = [
  {
    value: 'listed_only',
    label: 'Listed only',
    description: 'Visible publicly, but not accepting booking requests.',
  },
  {
    value: 'requestable',
    label: 'Requestable',
    description: 'Pet Parents can send a booking request or quote request.',
  },
  {
    value: 'bookable',
    label: 'Bookable',
    description: 'Pet Parents can start a booking from the public profile.',
  },
  {
    value: 'not_listed',
    label: 'Not listed',
    description: 'Hidden from public search and result surfaces.',
  },
];

export const guruDirectory: GuruRow[] = [];

export function getGuruBookingStatusLabel(status: GuruBookingStatus) {
  return (
    guruBookingStatusOptions.find((option) => option.value === status)?.label ??
    status
  );
}

export function isGuruBookingEligible(guru: GuruRow) {
  return (
    guru.profile_completed &&
    guru.is_active &&
    (guru.booking_status === 'requestable' ||
      guru.booking_status === 'bookable')
  );
}

export function isGuruPubliclyListed(guru: GuruRow) {
  return (
    guru.profile_completed &&
    guru.is_active &&
    guru.service_area_enabled &&
    guru.booking_status !== 'not_listed'
  );
}

export function formatGuruLocation(guru: GuruRow) {
  if (guru.service_area.trim()) {
    return guru.service_area;
  }

  return `${guru.service_city}, ${guru.service_state} ${guru.service_zip}`;
}

export function formatGuruRate(guru: GuruRow) {
  if (guru.rate > 0) {
    return `$${Math.round(guru.rate)} starting rate`;
  }

  return 'Custom quote';
}

export function getGuruPublicCta(guru: GuruRow): GuruPublicCta {
  if (guru.booking_status === 'bookable') {
    return {
      disabled: false,
      intent: 'book',
      label: 'Book This Guru',
    };
  }

  if (guru.booking_status === 'requestable') {
    return {
      disabled: false,
      intent: guru.rate > 0 ? 'request' : 'quote',
      label: guru.rate > 0 ? 'Request Booking' : 'Request Quote',
    };
  }

  if (guru.booking_status === 'listed_only') {
    return {
      disabled: true,
      intent: 'closed',
      label: 'Currently not accepting requests',
    };
  }

  return {
    disabled: true,
    intent: 'hidden',
    label: 'Not listed',
  };
}
