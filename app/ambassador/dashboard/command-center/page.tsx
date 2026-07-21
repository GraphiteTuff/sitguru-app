"use client";

import Link from "next/link";
import {
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CalendarPlus,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  GraduationCap,
  Handshake,
  Headphones,
  HeartHandshake,
  Home,
  Loader2,
  MapPin,
  Megaphone,
  MessageCircle,
  MoreHorizontal,
  PawPrint,
  Pencil,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Store,
  Target,
  Timer,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
  X,
} from "lucide-react";

type ViewMode =
  | "today"
  | "calendar"
  | "activities"
  | "marketing"
  | "leads";

type ComposerMode =
  | "activity"
  | "marketing_effort"
  | "lead"
  | null;

type CommandCenterResponse = {
  success: boolean;
  error?: string;
  details?: string;
  user?: {
    id: string;
    email: string | null;
  };
  ambassador?: AmbassadorIdentity;
  commandCenter?: CommandCenterData;
};

type SaveResponse = {
  success: boolean;
  message?: string;
  error?: string;
  details?: string;
  record?: Record<string, unknown>;
};

type AmbassadorIdentity = {
  id: string;
  user_id: string | null;
  full_name: string | null;
  referral_code: string | null;
  status: string | null;
  dashboard_enabled: boolean | null;
  login_enabled: boolean | null;
  ambassador_type?: string | null;
};

type ActivityTemplate = {
  id: string;
  title: string | null;
  description: string | null;
  category: string | null;
  activity_type: string | null;
  engagement_mode: string | null;
  default_duration_minutes: number | null;
  default_day_of_week: number | null;
  default_target_audience: string | null;
  is_active: boolean | null;
  sort_order: number | null;
};

type ActivityRecord = {
  id: string;
  ambassador_id: string;
  title: string | null;
  description: string | null;
  category: string | null;
  activity_type: string | null;
  engagement_mode: string | null;
  status: string | null;
  priority: string | null;
  activity_date: string | null;
  starts_at: string | null;
  ends_at: string | null;
  all_day: boolean | null;
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
  created_at: string | null;
  updated_at: string | null;
};

type MarketingEffort = {
  id: string;
  ambassador_id: string;
  activity_id: string | null;
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
  created_at: string | null;
  updated_at: string | null;
};

type LeadRecord = {
  id: string;
  ambassador_id: string;
  activity_id: string | null;
  marketing_effort_id: string | null;
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
  market_area: string | null;
  source_type: string | null;
  source_detail: string | null;
  campaign_name: string | null;
  target_audience: string | null;
  referral_code: string | null;
  consent_to_contact: boolean | null;
  preferred_contact_method: string | null;
  next_follow_up: string | null;
  next_action: string | null;
  outcome_goal: string | null;
  notes: string | null;
  admin_assistance_requested: boolean | null;
  admin_assistance_reason: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type CommandSummary = {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  scheduledActivities: number;
  completedActivities: number;
  upcomingActivities: number;
  totalMinutes: number;
  totalHours: number;
  contacts: number;
  conversations: number;
  qrScans: number;
  materialsDistributed: number;
  activityReportedLeads: number;
  verifiedSignups: number;
  completedBookings: number;
  generatedLeads: number;
  convertedLeads: number;
  leadsNeedingAdmin: number;
  leadsByStatus: Record<string, number>;
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

type FeedbackState = {
  tone: "success" | "error" | "info";
  message: string;
} | null;

type ActivityFormState = {
  template_id: string;
  title: string;
  description: string;
  category: string;
  activity_type: string;
  engagement_mode: string;
  status: string;
  priority: string;
  activity_date: string;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  estimated_minutes: string;
  actual_minutes: string;
  event_name: string;
  venue_name: string;
  organization_name: string;
  city: string;
  state: string;
  target_audience: string;
  goal: string;
  actual_contacts: string;
  conversations: string;
  qr_scans: string;
  referral_links_shared: string;
  materials_distributed: string;
  leads_generated: string;
  verified_signups: string;
  completed_bookings: string;
  outcome_summary: string;
  notes: string;
  needs_admin_help: boolean;
  admin_help_reason: string;
};

type MarketingFormState = {
  effort_date: string;
  effort_type: string;
  platform: string;
  campaign_name: string;
  target_audience: string;
  target_location: string;
  title: string;
  description: string;
  content_url: string;
  call_to_action: string;
  minutes_spent: string;
  spend_amount: string;
  impressions: string;
  reach: string;
  engagements: string;
  clicks: string;
  messages_received: string;
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

type LeadFormState = {
  lead_type: string;
  lead_status: string;
  lead_temperature: string;
  priority: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  business_name: string;
  organization_name: string;
  website_url: string;
  social_handle: string;
  city: string;
  state: string;
  zip_code: string;
  source_type: string;
  source_detail: string;
  campaign_name: string;
  target_audience: string;
  consent_to_contact: boolean;
  preferred_contact_method: string;
  next_follow_up: string;
  next_action: string;
  outcome_goal: string;
  notes: string;
  admin_assistance_requested: boolean;
  admin_assistance_reason: string;
};

const activityTypes = [
  "Campus Outreach",
  "Veterinary Practice Visit",
  "Pet Business Outreach",
  "Community Event",
  "Expo or Vendor Table",
  "Rescue or Adoption Event",
  "Professional Networking",
  "Partnership Meeting",
  "Social Media",
  "Email Outreach",
  "Phone Outreach",
  "Flyer or QR Distribution",
  "Lead Follow-Up",
  "Training",
  "Headquarters Assignment",
  "Weekly Review",
  "Other",
];

const engagementModes = [
  "Face-to-Face",
  "Event or Expo",
  "Business Visit",
  "Campus",
  "Community",
  "Phone",
  "Email",
  "Social Media",
  "Virtual Meeting",
  "Independent Work",
];

const activityCategories = [
  "Outreach",
  "Event",
  "Marketing",
  "Lead Follow-Up",
  "Partnership",
  "Training",
  "Headquarters",
  "Administration",
];

const leadTypes = [
  "Pet Parent Lead",
  "Guru Lead",
  "Ambassador Lead",
  "Partner Lead",
  "Pet Business Lead",
  "Veterinary Practice Lead",
  "Rescue or Shelter Lead",
  "Campus or Student Organization",
  "Community Organization",
  "General Contact",
];

const marketingEffortTypes = [
  "Social Post",
  "Story or Reel",
  "Email Campaign",
  "Community Group Post",
  "Business Flyer",
  "Campus Promotion",
  "Event Promotion",
  "Professional Outreach",
  "Partnership Campaign",
  "Printed Materials",
  "Other",
];

const platforms = [
  "Facebook",
  "Instagram",
  "TikTok",
  "X",
  "YouTube",
  "LinkedIn",
  "Email",
  "Website",
  "Printed Materials",
  "In Person",
  "Other",
];

const audienceOptions = [
  "Pet Parents",
  "Future Gurus",
  "Students",
  "Veterinary Professionals",
  "Pet Businesses",
  "Trainers and Groomers",
  "Rescues and Shelters",
  "Military and Veteran Community",
  "Community Organizations",
  "General Public",
];

const emptySummary: CommandSummary = {
  dateRange: {
    startDate: "",
    endDate: "",
  },
  scheduledActivities: 0,
  completedActivities: 0,
  upcomingActivities: 0,
  totalMinutes: 0,
  totalHours: 0,
  contacts: 0,
  conversations: 0,
  qrScans: 0,
  materialsDistributed: 0,
  activityReportedLeads: 0,
  verifiedSignups: 0,
  completedBookings: 0,
  generatedLeads: 0,
  convertedLeads: 0,
  leadsNeedingAdmin: 0,
  leadsByStatus: {},
  marketingEfforts: 0,
};

function todayInputValue() {
  const now = new Date();
  const local = new Date(
    now.getTime() - now.getTimezoneOffset() * 60_000,
  );
  return local.toISOString().slice(0, 10);
}

function addDays(dateValue: string, amount: number) {
  const date = new Date(`${dateValue}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  date.setDate(date.getDate() + amount);
  return date.toISOString().slice(0, 10);
}

function monthInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not scheduled";

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "Not scheduled";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value: string | null | undefined) {
  if (!value) return "";

  const match = value.match(/(\d{2}):(\d{2})/);

  if (!match) return value;

  const hour = Number(match[1]);
  const minute = match[2];

  return new Date(2026, 0, 1, hour, Number(minute)).toLocaleTimeString(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
    },
  );
}

function titleCase(value: string | null | undefined) {
  return (value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function numberValue(value: string) {
  if (!value.trim()) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function money(value: number | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

function activityStatusClasses(status: string | null | undefined) {
  const normalized = (status || "").toLowerCase();

  if (normalized === "completed") {
    return "bg-emerald-100 text-emerald-800 ring-emerald-200";
  }

  if (normalized === "in_progress") {
    return "bg-sky-100 text-sky-800 ring-sky-200";
  }

  if (normalized === "confirmed") {
    return "bg-violet-100 text-violet-800 ring-violet-200";
  }

  if (normalized === "cancelled") {
    return "bg-rose-100 text-rose-800 ring-rose-200";
  }

  if (normalized === "deferred") {
    return "bg-amber-100 text-amber-800 ring-amber-200";
  }

  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function leadStatusClasses(status: string | null | undefined) {
  const normalized = (status || "").toLowerCase();

  if (normalized === "converted") {
    return "bg-emerald-100 text-emerald-800 ring-emerald-200";
  }

  if (
    normalized === "contacted" ||
    normalized === "follow_up" ||
    normalized === "follow-up"
  ) {
    return "bg-sky-100 text-sky-800 ring-sky-200";
  }

  if (normalized === "closed" || normalized === "not_interested") {
    return "bg-slate-100 text-slate-700 ring-slate-200";
  }

  return "bg-amber-100 text-amber-800 ring-amber-200";
}

function newActivityForm(date = todayInputValue()): ActivityFormState {
  return {
    template_id: "",
    title: "",
    description: "",
    category: "Outreach",
    activity_type: "Community Event",
    engagement_mode: "Face-to-Face",
    status: "planned",
    priority: "normal",
    activity_date: date,
    starts_at: "",
    ends_at: "",
    all_day: false,
    estimated_minutes: "60",
    actual_minutes: "",
    event_name: "",
    venue_name: "",
    organization_name: "",
    city: "",
    state: "",
    target_audience: "Pet Parents",
    goal: "",
    actual_contacts: "",
    conversations: "",
    qr_scans: "",
    referral_links_shared: "",
    materials_distributed: "",
    leads_generated: "",
    verified_signups: "",
    completed_bookings: "",
    outcome_summary: "",
    notes: "",
    needs_admin_help: false,
    admin_help_reason: "",
  };
}

function newMarketingForm(): MarketingFormState {
  return {
    effort_date: todayInputValue(),
    effort_type: "Social Post",
    platform: "Instagram",
    campaign_name: "",
    target_audience: "Pet Parents",
    target_location: "",
    title: "",
    description: "",
    content_url: "",
    call_to_action: "",
    minutes_spent: "15",
    spend_amount: "",
    impressions: "",
    reach: "",
    engagements: "",
    clicks: "",
    messages_received: "",
    qr_scans: "",
    materials_distributed: "",
    leads_generated: "",
    verified_signups: "",
    completed_bookings: "",
    status: "planned",
    outcome_summary: "",
    notes: "",
    needs_admin_help: false,
  };
}

function newLeadForm(): LeadFormState {
  return {
    lead_type: "Pet Parent Lead",
    lead_status: "new",
    lead_temperature: "warm",
    priority: "normal",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    business_name: "",
    organization_name: "",
    website_url: "",
    social_handle: "",
    city: "",
    state: "",
    zip_code: "",
    source_type: "Face-to-Face",
    source_detail: "",
    campaign_name: "",
    target_audience: "Pet Parents",
    consent_to_contact: true,
    preferred_contact_method: "Email",
    next_follow_up: addDays(todayInputValue(), 1),
    next_action: "",
    outcome_goal: "",
    notes: "",
    admin_assistance_requested: false,
    admin_assistance_reason: "",
  };
}

function StatCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <article className="rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            {value}
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {detail}
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
          {icon}
        </div>
      </div>
    </article>
  );
}

function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
      <CalendarPlus className="mx-auto h-8 w-8 text-emerald-700" />
      <p className="mt-3 font-black text-slate-950">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
        {description}
      </p>
      <button
        type="button"
        onClick={onAction}
        className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-800"
      >
        <Plus className="h-4 w-4" />
        {actionLabel}
      </button>
    </div>
  );
}

function FieldLabel({
  children,
  required = false,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <span className="mb-1.5 block text-xs font-black text-slate-800">
      {children}
      {required ? <span className="ml-1 text-rose-600">*</span> : null}
    </span>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  min,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  min?: string;
  step?: string;
}) {
  return (
    <label className="block">
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        min={min}
        step={step}
        className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
}) {
  return (
    <label className="block">
      <FieldLabel required={required}>{label}</FieldLabel>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextAreaInput({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}

function CheckboxInput({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
      />
      <span>
        <span className="block text-sm font-black text-slate-900">
          {label}
        </span>
        {description ? (
          <span className="mt-1 block text-xs font-semibold leading-5 text-slate-600">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}

function ActivityCard({
  activity,
  busyId,
  onStatus,
  onEdit,
}: {
  activity: ActivityRecord;
  busyId: string | null;
  onStatus: (activity: ActivityRecord, status: string) => void;
  onEdit: (activity: ActivityRecord) => void;
}) {
  const isBusy = busyId === activity.id;
  const location = [
    activity.venue_name,
    activity.organization_name,
    [activity.city, activity.state].filter(Boolean).join(", "),
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <article className="rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ring-1 ${activityStatusClasses(
                activity.status,
              )}`}
            >
              {titleCase(activity.status || "planned")}
            </span>
            <span className="text-xs font-black text-emerald-700">
              {formatDate(activity.activity_date)}
            </span>
            {activity.starts_at ? (
              <span className="text-xs font-bold text-slate-500">
                {formatTime(activity.starts_at)}
              </span>
            ) : null}
          </div>

          <h3 className="mt-3 text-lg font-black tracking-tight text-slate-950">
            {activity.title || "Untitled activity"}
          </h3>

          <p className="mt-1 text-xs font-bold text-slate-500">
            {titleCase(activity.activity_type)} •{" "}
            {titleCase(activity.engagement_mode)}
          </p>

          {location ? (
            <p className="mt-2 flex items-start gap-2 text-sm font-semibold leading-6 text-slate-700">
              <MapPin className="mt-1 h-4 w-4 shrink-0 text-emerald-700" />
              {location}
            </p>
          ) : null}

          {activity.goal ? (
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
              <span className="font-black text-slate-900">Goal:</span>{" "}
              {activity.goal}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black text-slate-600">
            <span className="rounded-full bg-slate-100 px-3 py-1.5">
              <Clock3 className="mr-1 inline h-3.5 w-3.5" />
              {activity.actual_minutes
                ? `${Math.round(activity.actual_minutes / 60 * 10) / 10} actual hrs`
                : `${activity.estimated_minutes || 0} planned min`}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1.5">
              {activity.actual_contacts || 0} contacts
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1.5">
              {activity.leads_generated || 0} leads
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1.5">
              {activity.qr_scans || 0} scans
            </span>
          </div>

          {activity.needs_admin_help ? (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-900">
              <AlertCircle className="mr-1.5 inline h-4 w-4" />
              Headquarters assistance requested
              {activity.admin_help_reason
                ? `: ${activity.admin_help_reason}`
                : "."}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onEdit(activity)}
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-50"
          >
            <Pencil className="h-3.5 w-3.5" />
            Update
          </button>

          {activity.status !== "completed" ? (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onStatus(activity, "completed")}
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full bg-emerald-700 px-3 text-xs font-black text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {isBusy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Complete
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function LeadCard({
  lead,
  busyId,
  onStatus,
  onEdit,
}: {
  lead: LeadRecord;
  busyId: string | null;
  onStatus: (lead: LeadRecord, status: string) => void;
  onEdit: (lead: LeadRecord) => void;
}) {
  const displayName =
    lead.full_name ||
    [lead.first_name, lead.last_name].filter(Boolean).join(" ") ||
    lead.business_name ||
    lead.organization_name ||
    "Unnamed lead";

  return (
    <article className="rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ring-1 ${leadStatusClasses(
                lead.lead_status,
              )}`}
            >
              {titleCase(lead.lead_status || "new")}
            </span>
            <span className="text-xs font-black text-emerald-700">
              {titleCase(lead.lead_type)}
            </span>
            <span className="text-xs font-bold text-slate-500">
              {titleCase(lead.lead_temperature || "warm")}
            </span>
          </div>

          <h3 className="mt-3 text-lg font-black tracking-tight text-slate-950">
            {displayName}
          </h3>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-slate-700">
            {lead.email ? <span>{lead.email}</span> : null}
            {lead.phone ? <span>{lead.phone}</span> : null}
            {[lead.city, lead.state].filter(Boolean).length ? (
              <span>
                {[lead.city, lead.state].filter(Boolean).join(", ")}
              </span>
            ) : null}
          </div>

          <p className="mt-2 text-xs font-bold text-slate-500">
            Source: {titleCase(lead.source_type || "Ambassador outreach")}
            {lead.source_detail ? ` • ${lead.source_detail}` : ""}
          </p>

          {lead.next_action ? (
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
              <span className="font-black text-slate-900">Next:</span>{" "}
              {lead.next_action}
              {lead.next_follow_up
                ? ` by ${formatDate(lead.next_follow_up)}`
                : ""}
            </p>
          ) : null}

          {lead.admin_assistance_requested ? (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-900">
              <Headphones className="mr-1.5 inline h-4 w-4" />
              Sent to Headquarters for assistance
              {lead.admin_assistance_reason
                ? `: ${lead.admin_assistance_reason}`
                : "."}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onEdit(lead)}
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-50"
          >
            <Pencil className="h-3.5 w-3.5" />
            Update
          </button>

          {lead.lead_status !== "converted" ? (
            <button
              type="button"
              disabled={busyId === lead.id}
              onClick={() => onStatus(lead, "converted")}
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full bg-emerald-700 px-3 text-xs font-black text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {busyId === lead.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <BadgeCheck className="h-3.5 w-3.5" />
              )}
              Converted
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ComposerShell({
  title,
  description,
  saving,
  onClose,
  onSubmit,
  children,
}: {
  title: string;
  description: string;
  saving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={onSubmit}
        className="max-h-[94vh] w-full overflow-hidden rounded-t-[2rem] bg-white shadow-2xl sm:max-w-3xl sm:rounded-[2rem]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
              SitGuru Ambassador Portal
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              {title}
            </h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(94vh-165px)] overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-700 px-5 text-sm font-black text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AmbassadorCommandCenterPage() {
  const [view, setView] = useState<ViewMode>("today");
  const [composer, setComposer] = useState<ComposerMode>(null);
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [ambassador, setAmbassador] =
    useState<AmbassadorIdentity | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayInputValue());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [activityForm, setActivityForm] = useState<ActivityFormState>(
    newActivityForm(),
  );
  const [marketingForm, setMarketingForm] =
    useState<MarketingFormState>(newMarketingForm());
  const [leadForm, setLeadForm] =
    useState<LeadFormState>(newLeadForm());
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadData = useCallback(async (quiet = false) => {
    quiet ? setRefreshing(true) : setLoading(true);

    const start = addDays(todayInputValue(), -45);
    const end = addDays(todayInputValue(), 120);

    try {
      const response = await fetch(
        `/api/ambassador/command-center?start=${encodeURIComponent(
          start,
        )}&end=${encodeURIComponent(end)}`,
        {
          credentials: "include",
          cache: "no-store",
        },
      );

      const payload =
        (await response.json()) as CommandCenterResponse;

      if (!response.ok || !payload.success || !payload.commandCenter) {
        throw new Error(
          payload.error || "Unable to load the Ambassador Portal.",
        );
      }

      setData(payload.commandCenter);
      setAmbassador(payload.ambassador || null);
    } catch (error) {
      setFeedback({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to load the Ambassador Portal.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const summary = data?.summary || emptySummary;
  const activities = data?.activities || [];
  const marketingEfforts = data?.marketingEfforts || [];
  const leads = data?.leads || [];
  const templates = data?.templates || [];

  const todayActivities = useMemo(
    () =>
      activities.filter(
        (activity) => activity.activity_date === todayInputValue(),
      ),
    [activities],
  );

  const upcomingActivities = useMemo(
    () =>
      activities
        .filter(
          (activity) =>
            Boolean(activity.activity_date) &&
            activity.activity_date! >= todayInputValue() &&
            !["completed", "cancelled"].includes(
              activity.status || "",
            ),
        )
        .slice(0, 8),
    [activities],
  );

  const followUpLeads = useMemo(
    () =>
      leads
        .filter(
          (lead) =>
            Boolean(lead.next_follow_up) &&
            lead.next_follow_up! <= addDays(todayInputValue(), 7) &&
            !["converted", "closed"].includes(
              lead.lead_status || "",
            ),
        )
        .slice(0, 8),
    [leads],
  );

  const filteredActivities = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return activities;

    return activities.filter((activity) =>
      [
        activity.title,
        activity.activity_type,
        activity.engagement_mode,
        activity.event_name,
        activity.venue_name,
        activity.organization_name,
        activity.city,
        activity.state,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
    );
  }, [activities, search]);

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return leads;

    return leads.filter((lead) =>
      [
        lead.full_name,
        lead.first_name,
        lead.last_name,
        lead.email,
        lead.phone,
        lead.business_name,
        lead.organization_name,
        lead.lead_type,
        lead.lead_status,
        lead.city,
        lead.state,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
    );
  }, [leads, search]);

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const first = new Date(year, month, 1);
    const start = new Date(year, month, 1 - first.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);

      return {
        date,
        key: dateKey(date),
        inMonth: date.getMonth() === month,
      };
    });
  }, [calendarMonth]);

  const activitiesByDate = useMemo(() => {
    const grouped = new Map<string, ActivityRecord[]>();

    activities.forEach((activity) => {
      if (!activity.activity_date) return;

      const existing = grouped.get(activity.activity_date) || [];
      existing.push(activity);
      grouped.set(activity.activity_date, existing);
    });

    return grouped;
  }, [activities]);

  function openActivity(date = selectedDate) {
    setEditingId(null);
    setActivityForm(newActivityForm(date));
    setComposer("activity");
  }

  function openMarketing() {
    setEditingId(null);
    setMarketingForm(newMarketingForm());
    setComposer("marketing_effort");
  }

  function openLead() {
    setEditingId(null);
    setLeadForm(newLeadForm());
    setComposer("lead");
  }

  function editActivity(activity: ActivityRecord) {
    setEditingId(activity.id);
    setActivityForm({
      template_id: "",
      title: activity.title || "",
      description: activity.description || "",
      category: activity.category || "Outreach",
      activity_type: activity.activity_type || "Community Event",
      engagement_mode:
        activity.engagement_mode || "Face-to-Face",
      status: activity.status || "planned",
      priority: activity.priority || "normal",
      activity_date:
        activity.activity_date || todayInputValue(),
      starts_at: activity.starts_at?.slice(0, 5) || "",
      ends_at: activity.ends_at?.slice(0, 5) || "",
      all_day: Boolean(activity.all_day),
      estimated_minutes: String(activity.estimated_minutes || 60),
      actual_minutes:
        activity.actual_minutes === null
          ? ""
          : String(activity.actual_minutes || ""),
      event_name: activity.event_name || "",
      venue_name: activity.venue_name || "",
      organization_name: activity.organization_name || "",
      city: activity.city || "",
      state: activity.state || "",
      target_audience: activity.target_audience || "Pet Parents",
      goal: activity.goal || "",
      actual_contacts: String(activity.actual_contacts || ""),
      conversations: String(activity.conversations || ""),
      qr_scans: String(activity.qr_scans || ""),
      referral_links_shared: String(
        activity.referral_links_shared || "",
      ),
      materials_distributed: String(
        activity.materials_distributed || "",
      ),
      leads_generated: String(activity.leads_generated || ""),
      verified_signups: String(activity.verified_signups || ""),
      completed_bookings: String(
        activity.completed_bookings || "",
      ),
      outcome_summary: activity.outcome_summary || "",
      notes: activity.notes || "",
      needs_admin_help: Boolean(activity.needs_admin_help),
      admin_help_reason: activity.admin_help_reason || "",
    });
    setComposer("activity");
  }

  function editLead(lead: LeadRecord) {
    setEditingId(lead.id);
    setLeadForm({
      lead_type: lead.lead_type || "Pet Parent Lead",
      lead_status: lead.lead_status || "new",
      lead_temperature: lead.lead_temperature || "warm",
      priority: lead.priority || "normal",
      first_name: lead.first_name || "",
      last_name: lead.last_name || "",
      email: lead.email || "",
      phone: lead.phone || "",
      business_name: lead.business_name || "",
      organization_name: lead.organization_name || "",
      website_url: lead.website_url || "",
      social_handle: lead.social_handle || "",
      city: lead.city || "",
      state: lead.state || "",
      zip_code: lead.zip_code || "",
      source_type: lead.source_type || "Face-to-Face",
      source_detail: lead.source_detail || "",
      campaign_name: lead.campaign_name || "",
      target_audience: lead.target_audience || "Pet Parents",
      consent_to_contact: Boolean(lead.consent_to_contact),
      preferred_contact_method:
        lead.preferred_contact_method || "Email",
      next_follow_up: lead.next_follow_up || "",
      next_action: lead.next_action || "",
      outcome_goal: lead.outcome_goal || "",
      notes: lead.notes || "",
      admin_assistance_requested: Boolean(
        lead.admin_assistance_requested,
      ),
      admin_assistance_reason:
        lead.admin_assistance_reason || "",
    });
    setComposer("lead");
  }

  function useTemplate(template: ActivityTemplate) {
    setActivityForm((current) => ({
      ...current,
      template_id: template.id,
      title: template.title || current.title,
      description: template.description || current.description,
      category: template.category || current.category,
      activity_type:
        template.activity_type || current.activity_type,
      engagement_mode:
        template.engagement_mode || current.engagement_mode,
      estimated_minutes: String(
        template.default_duration_minutes || 60,
      ),
      target_audience:
        template.default_target_audience ||
        current.target_audience,
    }));
  }

  async function sendCommand(
    method: "POST" | "PATCH",
    entity: Exclude<ComposerMode, null>,
    payload: Record<string, unknown>,
    id?: string,
  ) {
    const response = await fetch(
      "/api/ambassador/command-center",
      {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entity,
          id,
          data: payload,
        }),
      },
    );

    const result = (await response.json()) as SaveResponse;

    if (!response.ok || !result.success) {
      throw new Error(
        result.error ||
          result.details ||
          "SitGuru could not save the record.",
      );
    }

    return result;
  }

  async function submitActivity(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setSaving(true);

    try {
      const result = await sendCommand(
        editingId ? "PATCH" : "POST",
        "activity",
        {
          template_id: activityForm.template_id || null,
          title: activityForm.title,
          description: activityForm.description,
          category: activityForm.category,
          activity_type: activityForm.activity_type,
          engagement_mode: activityForm.engagement_mode,
          status: activityForm.status,
          priority: activityForm.priority,
          activity_date: activityForm.activity_date,
          starts_at: activityForm.starts_at || null,
          ends_at: activityForm.ends_at || null,
          all_day: activityForm.all_day,
          estimated_minutes: numberValue(
            activityForm.estimated_minutes,
          ),
          actual_minutes: numberValue(
            activityForm.actual_minutes,
          ),
          event_name: activityForm.event_name,
          venue_name: activityForm.venue_name,
          organization_name: activityForm.organization_name,
          city: activityForm.city,
          state: activityForm.state,
          target_audience: activityForm.target_audience,
          goal: activityForm.goal,
          actual_contacts: numberValue(
            activityForm.actual_contacts,
          ),
          conversations: numberValue(
            activityForm.conversations,
          ),
          qr_scans: numberValue(activityForm.qr_scans),
          referral_links_shared: numberValue(
            activityForm.referral_links_shared,
          ),
          materials_distributed: numberValue(
            activityForm.materials_distributed,
          ),
          leads_generated: numberValue(
            activityForm.leads_generated,
          ),
          verified_signups: numberValue(
            activityForm.verified_signups,
          ),
          completed_bookings: numberValue(
            activityForm.completed_bookings,
          ),
          outcome_summary: activityForm.outcome_summary,
          notes: activityForm.notes,
          needs_admin_help: activityForm.needs_admin_help,
          admin_help_reason: activityForm.admin_help_reason,
        },
        editingId || undefined,
      );

      setComposer(null);
      setEditingId(null);
      setFeedback({
        tone: "success",
        message: result.message || "Activity saved.",
      });
      await loadData(true);
    } catch (error) {
      setFeedback({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to save the activity.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function submitMarketing(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setSaving(true);

    try {
      const result = await sendCommand(
        "POST",
        "marketing_effort",
        {
          effort_date: marketingForm.effort_date,
          effort_type: marketingForm.effort_type,
          platform: marketingForm.platform,
          campaign_name: marketingForm.campaign_name,
          target_audience: marketingForm.target_audience,
          target_location: marketingForm.target_location,
          title: marketingForm.title,
          description: marketingForm.description,
          content_url: marketingForm.content_url,
          call_to_action: marketingForm.call_to_action,
          minutes_spent: numberValue(
            marketingForm.minutes_spent,
          ),
          spend_amount: numberValue(marketingForm.spend_amount),
          impressions: numberValue(marketingForm.impressions),
          reach: numberValue(marketingForm.reach),
          engagements: numberValue(marketingForm.engagements),
          clicks: numberValue(marketingForm.clicks),
          messages_received: numberValue(
            marketingForm.messages_received,
          ),
          qr_scans: numberValue(marketingForm.qr_scans),
          materials_distributed: numberValue(
            marketingForm.materials_distributed,
          ),
          leads_generated: numberValue(
            marketingForm.leads_generated,
          ),
          verified_signups: numberValue(
            marketingForm.verified_signups,
          ),
          completed_bookings: numberValue(
            marketingForm.completed_bookings,
          ),
          status: marketingForm.status,
          outcome_summary: marketingForm.outcome_summary,
          notes: marketingForm.notes,
          needs_admin_help: marketingForm.needs_admin_help,
        },
      );

      setComposer(null);
      setFeedback({
        tone: "success",
        message: result.message || "Marketing effort saved.",
      });
      await loadData(true);
    } catch (error) {
      setFeedback({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to save the marketing effort.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function submitLead(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setSaving(true);

    try {
      const result = await sendCommand(
        editingId ? "PATCH" : "POST",
        "lead",
        {
          ...leadForm,
        },
        editingId || undefined,
      );

      setComposer(null);
      setEditingId(null);
      setFeedback({
        tone: "success",
        message:
          result.message ||
          "Lead saved and sent to SitGuru Headquarters.",
      });
      await loadData(true);
    } catch (error) {
      setFeedback({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to save the lead.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function updateRecordStatus(
    entity: "activity" | "lead",
    id: string,
    status: string,
  ) {
    setBusyId(id);

    try {
      const field =
        entity === "activity" ? "status" : "lead_status";
      const result = await sendCommand("PATCH", entity, {
        [field]: status,
      }, id);

      setFeedback({
        tone: "success",
        message: result.message || "Changes saved.",
      });
      await loadData(true);
    } catch (error) {
      setFeedback({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to save the update.",
      });
    } finally {
      setBusyId(null);
    }
  }

  function previousMonth() {
    setCalendarMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() - 1,
          1,
        ),
    );
  }

  function nextMonth() {
    setCalendarMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() + 1,
          1,
        ),
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center rounded-[2rem] border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
          <Loader2 className="h-9 w-9 animate-spin text-emerald-700" />
          <h1 className="mt-4 text-2xl font-black text-slate-950">
            Loading SitGuru Ambassador Portal
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Connecting your calendar, activities, marketing, and leads.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f7fffb_45%,#effcf5_100%)] px-3 py-4 text-slate-950 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-[1500px] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/ambassador/dashboard"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/ambassador/dashboard/training"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              <GraduationCap className="h-4 w-4" />
              Training
            </Link>
            <Link
              href="/ambassador/dashboard/support"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              <Headphones className="h-4 w-4" />
              Headquarters Help
            </Link>
            <button
              type="button"
              onClick={() => void loadData(true)}
              disabled={refreshing}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-800 disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
              Refresh
            </button>
          </div>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-6 bg-[radial-gradient(circle_at_86%_18%,rgba(255,255,255,0.96),transparent_20%),linear-gradient(120deg,#bbf7e1_0%,#dff9f0_46%,#ccefff_100%)] px-6 py-7 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800 shadow-sm">
                  SitGuru Ambassador Portal
                </span>
                <span className="rounded-full bg-emerald-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">
                  Your Ambassador working area
                </span>
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-[-0.045em] text-slate-950 sm:text-5xl">
                Welcome,{" "}
                {ambassador?.full_name?.split(" ")[0] || "Ambassador"}.
              </h1>

              <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-slate-800 sm:text-base">
                Plan your day, schedule outreach, log events and marketing,
                send leads to Headquarters, request help, and see the impact
                of your work in one place.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openActivity()}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-700 px-5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800"
                >
                  <CalendarPlus className="h-4 w-4" />
                  Add activity
                </button>
                <button
                  type="button"
                  onClick={openLead}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-black text-emerald-800 shadow-sm ring-1 ring-emerald-200 transition hover:bg-emerald-50"
                >
                  <UserPlus className="h-4 w-4" />
                  Add lead
                </button>
                <button
                  type="button"
                  onClick={openMarketing}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-black text-emerald-800 shadow-sm ring-1 ring-emerald-200 transition hover:bg-emerald-50"
                >
                  <Megaphone className="h-4 w-4" />
                  Log marketing
                </button>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-white/80 bg-white/95 p-5 shadow-xl">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                Today’s focus
              </p>
              <h2 className="mt-2 text-xl font-black text-slate-950">
                Know what to do, then show the result.
              </h2>
              <div className="mt-4 grid gap-2 text-sm font-bold text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                  {todayActivities.length} activities scheduled today
                </div>
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-emerald-700" />
                  {followUpLeads.length} leads need follow-up soon
                </div>
                <div className="flex items-center gap-2">
                  <Headphones className="h-4 w-4 text-emerald-700" />
                  {summary.leadsNeedingAdmin} leads need Headquarters help
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-emerald-50 px-3 py-3 text-xs font-bold leading-5 text-emerald-900">
                Hours and activities document effort. Rewards remain tied to
                approved assignments and verified results.
              </div>
            </div>
          </div>
        </section>

        {feedback ? (
          <section
            className={`flex items-start justify-between gap-3 rounded-[1.25rem] border px-4 py-3 text-sm font-bold leading-6 ${
              feedback.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : feedback.tone === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-900"
                  : "border-sky-200 bg-sky-50 text-sky-900"
            }`}
          >
            <span>{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="mt-0.5 shrink-0"
              aria-label="Dismiss message"
            >
              <X className="h-4 w-4" />
            </button>
          </section>
        ) : null}

        {data?.warning ? (
          <section className="rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-900">
            <AlertCircle className="mr-2 inline h-4 w-4" />
            {data.warning}
          </section>
        ) : null}

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
          <StatCard
            label="Activities"
            value={String(summary.scheduledActivities)}
            detail={`${summary.completedActivities} completed`}
            icon={<CalendarDays className="h-5 w-5" />}
          />
          <StatCard
            label="Hours"
            value={String(summary.totalHours)}
            detail="Completed activity time"
            icon={<Timer className="h-5 w-5" />}
          />
          <StatCard
            label="Contacts"
            value={String(summary.contacts)}
            detail={`${summary.conversations} conversations`}
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            label="QR Scans"
            value={String(summary.qrScans)}
            detail={`${summary.materialsDistributed} materials shared`}
            icon={<QrCode className="h-5 w-5" />}
          />
          <StatCard
            label="Leads"
            value={String(summary.generatedLeads)}
            detail={`${summary.convertedLeads} converted`}
            icon={<UserPlus className="h-5 w-5" />}
          />
          <StatCard
            label="Signups"
            value={String(summary.verifiedSignups)}
            detail="Verified SitGuru results"
            icon={<BadgeCheck className="h-5 w-5" />}
          />
          <StatCard
            label="Bookings"
            value={String(summary.completedBookings)}
            detail="Completed referrals"
            icon={<PawPrint className="h-5 w-5" />}
          />
          <StatCard
            label="Marketing"
            value={String(summary.marketingEfforts)}
            detail="Efforts logged"
            icon={<Megaphone className="h-5 w-5" />}
          />
        </section>

        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-sm">
          <div className="grid grid-cols-5 gap-1">
            {[
              {
                key: "today",
                label: "Today",
                icon: Home,
              },
              {
                key: "calendar",
                label: "Calendar",
                icon: CalendarDays,
              },
              {
                key: "activities",
                label: "Activities",
                icon: Target,
              },
              {
                key: "marketing",
                label: "Marketing",
                icon: Megaphone,
              },
              {
                key: "leads",
                label: "Leads",
                icon: UserPlus,
              },
            ].map((item) => {
              const Icon = item.icon;
              const active = view === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setView(item.key as ViewMode)}
                  className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-black transition sm:flex-row sm:text-sm ${
                    active
                      ? "bg-emerald-700 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </section>

        {view === "today" ? (
          <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                    Today and Next
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                    Your work schedule
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => openActivity()}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 text-sm font-black text-white hover:bg-emerald-800"
                >
                  <Plus className="h-4 w-4" />
                  Add activity
                </button>
              </div>

              <div className="mt-4 grid gap-3">
                {upcomingActivities.length > 0 ? (
                  upcomingActivities.map((activity) => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      busyId={busyId}
                      onEdit={editActivity}
                      onStatus={(record, status) =>
                        void updateRecordStatus(
                          "activity",
                          record.id,
                          status,
                        )
                      }
                    />
                  ))
                ) : (
                  <EmptyState
                    title="No upcoming activities"
                    description="Add a campus visit, professional outreach, event, expo, social effort, lead follow-up, or Headquarters assignment."
                    actionLabel="Schedule activity"
                    onAction={() => openActivity()}
                  />
                )}
              </div>
            </div>

            <div className="space-y-4">
              <section className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-end justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                      Follow-Up
                    </p>
                    <h2 className="mt-1 text-xl font-black text-slate-950">
                      Leads needing attention
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={openLead}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 text-xs font-black text-emerald-800"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Lead
                  </button>
                </div>

                <div className="mt-4 grid gap-3">
                  {followUpLeads.length > 0 ? (
                    followUpLeads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        busyId={busyId}
                        onEdit={editLead}
                        onStatus={(record, status) =>
                          void updateRecordStatus(
                            "lead",
                            record.id,
                            status,
                          )
                        }
                      />
                    ))
                  ) : (
                    <EmptyState
                      title="No urgent follow-ups"
                      description="New leads and Headquarters-assisted follow-ups will appear here."
                      actionLabel="Add lead"
                      onAction={openLead}
                    />
                  )}
                </div>
              </section>

              <section className="rounded-[1.7rem] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                  Remote Headquarters
                </p>
                <h2 className="mt-2 text-xl font-black text-emerald-950">
                  Help is built into your workflow.
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-emerald-900">
                  Request help on an activity or lead, open Support, review
                  training, or message SitGuru without leaving your Ambassador
                  workspace.
                </p>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Link
                    href="/ambassador/dashboard/support"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 text-sm font-black text-white"
                  >
                    <Headphones className="h-4 w-4" />
                    Ask Headquarters
                  </Link>
                  <Link
                    href="/ambassador/dashboard/training"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-black text-emerald-800 ring-1 ring-emerald-200"
                  >
                    <GraduationCap className="h-4 w-4" />
                    Open training
                  </Link>
                </div>
              </section>
            </div>
          </section>
        ) : null}

        {view === "calendar" ? (
          <section className="rounded-[1.7rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                  Activity Calendar
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                  {calendarMonth.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={previousMonth}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarMonth(new Date())}
                  className="min-h-10 rounded-full border border-slate-200 px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                (day) => (
                  <div key={day} className="py-2">
                    {day}
                  </div>
                ),
              )}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const dayActivities =
                  activitiesByDate.get(day.key) || [];
                const selected = day.key === selectedDate;
                const today = day.key === todayInputValue();

                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => {
                      setSelectedDate(day.key);
                    }}
                    onDoubleClick={() => openActivity(day.key)}
                    className={`min-h-[84px] rounded-xl border p-2 text-left transition sm:min-h-[118px] ${
                      selected
                        ? "border-emerald-500 bg-emerald-50"
                        : today
                          ? "border-sky-300 bg-sky-50"
                          : day.inMonth
                            ? "border-slate-200 bg-white hover:bg-slate-50"
                            : "border-slate-100 bg-slate-50/60 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${
                          today
                            ? "bg-sky-600 text-white"
                            : selected
                              ? "bg-emerald-700 text-white"
                              : ""
                        }`}
                      >
                        {day.date.getDate()}
                      </span>
                      {dayActivities.length > 0 ? (
                        <span className="text-[9px] font-black text-emerald-700">
                          {dayActivities.length}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-2 hidden space-y-1 sm:block">
                      {dayActivities.slice(0, 2).map((activity) => (
                        <div
                          key={activity.id}
                          className="truncate rounded-md bg-emerald-100 px-1.5 py-1 text-[9px] font-black text-emerald-900"
                        >
                          {activity.title}
                        </div>
                      ))}
                      {dayActivities.length > 2 ? (
                        <p className="text-[9px] font-black text-slate-500">
                          +{dayActivities.length - 2} more
                        </p>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-black text-slate-950">
                  {formatDate(selectedDate)}
                </p>
                <p className="text-xs font-semibold text-slate-600">
                  {(activitiesByDate.get(selectedDate) || []).length}{" "}
                  activities scheduled
                </p>
              </div>
              <button
                type="button"
                onClick={() => openActivity(selectedDate)}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 text-sm font-black text-white hover:bg-emerald-800"
              >
                <Plus className="h-4 w-4" />
                Add on this date
              </button>
            </div>
          </section>
        ) : null}

        {view === "activities" ? (
          <section className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                  Activity Log
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                  Planned and completed work
                </h2>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search activities"
                    className="min-w-0 bg-transparent text-sm font-semibold text-slate-950 outline-none"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => openActivity()}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 text-sm font-black text-white hover:bg-emerald-800"
                >
                  <Plus className="h-4 w-4" />
                  Add activity
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {filteredActivities.length > 0 ? (
                filteredActivities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    busyId={busyId}
                    onEdit={editActivity}
                    onStatus={(record, status) =>
                      void updateRecordStatus(
                        "activity",
                        record.id,
                        status,
                      )
                    }
                  />
                ))
              ) : (
                <EmptyState
                  title="No activities found"
                  description="Schedule outreach, events, professional visits, campus work, marketing, lead follow-ups, training, or Headquarters assignments."
                  actionLabel="Add activity"
                  onAction={() => openActivity()}
                />
              )}
            </div>
          </section>
        ) : null}

        {view === "marketing" ? (
          <section className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                  Marketing Efforts
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                  Record outreach beyond referral links
                </h2>
              </div>
              <button
                type="button"
                onClick={openMarketing}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 text-sm font-black text-white hover:bg-emerald-800"
              >
                <Plus className="h-4 w-4" />
                Add effort
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {marketingEfforts.length > 0 ? (
                marketingEfforts.map((effort) => (
                  <article
                    key={effort.id}
                    className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-emerald-800">
                          {titleCase(effort.status || "planned")}
                        </span>
                        <h3 className="mt-3 text-lg font-black text-slate-950">
                          {effort.title || "Marketing effort"}
                        </h3>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          {titleCase(effort.effort_type)} •{" "}
                          {effort.platform || "Unspecified platform"}
                        </p>
                      </div>
                      <Megaphone className="h-5 w-5 shrink-0 text-emerald-700" />
                    </div>

                    <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                      {effort.description ||
                        effort.outcome_summary ||
                        "No description entered."}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-black text-slate-700">
                      <div className="rounded-xl bg-white px-3 py-2">
                        {effort.minutes_spent || 0} min
                      </div>
                      <div className="rounded-xl bg-white px-3 py-2">
                        {effort.reach || 0} reach
                      </div>
                      <div className="rounded-xl bg-white px-3 py-2">
                        {effort.clicks || 0} clicks
                      </div>
                      <div className="rounded-xl bg-white px-3 py-2">
                        {effort.leads_generated || 0} leads
                      </div>
                    </div>

                    <p className="mt-3 text-xs font-bold text-slate-500">
                      {formatDate(effort.effort_date)}
                      {effort.spend_amount
                        ? ` • ${money(effort.spend_amount)} spent`
                        : ""}
                    </p>

                    {effort.content_url ? (
                      <a
                        href={effort.content_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-emerald-700"
                      >
                        Open content
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </article>
                ))
              ) : (
                <div className="md:col-span-2 xl:col-span-3">
                  <EmptyState
                    title="No marketing efforts logged"
                    description="Record social posts, business flyers, email campaigns, campus promotions, professional outreach, and printed materials."
                    actionLabel="Log marketing"
                    onAction={openMarketing}
                  />
                </div>
              )}
            </div>
          </section>
        ) : null}

        {view === "leads" ? (
          <section className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                  Lead Generator
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                  Send opportunities to SitGuru Headquarters
                </h2>
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  Leads remain attributed to you while Admin can follow up,
                  assist, and track conversion.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search leads"
                    className="min-w-0 bg-transparent text-sm font-semibold text-slate-950 outline-none"
                  />
                </label>
                <button
                  type="button"
                  onClick={openLead}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 text-sm font-black text-white hover:bg-emerald-800"
                >
                  <Plus className="h-4 w-4" />
                  Add lead
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    busyId={busyId}
                    onEdit={editLead}
                    onStatus={(record, status) =>
                      void updateRecordStatus(
                        "lead",
                        record.id,
                        status,
                      )
                    }
                  />
                ))
              ) : (
                <EmptyState
                  title="No leads found"
                  description="Add a Pet Parent, Guru, Ambassador, partner, pet business, veterinary practice, rescue, shelter, campus, or community lead."
                  actionLabel="Add lead"
                  onAction={openLead}
                />
              )}
            </div>
          </section>
        ) : null}

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/ambassador/dashboard/referrals"
            className="group rounded-[1.4rem] border border-emerald-200 bg-emerald-50 p-4 transition hover:-translate-y-0.5 hover:bg-emerald-100"
          >
            <QrCode className="h-5 w-5 text-emerald-700" />
            <h2 className="mt-3 font-black text-emerald-950">
              Referral Center
            </h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-emerald-900">
              Share tracked Pet Parent, Guru, and social links.
            </p>
          </Link>

          <Link
            href="/ambassador/dashboard/training"
            className="group rounded-[1.4rem] border border-sky-200 bg-sky-50 p-4 transition hover:-translate-y-0.5 hover:bg-sky-100"
          >
            <GraduationCap className="h-5 w-5 text-sky-700" />
            <h2 className="mt-3 font-black text-sky-950">
              Training and resources
            </h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-sky-900">
              Use approved scripts, guidance, and program training.
            </p>
          </Link>

          <Link
            href="/ambassador/dashboard/support"
            className="group rounded-[1.4rem] border border-amber-200 bg-amber-50 p-4 transition hover:-translate-y-0.5 hover:bg-amber-100"
          >
            <Headphones className="h-5 w-5 text-amber-700" />
            <h2 className="mt-3 font-black text-amber-950">
              Headquarters support
            </h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-amber-900">
              Request lead, event, material, account, or payout help.
            </p>
          </Link>

          <Link
            href="/ambassador/dashboard/commissions"
            className="group rounded-[1.4rem] border border-violet-200 bg-violet-50 p-4 transition hover:-translate-y-0.5 hover:bg-violet-100"
          >
            <CircleDollarSign className="h-5 w-5 text-violet-700" />
            <h2 className="mt-3 font-black text-violet-950">
              Rewards and payouts
            </h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-violet-900">
              Review verified eligibility, approval, and payment status.
            </p>
          </Link>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 rounded-[1.35rem] border border-slate-200 bg-white px-5 py-4 text-xs font-bold text-slate-600 shadow-sm">
          <span>
            Activity records document work and support Admin visibility. They
            do not automatically create a reward.
          </span>
          <span className="inline-flex items-center gap-2 text-emerald-700">
            <BadgeCheck className="h-4 w-4" />
            Connected to SitGuru Headquarters
          </span>
        </footer>
      </div>

      {composer === "activity" ? (
        <ComposerShell
          title={editingId ? "Update activity" : "Add activity"}
          description="Schedule or record outreach, events, professional visits, training, marketing, follow-ups, and Headquarters assignments."
          saving={saving}
          onClose={() => {
            setComposer(null);
            setEditingId(null);
          }}
          onSubmit={submitActivity}
        >
          <div className="space-y-5">
            {!editingId && templates.length > 0 ? (
              <section>
                <FieldLabel>Quick-start templates</FieldLabel>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {templates.slice(0, 12).map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => useTemplate(template)}
                      className={`min-w-[175px] rounded-xl border p-3 text-left transition ${
                        activityForm.template_id === template.id
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <p className="text-xs font-black text-slate-950">
                        {template.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-[10px] font-semibold leading-4 text-slate-600">
                        {template.description}
                      </p>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <TextInput
                  label="Activity title"
                  value={activityForm.title}
                  onChange={(value) =>
                    setActivityForm((current) => ({
                      ...current,
                      title: value,
                    }))
                  }
                  placeholder="Example: Veterinary office outreach"
                  required
                />
              </div>

              <SelectInput
                label="Activity type"
                value={activityForm.activity_type}
                onChange={(value) =>
                  setActivityForm((current) => ({
                    ...current,
                    activity_type: value,
                  }))
                }
                options={activityTypes}
              />

              <SelectInput
                label="Engagement mode"
                value={activityForm.engagement_mode}
                onChange={(value) =>
                  setActivityForm((current) => ({
                    ...current,
                    engagement_mode: value,
                  }))
                }
                options={engagementModes}
              />

              <SelectInput
                label="Category"
                value={activityForm.category}
                onChange={(value) =>
                  setActivityForm((current) => ({
                    ...current,
                    category: value,
                  }))
                }
                options={activityCategories}
              />

              <SelectInput
                label="Target audience"
                value={activityForm.target_audience}
                onChange={(value) =>
                  setActivityForm((current) => ({
                    ...current,
                    target_audience: value,
                  }))
                }
                options={audienceOptions}
              />

              <TextInput
                label="Date"
                type="date"
                value={activityForm.activity_date}
                onChange={(value) =>
                  setActivityForm((current) => ({
                    ...current,
                    activity_date: value,
                  }))
                }
                required
              />

              <SelectInput
                label="Status"
                value={activityForm.status}
                onChange={(value) =>
                  setActivityForm((current) => ({
                    ...current,
                    status: value,
                  }))
                }
                options={[
                  "planned",
                  "confirmed",
                  "in_progress",
                  "completed",
                  "deferred",
                  "cancelled",
                ]}
              />

              <TextInput
                label="Start time"
                type="time"
                value={activityForm.starts_at}
                onChange={(value) =>
                  setActivityForm((current) => ({
                    ...current,
                    starts_at: value,
                  }))
                }
              />

              <TextInput
                label="End time"
                type="time"
                value={activityForm.ends_at}
                onChange={(value) =>
                  setActivityForm((current) => ({
                    ...current,
                    ends_at: value,
                  }))
                }
              />

              <TextInput
                label="Planned minutes"
                type="number"
                min="0"
                value={activityForm.estimated_minutes}
                onChange={(value) =>
                  setActivityForm((current) => ({
                    ...current,
                    estimated_minutes: value,
                  }))
                }
              />

              <TextInput
                label="Actual minutes"
                type="number"
                min="0"
                value={activityForm.actual_minutes}
                onChange={(value) =>
                  setActivityForm((current) => ({
                    ...current,
                    actual_minutes: value,
                  }))
                }
              />

              <div className="sm:col-span-2">
                <TextAreaInput
                  label="Description or instructions"
                  value={activityForm.description}
                  onChange={(value) =>
                    setActivityForm((current) => ({
                      ...current,
                      description: value,
                    }))
                  }
                  placeholder="What will you do and what approved resources will you use?"
                />
              </div>

              <TextInput
                label="Event name"
                value={activityForm.event_name}
                onChange={(value) =>
                  setActivityForm((current) => ({
                    ...current,
                    event_name: value,
                  }))
                }
              />

              <TextInput
                label="Venue"
                value={activityForm.venue_name}
                onChange={(value) =>
                  setActivityForm((current) => ({
                    ...current,
                    venue_name: value,
                  }))
                }
              />

              <TextInput
                label="Organization or business"
                value={activityForm.organization_name}
                onChange={(value) =>
                  setActivityForm((current) => ({
                    ...current,
                    organization_name: value,
                  }))
                }
              />

              <TextInput
                label="City"
                value={activityForm.city}
                onChange={(value) =>
                  setActivityForm((current) => ({
                    ...current,
                    city: value,
                  }))
                }
              />

              <TextInput
                label="State"
                value={activityForm.state}
                onChange={(value) =>
                  setActivityForm((current) => ({
                    ...current,
                    state: value,
                  }))
                }
              />

              <TextInput
                label="Goal"
                value={activityForm.goal}
                onChange={(value) =>
                  setActivityForm((current) => ({
                    ...current,
                    goal: value,
                  }))
                }
                placeholder="Example: Speak with 10 pet parents"
              />
            </section>

            <section className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">
                Results
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-600">
                Complete these after or during the activity.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {[
                  ["Contacts", "actual_contacts"],
                  ["Conversations", "conversations"],
                  ["QR scans", "qr_scans"],
                  ["Links shared", "referral_links_shared"],
                  ["Materials", "materials_distributed"],
                  ["Leads", "leads_generated"],
                  ["Verified signups", "verified_signups"],
                  ["Completed bookings", "completed_bookings"],
                ].map(([label, key]) => (
                  <TextInput
                    key={key}
                    label={label}
                    type="number"
                    min="0"
                    value={
                      activityForm[
                        key as keyof ActivityFormState
                      ] as string
                    }
                    onChange={(value) =>
                      setActivityForm((current) => ({
                        ...current,
                        [key]: value,
                      }))
                    }
                  />
                ))}
              </div>
            </section>

            <TextAreaInput
              label="Outcome summary"
              value={activityForm.outcome_summary}
              onChange={(value) =>
                setActivityForm((current) => ({
                  ...current,
                  outcome_summary: value,
                }))
              }
              placeholder="What happened, what worked, and what needs follow-up?"
            />

            <TextAreaInput
              label="Notes"
              value={activityForm.notes}
              onChange={(value) =>
                setActivityForm((current) => ({
                  ...current,
                  notes: value,
                }))
              }
            />

            <CheckboxInput
              label="Request Headquarters assistance"
              checked={activityForm.needs_admin_help}
              onChange={(checked) =>
                setActivityForm((current) => ({
                  ...current,
                  needs_admin_help: checked,
                }))
              }
              description="Use this for event approvals, materials, partnership support, website help, safety concerns, or follow-up assistance."
            />

            {activityForm.needs_admin_help ? (
              <TextAreaInput
                label="What help do you need?"
                value={activityForm.admin_help_reason}
                onChange={(value) =>
                  setActivityForm((current) => ({
                    ...current,
                    admin_help_reason: value,
                  }))
                }
                placeholder="Tell SitGuru Headquarters what action or decision is needed."
              />
            ) : null}
          </div>
        </ComposerShell>
      ) : null}

      {composer === "marketing_effort" ? (
        <ComposerShell
          title="Log marketing effort"
          description="Track social, email, printed, campus, business, professional, and community marketing."
          saving={saving}
          onClose={() => setComposer(null)}
          onSubmit={submitMarketing}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TextInput
                label="Title"
                value={marketingForm.title}
                onChange={(value) =>
                  setMarketingForm((current) => ({
                    ...current,
                    title: value,
                  }))
                }
                placeholder="Example: Campus Pet Parent awareness post"
                required
              />
            </div>

            <TextInput
              label="Date"
              type="date"
              value={marketingForm.effort_date}
              onChange={(value) =>
                setMarketingForm((current) => ({
                  ...current,
                  effort_date: value,
                }))
              }
              required
            />

            <SelectInput
              label="Effort type"
              value={marketingForm.effort_type}
              onChange={(value) =>
                setMarketingForm((current) => ({
                  ...current,
                  effort_type: value,
                }))
              }
              options={marketingEffortTypes}
              required
            />

            <SelectInput
              label="Platform or channel"
              value={marketingForm.platform}
              onChange={(value) =>
                setMarketingForm((current) => ({
                  ...current,
                  platform: value,
                }))
              }
              options={platforms}
            />

            <SelectInput
              label="Target audience"
              value={marketingForm.target_audience}
              onChange={(value) =>
                setMarketingForm((current) => ({
                  ...current,
                  target_audience: value,
                }))
              }
              options={audienceOptions}
            />

            <TextInput
              label="Campaign"
              value={marketingForm.campaign_name}
              onChange={(value) =>
                setMarketingForm((current) => ({
                  ...current,
                  campaign_name: value,
                }))
              }
            />

            <TextInput
              label="Target location"
              value={marketingForm.target_location}
              onChange={(value) =>
                setMarketingForm((current) => ({
                  ...current,
                  target_location: value,
                }))
              }
              placeholder="Campus, city, practice, or service area"
            />

            <div className="sm:col-span-2">
              <TextAreaInput
                label="Description"
                value={marketingForm.description}
                onChange={(value) =>
                  setMarketingForm((current) => ({
                    ...current,
                    description: value,
                  }))
                }
              />
            </div>

            <TextInput
              label="Content URL"
              type="url"
              value={marketingForm.content_url}
              onChange={(value) =>
                setMarketingForm((current) => ({
                  ...current,
                  content_url: value,
                }))
              }
            />

            <TextInput
              label="Call to action"
              value={marketingForm.call_to_action}
              onChange={(value) =>
                setMarketingForm((current) => ({
                  ...current,
                  call_to_action: value,
                }))
              }
            />

            <TextInput
              label="Minutes spent"
              type="number"
              min="0"
              value={marketingForm.minutes_spent}
              onChange={(value) =>
                setMarketingForm((current) => ({
                  ...current,
                  minutes_spent: value,
                }))
              }
            />

            <TextInput
              label="Spend"
              type="number"
              min="0"
              step="0.01"
              value={marketingForm.spend_amount}
              onChange={(value) =>
                setMarketingForm((current) => ({
                  ...current,
                  spend_amount: value,
                }))
              }
            />

            {[
              ["Impressions", "impressions"],
              ["Reach", "reach"],
              ["Engagements", "engagements"],
              ["Clicks", "clicks"],
              ["Messages", "messages_received"],
              ["QR scans", "qr_scans"],
              ["Materials distributed", "materials_distributed"],
              ["Leads generated", "leads_generated"],
              ["Verified signups", "verified_signups"],
              ["Completed bookings", "completed_bookings"],
            ].map(([label, key]) => (
              <TextInput
                key={key}
                label={label}
                type="number"
                min="0"
                value={
                  marketingForm[
                    key as keyof MarketingFormState
                  ] as string
                }
                onChange={(value) =>
                  setMarketingForm((current) => ({
                    ...current,
                    [key]: value,
                  }))
                }
              />
            ))}

            <SelectInput
              label="Status"
              value={marketingForm.status}
              onChange={(value) =>
                setMarketingForm((current) => ({
                  ...current,
                  status: value,
                }))
              }
              options={[
                "planned",
                "draft",
                "published",
                "completed",
                "cancelled",
              ]}
            />

            <div className="sm:col-span-2">
              <TextAreaInput
                label="Outcome summary"
                value={marketingForm.outcome_summary}
                onChange={(value) =>
                  setMarketingForm((current) => ({
                    ...current,
                    outcome_summary: value,
                  }))
                }
              />
            </div>

            <div className="sm:col-span-2">
              <TextAreaInput
                label="Notes"
                value={marketingForm.notes}
                onChange={(value) =>
                  setMarketingForm((current) => ({
                    ...current,
                    notes: value,
                  }))
                }
              />
            </div>

            <div className="sm:col-span-2">
              <CheckboxInput
                label="Request Headquarters assistance"
                checked={marketingForm.needs_admin_help}
                onChange={(checked) =>
                  setMarketingForm((current) => ({
                    ...current,
                    needs_admin_help: checked,
                  }))
                }
                description="Flag the effort when you need approved content, brand guidance, campaign help, or follow-up."
              />
            </div>
          </div>
        </ComposerShell>
      ) : null}

      {composer === "lead" ? (
        <ComposerShell
          title={editingId ? "Update lead" : "Add lead"}
          description="Capture the opportunity quickly. Headquarters receives the lead while attribution remains connected to your Ambassador record."
          saving={saving}
          onClose={() => {
            setComposer(null);
            setEditingId(null);
          }}
          onSubmit={submitLead}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectInput
              label="Lead type"
              value={leadForm.lead_type}
              onChange={(value) =>
                setLeadForm((current) => ({
                  ...current,
                  lead_type: value,
                }))
              }
              options={leadTypes}
              required
            />

            <SelectInput
              label="Status"
              value={leadForm.lead_status}
              onChange={(value) =>
                setLeadForm((current) => ({
                  ...current,
                  lead_status: value,
                }))
              }
              options={[
                "new",
                "received_by_headquarters",
                "admin_assigned",
                "contacted",
                "follow_up",
                "converted",
                "closed",
              ]}
            />

            <TextInput
              label="First name"
              value={leadForm.first_name}
              onChange={(value) =>
                setLeadForm((current) => ({
                  ...current,
                  first_name: value,
                }))
              }
            />

            <TextInput
              label="Last name"
              value={leadForm.last_name}
              onChange={(value) =>
                setLeadForm((current) => ({
                  ...current,
                  last_name: value,
                }))
              }
            />

            <TextInput
              label="Email"
              type="email"
              value={leadForm.email}
              onChange={(value) =>
                setLeadForm((current) => ({
                  ...current,
                  email: value,
                }))
              }
            />

            <TextInput
              label="Phone"
              type="tel"
              value={leadForm.phone}
              onChange={(value) =>
                setLeadForm((current) => ({
                  ...current,
                  phone: value,
                }))
              }
            />

            <TextInput
              label="Business name"
              value={leadForm.business_name}
              onChange={(value) =>
                setLeadForm((current) => ({
                  ...current,
                  business_name: value,
                }))
              }
            />

            <TextInput
              label="Organization"
              value={leadForm.organization_name}
              onChange={(value) =>
                setLeadForm((current) => ({
                  ...current,
                  organization_name: value,
                }))
              }
            />

            <TextInput
              label="Website"
              type="url"
              value={leadForm.website_url}
              onChange={(value) =>
                setLeadForm((current) => ({
                  ...current,
                  website_url: value,
                }))
              }
            />

            <TextInput
              label="Social handle"
              value={leadForm.social_handle}
              onChange={(value) =>
                setLeadForm((current) => ({
                  ...current,
                  social_handle: value,
                }))
              }
            />

            <TextInput
              label="City"
              value={leadForm.city}
              onChange={(value) =>
                setLeadForm((current) => ({
                  ...current,
                  city: value,
                }))
              }
            />

            <TextInput
              label="State"
              value={leadForm.state}
              onChange={(value) =>
                setLeadForm((current) => ({
                  ...current,
                  state: value,
                }))
              }
            />

            <TextInput
              label="ZIP code"
              value={leadForm.zip_code}
              onChange={(value) =>
                setLeadForm((current) => ({
                  ...current,
                  zip_code: value,
                }))
              }
            />

            <SelectInput
              label="Source"
              value={leadForm.source_type}
              onChange={(value) =>
                setLeadForm((current) => ({
                  ...current,
                  source_type: value,
                }))
              }
              options={[
                "Face-to-Face",
                "Event or Expo",
                "Business Visit",
                "Campus",
                "Professional Introduction",
                "Social Media",
                "Email",
                "Phone",
                "Referral Link",
                "QR Code",
                "Other",
              ]}
            />

            <div className="sm:col-span-2">
              <TextInput
                label="Where or how did you meet?"
                value={leadForm.source_detail}
                onChange={(value) =>
                  setLeadForm((current) => ({
                    ...current,
                    source_detail: value,
                  }))
                }
                placeholder="Example: Quakertown Pet Expo vendor table"
              />
            </div>

            <SelectInput
              label="Target audience"
              value={leadForm.target_audience}
              onChange={(value) =>
                setLeadForm((current) => ({
                  ...current,
                  target_audience: value,
                }))
              }
              options={audienceOptions}
            />

            <TextInput
              label="Campaign"
              value={leadForm.campaign_name}
              onChange={(value) =>
                setLeadForm((current) => ({
                  ...current,
                  campaign_name: value,
                }))
              }
            />

            <SelectInput
              label="Preferred contact"
              value={leadForm.preferred_contact_method}
              onChange={(value) =>
                setLeadForm((current) => ({
                  ...current,
                  preferred_contact_method: value,
                }))
              }
              options={[
                "Email",
                "Phone",
                "Text",
                "Social Media",
                "No preference",
              ]}
            />

            <TextInput
              label="Next follow-up"
              type="date"
              value={leadForm.next_follow_up}
              onChange={(value) =>
                setLeadForm((current) => ({
                  ...current,
                  next_follow_up: value,
                }))
              }
            />

            <div className="sm:col-span-2">
              <TextInput
                label="Next action"
                value={leadForm.next_action}
                onChange={(value) =>
                  setLeadForm((current) => ({
                    ...current,
                    next_action: value,
                  }))
                }
                placeholder="Example: Headquarters should call about a partnership"
              />
            </div>

            <div className="sm:col-span-2">
              <TextAreaInput
                label="Notes"
                value={leadForm.notes}
                onChange={(value) =>
                  setLeadForm((current) => ({
                    ...current,
                    notes: value,
                  }))
                }
              />
            </div>

            <CheckboxInput
              label="Permission to contact"
              checked={leadForm.consent_to_contact}
              onChange={(checked) =>
                setLeadForm((current) => ({
                  ...current,
                  consent_to_contact: checked,
                }))
              }
              description="Confirm the person or organization agreed to receive follow-up from SitGuru."
            />

            <CheckboxInput
              label="Request Headquarters assistance"
              checked={leadForm.admin_assistance_requested}
              onChange={(checked) =>
                setLeadForm((current) => ({
                  ...current,
                  admin_assistance_requested: checked,
                }))
              }
              description="Admin will see this lead in the assistance queue."
            />

            {leadForm.admin_assistance_requested ? (
              <div className="sm:col-span-2">
                <TextAreaInput
                  label="What assistance is needed?"
                  value={leadForm.admin_assistance_reason}
                  onChange={(value) =>
                    setLeadForm((current) => ({
                      ...current,
                      admin_assistance_reason: value,
                    }))
                  }
                  placeholder="Example: Please follow up about a veterinary practice partnership."
                />
              </div>
            ) : null}
          </div>
        </ComposerShell>
      ) : null}
    </main>
  );
}