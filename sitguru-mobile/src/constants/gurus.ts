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

export const guruDirectory: GuruRow[] = [
  {
    id: 'guru-001',
    name: 'Local Guru',
    role: 'Pet Care Guru',
    profile_completed: true,
    is_active: true,
    booking_status: 'bookable',
    rate: 28,
    service_area: 'Upper Bucks and nearby neighborhoods',
    service_city: 'Quakertown',
    service_state: 'PA',
    service_zip: '18951',
    service_area_enabled: true,
    rating: 'Ready',
    reviews: 'New profile',
    services: ['Dog Walking', 'Drop-In Visits', 'Pet Sitting'],
    badges: ['Profile', 'Messages', 'PawReport'],
  },
  {
    id: 'guru-002',
    name: 'Trusted Care Provider',
    role: 'Independent Pet Guru',
    profile_completed: true,
    is_active: true,
    booking_status: 'requestable',
    rate: 0,
    service_area: 'Bethlehem, Allentown, and Lehigh Valley',
    service_city: 'Bethlehem',
    service_state: 'PA',
    service_zip: '18018',
    service_area_enabled: true,
    rating: 'Custom quote',
    reviews: 'Care details',
    services: ['Boarding', 'House Sitting', 'Doggy Day Care'],
    badges: ['Care Notes', 'Pet Passports', 'Visit Updates'],
  },
  {
    id: 'guru-003',
    name: 'Neighborhood Guru',
    role: 'Local Pet Care',
    profile_completed: true,
    is_active: true,
    booking_status: 'listed_only',
    rate: 24,
    service_area: 'Center City and nearby ZIP codes',
    service_city: 'Philadelphia',
    service_state: 'PA',
    service_zip: '19103',
    service_area_enabled: true,
    rating: 'Listed',
    reviews: 'Matched by location',
    services: ['Pet Sitting', 'Training Support', 'Drop-In Visits'],
    badges: ['Local', 'Trusted', 'Easy Booking'],
  },
  {
    id: 'guru-004',
    name: 'Paused Guru',
    role: 'Pet Care Guru',
    profile_completed: true,
    is_active: true,
    booking_status: 'not_listed',
    rate: 32,
    service_area: 'Camden and nearby towns',
    service_city: 'Camden',
    service_state: 'NJ',
    service_zip: '08030',
    service_area_enabled: true,
    rating: 'Paused',
    reviews: 'Hidden from search',
    services: ['Dog Walking', 'Drop-In Visits'],
    badges: ['Hidden', 'Admin only'],
  },
];

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
