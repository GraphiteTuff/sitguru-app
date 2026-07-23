import { router, type Href } from 'expo-router';
import {
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  Bell,
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Gift,
  Headphones,
  Home,
  Megaphone,
  MessageCircle,
  Plus,
  QrCode,
  Search,
  ShieldCheck,
  Target,
  Timer,
  UserPlus,
  UserRound,
  Users,
  Wallet,
  X
} from 'lucide-react-native';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type TextStyle,
} from 'react-native';

import { SitGuruIcon } from '@/components/SitGuruIcon';
import SitGuruScreen from '@/components/SitGuruScreen';
import { getAppTheme } from '@/constants/theme';
import {
  setThemePreference,
  useThemePreference,
  type SitGuruThemePreference,
} from '@/hooks/use-color-scheme';
import { useThemeMode } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { resolveSupabaseStorageUrl } from '@/lib/storage';

type CommandView = 'today' | 'calendar' | 'activities' | 'marketing' | 'leads' | 'rewards';
type ComposerMode = 'activity' | 'marketing_effort' | 'lead' | null;
type Theme = ReturnType<typeof getAppTheme>;

type AmbassadorIdentity = {
  id: string;
  full_name: string | null;
  referral_code: string | null;
};

type ActivityTemplate = {
  id: string;
  title: string | null;
  description: string | null;
  category: string | null;
  activity_type: string | null;
  engagement_mode: string | null;
  default_duration_minutes: number | null;
  default_target_audience: string | null;
};

type ActivityRecord = {
  id: string;
  title: string | null;
  description: string | null;
  category: string | null;
  activity_type: string | null;
  engagement_mode: string | null;
  status: string | null;
  activity_date: string | null;
  starts_at: string | null;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  event_name: string | null;
  venue_name: string | null;
  organization_name: string | null;
  city: string | null;
  state: string | null;
  target_audience: string | null;
  goal: string | null;
  actual_contacts: number | null;
  conversations: number | null;
  qr_scans: number | null;
  referral_links_shared: number | null;
  materials_distributed: number | null;
  leads_generated: number | null;
  verified_signups: number | null;
  completed_bookings: number | null;
  outcome_summary: string | null;
  notes: string | null;
  needs_admin_help: boolean | null;
  admin_help_reason: string | null;
};

type MarketingEffort = {
  id: string;
  effort_date: string | null;
  effort_type: string | null;
  platform: string | null;
  campaign_name: string | null;
  target_audience: string | null;
  target_location: string | null;
  title: string | null;
  description: string | null;
  content_url: string | null;
  call_to_action: string | null;
  minutes_spent: number | null;
  spend_amount: number | null;
  impressions: number | null;
  reach: number | null;
  engagements: number | null;
  clicks: number | null;
  messages_received: number | null;
  qr_scans: number | null;
  materials_distributed: number | null;
  leads_generated: number | null;
  verified_signups: number | null;
  completed_bookings: number | null;
  status: string | null;
  outcome_summary: string | null;
  notes: string | null;
  needs_admin_help: boolean | null;
};

type LeadRecord = {
  id: string;
  lead_type: string | null;
  lead_status: string | null;
  lead_temperature: string | null;
  priority: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  business_name: string | null;
  organization_name: string | null;
  website_url: string | null;
  social_handle: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  source_type: string | null;
  source_detail: string | null;
  campaign_name: string | null;
  target_audience: string | null;
  consent_to_contact: boolean | null;
  preferred_contact_method: string | null;
  next_follow_up: string | null;
  next_action: string | null;
  notes: string | null;
  admin_assistance_requested: boolean | null;
  admin_assistance_reason: string | null;
};

type CommandSummary = {
  scheduledActivities: number;
  completedActivities: number;
  totalHours: number;
  contacts: number;
  conversations: number;
  qrScans: number;
  materialsDistributed: number;
  verifiedSignups: number;
  completedBookings: number;
  generatedLeads: number;
  convertedLeads: number;
  leadsNeedingAdmin: number;
  marketingEfforts: number;
};

type CommandCenterData = {
  templates: ActivityTemplate[];
  activities: ActivityRecord[];
  marketingEfforts: MarketingEffort[];
  leads: LeadRecord[];
  summary: CommandSummary;
  warning: string;
};

type CommandResponse = {
  success: boolean;
  error?: string;
  details?: string;
  ambassador?: AmbassadorIdentity;
  commandCenter?: CommandCenterData;
  message?: string;
};

type Feedback = {
  tone: 'success' | 'error' | 'info';
  message: string;
} | null;

type AmbassadorPayoutProvider =
  | 'stripe'
  | 'paypal'
  | 'venmo'
  | 'set_up_later';

type AmbassadorPayoutAccount = {
  provider?: 'stripe' | 'paypal' | 'venmo' | null;
  providerAccountId?: string | null;
  providerEmail?: string | null;
  providerPhone?: string | null;
  onboardingStatus?: string | null;
  accountStatus?: string | null;
  payoutsEnabled?: boolean;
};

type AmbassadorPayoutSetup = {
  selectedProvider?: AmbassadorPayoutProvider;
  setupComplete?: boolean;
  readyAccount?: AmbassadorPayoutAccount | null;
};

type AmbassadorPayoutResponse = {
  success: boolean;
  error?: string;
  setup?: AmbassadorPayoutSetup;
};

type ActivityForm = {
  title: string;
  activity_date: string;
  activity_type: string;
  engagement_mode: string;
  category: string;
  status: string;
  estimated_minutes: string;
  actual_minutes: string;
  target_audience: string;
  organization_name: string;
  venue_name: string;
  city: string;
  state: string;
  goal: string;
  actual_contacts: string;
  conversations: string;
  qr_scans: string;
  materials_distributed: string;
  leads_generated: string;
  verified_signups: string;
  completed_bookings: string;
  outcome_summary: string;
  notes: string;
  needs_admin_help: boolean;
  admin_help_reason: string;
};

type LeadForm = {
  lead_type: string;
  lead_status: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  business_name: string;
  organization_name: string;
  city: string;
  state: string;
  zip_code: string;
  source_type: string;
  source_detail: string;
  target_audience: string;
  next_follow_up: string;
  next_action: string;
  notes: string;
  consent_to_contact: boolean;
  admin_assistance_requested: boolean;
  admin_assistance_reason: string;
};

type MarketingForm = {
  title: string;
  effort_date: string;
  effort_type: string;
  platform: string;
  campaign_name: string;
  target_audience: string;
  target_location: string;
  description: string;
  content_url: string;
  call_to_action: string;
  minutes_spent: string;
  spend_amount: string;
  reach: string;
  engagements: string;
  clicks: string;
  qr_scans: string;
  materials_distributed: string;
  leads_generated: string;
  verified_signups: string;
  completed_bookings: string;
  status: string;
  outcome_summary: string;
  notes: string;
  needs_admin_help: boolean;
};

const Fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extraBold: 'PlusJakartaSans_800ExtraBold',
} as const;

const API_BASE_CANDIDATES = Array.from(
  new Set(
    [
      process.env.EXPO_PUBLIC_SITGURU_API_URL,
      Platform.OS === 'web' ? 'http://localhost:3000' : '',
      Platform.OS === 'web' ? 'http://127.0.0.1:3000' : '',
      process.env.EXPO_PUBLIC_SITGURU_WEB_URL,
      'https://www.sitguru.com',
    ]
      .map((value) => (value || '').trim().replace(/\/+$/, ''))
      .filter(Boolean),
  ),
);

const THEME_OPTIONS: Array<{
  icon: 'sun' | 'moon';
  label: string;
  value: SitGuruThemePreference;
}> = [
  { icon: 'sun', label: 'Light', value: 'light' },
  { icon: 'moon', label: 'Dark', value: 'dark' },
];

async function readCommandResponse(response: Response): Promise<CommandResponse> {
  const raw = await response.text();

  if (!raw.trim()) {
    return {
      success: false,
      error: `SitGuru returned an empty response (${response.status}).`,
    };
  }

  try {
    return JSON.parse(raw) as CommandResponse;
  } catch {
    return {
      success: false,
      error:
        response.status === 404
          ? 'The Ambassador Portal API is not available at this address yet.'
          : `SitGuru returned an unreadable response (${response.status}).`,
    };
  }
}

async function readPayoutResponse(
  response: Response,
): Promise<AmbassadorPayoutResponse> {
  const raw = await response.text();

  if (!raw.trim()) {
    return {
      success: false,
      error: `SitGuru returned an empty payout response (${response.status}).`,
    };
  }

  try {
    return JSON.parse(raw) as AmbassadorPayoutResponse;
  } catch {
    return {
      success: false,
      error:
        response.status === 404
          ? 'Reward payout setup is not available at this address yet.'
          : `SitGuru returned an unreadable payout response (${response.status}).`,
    };
  }
}

function payoutProviderLabel(
  provider?: AmbassadorPayoutProvider | null,
) {
  if (provider === 'stripe') return 'Bank or debit card';
  if (provider === 'paypal') return 'PayPal';
  if (provider === 'venmo') return 'Venmo';
  return 'Not picked yet';
}

function payoutProviderShortLabel(
  provider?: AmbassadorPayoutProvider | null,
) {
  if (provider === 'stripe') return 'Bank or card';
  if (provider === 'paypal') return 'PayPal';
  if (provider === 'venmo') return 'Venmo';
  return 'Pick a payout';
}

function payoutDestinationLabel(account?: AmbassadorPayoutAccount | null) {
  if (!account) return 'Choose bank or card, PayPal, or Venmo';

  return (
    account.providerEmail ||
    account.providerPhone ||
    account.providerAccountId ||
    (account.provider === 'stripe'
      ? 'Connected securely with Stripe'
      : 'Connected account')
  );
}

const activityTypes = [
  'Campus Outreach',
  'Veterinary Practice Visit',
  'Pet Business Outreach',
  'Community Event',
  'Expo or Vendor Table',
  'Rescue or Adoption Event',
  'Professional Networking',
  'Partnership Meeting',
  'Social Media',
  'Email Outreach',
  'Phone Outreach',
  'Flyer or QR Distribution',
  'Lead Follow-Up',
  'Training',
  'Headquarters Assignment',
  'Weekly Review',
  'Other',
];

const engagementModes = [
  'Face-to-Face',
  'Event or Expo',
  'Business Visit',
  'Campus',
  'Community',
  'Phone',
  'Email',
  'Social Media',
  'Virtual Meeting',
  'Independent Work',
];

const categories = [
  'Outreach',
  'Event',
  'Marketing',
  'Lead Follow-Up',
  'Partnership',
  'Training',
  'Headquarters',
  'Administration',
];

const audiences = [
  'Pet Parents',
  'Future Gurus',
  'Students',
  'Veterinary Professionals',
  'Pet Businesses',
  'Trainers and Groomers',
  'Rescues and Shelters',
  'Military and Veteran Community',
  'Community Organizations',
  'General Public',
];

const leadTypes = [
  'Pet Parent Lead',
  'Guru Lead',
  'Ambassador Lead',
  'Partner Lead',
  'Pet Business Lead',
  'Veterinary Practice Lead',
  'Rescue or Shelter Lead',
  'Campus or Student Organization',
  'Community Organization',
  'General Contact',
];

const marketingTypes = [
  'Social Post',
  'Story or Reel',
  'Email Campaign',
  'Community Group Post',
  'Business Flyer',
  'Campus Promotion',
  'Event Promotion',
  'Professional Outreach',
  'Partnership Campaign',
  'Printed Materials',
  'Other',
];

const platforms = [
  'Facebook',
  'Instagram',
  'TikTok',
  'X',
  'YouTube',
  'LinkedIn',
  'Email',
  'Website',
  'Printed Materials',
  'In Person',
  'Other',
];

const emptySummary: CommandSummary = {
  scheduledActivities: 0,
  completedActivities: 0,
  totalHours: 0,
  contacts: 0,
  conversations: 0,
  qrScans: 0,
  materialsDistributed: 0,
  verifiedSignups: 0,
  completedBookings: 0,
  generatedLeads: 0,
  convertedLeads: 0,
  leadsNeedingAdmin: 0,
  marketingEfforts: 0,
};

function todayValue() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(value?: string | null) {
  if (!value) return 'Not scheduled';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function titleCase(value?: string | null) {
  return (value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function numberValue(value: string) {
  const parsed = Number(value);
  return value.trim() && Number.isFinite(parsed) ? parsed : null;
}

function newActivityForm(date = todayValue()): ActivityForm {
  return {
    title: '',
    activity_date: date,
    activity_type: 'Community Event',
    engagement_mode: 'Face-to-Face',
    category: 'Outreach',
    status: 'planned',
    estimated_minutes: '60',
    actual_minutes: '',
    target_audience: 'Pet Parents',
    organization_name: '',
    venue_name: '',
    city: '',
    state: '',
    goal: '',
    actual_contacts: '',
    conversations: '',
    qr_scans: '',
    materials_distributed: '',
    leads_generated: '',
    verified_signups: '',
    completed_bookings: '',
    outcome_summary: '',
    notes: '',
    needs_admin_help: false,
    admin_help_reason: '',
  };
}

function newLeadForm(): LeadForm {
  return {
    lead_type: 'Pet Parent Lead',
    lead_status: 'new',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    business_name: '',
    organization_name: '',
    city: '',
    state: '',
    zip_code: '',
    source_type: 'Face-to-Face',
    source_detail: '',
    target_audience: 'Pet Parents',
    next_follow_up: addDays(todayValue(), 1),
    next_action: '',
    notes: '',
    consent_to_contact: true,
    admin_assistance_requested: false,
    admin_assistance_reason: '',
  };
}

function newMarketingForm(): MarketingForm {
  return {
    title: '',
    effort_date: todayValue(),
    effort_type: 'Social Post',
    platform: 'Instagram',
    campaign_name: '',
    target_audience: 'Pet Parents',
    target_location: '',
    description: '',
    content_url: '',
    call_to_action: '',
    minutes_spent: '15',
    spend_amount: '',
    reach: '',
    engagements: '',
    clicks: '',
    qr_scans: '',
    materials_distributed: '',
    leads_generated: '',
    verified_signups: '',
    completed_bookings: '',
    status: 'planned',
    outcome_summary: '',
    notes: '',
    needs_admin_help: false,
  };
}

function Button({
  label,
  onPress,
  styles,
  theme,
  icon,
  primary = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  theme: Theme;
  icon?: ReactNode;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.buttonPrimary : styles.buttonSecondary,
        pressed ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}>
      {icon}
      <Text
        style={[
          styles.buttonText,
          primary ? styles.buttonTextPrimary : { color: theme.colors.primary },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ChipRow({
  value,
  values,
  onChange,
  styles,
}: {
  value: string;
  values: string[];
  onChange: (value: string) => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}>
      {values.map((item) => {
        const active = item === value;
        return (
          <Pressable
            key={item}
            onPress={() => onChange(item)}
            style={[styles.chip, active ? styles.chipActive : null]}>
            <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>
              {titleCase(item)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  styles,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  required = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  styles: ReturnType<typeof createStyles>;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric' | 'url';
  multiline?: boolean;
  required?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? ' *' : ''}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={styles.placeholder.color}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' || keyboardType === 'url' ? 'none' : 'sentences'}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[styles.input, multiline ? styles.inputMultiline : null]}
      />
    </View>
  );
}

function SwitchField({
  label,
  detail,
  value,
  onChange,
  styles,
  theme,
}: {
  label: string;
  detail: string;
  value: boolean;
  onChange: (value: boolean) => void;
  styles: ReturnType<typeof createStyles>;
  theme: Theme;
}) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchCopy}>
        <Text style={styles.switchLabel}>{label}</Text>
        <Text style={styles.switchDetail}>{detail}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{
          false: theme.colors.toggleTrack,
          true: theme.colors.toggleTrackActive,
        }}
        thumbColor={theme.colors.toggleThumb}
      />
    </View>
  );
}

function StatCard({
  label,
  value,
  detail,
  icon,
  onPress,
  styles,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  onPress?: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const content = (
    <>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statDetail}>{detail}</Text>
    </>
  );

  if (!onPress) {
    return <View style={styles.statCard}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityLabel={`Open ${label}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.statCard,
        pressed ? styles.pressed : null,
      ]}>
      {content}
    </Pressable>
  );
}

function PortalLinkButton({
  label,
  detail,
  onPress,
  icon,
  styles,
  theme,
}: {
  label: string;
  detail: string;
  onPress: () => void;
  icon: ReactNode;
  styles: ReturnType<typeof createStyles>;
  theme: Theme;
}) {
  return (
    <Pressable
      accessibilityHint={`Opens ${label}`}
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.portalLinkButton,
        pressed ? styles.pressed : null,
      ]}>
      <View style={styles.portalLinkIcon}>{icon}</View>
      <View style={styles.portalLinkCopy}>
        <Text style={styles.portalLinkTitle}>{label}</Text>
        <Text style={styles.portalLinkDetail}>{detail}</Text>
      </View>
      <ChevronRight
        color={theme.colors.primary}
        size={17}
        strokeWidth={2.4}
      />
    </Pressable>
  );
}

function ActivityCard({
  record,
  styles,
  theme,
  busyId,
  onEdit,
  onComplete,
}: {
  record: ActivityRecord;
  styles: ReturnType<typeof createStyles>;
  theme: Theme;
  busyId: string | null;
  onEdit: () => void;
  onComplete: () => void;
}) {
  return (
    <View style={styles.recordCard}>
      <View style={styles.recordTop}>
        <View style={styles.recordCopy}>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{titleCase(record.status || 'planned')}</Text>
            </View>
            <Text style={styles.recordDate}>{formatDate(record.activity_date)}</Text>
          </View>
          <Text style={styles.recordTitle}>{record.title || 'Untitled activity'}</Text>
          <Text style={styles.recordMeta}>
            {titleCase(record.activity_type)} • {titleCase(record.engagement_mode)}
          </Text>
        </View>
        <Pressable onPress={onEdit} style={styles.iconButton}>
          <Target color={theme.colors.primary} size={17} strokeWidth={2.4} />
        </Pressable>
      </View>

      {record.organization_name || record.venue_name || record.city ? (
        <Text style={styles.recordBody}>
          {[record.organization_name, record.venue_name, [record.city, record.state].filter(Boolean).join(', ')]
            .filter(Boolean)
            .join(' • ')}
        </Text>
      ) : null}

      {record.goal ? (
        <Text style={styles.recordBody}>
          <Text style={styles.recordStrong}>Goal: </Text>
          {record.goal}
        </Text>
      ) : null}

      <View style={styles.metricRow}>
        <Text style={styles.metricPill}>
          {record.actual_minutes
            ? `${Math.round((record.actual_minutes / 60) * 10) / 10} hrs`
            : `${record.estimated_minutes || 0} min`}
        </Text>
        <Text style={styles.metricPill}>{record.actual_contacts || 0} contacts</Text>
        <Text style={styles.metricPill}>{record.leads_generated || 0} leads</Text>
        <Text style={styles.metricPill}>{record.qr_scans || 0} scans</Text>
      </View>

      {record.needs_admin_help ? (
        <View style={styles.helpBanner}>
          <Headphones color={theme.colors.warning} size={16} strokeWidth={2.4} />
          <Text style={styles.helpText}>
            Headquarters assistance requested
            {record.admin_help_reason ? `: ${record.admin_help_reason}` : '.'}
          </Text>
        </View>
      ) : null}

      <View style={styles.actionRow}>
        <Button label="Update" onPress={onEdit} styles={styles} theme={theme} />
        {record.status !== 'completed' ? (
          <Button
            label={busyId === record.id ? 'Saving...' : 'Complete'}
            primary
            disabled={busyId === record.id}
            onPress={onComplete}
            styles={styles}
            theme={theme}
            icon={
              busyId === record.id ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Check color="#FFFFFF" size={16} strokeWidth={2.4} />
              )
            }
          />
        ) : null}
      </View>
    </View>
  );
}

function LeadCard({
  record,
  styles,
  theme,
  busyId,
  onEdit,
  onConvert,
}: {
  record: LeadRecord;
  styles: ReturnType<typeof createStyles>;
  theme: Theme;
  busyId: string | null;
  onEdit: () => void;
  onConvert: () => void;
}) {
  const displayName =
    record.full_name ||
    [record.first_name, record.last_name].filter(Boolean).join(' ') ||
    record.business_name ||
    record.organization_name ||
    'Unnamed lead';

  return (
    <View style={styles.recordCard}>
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{titleCase(record.lead_status || 'new')}</Text>
        </View>
        <Text style={styles.recordDate}>{titleCase(record.lead_type)}</Text>
      </View>
      <Text style={styles.recordTitle}>{displayName}</Text>
      {record.email || record.phone ? (
        <Text style={styles.recordMeta}>{[record.email, record.phone].filter(Boolean).join(' • ')}</Text>
      ) : null}
      <Text style={styles.recordBody}>
        Source: {titleCase(record.source_type || 'Ambassador outreach')}
        {record.source_detail ? ` • ${record.source_detail}` : ''}
      </Text>
      {record.next_action ? (
        <Text style={styles.recordBody}>
          <Text style={styles.recordStrong}>Next: </Text>
          {record.next_action}
          {record.next_follow_up ? ` by ${formatDate(record.next_follow_up)}` : ''}
        </Text>
      ) : null}
      {record.admin_assistance_requested ? (
        <View style={styles.helpBanner}>
          <Headphones color={theme.colors.warning} size={16} strokeWidth={2.4} />
          <Text style={styles.helpText}>
            Sent to Headquarters for assistance
            {record.admin_assistance_reason ? `: ${record.admin_assistance_reason}` : '.'}
          </Text>
        </View>
      ) : null}
      <View style={styles.actionRow}>
        <Button label="Update" onPress={onEdit} styles={styles} theme={theme} />
        {record.lead_status !== 'converted' ? (
          <Button
            label={busyId === record.id ? 'Saving...' : 'Converted'}
            primary
            disabled={busyId === record.id}
            onPress={onConvert}
            styles={styles}
            theme={theme}
            icon={
              busyId === record.id ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <BadgeCheck color="#FFFFFF" size={16} strokeWidth={2.4} />
              )
            }
          />
        ) : null}
      </View>
    </View>
  );
}

function FormModal({
  visible,
  title,
  subtitle,
  saving,
  styles,
  theme,
  onClose,
  onSave,
  children,
}: {
  visible: boolean;
  title: string;
  subtitle: string;
  saving: boolean;
  styles: ReturnType<typeof createStyles>;
  theme: Theme;
  onClose: () => void;
  onSave: () => void;
  children: ReactNode;
}) {
  if (!visible) {
    return null;
  }

  const modalCard = (
    <View style={styles.modalCard}>
      <View style={styles.modalHeader}>
        <View style={styles.modalHeaderCopy}>
          <Text style={styles.eyebrow}>SitGuru Ambassador Portal</Text>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalSubtitle}>{subtitle}</Text>
        </View>

        <Pressable
          accessibilityLabel="Close form"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.iconButton}>
          <X color={theme.colors.text} size={20} strokeWidth={2.4} />
        </Pressable>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="always"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        style={styles.modalScroll}
        contentContainerStyle={styles.modalContent}>
        {children}
      </ScrollView>

      <View style={styles.modalFooter}>
        <Button
          label="Cancel"
          onPress={onClose}
          styles={styles}
          theme={theme}
        />
        <Button
          label={saving ? 'Saving...' : 'Save'}
          primary
          disabled={saving}
          onPress={onSave}
          styles={styles}
          theme={theme}
          icon={
            saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : undefined
          }
        />
      </View>
    </View>
  );

  // React Native Web's Modal portal can mount an invisible full-screen layer
  // around a simulated-phone preview. Render the web form directly in the
  // route tree instead so the form is visible and cannot leave a dead overlay.
  if (Platform.OS === 'web') {
    return (
      <View pointerEvents="auto" style={styles.webInlineOverlayRoot}>
        <View style={styles.webInlinePhoneSurface}>
          <KeyboardAvoidingView style={styles.modalBackdrop}>
            {modalCard}
          </KeyboardAvoidingView>
        </View>
      </View>
    );
  }

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalBackdrop}>
        {modalCard}
      </KeyboardAvoidingView>
    </Modal>
  );
}

function PhoneStatusBar({
  styles,
}: {
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.statusBar}>
      <Text style={styles.statusTime}>9:41</Text>
      <View style={styles.statusIcons}>
        <View style={styles.signalBars}>
          <View style={[styles.signalBar, { height: 5 }]} />
          <View style={[styles.signalBar, { height: 7 }]} />
          <View style={[styles.signalBar, { height: 9 }]} />
        </View>
        <Text style={styles.wifiText}>⌁</Text>
        <View style={styles.batteryWrap}>
          <View style={styles.batteryBody}>
            <View style={styles.batteryFill} />
          </View>
          <View style={styles.batteryCap} />
        </View>
      </View>
    </View>
  );
}

export default function AmbassadorCommandCenterScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const themeMode = useThemeMode();
  const themePreference = useThemePreference();
  const isDark = themeMode === 'dark';
  const theme = getAppTheme(isDark ? 'dark' : 'light');
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isWebPreview = Platform.OS === 'web';
  const isTablet = Platform.OS !== 'web' && windowWidth >= 768;
  const { session, user, profile, roles, loading: authLoading } = useAuth();

  const [view, setView] = useState<CommandView>('today');
  const [composer, setComposer] = useState<ComposerMode>(null);
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [ambassador, setAmbassador] = useState<AmbassadorIdentity | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayValue());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [activityForm, setActivityForm] = useState<ActivityForm>(newActivityForm());
  const [leadForm, setLeadForm] = useState<LeadForm>(newLeadForm());
  const [marketingForm, setMarketingForm] = useState<MarketingForm>(newMarketingForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [avatarImageFailed, setAvatarImageFailed] = useState(false);
  const [payoutSetup, setPayoutSetup] =
    useState<AmbassadorPayoutSetup | null>(null);
  const [payoutWarning, setPayoutWarning] = useState('');

  const token = session?.access_token || '';
  const hasAmbassadorRole = roles.includes('ambassador');

  const apiFetch = useCallback(
    async (path: string, options?: RequestInit) => {
      const headers = new Headers(options?.headers || {});

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      if (options?.body) {
        headers.set('Content-Type', 'application/json');
      }

      let lastResponse: Response | null = null;

      for (const baseUrl of API_BASE_CANDIDATES) {
        try {
          const response = await fetch(`${baseUrl}${path}`, {
            ...options,
            headers,
          });

          lastResponse = response;

          if (response.status === 404) {
            continue;
          }

          return response;
        } catch {
          // Try the next configured SitGuru API address.
        }
      }

      if (lastResponse) {
        return lastResponse;
      }

      throw new Error(
        Platform.OS === 'web'
          ? 'The Ambassador Portal could not connect to SitGuru. Keep the main SitGuru web server running at http://localhost:3000, then pull down to refresh.'
          : 'The Ambassador Portal could not connect to SitGuru. Check your internet connection and try again.',
      );
    },
    [token],
  );

  const loadData = useCallback(
    async (quiet = false) => {
      if (!token) {
        setLoading(false);
        return;
      }

      quiet ? setRefreshing(true) : setLoading(true);

      try {
        const start = addDays(todayValue(), -45);
        const end = addDays(todayValue(), 120);

        const [commandResponse, payoutResponse] = await Promise.all([
          apiFetch(
            `/api/ambassador/command-center?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
            { method: 'GET', cache: 'no-store' },
          ),
          apiFetch('/api/payouts/setup?role=ambassador', {
            method: 'GET',
            cache: 'no-store',
          }).catch(() => null),
        ]);

        const commandPayload = await readCommandResponse(commandResponse);

        if (
          !commandResponse.ok ||
          !commandPayload.success ||
          !commandPayload.commandCenter
        ) {
          throw new Error(
            commandPayload.error || 'Unable to load the Ambassador Portal.',
          );
        }

        setData(commandPayload.commandCenter);
        setAmbassador(commandPayload.ambassador || null);

        if (payoutResponse) {
          const payoutPayload = await readPayoutResponse(payoutResponse);

          if (payoutResponse.ok && payoutPayload.success) {
            setPayoutSetup(payoutPayload.setup || null);
            setPayoutWarning('');
          } else {
            setPayoutSetup(null);
            setPayoutWarning(
              payoutPayload.error ||
                'Your payout setup could not be loaded right now.',
            );
          }
        } else {
          setPayoutSetup(null);
          setPayoutWarning(
            'Your payout setup could not be loaded right now.',
          );
        }
      } catch {
        // Keep the Portal usable in Expo preview when the local Next.js API
        // is not running. Save failures still show a clear message.
        setFeedback(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [apiFetch, token],
  );

  useEffect(() => {
    if (!authLoading) void loadData();
  }, [authLoading, loadData]);

  const summary = data?.summary || emptySummary;
  const activities = data?.activities || [];
  const leads = data?.leads || [];
  const marketing = data?.marketingEfforts || [];
  const templates = data?.templates || [];
  const payoutReady = Boolean(payoutSetup?.setupComplete);
  const payoutProvider =
    payoutSetup?.readyAccount?.provider ||
    payoutSetup?.selectedProvider ||
    'set_up_later';
  const payoutLabel = payoutProviderLabel(payoutProvider);
  const payoutShortLabel = payoutProviderShortLabel(payoutProvider);
  const payoutDestination = payoutDestinationLabel(
    payoutSetup?.readyAccount || null,
  );

  const upcoming = useMemo(
    () =>
      activities
        .filter(
          (item) =>
            Boolean(item.activity_date) &&
            item.activity_date! >= todayValue() &&
            !['completed', 'cancelled'].includes(item.status || ''),
        )
        .slice(0, 8),
    [activities],
  );

  const followUps = useMemo(
    () =>
      leads
        .filter(
          (item) =>
            Boolean(item.next_follow_up) &&
            item.next_follow_up! <= addDays(todayValue(), 7) &&
            !['converted', 'closed'].includes(item.lead_status || ''),
        )
        .slice(0, 8),
    [leads],
  );

  const filteredActivities = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return activities;
    return activities.filter((item) =>
      [item.title, item.activity_type, item.organization_name, item.city, item.state]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
    );
  }, [activities, search]);

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return leads;
    return leads.filter((item) =>
      [
        item.full_name,
        item.first_name,
        item.last_name,
        item.email,
        item.phone,
        item.business_name,
        item.organization_name,
        item.lead_type,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
    );
  }, [leads, search]);

  const calendarDays = useMemo(() => {
    const first = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return {
        date,
        key: dateKey(date),
        inMonth: date.getMonth() === calendarMonth.getMonth(),
      };
    });
  }, [calendarMonth]);

  const activitiesByDate = useMemo(() => {
    const grouped = new Map<string, ActivityRecord[]>();
    activities.forEach((item) => {
      if (!item.activity_date) return;
      grouped.set(item.activity_date, [...(grouped.get(item.activity_date) || []), item]);
    });
    return grouped;
  }, [activities]);

  function openActivity(date?: string) {
    const activityDate = typeof date === 'string' ? date : selectedDate;
    setEditingId(null);
    setActivityForm(newActivityForm(activityDate));
    setComposer('activity');
  }

  function openLead() {
    setEditingId(null);
    setLeadForm(newLeadForm());
    setComposer('lead');
  }

  function openMarketing() {
    setEditingId(null);
    setMarketingForm(newMarketingForm());
    setComposer('marketing_effort');
  }

  function closeAddMenuThen(openNext: () => void) {
    setAddMenuOpen(false);

    // Let the add-menu Modal unmount before opening the next Modal. This avoids
    // overlapping web/native modal layers that can make the preview appear frozen.
    setTimeout(openNext, Platform.OS === 'web' ? 50 : 0);
  }

  function editActivity(record: ActivityRecord) {
    setEditingId(record.id);
    setActivityForm({
      title: record.title || '',
      activity_date: record.activity_date || todayValue(),
      activity_type: record.activity_type || 'Community Event',
      engagement_mode: record.engagement_mode || 'Face-to-Face',
      category: record.category || 'Outreach',
      status: record.status || 'planned',
      estimated_minutes: String(record.estimated_minutes || 60),
      actual_minutes: record.actual_minutes == null ? '' : String(record.actual_minutes),
      target_audience: record.target_audience || 'Pet Parents',
      organization_name: record.organization_name || '',
      venue_name: record.venue_name || '',
      city: record.city || '',
      state: record.state || '',
      goal: record.goal || '',
      actual_contacts: String(record.actual_contacts || ''),
      conversations: String(record.conversations || ''),
      qr_scans: String(record.qr_scans || ''),
      materials_distributed: String(record.materials_distributed || ''),
      leads_generated: String(record.leads_generated || ''),
      verified_signups: String(record.verified_signups || ''),
      completed_bookings: String(record.completed_bookings || ''),
      outcome_summary: record.outcome_summary || '',
      notes: record.notes || '',
      needs_admin_help: Boolean(record.needs_admin_help),
      admin_help_reason: record.admin_help_reason || '',
    });
    setComposer('activity');
  }

  function editMarketing(record: MarketingEffort) {
    setEditingId(record.id);
    setMarketingForm({
      title: record.title || '',
      effort_date: record.effort_date || todayValue(),
      effort_type: record.effort_type || 'Social Post',
      platform: record.platform || 'Instagram',
      campaign_name: record.campaign_name || '',
      target_audience: record.target_audience || 'Pet Parents',
      target_location: record.target_location || '',
      description: record.description || '',
      content_url: record.content_url || '',
      call_to_action: record.call_to_action || '',
      minutes_spent:
        record.minutes_spent == null ? '15' : String(record.minutes_spent),
      spend_amount:
        record.spend_amount == null ? '' : String(record.spend_amount),
      reach: record.reach == null ? '' : String(record.reach),
      engagements:
        record.engagements == null ? '' : String(record.engagements),
      clicks: record.clicks == null ? '' : String(record.clicks),
      qr_scans: record.qr_scans == null ? '' : String(record.qr_scans),
      materials_distributed:
        record.materials_distributed == null
          ? ''
          : String(record.materials_distributed),
      leads_generated:
        record.leads_generated == null ? '' : String(record.leads_generated),
      verified_signups:
        record.verified_signups == null ? '' : String(record.verified_signups),
      completed_bookings:
        record.completed_bookings == null
          ? ''
          : String(record.completed_bookings),
      status: record.status || 'planned',
      outcome_summary: record.outcome_summary || '',
      notes: record.notes || '',
      needs_admin_help: Boolean(record.needs_admin_help),
    });
    setComposer('marketing_effort');
  }

  function editLead(record: LeadRecord) {
    setEditingId(record.id);
    setLeadForm({
      lead_type: record.lead_type || 'Pet Parent Lead',
      lead_status: record.lead_status || 'new',
      first_name: record.first_name || '',
      last_name: record.last_name || '',
      email: record.email || '',
      phone: record.phone || '',
      business_name: record.business_name || '',
      organization_name: record.organization_name || '',
      city: record.city || '',
      state: record.state || '',
      zip_code: record.zip_code || '',
      source_type: record.source_type || 'Face-to-Face',
      source_detail: record.source_detail || '',
      target_audience: record.target_audience || 'Pet Parents',
      next_follow_up: record.next_follow_up || '',
      next_action: record.next_action || '',
      notes: record.notes || '',
      consent_to_contact: Boolean(record.consent_to_contact),
      admin_assistance_requested: Boolean(record.admin_assistance_requested),
      admin_assistance_reason: record.admin_assistance_reason || '',
    });
    setComposer('lead');
  }

  async function sendCommand(
    method: 'POST' | 'PATCH',
    entity: Exclude<ComposerMode, null>,
    payload: Record<string, unknown>,
    id?: string,
  ) {
    const response = await apiFetch('/api/ambassador/command-center', {
      method,
      body: JSON.stringify({ entity, id, data: payload }),
    });
    const result = await readCommandResponse(response);
    if (!response.ok || !result.success) {
      throw new Error(result.error || result.details || 'SitGuru could not save the record.');
    }
    return result;
  }

  async function saveActivity() {
    if (!activityForm.title.trim() || !activityForm.activity_date.trim()) {
      setFeedback({ tone: 'error', message: 'Activity title and date are required.' });
      return;
    }
    setSaving(true);
    try {
      const result = await sendCommand(
        editingId ? 'PATCH' : 'POST',
        'activity',
        {
          ...activityForm,
          estimated_minutes: numberValue(activityForm.estimated_minutes),
          actual_minutes: numberValue(activityForm.actual_minutes),
          actual_contacts: numberValue(activityForm.actual_contacts),
          conversations: numberValue(activityForm.conversations),
          qr_scans: numberValue(activityForm.qr_scans),
          materials_distributed: numberValue(activityForm.materials_distributed),
          leads_generated: numberValue(activityForm.leads_generated),
          verified_signups: numberValue(activityForm.verified_signups),
          completed_bookings: numberValue(activityForm.completed_bookings),
        },
        editingId || undefined,
      );
      setComposer(null);
      setEditingId(null);
      setFeedback({ tone: 'success', message: result.message || 'Activity saved.' });
      await loadData(true);
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to save activity.',
      });
    } finally {
      setSaving(false);
    }
  }

  async function saveLead() {
    const hasContact =
      leadForm.first_name.trim() ||
      leadForm.last_name.trim() ||
      leadForm.email.trim() ||
      leadForm.phone.trim() ||
      leadForm.business_name.trim() ||
      leadForm.organization_name.trim();
    if (!hasContact) {
      setFeedback({
        tone: 'error',
        message: 'Enter a name, email, phone, business, or organization.',
      });
      return;
    }
    setSaving(true);
    try {
      const result = await sendCommand(
        editingId ? 'PATCH' : 'POST',
        'lead',
        leadForm,
        editingId || undefined,
      );
      setComposer(null);
      setEditingId(null);
      setFeedback({
        tone: 'success',
        message: result.message || 'Lead saved and sent to Headquarters.',
      });
      await loadData(true);
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to save lead.',
      });
    } finally {
      setSaving(false);
    }
  }

  async function saveMarketing() {
    if (!marketingForm.title.trim() || !marketingForm.effort_date.trim()) {
      setFeedback({ tone: 'error', message: 'Marketing title and date are required.' });
      return;
    }
    setSaving(true);
    try {
      const result = await sendCommand(
        editingId ? 'PATCH' : 'POST',
        'marketing_effort',
        {
          ...marketingForm,
          minutes_spent: numberValue(marketingForm.minutes_spent),
          spend_amount: numberValue(marketingForm.spend_amount),
          reach: numberValue(marketingForm.reach),
          engagements: numberValue(marketingForm.engagements),
          clicks: numberValue(marketingForm.clicks),
          qr_scans: numberValue(marketingForm.qr_scans),
          materials_distributed: numberValue(marketingForm.materials_distributed),
          leads_generated: numberValue(marketingForm.leads_generated),
          verified_signups: numberValue(marketingForm.verified_signups),
          completed_bookings: numberValue(marketingForm.completed_bookings),
        },
        editingId || undefined,
      );
      setComposer(null);
      setEditingId(null);
      setFeedback({ tone: 'success', message: result.message || 'Marketing effort saved.' });
      await loadData(true);
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to save marketing effort.',
      });
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(entity: 'activity' | 'lead', id: string, status: string) {
    setBusyId(id);
    try {
      const result = await sendCommand(
        'PATCH',
        entity,
        entity === 'activity' ? { status } : { lead_status: status },
        id,
      );
      setFeedback({ tone: 'success', message: result.message || 'Changes saved.' });
      await loadData(true);
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to save update.',
      });
    } finally {
      setBusyId(null);
    }
  }

  function openRoute(path: string) {
    if (Platform.OS === 'web') {
      router.navigate(path as never);
      return;
    }

    router.push(path as never);
  }

  function go(path: Href) {
    openRoute(String(path));
  }

  function openMessages() {
    router.push(
      {
        pathname: '/messages',
        params: { role: 'ambassador' },
      } as never,
    );
  }

  function openReferralAnalytics() {
    openRoute('/ambassador-referral-analytics');
  }

  function openRewards() {
    setView('rewards');
  }

  function openPayoutSetup() {
    openRoute('/ambassador-payouts');
  }

  if (authLoading || loading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.centerTitle}>Loading your Ambassador tools</Text>
        <Text style={styles.centerBody}>Getting your activity, leads, rewards, and payout status.</Text>
      </View>
    );
  }

  if (!user || !session) {
    return (
      <View style={styles.centerScreen}>
        <UserRound color={theme.colors.primary} size={38} strokeWidth={2.2} />
        <Text style={styles.centerTitle}>Sign in to continue</Text>
        <Text style={styles.centerBody}>The SitGuru Ambassador Portal requires your SitGuru account.</Text>
        <Button label="Open sign in" primary onPress={() => go('/login')} styles={styles} theme={theme} />
      </View>
    );
  }

  if (!hasAmbassadorRole) {
    return (
      <View style={styles.centerScreen}>
        <Headphones color={theme.colors.warning} size={38} strokeWidth={2.2} />
        <Text style={styles.centerTitle}>Ambassador workspace required</Text>
        <Text style={styles.centerBody}>This account does not currently have an Ambassador workspace.</Text>
        <Button label="Return to account" onPress={() => go('/account')} styles={styles} theme={theme} />
      </View>
    );
  }

  const profileRecord = (profile ?? {}) as Record<string, unknown>;
  const userMetadata = (user?.user_metadata ?? {}) as Record<string, unknown>;

  const firstName =
    ambassador?.full_name?.split(' ')[0] ||
    profile?.first_name ||
    profile?.full_name?.split(' ')[0] ||
    (typeof userMetadata.full_name === 'string'
      ? userMetadata.full_name.split(' ')[0]
      : '') ||
    'Ambassador';

  const rawAvatar = [
    profileRecord.avatar_url,
    profileRecord.photo_url,
    profileRecord.profile_photo_url,
    profileRecord.profile_image_url,
    userMetadata.avatar_url,
    userMetadata.picture,
  ].find(
    (value): value is string =>
      typeof value === 'string' && value.trim().length > 0,
  );

  const avatarUrl = rawAvatar
    ? resolveSupabaseStorageUrl(rawAvatar)
    : null;

  return (
    <View style={styles.screen}>
      <SitGuruScreen
        center={isWebPreview || isTablet}
        maxWidth={isTablet ? 980 : 620}
      >
        <View
          style={[
            styles.previewCanvas,
            !isWebPreview && styles.previewCanvasNative,
          ]}
        >
          <View
            style={[
              styles.deviceFrame,
              !isWebPreview && styles.deviceFrameNative,
            ]}
          >
            {isWebPreview ? <View style={styles.deviceTopSpeaker} /> : null}

            <View
              style={[
                styles.phoneShell,
                !isWebPreview && styles.phoneShellNative,
              ]}
            >
              <View style={styles.appScreen}>
                {isWebPreview ? <PhoneStatusBar styles={styles} /> : null}

                <View style={styles.header}>
                  <View style={styles.headerCopy}>
                    <Text style={styles.headerTitle}>
                      {"Ambassador\nPortal"}
                    </Text>

                    <Text
                      numberOfLines={1}
                      style={styles.welcomeText}
                    >
                      Welcome back, {firstName}! <Text style={styles.wave}>👋</Text>
                    </Text>

                    <View style={styles.roleStatusRow}>
                      <View style={styles.roleStatusDot} />
                      <Text style={styles.roleStatusText}>
                        Ambassador • Live
                      </Text>
                    </View>
                    <Pressable
                        accessibilityHint="Returns to the Ambassador Dashboard."
                        accessibilityLabel="Back to Ambassador Dashboard"
                        accessibilityRole="button"
                        onPress={() => openRoute('/ambassador-dashboard')}
                        style={({ pressed }) => [
                          styles.dashboardReturnButton,
                          pressed ? styles.headerControlPressed : null,
                        ]}>
                        <ArrowLeft
                          color={theme.colors.primary}
                          size={12}
                          strokeWidth={2.6}
                        />
                        <Text style={styles.dashboardReturnText}>
                          Dashboard
                        </Text>
                      </Pressable>
                  </View>

                  <View style={styles.headerActions}>
                    <Pressable
                        accessibilityLabel="Open notifications"
                        accessibilityRole="button"
                        onPress={() => openRoute('/notifications')}
                        style={styles.headerIconButton}>
                        <Bell
                          color={theme.colors.text}
                          size={18}
                          strokeWidth={2.3}
                        />
                      </Pressable>

                    <View style={styles.modeToggle}>
                      {THEME_OPTIONS.map((option) => {
                        const active = themePreference === option.value;

                        return (
                          <Pressable
                            key={option.value}
                            accessibilityLabel={`Switch to ${option.label} mode`}
                            accessibilityRole="button"
                            accessibilityState={{ selected: active }}
                            onPress={() => setThemePreference(option.value)}
                            style={[
                              styles.modeButton,
                              active ? styles.modeButtonActive : null,
                            ]}
                          >
                            <SitGuruIcon
                              color={
                                active
                                  ? option.value === 'light'
                                    ? '#F3AA1F'
                                    : isDark
                                      ? '#F0CF62'
                                      : theme.colors.primary
                                  : theme.colors.textSecondary
                              }
                              name={option.icon}
                              size={15}
                              strokeWidth={2.4}
                            />
                          </Pressable>
                        );
                      })}
                    </View>
                    <Pressable
                        accessibilityLabel="Open profile and workspace switcher"
                        accessibilityRole="button"
                        onPress={() => openRoute('/account')}
                        style={styles.avatar}>
                        {avatarUrl && !avatarImageFailed ? (
                          <Image
                            onError={() => setAvatarImageFailed(true)}
                            resizeMode="cover"
                            source={{ uri: avatarUrl }}
                            style={styles.avatarImage}
                          />
                        ) : (
                          <Text style={styles.avatarText}>
                            {(firstName[0] || 'A').toUpperCase()}
                          </Text>
                        )}
                      </Pressable>
                  </View>
                </View>

          <ScrollView
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => void loadData(true)}
                tintColor={theme.colors.primary}
              />
            }
            contentContainerStyle={[
              styles.content,
              isTablet ? styles.contentTablet : null,
            ]}>
            <View style={styles.hero}>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>SitGuru Ambassador Portal</Text>
              </View>
              <Text style={styles.heroTitle}>Hey, {firstName}.</Text>
              <Text style={styles.heroBody}>
                Plan it. Share it. Track it. See your impact and rewards in one place.
              </Text>
              <View style={styles.heroActions}>
                <Button
                  label="Add activity"
                  primary
                  onPress={() => openActivity()}
                  styles={styles}
                  theme={theme}
                  icon={<CalendarPlus color="#FFFFFF" size={17} strokeWidth={2.4} />}
                />
                <Button
                  label="Add lead"
                  onPress={openLead}
                  styles={styles}
                  theme={theme}
                  icon={<UserPlus color={theme.colors.primary} size={17} strokeWidth={2.4} />}
                />
              </View>
            </View>

            {feedback ? (
              <View
                style={[
                  styles.feedback,
                  feedback.tone === 'success'
                    ? styles.feedbackSuccess
                    : feedback.tone === 'error'
                      ? styles.feedbackError
                      : styles.feedbackInfo,
                ]}>
                <Text style={styles.feedbackText}>{feedback.message}</Text>
                <Pressable onPress={() => setFeedback(null)}>
                  <X color={theme.colors.text} size={17} strokeWidth={2.4} />
                </Pressable>
              </View>
            ) : null}

            {data?.warning ? (
              <View style={styles.warning}>
                <Text style={styles.warningText}>{data.warning}</Text>
              </View>
            ) : null}

            {payoutWarning ? (
              <View style={styles.warning}>
                <Text style={styles.warningText}>{payoutWarning}</Text>
              </View>
            ) : null}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statRow}>
              <StatCard
                label="Activities"
                value={String(summary.scheduledActivities)}
                detail={`${summary.completedActivities} completed`}
                onPress={() => setView('activities')}
                styles={styles}
                icon={<CalendarDays color={theme.colors.primary} size={19} strokeWidth={2.3} />}
              />
              <StatCard
                label="Hours"
                value={String(summary.totalHours)}
                detail="Completed time"
                onPress={() => setView('activities')}
                styles={styles}
                icon={<Timer color={theme.colors.primary} size={19} strokeWidth={2.3} />}
              />
              <StatCard
                label="Contacts"
                value={String(summary.contacts)}
                detail={`${summary.conversations} conversations`}
                onPress={() => setView('activities')}
                styles={styles}
                icon={<Users color={theme.colors.primary} size={19} strokeWidth={2.3} />}
              />
              <StatCard
                label="Leads"
                value={String(summary.generatedLeads)}
                detail={`${summary.convertedLeads} converted`}
                onPress={() => setView('leads')}
                styles={styles}
                icon={<UserPlus color={theme.colors.primary} size={19} strokeWidth={2.3} />}
              />
              <StatCard
                label="QR Scans"
                value={String(summary.qrScans)}
                detail={`${summary.materialsDistributed} materials`}
                onPress={openReferralAnalytics}
                styles={styles}
                icon={<QrCode color={theme.colors.primary} size={19} strokeWidth={2.3} />}
              />
              <StatCard
                label="Rewards"
                value={String(summary.verifiedSignups)}
                detail={`${summary.completedBookings} bookings`}
                onPress={openRewards}
                styles={styles}
                icon={<Gift color={theme.colors.primary} size={19} strokeWidth={2.3} />}
              />
            </ScrollView>

            <View style={styles.portalLinksSection}>
              <Text style={styles.portalLinksEyebrow}>CONNECTED TOOLS</Text>

              <PortalLinkButton
                label="Referral Analytics"
                detail="Visits, conversions, channels, bookings, and rewards"
                icon={
                  <BarChart3
                    color={theme.colors.primary}
                    size={19}
                    strokeWidth={2.4}
                  />
                }
                onPress={openReferralAnalytics}
                styles={styles}
                theme={theme}
              />

              <PortalLinkButton
                label="Rewards & Payouts"
                detail={
                  payoutReady
                    ? `${payoutShortLabel} is ready`
                    : 'Track rewards and pick how you get paid'
                }
                icon={
                  <Wallet
                    color={theme.colors.primary}
                    size={19}
                    strokeWidth={2.4}
                  />
                }
                onPress={openRewards}
                styles={styles}
                theme={theme}
              />

              <PortalLinkButton
                label="Ambassador Dashboard"
                detail="Return to your main Ambassador overview"
                icon={
                  <Home
                    color={theme.colors.primary}
                    size={19}
                    strokeWidth={2.4}
                  />
                }
                onPress={() => openRoute('/ambassador-dashboard')}
                styles={styles}
                theme={theme}
              />

              <PortalLinkButton
                label="Message Center"
                detail="Contact Headquarters and review Ambassador conversations"
                icon={
                  <MessageCircle
                    color={theme.colors.primary}
                    size={19}
                    strokeWidth={2.4}
                  />
                }
                onPress={openMessages}
                styles={styles}
                theme={theme}
              />

              <PortalLinkButton
                label="Headquarters Support"
                detail="Request account, lead, event, materials, or payout help"
                icon={
                  <Headphones
                    color={theme.colors.primary}
                    size={19}
                    strokeWidth={2.4}
                  />
                }
                onPress={() => openRoute('/support')}
                styles={styles}
                theme={theme}
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
              {[
                ['today', 'Today', Home],
                ['calendar', 'Calendar', CalendarDays],
                ['activities', 'Activities', Target],
                ['marketing', 'Marketing', Megaphone],
                ['leads', 'Leads', UserPlus],
                ['rewards', 'Rewards', Gift],
              ].map(([key, label, Icon]) => {
                const active = view === key;
                const IconComponent = Icon as typeof Home;
                return (
                  <Pressable
                    key={key as string}
                    onPress={() => setView(key as CommandView)}
                    style={[styles.tab, active ? styles.tabActive : null]}>
                    <IconComponent
                      color={active ? theme.colors.chipActiveText : theme.colors.textSecondary}
                      size={16}
                      strokeWidth={2.4}
                    />
                    <Text style={[styles.tabText, active ? styles.tabTextActive : null]}>{label as string}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {view === 'today' ? (
              <>
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionCopy}>
                      <Text style={styles.eyebrow}>Today and next</Text>
                      <Text style={styles.sectionTitle}>Your work schedule</Text>
                      <Text style={styles.sectionBody}>Planned, confirmed, and in-progress activities.</Text>
                    </View>
                    <Pressable onPress={() => openActivity()} style={styles.roundAdd}>
                      <Plus color="#FFFFFF" size={18} strokeWidth={2.6} />
                    </Pressable>
                  </View>
                  <View style={styles.list}>
                    {upcoming.length ? (
                      upcoming.map((item) => (
                        <ActivityCard
                          key={item.id}
                          record={item}
                          styles={styles}
                          theme={theme}
                          busyId={busyId}
                          onEdit={() => editActivity(item)}
                          onComplete={() => void updateStatus('activity', item.id, 'completed')}
                        />
                      ))
                    ) : (
                      <View style={styles.empty}>
                        <CalendarPlus color={theme.colors.primary} size={30} strokeWidth={2.1} />
                        <Text style={styles.emptyTitle}>No upcoming activities</Text>
                        <Text style={styles.emptyBody}>
                          Add outreach, events, professional visits, campus activity, marketing, or follow-up.
                        </Text>
                        <Button label="Schedule activity" primary onPress={() => openActivity()} styles={styles} theme={theme} />
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionCopy}>
                      <Text style={styles.eyebrow}>Follow-up</Text>
                      <Text style={styles.sectionTitle}>Leads needing attention</Text>
                      <Text style={styles.sectionBody}>Upcoming follow-ups and Headquarters-assisted opportunities.</Text>
                    </View>
                    <Pressable onPress={openLead} style={styles.roundAdd}>
                      <Plus color="#FFFFFF" size={18} strokeWidth={2.6} />
                    </Pressable>
                  </View>
                  <View style={styles.list}>
                    {followUps.length ? (
                      followUps.map((item) => (
                        <LeadCard
                          key={item.id}
                          record={item}
                          styles={styles}
                          theme={theme}
                          busyId={busyId}
                          onEdit={() => editLead(item)}
                          onConvert={() => void updateStatus('lead', item.id, 'converted')}
                        />
                      ))
                    ) : (
                      <View style={styles.empty}>
                        <UserPlus color={theme.colors.primary} size={30} strokeWidth={2.1} />
                        <Text style={styles.emptyTitle}>No urgent follow-ups</Text>
                        <Text style={styles.emptyBody}>New leads and Admin-assisted follow-ups will appear here.</Text>
                        <Button label="Add lead" onPress={openLead} styles={styles} theme={theme} />
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.headquarters}>
                  <Headphones color={theme.colors.primary} size={25} strokeWidth={2.3} />
                  <Text style={styles.headquartersTitle}>Need a hand?</Text>
                  <Text style={styles.headquartersBody}>
                    Ask SitGuru for help with an activity, lead, event, or payout.
                  </Text>
                  <Button
                    label="Ask Headquarters"
                    primary
                    onPress={() => go('/support')}
                    styles={styles}
                    theme={theme}
                    icon={<Headphones color="#FFFFFF" size={17} strokeWidth={2.4} />}
                  />
                </View>
              </>
            ) : null}

            {view === 'calendar' ? (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionCopy}>
                    <Text style={styles.eyebrow}>Activity calendar</Text>
                    <Text style={styles.sectionTitle}>
                      {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </Text>
                  </View>
                </View>
                <View style={styles.calendarToolbar}>
                  <Pressable
                    onPress={() =>
                      setCalendarMonth(
                        (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
                      )
                    }
                    style={styles.iconButton}>
                    <ChevronLeft color={theme.colors.text} size={20} strokeWidth={2.4} />
                  </Pressable>
                  <Button label="Today" onPress={() => { const today = new Date(); setCalendarMonth(today); setSelectedDate(dateKey(today)); }} styles={styles} theme={theme} />
                  <Pressable
                    onPress={() =>
                      setCalendarMonth(
                        (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
                      )
                    }
                    style={styles.iconButton}>
                    <ChevronRight color={theme.colors.text} size={20} strokeWidth={2.4} />
                  </Pressable>
                </View>
                <View style={styles.weekRow}>
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <Text key={`${day}-${index}`} style={styles.weekText}>{day}</Text>
                  ))}
                </View>
                <View style={styles.calendarGrid}>
                  {calendarDays.map((day) => {
                    const count = (activitiesByDate.get(day.key) || []).length;
                    const selected = selectedDate === day.key;
                    return (
                      <Pressable
                        key={day.key}
                        onPress={() => setSelectedDate(day.key)}
                        style={[
                          styles.calendarDay,
                          !day.inMonth ? styles.calendarDayMuted : null,
                          selected ? styles.calendarDaySelected : null,
                        ]}>
                        <Text style={[styles.calendarDayText, selected ? styles.calendarDayTextActive : null]}>
                          {day.date.getDate()}
                        </Text>
                        {count ? <View style={styles.calendarDot} /> : null}
                      </Pressable>
                    );
                  })}
                </View>
                <View style={styles.selectedDate}>
                  <View style={styles.selectedDateCopy}>
                    <Text style={styles.selectedDateTitle}>{formatDate(selectedDate)}</Text>
                    <Text style={styles.selectedDateBody}>
                      {(activitiesByDate.get(selectedDate) || []).length} activities scheduled
                    </Text>
                  </View>
                  <Button label="Add" primary onPress={() => openActivity(selectedDate)} styles={styles} theme={theme} />
                </View>
                <View style={styles.list}>
                  {(activitiesByDate.get(selectedDate) || []).map((item) => (
                    <ActivityCard
                      key={item.id}
                      record={item}
                      styles={styles}
                      theme={theme}
                      busyId={busyId}
                      onEdit={() => editActivity(item)}
                      onComplete={() => void updateStatus('activity', item.id, 'completed')}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {view === 'activities' ? (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionCopy}>
                    <Text style={styles.eyebrow}>Activity log</Text>
                    <Text style={styles.sectionTitle}>Planned and completed work</Text>
                  </View>
                  <Pressable onPress={() => openActivity()} style={styles.roundAdd}>
                    <Plus color="#FFFFFF" size={18} strokeWidth={2.6} />
                  </Pressable>
                </View>
                <View style={styles.searchBar}>
                  <Search color={theme.colors.textSecondary} size={17} strokeWidth={2.3} />
                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search activities"
                    placeholderTextColor={theme.colors.inputPlaceholder}
                    style={styles.searchInput}
                  />
                </View>
                <View style={styles.list}>
                  {filteredActivities.map((item) => (
                    <ActivityCard
                      key={item.id}
                      record={item}
                      styles={styles}
                      theme={theme}
                      busyId={busyId}
                      onEdit={() => editActivity(item)}
                      onComplete={() => void updateStatus('activity', item.id, 'completed')}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {view === 'marketing' ? (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionCopy}>
                    <Text style={styles.eyebrow}>Marketing efforts</Text>
                    <Text style={styles.sectionTitle}>Track outreach beyond referral links</Text>
                  </View>
                  <Pressable onPress={openMarketing} style={styles.roundAdd}>
                    <Plus color="#FFFFFF" size={18} strokeWidth={2.6} />
                  </Pressable>
                </View>
                <View style={styles.list}>
                  {marketing.length ? (
                    marketing.map((item) => (
                      <View key={item.id} style={styles.recordCard}>
                        <View style={styles.recordTop}>
                          <View style={styles.recordCopy}>
                            <Text style={styles.recordDate}>{formatDate(item.effort_date)}</Text>
                            <Text style={styles.recordTitle}>{item.title || 'Marketing effort'}</Text>
                            <Text style={styles.recordMeta}>
                              {titleCase(item.effort_type)} • {item.platform || 'Unspecified channel'}
                            </Text>
                          </View>
                          <Megaphone color={theme.colors.primary} size={21} strokeWidth={2.3} />
                        </View>
                        <Text style={styles.recordBody}>
                          {item.description || item.outcome_summary || 'No description entered.'}
                        </Text>
                        <View style={styles.metricRow}>
                          <Text style={styles.metricPill}>{item.minutes_spent || 0} min</Text>
                          <Text style={styles.metricPill}>{item.reach || 0} reach</Text>
                          <Text style={styles.metricPill}>{item.clicks || 0} clicks</Text>
                          <Text style={styles.metricPill}>{item.leads_generated || 0} leads</Text>
                        </View>

                        <View style={styles.actionRow}>
                          <Button
                            label="Update"
                            onPress={() => editMarketing(item)}
                            styles={styles}
                            theme={theme}
                          />
                          <Button
                            label="Analytics"
                            primary
                            onPress={openReferralAnalytics}
                            styles={styles}
                            theme={theme}
                            icon={
                              <BarChart3
                                color="#FFFFFF"
                                size={16}
                                strokeWidth={2.4}
                              />
                            }
                          />
                        </View>
                      </View>
                    ))
                  ) : (
                    <View style={styles.empty}>
                      <Megaphone color={theme.colors.primary} size={30} strokeWidth={2.1} />
                      <Text style={styles.emptyTitle}>No marketing efforts logged</Text>
                      <Text style={styles.emptyBody}>
                        Record social posts, flyers, campus promotions, professional outreach, and campaigns.
                      </Text>
                      <Button label="Log marketing" primary onPress={openMarketing} styles={styles} theme={theme} />
                    </View>
                  )}
                </View>
              </View>
            ) : null}

            {view === 'leads' ? (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionCopy}>
                    <Text style={styles.eyebrow}>Lead generator</Text>
                    <Text style={styles.sectionTitle}>Send opportunities to Headquarters</Text>
                  </View>
                  <Pressable onPress={openLead} style={styles.roundAdd}>
                    <Plus color="#FFFFFF" size={18} strokeWidth={2.6} />
                  </Pressable>
                </View>
                <View style={styles.searchBar}>
                  <Search color={theme.colors.textSecondary} size={17} strokeWidth={2.3} />
                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search leads"
                    placeholderTextColor={theme.colors.inputPlaceholder}
                    style={styles.searchInput}
                  />
                </View>
                <View style={styles.list}>
                  {filteredLeads.map((item) => (
                    <LeadCard
                      key={item.id}
                      record={item}
                      styles={styles}
                      theme={theme}
                      busyId={busyId}
                      onEdit={() => editLead(item)}
                      onConvert={() => void updateStatus('lead', item.id, 'converted')}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {view === 'rewards' ? (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionCopy}>
                    <Text style={styles.eyebrow}>Rewards</Text>
                    <Text style={styles.sectionTitle}>
                      Your rewards, all in one spot
                    </Text>
                    <Text style={styles.sectionBody}>
                      See what&apos;s verified, what drove it, and whether your payout method is ready.
                    </Text>
                  </View>
                  <View style={styles.rewardHeaderIcon}>
                    <Gift
                      color={theme.colors.primary}
                      size={21}
                      strokeWidth={2.4}
                    />
                  </View>
                </View>

                <View style={styles.rewardQuickGrid}>
                  <View style={styles.rewardQuickCard}>
                    <BadgeCheck
                      color={theme.colors.primary}
                      size={20}
                      strokeWidth={2.4}
                    />
                    <Text style={styles.rewardQuickValue}>
                      {summary.verifiedSignups}
                    </Text>
                    <Text style={styles.rewardQuickLabel}>
                      Verified signups
                    </Text>
                  </View>

                  <View style={styles.rewardQuickCard}>
                    <CalendarDays
                      color={theme.colors.primary}
                      size={20}
                      strokeWidth={2.4}
                    />
                    <Text style={styles.rewardQuickValue}>
                      {summary.completedBookings}
                    </Text>
                    <Text style={styles.rewardQuickLabel}>
                      Completed bookings
                    </Text>
                  </View>

                  <View style={styles.rewardQuickCard}>
                    <Wallet
                      color={theme.colors.primary}
                      size={20}
                      strokeWidth={2.4}
                    />
                    <Text
                      numberOfLines={1}
                      style={styles.rewardQuickValueSmall}
                    >
                      {payoutReady ? 'Ready' : 'Pick one'}
                    </Text>
                    <Text style={styles.rewardQuickLabel}>
                      Payout status
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.payoutCard,
                    payoutReady ? styles.payoutCardReady : null,
                  ]}
                >
                  <View style={styles.payoutTopRow}>
                    <View style={styles.payoutIcon}>
                      <Wallet
                        color={theme.colors.primary}
                        size={22}
                        strokeWidth={2.4}
                      />
                    </View>

                    <View style={styles.payoutCopy}>
                      <Text style={styles.payoutEyebrow}>Get paid</Text>
                      <Text style={styles.payoutTitle}>
                        {payoutReady
                          ? 'You’re ready to get paid'
                          : 'Pick how you get paid'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.payoutBody}>
                    {payoutReady
                      ? `${payoutLabel} • ${payoutDestination}`
                      : 'Choose bank or card, PayPal, or Venmo. You can switch later.'}
                  </Text>

                  <Button
                    label={payoutReady ? 'Manage payout' : 'Pick a payout'}
                    primary
                    onPress={openPayoutSetup}
                    styles={styles}
                    theme={theme}
                    icon={
                      <Wallet
                        color="#FFFFFF"
                        size={17}
                        strokeWidth={2.4}
                      />
                    }
                  />
                </View>

                <View style={styles.rewardSteps}>
                  <Text style={styles.rewardStepsTitle}>
                    Share. Track. Earn.
                  </Text>

                  {[
                    ['1', 'Share your link or QR code.'],
                    ['2', 'Track verified signups and bookings.'],
                    ['3', 'See approved rewards and payout status.'],
                  ].map(([step, label]) => (
                    <View key={step} style={styles.rewardStepRow}>
                      <View style={styles.rewardStepNumber}>
                        <Text style={styles.rewardStepNumberText}>
                          {step}
                        </Text>
                      </View>
                      <Text style={styles.rewardStepText}>{label}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.noMysteryCard}>
                  <ShieldCheck
                    color={theme.colors.primary}
                    size={20}
                    strokeWidth={2.4}
                  />
                  <View style={styles.noMysteryCopy}>
                    <Text style={styles.noMysteryTitle}>
                      No mystery math
                    </Text>
                    <Text style={styles.noMysteryBody}>
                      Activities and clicks do not automatically create money.
                      Rewards appear after SitGuru verifies the activity.
                    </Text>
                  </View>
                </View>

                <Button
                  label="Open referral analytics"
                  onPress={openReferralAnalytics}
                  styles={styles}
                  theme={theme}
                  icon={
                    <BarChart3
                      color={theme.colors.primary}
                      size={17}
                      strokeWidth={2.4}
                    />
                  }
                />
              </View>
            ) : null}

            <View style={styles.accuracyNote}>
              <BadgeCheck color={theme.colors.primary} size={18} strokeWidth={2.3} />
              <Text style={styles.accuracyText}>
                Logged activity helps SitGuru verify your work. It does not automatically create a reward.
              </Text>
            </View>
            <View style={styles.bottomSpacer} />
          </ScrollView>

          <View style={styles.bottomNav}>
            <Pressable
              accessibilityLabel="Open Ambassador Dashboard"
              accessibilityRole="button"
              onPress={() => openRoute('/ambassador-dashboard')}
              style={styles.bottomNavItem}>
              <Home color={theme.colors.textSecondary} size={20} strokeWidth={2.3} />
              <Text style={styles.bottomLabel}>Home</Text>
            </Pressable>

            <Pressable
              accessibilityLabel="Open Portal calendar"
              accessibilityRole="button"
              onPress={() => setView('calendar')}
              style={styles.bottomNavItem}>
              <CalendarDays
                color={view === 'calendar' ? theme.colors.primary : theme.colors.textSecondary}
                size={20}
                strokeWidth={2.3}
              />
              <Text style={[styles.bottomLabel, view === 'calendar' ? styles.bottomLabelActive : null]}>
                Calendar
              </Text>
            </Pressable>

            <Pressable
              accessibilityLabel="Add to Ambassador Portal"
              accessibilityRole="button"
              onPress={() => setAddMenuOpen(true)}
              style={styles.bottomAdd}>
              <Plus color="#FFFFFF" size={26} strokeWidth={2.8} />
            </Pressable>

            <Pressable
              accessibilityLabel="Open Ambassador messages"
              accessibilityRole="button"
              onPress={openMessages}
              style={styles.bottomNavItem}>
              <MessageCircle color={theme.colors.textSecondary} size={20} strokeWidth={2.3} />
              <Text style={styles.bottomLabel}>Messages</Text>
            </Pressable>

            <Pressable
              accessibilityLabel="Open profile"
              accessibilityRole="button"
              onPress={() => openRoute('/account')}
              style={styles.bottomNavItem}>
              <UserRound color={theme.colors.textSecondary} size={20} strokeWidth={2.3} />
              <Text style={styles.bottomLabel}>Profile</Text>
            </Pressable>
          </View>
              </View>
            </View>

            {isWebPreview ? <View style={styles.homeIndicator} /> : null}
          </View>
        </View>
      </SitGuruScreen>

      {Platform.OS === 'web' ? (
        addMenuOpen ? (
          <View pointerEvents="auto" style={styles.webInlineOverlayRoot}>
            <View style={styles.webInlinePhoneSurface}>
          <View style={styles.sheetBackdrop}>
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeaderRow}>
                <Text style={styles.sheetTitle}>Add to Ambassador Portal</Text>
                <Pressable
                  accessibilityLabel="Close Add menu"
                  accessibilityRole="button"
                  onPress={() => setAddMenuOpen(false)}
                  style={styles.sheetCloseButton}>
                  <X color={theme.colors.text} size={18} strokeWidth={2.4} />
                </Pressable>
              </View>

              {[
                [
                  'Add activity',
                  'Schedule outreach, events, visits, training, or follow-ups.',
                  CalendarPlus,
                  () => closeAddMenuThen(() => openActivity()),
                ],
                [
                  'Add lead',
                  'Send a person, business, or organization to Headquarters.',
                  UserPlus,
                  () => closeAddMenuThen(openLead),
                ],
                [
                  'Log marketing',
                  'Track social, email, print, campus, and professional outreach.',
                  Megaphone,
                  () => closeAddMenuThen(openMarketing),
                ],
              ].map(([title, detail, Icon, action]) => {
                const IconComponent = Icon as typeof CalendarPlus;

                return (
                  <Pressable
                    key={title as string}
                    onPress={action as () => void}
                    style={styles.sheetItem}>
                    <View style={styles.sheetIcon}>
                      <IconComponent
                        color={theme.colors.primary}
                        size={20}
                        strokeWidth={2.4}
                      />
                    </View>
                    <View style={styles.sheetCopy}>
                      <Text style={styles.sheetItemTitle}>{title as string}</Text>
                      <Text style={styles.sheetItemBody}>{detail as string}</Text>
                    </View>
                  </Pressable>
                );
              })}

              <Pressable
                onPress={() => {
                  setAddMenuOpen(false);
                  setTimeout(() => go('/support'), Platform.OS === 'web' ? 50 : 0);
                }}
                style={styles.sheetItem}>
                <View style={styles.sheetIcon}>
                  <Headphones
                    color={theme.colors.primary}
                    size={20}
                    strokeWidth={2.4}
                  />
                </View>
                <View style={styles.sheetCopy}>
                  <Text style={styles.sheetItemTitle}>
                    Request Headquarters help
                  </Text>
                  <Text style={styles.sheetItemBody}>
                    Ask for help with a lead, event, materials, account, or payout.
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
            </View>
          </View>
        ) : null
      ) : (
      <Modal
        visible={addMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAddMenuOpen(false)}>
        <View style={styles.modalViewport}>
          <Pressable
            style={styles.sheetBackdrop}
            onPress={() => setAddMenuOpen(false)}>
            <Pressable
              onPress={(event) => event.stopPropagation()}
              style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeaderRow}>
                <Text style={styles.sheetTitle}>Add to Ambassador Portal</Text>
                <Pressable
                  accessibilityLabel="Close Add menu"
                  accessibilityRole="button"
                  onPress={() => setAddMenuOpen(false)}
                  style={styles.sheetCloseButton}>
                  <X color={theme.colors.text} size={18} strokeWidth={2.4} />
                </Pressable>
              </View>

              {[
                [
                  'Add activity',
                  'Schedule outreach, events, visits, training, or follow-ups.',
                  CalendarPlus,
                  () => closeAddMenuThen(() => openActivity()),
                ],
                [
                  'Add lead',
                  'Send a person, business, or organization to Headquarters.',
                  UserPlus,
                  () => closeAddMenuThen(openLead),
                ],
                [
                  'Log marketing',
                  'Track social, email, print, campus, and professional outreach.',
                  Megaphone,
                  () => closeAddMenuThen(openMarketing),
                ],
              ].map(([title, detail, Icon, action]) => {
                const IconComponent = Icon as typeof CalendarPlus;

                return (
                  <Pressable
                    key={title as string}
                    onPress={action as () => void}
                    style={styles.sheetItem}>
                    <View style={styles.sheetIcon}>
                      <IconComponent
                        color={theme.colors.primary}
                        size={20}
                        strokeWidth={2.4}
                      />
                    </View>
                    <View style={styles.sheetCopy}>
                      <Text style={styles.sheetItemTitle}>{title as string}</Text>
                      <Text style={styles.sheetItemBody}>{detail as string}</Text>
                    </View>
                  </Pressable>
                );
              })}

              <Pressable
                onPress={() => {
                  setAddMenuOpen(false);
                  setTimeout(() => go('/support'), Platform.OS === 'web' ? 50 : 0);
                }}
                style={styles.sheetItem}>
                <View style={styles.sheetIcon}>
                  <Headphones
                    color={theme.colors.primary}
                    size={20}
                    strokeWidth={2.4}
                  />
                </View>
                <View style={styles.sheetCopy}>
                  <Text style={styles.sheetItemTitle}>
                    Request Headquarters help
                  </Text>
                  <Text style={styles.sheetItemBody}>
                    Ask for help with a lead, event, materials, account, or payout.
                  </Text>
                </View>
              </Pressable>
            </Pressable>
          </Pressable>
        </View>
      </Modal>
      )}

      <FormModal
        visible={composer === 'activity'}
        title={editingId ? 'Update activity' : 'Add activity'}
        subtitle="Schedule or record outreach, events, professional visits, training, marketing, and follow-ups."
        saving={saving}
        styles={styles}
        theme={theme}
        onClose={() => {
          setComposer(null);
          setEditingId(null);
        }}
        onSave={() => void saveActivity()}>
        {!editingId && templates.length ? (
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Quick-start templates</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templateRow}>
              {templates.slice(0, 12).map((template) => (
                <Pressable
                  key={template.id}
                  onPress={() =>
                    setActivityForm((current) => ({
                      ...current,
                      title: template.title || current.title,
                      activity_type: template.activity_type || current.activity_type,
                      engagement_mode: template.engagement_mode || current.engagement_mode,
                      category: template.category || current.category,
                      estimated_minutes: String(template.default_duration_minutes || 60),
                      target_audience: template.default_target_audience || current.target_audience,
                    }))
                  }
                  style={styles.templateCard}>
                  <Text style={styles.templateTitle}>{template.title}</Text>
                  <Text style={styles.templateBody} numberOfLines={3}>{template.description}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}
        <Field label="Activity title" required value={activityForm.title} onChangeText={(value) => setActivityForm((current) => ({ ...current, title: value }))} styles={styles} />
        <Text style={styles.fieldLabel}>Activity type</Text>
        <ChipRow value={activityForm.activity_type} values={activityTypes} onChange={(value) => setActivityForm((current) => ({ ...current, activity_type: value }))} styles={styles} />
        <Text style={styles.fieldLabel}>Engagement mode</Text>
        <ChipRow value={activityForm.engagement_mode} values={engagementModes} onChange={(value) => setActivityForm((current) => ({ ...current, engagement_mode: value }))} styles={styles} />
        <Text style={styles.fieldLabel}>Category</Text>
        <ChipRow value={activityForm.category} values={categories} onChange={(value) => setActivityForm((current) => ({ ...current, category: value }))} styles={styles} />
        <Text style={styles.fieldLabel}>Target audience</Text>
        <ChipRow value={activityForm.target_audience} values={audiences} onChange={(value) => setActivityForm((current) => ({ ...current, target_audience: value }))} styles={styles} />
        <Field label="Date (YYYY-MM-DD)" required value={activityForm.activity_date} onChangeText={(value) => setActivityForm((current) => ({ ...current, activity_date: value }))} styles={styles} />
        <Text style={styles.fieldLabel}>Status</Text>
        <ChipRow value={activityForm.status} values={['planned', 'confirmed', 'in_progress', 'completed', 'deferred', 'cancelled']} onChange={(value) => setActivityForm((current) => ({ ...current, status: value }))} styles={styles} />
        <Field label="Planned minutes" value={activityForm.estimated_minutes} onChangeText={(value) => setActivityForm((current) => ({ ...current, estimated_minutes: value }))} keyboardType="numeric" styles={styles} />
        <Field label="Actual minutes" value={activityForm.actual_minutes} onChangeText={(value) => setActivityForm((current) => ({ ...current, actual_minutes: value }))} keyboardType="numeric" styles={styles} />
        <Field label="Organization or business" value={activityForm.organization_name} onChangeText={(value) => setActivityForm((current) => ({ ...current, organization_name: value }))} styles={styles} />
        <Field label="Venue" value={activityForm.venue_name} onChangeText={(value) => setActivityForm((current) => ({ ...current, venue_name: value }))} styles={styles} />
        <Field label="City" value={activityForm.city} onChangeText={(value) => setActivityForm((current) => ({ ...current, city: value }))} styles={styles} />
        <Field label="State" value={activityForm.state} onChangeText={(value) => setActivityForm((current) => ({ ...current, state: value }))} styles={styles} />
        <Field label="Goal" value={activityForm.goal} onChangeText={(value) => setActivityForm((current) => ({ ...current, goal: value }))} styles={styles} />
        <View style={styles.formSection}>
          <Text style={styles.formSectionTitle}>Results</Text>
          {[
            ['Contacts', 'actual_contacts'],
            ['Conversations', 'conversations'],
            ['QR scans', 'qr_scans'],
            ['Materials', 'materials_distributed'],
            ['Leads', 'leads_generated'],
            ['Verified signups', 'verified_signups'],
            ['Completed bookings', 'completed_bookings'],
          ].map(([label, key]) => (
            <Field
              key={key}
              label={label}
              value={activityForm[key as keyof ActivityForm] as string}
              onChangeText={(value) => setActivityForm((current) => ({ ...current, [key]: value }))}
              keyboardType="numeric"
              styles={styles}
            />
          ))}
        </View>
        <Field label="Outcome summary" value={activityForm.outcome_summary} onChangeText={(value) => setActivityForm((current) => ({ ...current, outcome_summary: value }))} multiline styles={styles} />
        <Field label="Notes" value={activityForm.notes} onChangeText={(value) => setActivityForm((current) => ({ ...current, notes: value }))} multiline styles={styles} />
        <SwitchField
          label="Request Headquarters assistance"
          detail="Use this for event approvals, materials, partnerships, safety concerns, or follow-up assistance."
          value={activityForm.needs_admin_help}
          onChange={(value) => setActivityForm((current) => ({ ...current, needs_admin_help: value }))}
          styles={styles}
          theme={theme}
        />
        {activityForm.needs_admin_help ? (
          <Field label="What help do you need?" value={activityForm.admin_help_reason} onChangeText={(value) => setActivityForm((current) => ({ ...current, admin_help_reason: value }))} multiline styles={styles} />
        ) : null}
      </FormModal>

      <FormModal
        visible={composer === 'lead'}
        title={editingId ? 'Update lead' : 'Add lead'}
        subtitle="Capture the opportunity quickly. Headquarters receives it while your Ambassador attribution remains connected."
        saving={saving}
        styles={styles}
        theme={theme}
        onClose={() => {
          setComposer(null);
          setEditingId(null);
        }}
        onSave={() => void saveLead()}>
        <Text style={styles.fieldLabel}>Lead type</Text>
        <ChipRow value={leadForm.lead_type} values={leadTypes} onChange={(value) => setLeadForm((current) => ({ ...current, lead_type: value }))} styles={styles} />
        <Text style={styles.fieldLabel}>Status</Text>
        <ChipRow value={leadForm.lead_status} values={['new', 'received_by_headquarters', 'admin_assigned', 'contacted', 'follow_up', 'converted', 'closed']} onChange={(value) => setLeadForm((current) => ({ ...current, lead_status: value }))} styles={styles} />
        <Field label="First name" value={leadForm.first_name} onChangeText={(value) => setLeadForm((current) => ({ ...current, first_name: value }))} styles={styles} />
        <Field label="Last name" value={leadForm.last_name} onChangeText={(value) => setLeadForm((current) => ({ ...current, last_name: value }))} styles={styles} />
        <Field label="Email" value={leadForm.email} onChangeText={(value) => setLeadForm((current) => ({ ...current, email: value }))} keyboardType="email-address" styles={styles} />
        <Field label="Phone" value={leadForm.phone} onChangeText={(value) => setLeadForm((current) => ({ ...current, phone: value }))} keyboardType="phone-pad" styles={styles} />
        <Field label="Business name" value={leadForm.business_name} onChangeText={(value) => setLeadForm((current) => ({ ...current, business_name: value }))} styles={styles} />
        <Field label="Organization" value={leadForm.organization_name} onChangeText={(value) => setLeadForm((current) => ({ ...current, organization_name: value }))} styles={styles} />
        <Field label="City" value={leadForm.city} onChangeText={(value) => setLeadForm((current) => ({ ...current, city: value }))} styles={styles} />
        <Field label="State" value={leadForm.state} onChangeText={(value) => setLeadForm((current) => ({ ...current, state: value }))} styles={styles} />
        <Field label="ZIP code" value={leadForm.zip_code} onChangeText={(value) => setLeadForm((current) => ({ ...current, zip_code: value }))} keyboardType="numeric" styles={styles} />
        <Text style={styles.fieldLabel}>Source</Text>
        <ChipRow value={leadForm.source_type} values={['Face-to-Face', 'Event or Expo', 'Business Visit', 'Campus', 'Professional Introduction', 'Social Media', 'Email', 'Phone', 'Referral Link', 'QR Code', 'Other']} onChange={(value) => setLeadForm((current) => ({ ...current, source_type: value }))} styles={styles} />
        <Field label="Where or how did you meet?" value={leadForm.source_detail} onChangeText={(value) => setLeadForm((current) => ({ ...current, source_detail: value }))} styles={styles} />
        <Text style={styles.fieldLabel}>Target audience</Text>
        <ChipRow value={leadForm.target_audience} values={audiences} onChange={(value) => setLeadForm((current) => ({ ...current, target_audience: value }))} styles={styles} />
        <Field label="Next follow-up (YYYY-MM-DD)" value={leadForm.next_follow_up} onChangeText={(value) => setLeadForm((current) => ({ ...current, next_follow_up: value }))} styles={styles} />
        <Field label="Next action" value={leadForm.next_action} onChangeText={(value) => setLeadForm((current) => ({ ...current, next_action: value }))} styles={styles} />
        <Field label="Notes" value={leadForm.notes} onChangeText={(value) => setLeadForm((current) => ({ ...current, notes: value }))} multiline styles={styles} />
        <SwitchField label="Permission to contact" detail="Confirm the person or organization agreed to receive SitGuru follow-up." value={leadForm.consent_to_contact} onChange={(value) => setLeadForm((current) => ({ ...current, consent_to_contact: value }))} styles={styles} theme={theme} />
        <SwitchField label="Request Headquarters assistance" detail="Admin will see this lead in the assistance queue." value={leadForm.admin_assistance_requested} onChange={(value) => setLeadForm((current) => ({ ...current, admin_assistance_requested: value }))} styles={styles} theme={theme} />
        {leadForm.admin_assistance_requested ? (
          <Field label="What assistance is needed?" value={leadForm.admin_assistance_reason} onChangeText={(value) => setLeadForm((current) => ({ ...current, admin_assistance_reason: value }))} multiline styles={styles} />
        ) : null}
      </FormModal>

      <FormModal
        visible={composer === 'marketing_effort'}
        title="Log marketing effort"
        subtitle="Track social, email, print, campus, professional, and community marketing."
        saving={saving}
        styles={styles}
        theme={theme}
        onClose={() => setComposer(null)}
        onSave={() => void saveMarketing()}>
        <Field label="Title" required value={marketingForm.title} onChangeText={(value) => setMarketingForm((current) => ({ ...current, title: value }))} styles={styles} />
        <Field label="Date (YYYY-MM-DD)" required value={marketingForm.effort_date} onChangeText={(value) => setMarketingForm((current) => ({ ...current, effort_date: value }))} styles={styles} />
        <Text style={styles.fieldLabel}>Effort type</Text>
        <ChipRow value={marketingForm.effort_type} values={marketingTypes} onChange={(value) => setMarketingForm((current) => ({ ...current, effort_type: value }))} styles={styles} />
        <Text style={styles.fieldLabel}>Platform or channel</Text>
        <ChipRow value={marketingForm.platform} values={platforms} onChange={(value) => setMarketingForm((current) => ({ ...current, platform: value }))} styles={styles} />
        <Text style={styles.fieldLabel}>Target audience</Text>
        <ChipRow value={marketingForm.target_audience} values={audiences} onChange={(value) => setMarketingForm((current) => ({ ...current, target_audience: value }))} styles={styles} />
        <Field label="Campaign" value={marketingForm.campaign_name} onChangeText={(value) => setMarketingForm((current) => ({ ...current, campaign_name: value }))} styles={styles} />
        <Field label="Target location" value={marketingForm.target_location} onChangeText={(value) => setMarketingForm((current) => ({ ...current, target_location: value }))} styles={styles} />
        <Field label="Description" value={marketingForm.description} onChangeText={(value) => setMarketingForm((current) => ({ ...current, description: value }))} multiline styles={styles} />
        <Field label="Content URL" value={marketingForm.content_url} onChangeText={(value) => setMarketingForm((current) => ({ ...current, content_url: value }))} keyboardType="url" styles={styles} />
        <Field label="Call to action" value={marketingForm.call_to_action} onChangeText={(value) => setMarketingForm((current) => ({ ...current, call_to_action: value }))} styles={styles} />
        {[
          ['Minutes spent', 'minutes_spent'],
          ['Spend', 'spend_amount'],
          ['Reach', 'reach'],
          ['Engagements', 'engagements'],
          ['Clicks', 'clicks'],
          ['QR scans', 'qr_scans'],
          ['Materials', 'materials_distributed'],
          ['Leads', 'leads_generated'],
          ['Verified signups', 'verified_signups'],
          ['Bookings', 'completed_bookings'],
        ].map(([label, key]) => (
          <Field
            key={key}
            label={label}
            value={marketingForm[key as keyof MarketingForm] as string}
            onChangeText={(value) => setMarketingForm((current) => ({ ...current, [key]: value }))}
            keyboardType="numeric"
            styles={styles}
          />
        ))}
        <Text style={styles.fieldLabel}>Status</Text>
        <ChipRow value={marketingForm.status} values={['planned', 'draft', 'published', 'completed', 'cancelled']} onChange={(value) => setMarketingForm((current) => ({ ...current, status: value }))} styles={styles} />
        <Field label="Outcome summary" value={marketingForm.outcome_summary} onChangeText={(value) => setMarketingForm((current) => ({ ...current, outcome_summary: value }))} multiline styles={styles} />
        <Field label="Notes" value={marketingForm.notes} onChangeText={(value) => setMarketingForm((current) => ({ ...current, notes: value }))} multiline styles={styles} />
        <SwitchField label="Request Headquarters assistance" detail="Use this for approved content, brand guidance, campaign support, or follow-up." value={marketingForm.needs_admin_help} onChange={(value) => setMarketingForm((current) => ({ ...current, needs_admin_help: value }))} styles={styles} theme={theme} />
      </FormModal>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      position: 'relative',
      backgroundColor: theme.colors.screen,
    },
    previewCanvas: {
      alignItems: 'center',
      justifyContent: 'flex-start',
      minHeight: 930,
      paddingHorizontal: 16,
      paddingVertical: 22,
      width: '100%',
    },
    previewCanvasNative: {
      flex: 1,
      minHeight: 0,
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
    deviceFrame: {
      backgroundColor: '#111713',
      borderColor: '#2E3631',
      borderRadius: 42,
      borderWidth: 2,
      maxWidth: 430,
      overflow: 'hidden',
      paddingBottom: 15,
      paddingHorizontal: 8,
      paddingTop: 10,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.27,
      shadowRadius: 28,
      width: '100%',
    },
    deviceFrameNative: {
      backgroundColor: 'transparent',
      borderRadius: 0,
      borderWidth: 0,
      flex: 1,
      maxWidth: '100%',
      overflow: 'visible',
      paddingBottom: 0,
      paddingHorizontal: 0,
      paddingTop: 0,
      shadowOpacity: 0,
    },
    deviceTopSpeaker: {
      alignSelf: 'center',
      backgroundColor: '#303832',
      borderRadius: 999,
      height: 6,
      marginBottom: 9,
      width: 86,
    },
    phoneShell: {
      backgroundColor: theme.colors.screen,
      borderColor: theme.colors.border,
      borderRadius: 34,
      borderWidth: 1,
      height: 844,
      overflow: 'hidden',
      width: '100%',
    },
    phoneShellNative: {
      borderRadius: 0,
      borderWidth: 0,
      flex: 1,
      height: '100%',
    },
    appScreen: {
      backgroundColor: theme.colors.screen,
      flex: 1,
      width: '100%',
    },
    homeIndicator: {
      alignSelf: 'center',
      backgroundColor: '#F3F1EA',
      borderRadius: 999,
      height: 5,
      marginTop: 9,
      width: 116,
    },
    statusBar: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      minHeight: 31,
      paddingHorizontal: 16,
      paddingTop: 7,
    },
    statusTime: {
      color: theme.colors.text,
      fontFamily: Fonts.bold,
      fontSize: 12,
    },
    statusIcons: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    signalBars: {
      alignItems: 'flex-end',
      flexDirection: 'row',
      gap: 2,
    },
    signalBar: {
      backgroundColor: theme.colors.text,
      borderRadius: 2,
      width: 3,
    },
    wifiText: {
      color: theme.colors.text,
      fontFamily: Fonts.bold,
      fontSize: 11,
    },
    batteryWrap: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 2,
    },
    batteryBody: {
      borderColor: theme.colors.text,
      borderRadius: 3,
      borderWidth: 1,
      height: 9,
      padding: 1,
      width: 17,
    },
    batteryFill: {
      backgroundColor: theme.colors.text,
      borderRadius: 2,
      flex: 1,
    },
    batteryCap: {
      backgroundColor: theme.colors.text,
      height: 4,
      width: 2,
    },
    centerScreen: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      padding: 28,
      backgroundColor: theme.colors.screen,
    },
    centerTitle: {
      color: theme.colors.text,
      fontFamily: Fonts.extraBold,
      fontSize: 23,
      textAlign: 'center',
    },
    centerBody: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.medium,
      fontSize: 14,
      lineHeight: 21,
      textAlign: 'center',
    },
    header: {
      minHeight: 86,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      backgroundColor: theme.colors.screen,
    },
    headerControlPressed: {
      opacity: 0.72,
      transform: [{ scale: 0.97 }],
    },
    headerCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
      paddingRight: 6,
    },
    dashboardReturnButton: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.border,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 4,
      justifyContent: 'center',
      marginTop: 5,
      minHeight: 28,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },
    dashboardReturnText: {
      color: theme.colors.primary,
      fontFamily: Fonts.extraBold,
      fontSize: 8,
      lineHeight: 11,
    },
    headerTitle: {
      color: theme.colors.text,
      fontFamily: Fonts.extraBold,
      fontSize: 20,
      letterSpacing: -0.4,
    },
    welcomeText: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.medium,
      fontSize: 11,
    },
    wave: {
      fontSize: 11,
    },
    roleStatusRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 5,
    },
    roleStatusDot: {
      width: 7,
      height: 7,
      borderRadius: 999,
      backgroundColor: theme.colors.primary,
    },
    roleStatusText: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.medium,
      fontSize: 9,
      lineHeight: 13,
    },
    headerActions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    headerIconButton: {
      width: 38,
      height: 38,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.elevatedCard,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    modeToggle: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 2,
      padding: 2,
      borderRadius: 13,
      backgroundColor: theme.colors.elevatedCard,
      borderWidth: 1.2,
      borderColor: theme.colors.warning,
    },
    modeButton: {
      width: 31,
      height: 28,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modeButtonActive: {
      backgroundColor: `${theme.colors.warning}18`,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      borderWidth: 2,
      borderColor: theme.colors.elevatedCard,
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarText: {
      color: '#FFFFFF',
      fontFamily: Fonts.extraBold,
      fontSize: 15,
    },
    content: { padding: 14, gap: 14 },
    contentTablet: {
      alignSelf: 'center',
      maxWidth: 920,
      padding: 22,
      width: '100%',
    },
    hero: {
      padding: 18,
      borderRadius: 26,
      backgroundColor: theme.colors.heroBackground,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
    },
    heroPill: {
      alignSelf: 'flex-start',
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: theme.colors.elevatedCard,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    heroPillText: {
      color: theme.colors.primary,
      fontFamily: Fonts.extraBold,
      fontSize: 8,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    heroTitle: {
      marginTop: 13,
      color: theme.colors.text,
      fontFamily: Fonts.extraBold,
      fontSize: 30,
      lineHeight: 35,
      letterSpacing: -0.9,
    },
    heroBody: {
      marginTop: 8,
      color: theme.colors.textSecondary,
      fontFamily: Fonts.semiBold,
      fontSize: 13,
      lineHeight: 20,
    },
    heroActions: { marginTop: 15, flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
    button: {
      minHeight: 48,
      paddingHorizontal: 14,
      borderRadius: 999,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      borderWidth: 1,
    },
    buttonPrimary: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    buttonSecondary: { backgroundColor: theme.colors.elevatedCard, borderColor: theme.colors.borderStrong },
    buttonText: { fontFamily: Fonts.extraBold, fontSize: 11 },
    buttonTextPrimary: { color: '#FFFFFF' },
    pressed: { opacity: 0.8 },
    disabled: { opacity: 0.55 },
    feedback: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 10,
      borderRadius: 16,
      borderWidth: 1,
      padding: 12,
    },
    feedbackSuccess: { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.primary },
    feedbackError: { backgroundColor: `${theme.colors.danger}18`, borderColor: theme.colors.danger },
    feedbackInfo: { backgroundColor: `${theme.colors.info}18`, borderColor: theme.colors.info },
    feedbackText: { flex: 1, color: theme.colors.text, fontFamily: Fonts.bold, fontSize: 11, lineHeight: 17 },
    warning: { borderRadius: 16, borderWidth: 1, borderColor: theme.colors.warning, padding: 12, backgroundColor: `${theme.colors.warning}18` },
    warningText: { color: theme.colors.text, fontFamily: Fonts.bold, fontSize: 11, lineHeight: 17 },
    statRow: { gap: 9, paddingRight: 14 },
    statCard: {
      width: 126,
      minHeight: 128,
      padding: 12,
      borderRadius: 19,
      backgroundColor: theme.colors.elevatedCard,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    statIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primarySoft },
    statLabel: { marginTop: 9, color: theme.colors.textSecondary, fontFamily: Fonts.extraBold, fontSize: 8, letterSpacing: 0.7, textTransform: 'uppercase' },
    statValue: { marginTop: 3, color: theme.colors.text, fontFamily: Fonts.extraBold, fontSize: 23 },
    statDetail: { marginTop: 2, color: theme.colors.textSecondary, fontFamily: Fonts.medium, fontSize: 9, lineHeight: 14 },
    portalLinksSection: {
      gap: 8,
      position: 'relative',
      zIndex: 5,
    },
    portalLinksEyebrow: {
      color: theme.colors.primary,
      fontFamily: Fonts.extraBold,
      fontSize: 8,
      letterSpacing: 0.9,
      marginBottom: 1,
    },
    portalLinkButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 17,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 9,
      minHeight: 62,
      paddingHorizontal: 11,
      paddingVertical: 9,
      elevation: 2,
      position: 'relative',
      zIndex: 6,
    },
    portalLinkIcon: {
      alignItems: 'center',
      backgroundColor: theme.colors.primarySoft,
      borderRadius: 12,
      height: 38,
      justifyContent: 'center',
      width: 38,
    },
    portalLinkCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    portalLinkTitle: {
      color: theme.colors.text,
      fontFamily: Fonts.extraBold,
      fontSize: 10,
    },
    portalLinkDetail: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.medium,
      fontSize: 8,
      lineHeight: 12,
    },
    tabRow: { gap: 7, paddingRight: 14 },
    tab: { minHeight: 46, paddingHorizontal: 12, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.elevatedCard, borderWidth: 1, borderColor: theme.colors.border },
    tabActive: { backgroundColor: theme.colors.chipActive, borderColor: theme.colors.chipActive },
    tabText: { color: theme.colors.textSecondary, fontFamily: Fonts.bold, fontSize: 10 },
    tabTextActive: { color: theme.colors.chipActiveText },
    section: { borderRadius: 24, padding: 14, backgroundColor: theme.colors.elevatedCard, borderWidth: 1, borderColor: theme.colors.border },
    sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingBottom: 12, borderBottomWidth: 1, borderColor: theme.colors.border },
    sectionCopy: { flex: 1 },
    eyebrow: { color: theme.colors.primary, fontFamily: Fonts.extraBold, fontSize: 8, letterSpacing: 0.9, textTransform: 'uppercase' },
    sectionTitle: { marginTop: 4, color: theme.colors.text, fontFamily: Fonts.extraBold, fontSize: 20, lineHeight: 25 },
    sectionBody: { marginTop: 4, color: theme.colors.textSecondary, fontFamily: Fonts.medium, fontSize: 10, lineHeight: 16 },
    roundAdd: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary },
    list: { gap: 10, paddingTop: 12 },
    recordCard: { padding: 13, borderRadius: 18, backgroundColor: theme.colors.softCard, borderWidth: 1, borderColor: theme.colors.border },
    recordTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    recordCopy: { flex: 1 },
    badgeRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7 },
    badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: theme.colors.primarySoft },
    badgeText: { color: theme.colors.primary, fontFamily: Fonts.extraBold, fontSize: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
    recordDate: { color: theme.colors.primary, fontFamily: Fonts.extraBold, fontSize: 9 },
    recordTitle: { marginTop: 8, color: theme.colors.text, fontFamily: Fonts.extraBold, fontSize: 16, lineHeight: 21 },
    recordMeta: { marginTop: 3, color: theme.colors.textSecondary, fontFamily: Fonts.bold, fontSize: 9, lineHeight: 14 },
    recordBody: { marginTop: 8, color: theme.colors.textSecondary, fontFamily: Fonts.medium, fontSize: 10, lineHeight: 16 },
    recordStrong: { color: theme.colors.text, fontFamily: Fonts.bold },
    metricRow: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    metricPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5, overflow: 'hidden', color: theme.colors.textSecondary, backgroundColor: theme.colors.elevatedCard, fontFamily: Fonts.bold, fontSize: 8 },
    helpBanner: { marginTop: 10, padding: 9, borderRadius: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 7, backgroundColor: `${theme.colors.warning}18`, borderWidth: 1, borderColor: `${theme.colors.warning}55` },
    helpText: { flex: 1, color: theme.colors.text, fontFamily: Fonts.bold, fontSize: 9, lineHeight: 14 },
    actionRow: { marginTop: 11, flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    iconButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.elevatedCard, borderWidth: 1, borderColor: theme.colors.border },
    empty: { alignItems: 'center', gap: 8, padding: 22, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: theme.colors.borderStrong, backgroundColor: theme.colors.softCard },
    emptyTitle: { color: theme.colors.text, fontFamily: Fonts.extraBold, fontSize: 15, textAlign: 'center' },
    emptyBody: { color: theme.colors.textSecondary, fontFamily: Fonts.medium, fontSize: 10, lineHeight: 16, textAlign: 'center' },
    headquarters: { padding: 16, gap: 8, borderRadius: 24, backgroundColor: theme.colors.primarySoft, borderWidth: 1, borderColor: theme.colors.primary },
    headquartersTitle: { color: theme.colors.text, fontFamily: Fonts.extraBold, fontSize: 19 },
    headquartersBody: { color: theme.colors.textSecondary, fontFamily: Fonts.semiBold, fontSize: 10, lineHeight: 16 },
    calendarToolbar: { marginTop: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    weekRow: { marginTop: 13, flexDirection: 'row' },
    weekText: { width: `${100 / 7}%`, color: theme.colors.textSecondary, fontFamily: Fonts.extraBold, fontSize: 8, textAlign: 'center' },
    calendarGrid: { marginTop: 4, flexDirection: 'row', flexWrap: 'wrap' },
    calendarDay: { width: `${100 / 7}%`, aspectRatio: 0.92, alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 11 },
    calendarDayMuted: { opacity: 0.35 },
    calendarDaySelected: { backgroundColor: theme.colors.primary },
    calendarDayText: { color: theme.colors.text, fontFamily: Fonts.bold, fontSize: 10 },
    calendarDayTextActive: { color: '#FFFFFF' },
    calendarDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: theme.colors.accent },
    selectedDate: { marginTop: 13, padding: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.colors.softCard, borderWidth: 1, borderColor: theme.colors.border },
    selectedDateCopy: { flex: 1 },
    selectedDateTitle: { color: theme.colors.text, fontFamily: Fonts.extraBold, fontSize: 13 },
    selectedDateBody: { marginTop: 2, color: theme.colors.textSecondary, fontFamily: Fonts.medium, fontSize: 9 },
    searchBar: { marginTop: 12, minHeight: 44, paddingHorizontal: 12, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.colors.input, borderWidth: 1, borderColor: theme.colors.border },
    searchInput: { flex: 1, color: theme.colors.inputText, fontFamily: Fonts.semiBold, fontSize: 12 },
    rewardHeaderIcon: {
      alignItems: 'center',
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.border,
      borderRadius: 16,
      borderWidth: 1,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    rewardQuickGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 9,
      paddingTop: 12,
    },
    rewardQuickCard: {
      backgroundColor: theme.colors.softCard,
      borderColor: theme.colors.border,
      borderRadius: 18,
      borderWidth: 1,
      flexBasis: 138,
      flexGrow: 1,
      minHeight: 112,
      padding: 13,
    },
    rewardQuickValue: {
      color: theme.colors.text,
      fontFamily: Fonts.extraBold,
      fontSize: 24,
      marginTop: 9,
    },
    rewardQuickValueSmall: {
      color: theme.colors.text,
      fontFamily: Fonts.extraBold,
      fontSize: 17,
      marginTop: 10,
    },
    rewardQuickLabel: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.bold,
      fontSize: 9,
      lineHeight: 14,
      marginTop: 3,
    },
    payoutCard: {
      backgroundColor: theme.colors.softCard,
      borderColor: theme.colors.borderStrong,
      borderRadius: 22,
      borderWidth: 1,
      gap: 12,
      marginTop: 12,
      padding: 15,
    },
    payoutCardReady: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primary,
    },
    payoutTopRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 11,
    },
    payoutIcon: {
      alignItems: 'center',
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 16,
      borderWidth: 1,
      height: 46,
      justifyContent: 'center',
      width: 46,
    },
    payoutCopy: {
      flex: 1,
      minWidth: 0,
    },
    payoutEyebrow: {
      color: theme.colors.primary,
      fontFamily: Fonts.extraBold,
      fontSize: 8,
      letterSpacing: 0.9,
      textTransform: 'uppercase',
    },
    payoutTitle: {
      color: theme.colors.text,
      fontFamily: Fonts.extraBold,
      fontSize: 18,
      lineHeight: 23,
      marginTop: 2,
    },
    payoutBody: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.semiBold,
      fontSize: 11,
      lineHeight: 17,
    },
    rewardSteps: {
      backgroundColor: theme.colors.softCard,
      borderColor: theme.colors.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 9,
      marginTop: 12,
      padding: 14,
    },
    rewardStepsTitle: {
      color: theme.colors.text,
      fontFamily: Fonts.extraBold,
      fontSize: 15,
    },
    rewardStepRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
    },
    rewardStepNumber: {
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      borderRadius: 999,
      height: 28,
      justifyContent: 'center',
      width: 28,
    },
    rewardStepNumberText: {
      color: '#FFFFFF',
      fontFamily: Fonts.extraBold,
      fontSize: 10,
    },
    rewardStepText: {
      color: theme.colors.textSecondary,
      flex: 1,
      fontFamily: Fonts.bold,
      fontSize: 10,
      lineHeight: 16,
    },
    noMysteryCard: {
      alignItems: 'flex-start',
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.border,
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      marginVertical: 12,
      padding: 13,
    },
    noMysteryCopy: {
      flex: 1,
      minWidth: 0,
    },
    noMysteryTitle: {
      color: theme.colors.text,
      fontFamily: Fonts.extraBold,
      fontSize: 13,
    },
    noMysteryBody: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.medium,
      fontSize: 10,
      lineHeight: 16,
      marginTop: 3,
    },
    accuracyNote: { padding: 13, borderRadius: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 9, backgroundColor: theme.colors.primarySoft, borderWidth: 1, borderColor: theme.colors.border },
    accuracyText: { flex: 1, color: theme.colors.text, fontFamily: Fonts.bold, fontSize: 10, lineHeight: 16 },
    bottomSpacer: { height: 100 },
    bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 20, elevation: 20, minHeight: 76, paddingHorizontal: 10, paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 18 : 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: theme.colors.tabBar, borderTopWidth: 1, borderColor: theme.colors.tabBarBorder },
    bottomNavItem: { minWidth: 54, alignItems: 'center', justifyContent: 'center', gap: 3 },
    bottomLabel: { color: theme.colors.textSecondary, fontFamily: Fonts.bold, fontSize: 8 },
    bottomLabelActive: { color: theme.colors.primary },
    bottomAdd: { width: 52, height: 52, marginTop: -24, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary, borderWidth: 4, borderColor: theme.colors.tabBar },
    webInlineOverlayRoot: {
      alignItems: 'center',
      bottom: 0,
      elevation: 1000,
      justifyContent: 'center',
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
      zIndex: 1000,
    },
    webInlinePhoneSurface: {
      backgroundColor: theme.colors.overlay,
      borderRadius: 34,
      height: 844,
      justifyContent: 'flex-end',
      maxHeight: 'calc(100vh - 44px)' as never,
      maxWidth: 414,
      overflow: 'hidden',
      width: '100%',
    },
    modalViewport: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      width: '100%',
    },
    webPhoneOverlay: {
      borderRadius: 34,
      flex: 0,
      height: 844,
      maxHeight: 'calc(100vh - 44px)' as never,
      maxWidth: 414,
      overflow: 'hidden',
      width: '100%',
    },
    sheetBackdrop: {
      backgroundColor: theme.colors.overlay,
      height: '100%',
      justifyContent: 'flex-end',
      padding: 12,
      width: '100%',
    },
    sheet: {
      alignSelf: 'stretch',
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 26,
      borderWidth: 1,
      maxHeight: '88%',
      padding: 16,
      paddingBottom: Platform.OS === 'ios' ? 28 : 18,
      width: '100%',
    },
    sheetHandle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, backgroundColor: theme.colors.borderStrong },
    sheetHeaderRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'space-between',
      marginTop: 10,
    },
    sheetTitle: {
      color: theme.colors.text,
      flex: 1,
      fontFamily: Fonts.extraBold,
      fontSize: 20,
      textAlign: 'left',
    },
    sheetCloseButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.softCard,
      borderColor: theme.colors.border,
      borderRadius: 18,
      borderWidth: 1,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    sheetItem: { marginTop: 10, padding: 12, borderRadius: 17, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: theme.colors.softCard, borderWidth: 1, borderColor: theme.colors.border },
    sheetIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primarySoft },
    sheetCopy: { flex: 1 },
    sheetItemTitle: { color: theme.colors.text, fontFamily: Fonts.extraBold, fontSize: 13 },
    sheetItemBody: { marginTop: 2, color: theme.colors.textSecondary, fontFamily: Fonts.medium, fontSize: 9, lineHeight: 14 },
    modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: theme.colors.overlay, width: '100%' },
    modalCard: { width: '100%', maxHeight: '93%', alignSelf: 'center', maxWidth: Platform.OS === 'web' ? 414 : 720, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: theme.colors.elevatedCard, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' },
    modalScroll: { flex: 1, minHeight: 0 },
    modalHeader: { padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderBottomWidth: 1, borderColor: theme.colors.border },
    modalHeaderCopy: { flex: 1 },
    modalTitle: { marginTop: 4, color: theme.colors.text, fontFamily: Fonts.extraBold, fontSize: 21, lineHeight: 26 },
    modalSubtitle: { marginTop: 4, color: theme.colors.textSecondary, fontFamily: Fonts.medium, fontSize: 10, lineHeight: 16 },
    modalContent: { padding: 16, gap: 13 },
    modalFooter: { padding: 12, flexDirection: 'row', justifyContent: 'flex-end', gap: 8, borderTopWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.softCard },
    field: { gap: 5 },
    fieldLabel: { color: theme.colors.text, fontFamily: Fonts.extraBold, fontSize: 10 },
    input: { minHeight: 46, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 13, color: theme.colors.inputText, backgroundColor: theme.colors.input, borderWidth: 1, borderColor: theme.colors.border, fontFamily: Fonts.semiBold, fontSize: 12 },
    inputMultiline: { minHeight: 100 },
    placeholder: { color: theme.colors.inputPlaceholder } as TextStyle,
    chipRow: { gap: 7, paddingRight: 12 },
    chip: { minHeight: 36, paddingHorizontal: 11, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.chip, borderWidth: 1, borderColor: theme.colors.border },
    chipActive: { backgroundColor: theme.colors.chipActive, borderColor: theme.colors.chipActive },
    chipText: { color: theme.colors.chipText, fontFamily: Fonts.bold, fontSize: 9 },
    chipTextActive: { color: theme.colors.chipActiveText },
    switchRow: { minHeight: 72, padding: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.colors.softCard, borderWidth: 1, borderColor: theme.colors.border },
    switchCopy: { flex: 1 },
    switchLabel: { color: theme.colors.text, fontFamily: Fonts.extraBold, fontSize: 11 },
    switchDetail: { marginTop: 3, color: theme.colors.textSecondary, fontFamily: Fonts.medium, fontSize: 9, lineHeight: 14 },
    formSection: { padding: 12, gap: 10, borderRadius: 17, backgroundColor: theme.colors.softCard, borderWidth: 1, borderColor: theme.colors.border },
    formSectionTitle: { color: theme.colors.text, fontFamily: Fonts.extraBold, fontSize: 13 },
    templateRow: { gap: 8, paddingRight: 12 },
    templateCard: { width: 166, minHeight: 88, padding: 10, borderRadius: 14, backgroundColor: theme.colors.elevatedCard, borderWidth: 1, borderColor: theme.colors.border },
    templateTitle: { color: theme.colors.text, fontFamily: Fonts.extraBold, fontSize: 10 },
    templateBody: { marginTop: 4, color: theme.colors.textSecondary, fontFamily: Fonts.medium, fontSize: 8, lineHeight: 12 },
  });
}