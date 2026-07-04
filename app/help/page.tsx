import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CircleHelp,
  ClipboardCheck,
  CreditCard,
  GraduationCap,
  Heart,
  HeartHandshake,
  LifeBuoy,
  Lock,
  Mail,
  Medal,
  MessageCircle,
  PawPrint,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

type HelpCard = {
  title: string;
  eyebrow: string;
  description: string;
  href: string;
  cta: string;
  icon: ReactNode;
};

type HelpSection = {
  title: string;
  description: string;
  icon: ReactNode;
  items: Array<{
    question: string;
    answer: string;
  }>;
};

type PaymentGuide = {
  title: string;
  audience: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  href: string;
  cta: string;
  icon: ReactNode;
  highlights: string[];
};

type OnboardingGuide = {
  title: string;
  audience: string;
  description: string;
  icon: ReactNode;
  steps: string[];
  tips: string[];
};

const quickHelpCards: HelpCard[] = [
  {
    title: "Pet Parent Help",
    eyebrow: "Find trusted care",
    description:
      "Find Gurus, book care, add pet details, message your Guru, and view PawReport Live updates, photos, walk status, distance, duration, and final care summaries.",
    href: "/search",
    cta: "Find Care",
    icon: <PawPrint className="h-6 w-6" />,
  },
  {
    title: "Pet Guru Help",
    eyebrow: "Join as a local provider",
    description:
      "Build your profile, manage pricing in My Calendar, handle bookings, start PawReports, track live walks, add care updates, and complete summaries for Pet Parents.",
    href: "/become-a-guru",
    cta: "Become a Guru",
    icon: <UsersRound className="h-6 w-6" />,
  },
  {
    title: "Onboarding Help",
    eyebrow: "Step-by-step setup",
    description:
      "Clear onboarding help for Gurus, Ambassadors, and Pet Parents, including what each step means and what happens after submitting.",
    href: "#onboarding-help",
    cta: "View Onboarding",
    icon: <ClipboardCheck className="h-6 w-6" />,
  },
  {
    title: "Payments & Payouts",
    eyebrow: "Stripe setup guides",
    description:
      "Use role-specific payment guides for Guru payouts, Ambassador payouts, and Pet Parent service payments.",
    href: "#payments-payouts",
    cta: "View Guides",
    icon: <CreditCard className="h-6 w-6" />,
  },
  {
    title: "Bookings",
    eyebrow: "Care requests and details",
    description:
      "Learn how requests, communication, care instructions, service notes, and booking records can help keep everyone organized.",
    href: "#bookings-and-communication",
    cta: "Booking Help",
    icon: <CalendarCheck className="h-6 w-6" />,
  },
  {
    title: "PawReport Live",
    eyebrow: "Live walks and care updates",
    description:
      "Learn how Gurus start PawReport Live, track walks, pause and resume walking, add photos and care updates, and how Pet Parents view everything from their dashboard.",
    href: "#pawreport-help",
    cta: "PawReport Help",
    icon: <PawPrint className="h-6 w-6" />,
  },
  {
    title: "Reviews & Trust",
    eyebrow: "Ratings and feedback",
    description:
      "Learn how Pet Parents leave reviews after completed bookings, how Gurus use feedback to build trust, and how Ambassadors explain real ratings to new users.",
    href: "#reviews-help",
    cta: "Review Help",
    icon: <Medal className="h-6 w-6" />,
  },
  {
    title: "Account & Login",
    eyebrow: "Access your account",
    description:
      "Need help with signup, phone login codes, email access, profile details, or account settings? Start here.",
    href: "#accounts-and-login",
    cta: "Account Help",
    icon: <Lock className="h-6 w-6" />,
  },
  {
    title: "Programs & Ambassadors",
    eyebrow: "Student, Community & Military",
    description:
      "Learn how Ambassadors use referrals, local outreach, dashboards, payout setup, and Student Hire, Community Hire, and Military Hire pathways to help SitGuru grow.",
    href: "/programs",
    cta: "View Programs",
    icon: <HeartHandshake className="h-6 w-6" />,
  },
  {
    title: "Contact Support",
    eyebrow: "Need a real person?",
    description:
      "Send SitGuru a message and we’ll route your question to the right place for review.",
    href: "/contact",
    cta: "Contact SitGuru",
    icon: <MessageCircle className="h-6 w-6" />,
  },
];

const paymentGuides: PaymentGuide[] = [
  {
    title: "Guru Stripe Setup Guide",
    audience: "For Gurus",
    description:
      "Complete Stripe payout setup so eligible booking payouts, commission, and referral earnings can be routed correctly.",
    imageSrc: "/help/stripe/sitguru-guru-stripe-setup-guide.png",
    imageAlt: "SitGuru Guru Stripe Setup Guide",
    href: "#guru-stripe-setup",
    cta: "Guru Setup Steps",
    icon: <UsersRound className="h-5 w-5" />,
    highlights: [
      "Booking payouts",
      "Commission earnings",
      "Referral earnings",
    ],
  },
  {
    title: "Pet Parent Payment Guide",
    audience: "For Pet Parents",
    description:
      "Learn how Pet Parents can securely request, review, and pay for pet care services through SitGuru.",
    imageSrc: "/help/stripe/sitguru-pet-parent-payment-guide.png",
    imageAlt: "SitGuru Pet Parent Payment Guide",
    href: "#pet-parent-payment-guide",
    cta: "Payment Steps",
    icon: <PawPrint className="h-5 w-5" />,
    highlights: [
      "Secure checkout",
      "Booking payments",
      "Receipts and dashboard",
    ],
  },
  {
    title: "Ambassador Stripe Setup Guide",
    audience: "For Ambassadors",
    description:
      "Complete Stripe payout setup so eligible ambassador payouts, commission, and referral earnings can be routed correctly.",
    imageSrc: "/help/stripe/sitguru-ambassador-stripe-setup-guide.png",
    imageAlt: "SitGuru Ambassador Stripe Setup Guide",
    href: "#ambassador-stripe-setup",
    cta: "Ambassador Setup Steps",
    icon: <HeartHandshake className="h-5 w-5" />,
    highlights: [
      "Ambassador payouts",
      "Referral activity",
      "Commission earnings",
    ],
  },
];

const onboardingGuides: OnboardingGuide[] = [
  {
    title: "Guru Onboarding",
    audience: "For Gurus",
    description:
      "Understand each Guru setup step, what is required, what is optional, and how SitGuru reviews your account before you become fully bookable.",
    icon: <UsersRound className="h-5 w-5" />,
    steps: [
      "Step 1: Complete your profile with name, bio, photo, and experience.",
      "Step 2: Set your service area so local Pet Parents can find you.",
      "Step 3: Add services, pricing, and request public visibility.",
      "Step 4: Complete Trust & Safety Screening when required or view the launch-year waiver.",
      "Step 5: Submit your Guru Onboarding Packet with acknowledgments and typed signature.",
      "Step 6: Connect Stripe payouts so SitGuru can pay eligible earnings.",
    ],
    tips: [
      "Submitted means SitGuru received your packet and will review it.",
      "You can continue to Step 6 while Step 5 is pending review.",
      "Only upload documents if SitGuru specifically requested them.",
    ],
  },
  {
    title: "Ambassador Onboarding",
    audience: "For Ambassadors",
    description:
      "Learn how Ambassadors complete setup, understand referrals, and prepare for payout or referral earning activity.",
    icon: <HeartHandshake className="h-5 w-5" />,
    steps: [
      "Complete your Ambassador profile and contact details.",
      "Review Ambassador expectations and referral guidance.",
      "Use your referral code or referral link when sharing SitGuru.",
      "Complete Stripe payout setup if referral or ambassador payouts apply.",
      "Track referral activity and follow SitGuru updates as the program grows.",
    ],
    tips: [
      "Referral setup helps SitGuru credit the right person or campaign.",
      "Stripe may be needed before eligible referral payouts can be sent.",
      "Contact SitGuru if your referral code or dashboard looks incorrect.",
    ],
  },
  {
    title: "Pet Parent Setup",
    audience: "For Pet Parents",
    description:
      "Get help creating your account, adding pet details, finding a Guru, requesting care, and paying securely through SitGuru.",
    icon: <PawPrint className="h-5 w-5" />,
    steps: [
      "Create your Pet Parent account.",
      "Add pet details and helpful care instructions.",
      "Search for a Guru and review their profile, services, and location.",
      "Request a booking and review the service details.",
      "Pay securely through SitGuru checkout when prompted.",
      "Use your dashboard to track bookings, messages, receipts, and updates.",
    ],
    tips: [
      "Clear pet details help Gurus provide better care.",
      "Keep booking conversations organized through SitGuru when available.",
      "Contact support if checkout or booking details look incorrect.",
    ],
  },
];

const popularQuestions = [
  {
    question: "What is SitGuru?",
    answer:
      "SitGuru is a trusted pet care marketplace that helps Pet Parents connect with local Pet Gurus for walks, sitting, drop-ins, boarding, training support, and other local pet care needs.",
  },
  {
    question: "Is signup free?",
    answer:
      "Yes. Pet Parents can sign up free, and Pet Gurus can start their profile free. SitGuru is designed to make it easy for local families and trusted pet care providers to connect.",
  },
  {
    question: "What is a Pet Guru?",
    answer:
      "A Pet Guru is a local pet care provider on SitGuru. That can include dog walkers, sitters, drop-in caregivers, boarding providers, trainers, groomers, and experienced pet people who want to help local families.",
  },
  {
    question: "How do I join as a Pet Parent?",
    answer:
      "Create your free SitGuru account, add your basic information, and start looking for trusted local care options as features become available in your area.",
  },
  {
    question: "How do I join as a Pet Guru?",
    answer:
      "Start on the Become a Guru page. You can create your profile, choose services you are interested in offering, share your local service area, and complete SitGuru trust and safety steps when required.",
  },
];

const helpSections: HelpSection[] = [
  {
    title: "Getting Started",
    description:
      "Quick answers for people learning what SitGuru is and how to begin.",
    icon: <Sparkles className="h-5 w-5" />,
    items: [
      {
        question: "How does SitGuru work?",
        answer:
          "SitGuru helps Pet Parents discover and book local Gurus for walks, sitting, boarding, drop-ins, daycare, training support, and other pet care needs. The dashboard keeps profiles, bookings, messages, PawReport Live updates, payments, and support context organized.",
      },
      {
        question: "Who is SitGuru for?",
        answer:
          "SitGuru is for Pet Parents who need trusted local care, Gurus who want to offer pet care services independently, and Ambassadors who help introduce SitGuru to local communities, students, partners, and pet families.",
      },
      {
        question: "Is SitGuru free to join?",
        answer:
          "Yes. Pet Parents can sign up free, Gurus can start their profile free, and Ambassadors can apply or participate through the appropriate SitGuru pathway. Booking payments, payouts, and referral activity are handled separately inside the platform when applicable.",
      },
      {
        question: "What dashboards are available?",
        answer:
          "Pet Parents use the customer dashboard for pets, bookings, messages, PawReports, PawPerks, and SitGuru University. Gurus use their dashboard as a workstation for profile setup, pricing, My Calendar, bookings, PawReports, live walks, reviews, messages, and payouts. Ambassadors use their dashboard for referrals, outreach, and program activity.",
      },
    ],
  },
  {
    title: "Pet Parents",
    description: "Help for families booking trusted local pet care.",
    icon: <PawPrint className="h-5 w-5" />,
    items: [
      {
        question: "How do I find the right Guru?",
        answer:
          "Search by service and location, review Guru profiles, services, service area, pricing, photos, care style, and any available reviews. Choose the Guru who feels like the best match for your pet's routine, personality, and care needs.",
      },
      {
        question: "What should I add to my pet profile?",
        answer:
          "Add routines, feeding details, walking preferences, medication notes, temperament, health details you choose to share, emergency contacts, access instructions, photos, and anything a Guru should know before care begins.",
      },
      {
        question: "Where do I see live care updates?",
        answer:
          "When a Guru starts PawReport Live, your Pet Parent dashboard can show live care activity. Open the booking and choose View Live PawReport to see visit status, walk status, distance, duration, photos, potty updates, food, water, mood, play, medication notes, and the final summary.",
      },
      {
        question: "How do I leave a review after care?",
        answer:
          "After the booking is completed, open the booking details from your Pet Parent dashboard. Use the review area to choose a star rating, write honest feedback about the Guru, mark whether you would book again, and submit the review so other Pet Parents can make informed decisions.",
      },
      {
        question: "Can I message my Guru?",
        answer:
          "Use SitGuru messaging when available so booking questions, care details, timing, access notes, and support context stay organized in one place.",
      },
      {
        question: "How do Pet Parents pay for services?",
        answer:
          "Pet Parents use SitGuru checkout to review booking details, service totals, tips when available, payment status, receipts, and booking records from the dashboard.",
      },
      {
        question: "What if I have an urgent pet safety issue?",
        answer:
          "For urgent pet safety, medical, or emergency issues, contact your veterinarian, local emergency services, or the proper local authority first. SitGuru support can help with platform-related questions, but urgent pet safety should be handled immediately by the right local professionals.",
      },
    ],
  },
  {
    title: "Gurus",
    description: "Help for pet care providers using SitGuru as a marketplace workstation.",
    icon: <UsersRound className="h-5 w-5" />,
    items: [
      {
        question: "What should a Guru do first?",
        answer:
          "Complete your profile, service area, ZIP/location details, services, pricing, onboarding packet, trust and safety steps when required, and Stripe payout setup. Then keep your dashboard current so Pet Parents know what care you offer.",
      },
      {
        question: "How do Gurus manage pricing and availability?",
        answer:
          "Use My Calendar and pricing tools to manage service rates, daily custom prices, multi-pet settings, multi-day discounts, peak-time pricing, availability, and service rules. Clear pricing makes the booking experience easier for Pet Parents.",
      },
      {
        question: "Where do Gurus start PawReports and walks?",
        answer:
          "Go to Guru Dashboard, then Bookings & PawReports. Select the booking and use the Live Care command center to Start PawReport, Start Walk, Pause Walk, Resume Walk, End Walk, Add Updates, Complete PawReport, or Message the Pet Parent.",
      },
      {
        question: "What updates should a Guru add during care?",
        answer:
          "Add updates that match the service: photos, pee, poop, food, water, walk activity, play, mood, medication notes, and care notes. For dog walks, use the live walk controls so distance and duration can be saved to the PawReport.",
      },
      {
        question: "How do Gurus complete a strong PawReport?",
        answer:
          "Start PawReport Live when care begins, add useful updates during care, upload clear photos when appropriate, track walks when relevant, and finish with a specific final summary using the pet's name and how the visit went.",
      },
      {
        question: "How do reviews help Gurus get more bookings?",
        answer:
          "Reviews are public trust signals when they are connected to completed bookings. Gurus should earn them through clear communication, on-time care, thoughtful PawReport Live updates, accurate walk tracking, clean photos, and strong final summaries. New Gurus should show New until real reviews are submitted.",
      },
      {
        question: "Are Gurus employees of SitGuru?",
        answer:
          "Pet Gurus provide services as independent local providers through the SitGuru marketplace. More detailed onboarding, tax, and provider information is shared during approval and setup.",
      },
    ],
  },
  {
    title: "Reviews & Trust Signals",
    description:
      "How Pet Parents, Gurus, and Ambassadors use reviews, ratings, written feedback, and trust signals across SitGuru.",
    icon: <Medal className="h-5 w-5" />,
    items: [
      {
        question: "When can a Pet Parent leave a review?",
        answer:
          "Pet Parents should leave a review after a completed booking. Open the booking details from the Pet Parent dashboard, review the care experience, choose a star rating, write clear feedback, and submit the review when the visit is finished.",
      },
      {
        question: "What should Pet Parents include in a helpful review?",
        answer:
          "Helpful reviews mention what service was booked, how communication went, whether PawReport Live updates were useful, whether the Guru followed pet instructions, and what made the experience feel safe, friendly, or trustworthy.",
      },
      {
        question: "How do Guru ratings and review counts appear?",
        answer:
          "Guru public profiles should show real review counts and real rating averages from completed booking reviews. When a Guru has no real reviews yet, SitGuru should show New Guru or New instead of fake ratings or fake review totals.",
      },
      {
        question: "How should Gurus use reviews?",
        answer:
          "Gurus should read reviews as business feedback. Strong reviews can help improve trust on the public profile. If feedback mentions communication, timing, PawReport updates, photos, walk tracking, or care notes, use it to improve future bookings.",
      },
      {
        question: "Can Gurus ask for reviews?",
        answer:
          "Gurus may politely remind Pet Parents to review the completed booking, but should not pressure them or ask for dishonest feedback. The best way to earn reviews is to communicate clearly, use PawReport Live well, complete walks and summaries, and provide reliable care.",
      },
      {
        question: "How should Ambassadors explain reviews?",
        answer:
          "Ambassadors can tell new Pet Parents and future Gurus that SitGuru uses real booking-based reviews to build trust. They should explain that reviews help families choose care and help Gurus improve their marketplace reputation.",
      },
    ],
  },
  {
    title: "PawReport Live",
    description:
      "Help for Pet Parents and Gurus using live care updates, live walks, photos, notes, and summaries.",
    icon: <PawPrint className="h-5 w-5" />,
    items: [
      {
        question: "What is PawReport Live?",
        answer:
          "PawReport Live is the care update system connected to a booking. It can show when care starts, live walk activity, distance and duration, photos, potty updates, food and water confirmations, medication, play, mood, notes, and a final summary.",
      },
      {
        question: "How does live walk tracking work?",
        answer:
          "When walking is part of the service, the Guru opens the booking's PawReport, allows browser location access, taps Start Walk, keeps the page open while walking, and taps End Walk when finished. SitGuru saves the walk summary and location points for the booking record.",
      },
      {
        question: "What should Pet Parents expect to see?",
        answer:
          "Pet Parents may see the current PawReport status, walk in progress, last update, distance, duration, photos, potty updates, care notes, and completion summary from their dashboard or booking page.",
      },
      {
        question: "Why does location permission matter?",
        answer:
          "Live walk tracking uses the browser or phone's location permission. If the Guru blocks location access, closes the page, or uses a device without location support, walk tracking may not update correctly.",
      },
      {
        question: "Are PawReports only for dog walks?",
        answer:
          "No. PawReports support dog walks, drop-ins, pet sitting, boarding, daycare, house sitting, and other services. Walk tracking is used when walking is part of the booking, while other updates support many care types.",
      },
    ],
  },
  {
    title: "Bookings & Communication",
    description:
      "Help with requests, schedules, messages, care details, and booking records.",
    icon: <CalendarCheck className="h-5 w-5" />,
    items: [
      {
        question: "How do bookings work on SitGuru?",
        answer:
          "Bookings organize the service, date, time, location, pet, Guru, payment status, messages, PawReport activity, and support context. Pet Parents use bookings to follow care, and Gurus use bookings as their work queue.",
      },
      {
        question: "What should be confirmed before care starts?",
        answer:
          "Confirm service type, date, time window, location, access instructions, pet details, feeding, medication, walking preferences, emergency contacts, payment status, and PawReport expectations before care begins.",
      },
      {
        question: "Why use SitGuru for repeat care?",
        answer:
          "Using SitGuru for repeat care helps keep pet instructions, service history, reviews, communication, receipts, PawReports, and support context in one place.",
      },
      {
        question: "What if something changes after a booking is requested?",
        answer:
          "Message early. If timing, location, pet needs, walk expectations, access details, or service details change, Pet Parents and Gurus should clarify those details before care happens.",
      },
    ],
  },
  {
    title: "Ambassadors & Programs",
    description:
      "Help for Ambassadors and program participants supporting SitGuru growth.",
    icon: <HeartHandshake className="h-5 w-5" />,
    items: [
      {
        question: "What does an Ambassador do?",
        answer:
          "Ambassadors help introduce SitGuru to Pet Parents, future Gurus, local partners, students, community groups, and military-connected networks. They support growth by sharing referral links, answering basic questions, and routing people to the correct signup path.",
      },
      {
        question: "What should Ambassadors focus on?",
        answer:
          "Focus on clear local outreach: explain that SitGuru helps Pet Parents find trusted local care and helps independent Gurus manage profiles, bookings, PawReports, live walks, messages, pricing, and payouts.",
      },
      {
        question: "How do Ambassador referrals work?",
        answer:
          "Use your Ambassador referral code or referral link when sharing SitGuru. Referral activity may be tracked in the Ambassador dashboard as the program grows. Contact SitGuru if your code, link, or dashboard looks incorrect.",
      },
      {
        question: "How should Ambassadors talk about reviews and ratings?",
        answer:
          "Ambassadors should explain that reviews help SitGuru build local trust. Pet Parents can review completed bookings, Gurus can use reviews to improve and grow, and public Guru profiles should show real ratings and real review counts instead of inflated numbers.",
      },
      {
        question: "What are Student Hire, Community Hire, and Military Hire?",
        answer:
          "These are SitGuru program pathways for students and recent grads, local community members, and military-connected applicants such as veterans, spouses, and eligible dependents. Program applications do not guarantee approval, placement, bookings, or payouts.",
      },
      {
        question: "Do Ambassadors need Stripe?",
        answer:
          "Ambassadors may need Stripe payout setup before eligible referral, commission, or ambassador payouts can be sent. Use the Ambassador Stripe Setup Guide if payout setup applies to your role.",
      },
    ],
  },
  {
    title: "Accounts & Login",
    description:
      "Help with signup, phone codes, email access, and profile settings.",
    icon: <Lock className="h-5 w-5" />,
    items: [
      {
        question: "How do I create a SitGuru account?",
        answer:
          "Use the signup page and choose whether you are joining as a Pet Parent, Future Guru, Ambassador, or more than one role. SitGuru One Access lets users move between the dashboards connected to their account.",
      },
      {
        question: "How do phone login codes work?",
        answer:
          "SitGuru may send a secure one-time code to your phone number to help you create an account, sign in, or protect account access. Do not share login codes with anyone.",
      },
      {
        question: "What should I do if I cannot log in?",
        answer:
          "Check that you are using the correct phone number or email. If you still cannot access your account, contact SitGuru through the contact page and include the email or phone number connected to your account.",
      },
      {
        question: "Can I update my profile later?",
        answer:
          "Yes. Users should update account details, profile information, pet details, Guru service area, pricing, Ambassador contact information, and notification preferences from the proper dashboard area when tools are available.",
      },
    ],
  },
  {
    title: "Payments & Payouts",
    description:
      "Help with Stripe setup, secure checkout, booking totals, payout tracking, and payment questions.",
    icon: <CreditCard className="h-5 w-5" />,
    items: [
      {
        question: "Where can I find the SitGuru Stripe setup guides?",
        answer:
          "The Payments & Payouts section includes separate guides for Guru Stripe setup, Ambassador Stripe setup, and Pet Parent payment checkout. Each guide explains the steps for that specific role.",
      },
      {
        question: "Why do Gurus need to set up Stripe?",
        answer:
          "Gurus need Stripe setup before eligible booking payouts, commission, or referral earnings can be sent. The Guru Stripe Setup Guide walks through business type, personal details, bank account connection, payout account choice, and returning to the Earnings tab.",
      },
      {
        question: "Why do Ambassadors need to set up Stripe?",
        answer:
          "Ambassadors may need Stripe setup before eligible ambassador payouts, commission, or referral earnings can be sent. The Ambassador Stripe Setup Guide explains how to connect a payout account and track referral-related activity.",
      },
      {
        question: "How do Pet Parents pay for services?",
        answer:
          "Pet Parents can use SitGuru checkout to review booking details, add a payment method, confirm billing information, submit payment, receive confirmation, and manage bookings and receipts from their dashboard.",
      },
      {
        question: "Who do I contact for payment or payout help?",
        answer:
          "Use the contact page or email support@sitguru.com. Include your name, account email, role, booking details if applicable, and a clear description of the issue.",
      },
    ],
  },
  {
    title: "Trust & Safety",
    description:
      "Guidance for safer, clearer, and more trusted pet care connections.",
    icon: <ShieldCheck className="h-5 w-5" />,
    items: [
      {
        question: "How does SitGuru support trust and safety?",
        answer:
          "SitGuru may use profile reviews, trust and safety steps, communication tools, support records, user reports, PawReport history, and platform rules to help protect pets, Pet Parents, Gurus, Ambassadors, and the community.",
      },
      {
        question: "Why does SitGuru encourage organized records?",
        answer:
          "Organized communication, booking details, care notes, service records, PawReports, walk summaries, and support records help everyone understand what was requested, what was confirmed, and what happened if a question comes up later.",
      },
      {
        question: "Does trust and safety remove all risk?",
        answer:
          "No online marketplace can remove every risk. Pet care involves real people, real pets, and real-world circumstances. SitGuru's goal is to support better information, clearer communication, and safer decisions.",
      },
      {
        question: "How do I report a concern?",
        answer:
          "Use the contact page and include as much detail as possible. For urgent pet safety, medical, or emergency concerns, contact your veterinarian, local emergency services, or the proper local authority first.",
      },
    ],
  },
];

const programPathways = [
  {
    title: "Student Hire",
    description:
      "For students, recent grads, and summer workers interested in flexible pet care opportunities.",
    icon: <GraduationCap className="h-5 w-5" />,
  },
  {
    title: "Community Hire",
    description:
      "For qualified applicants connected through community, workforce, nonprofit, and local partner pathways.",
    icon: <HeartHandshake className="h-5 w-5" />,
  },
  {
    title: "Military Hire",
    description:
      "For veterans, military families, and eligible military-connected applicants.",
    icon: <Medal className="h-5 w-5" />,
  },
];

function SectionEyebrow({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        {icon}
      </span>
      <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-700 sm:tracking-[0.28em]">
        {children}
      </p>
    </div>
  );
}

function HelpCard({ card }: { card: HelpCard }) {
  return (
    <Link
      href={card.href}
      className="group rounded-[28px] border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md sm:p-6"
    >
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
        {card.icon}
      </div>

      <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
        {card.eyebrow}
      </p>

      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        {card.title}
      </h2>

      <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
        {card.description}
      </p>

      <span className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800 transition group-hover:bg-emerald-600 group-hover:text-white">
        {card.cta}
        <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

function OnboardingGuideCard({ guide }: { guide: OnboardingGuide }) {
  return (
    <article className="rounded-[30px] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
        {guide.icon}
      </div>

      <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
        {guide.audience}
      </p>
      <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        {guide.title}
      </h3>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
        {guide.description}
      </p>

      <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
          Setup steps
        </p>
        <div className="mt-3 grid gap-2">
          {guide.steps.map((step, index) => (
            <div
              key={step}
              className="rounded-xl bg-white px-3 py-2 text-sm font-bold leading-5 text-slate-700 ring-1 ring-emerald-100"
            >
              <span className="font-black text-emerald-700">
                {index + 1}.
              </span>{" "}
              {step}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {guide.tips.map((tip) => (
          <span
            key={tip}
            className="rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-xs font-black text-emerald-800"
          >
            {tip}
          </span>
        ))}
      </div>
    </article>
  );
}

function PaymentGuideCard({ guide }: { guide: PaymentGuide }) {
  return (
    <article
      id={guide.href.replace("#", "")}
      className="group overflow-hidden rounded-[30px] border border-emerald-100 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
    >
      <div className="relative aspect-[724/2172] w-full overflow-hidden bg-emerald-50">
        <Image
          src={guide.imageSrc}
          alt={guide.imageAlt}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover object-top transition duration-300 group-hover:scale-[1.015]"
          priority={false}
        />
      </div>

      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
            {guide.icon}
            {guide.audience}
          </span>
        </div>

        <h3 className="text-2xl font-black tracking-tight text-slate-950">
          {guide.title}
        </h3>

        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          {guide.description}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {guide.highlights.map((highlight) => (
            <span
              key={highlight}
              className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-800"
            >
              {highlight}
            </span>
          ))}
        </div>

        <a
          href={guide.imageSrc}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
        >
          Open Guide
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </article>
  );
}

function FaqSection({ section }: { section: HelpSection }) {
  const sectionId = section.title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return (
    <section
      id={sectionId}
      className="scroll-mt-6 rounded-[32px] border border-emerald-100 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6 lg:p-8"
    >
      <div className="grid gap-5 lg:grid-cols-[0.36fr_0.64fr] lg:items-start">
        <div>
          <SectionEyebrow icon={section.icon}>{section.title}</SectionEyebrow>
          <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">
            {section.description}
          </p>
        </div>

        <div className="space-y-3">
          {section.items.map((item) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 open:bg-white"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left">
                <span className="text-base font-black leading-6 text-slate-950">
                  {item.question}
                </span>
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm transition group-open:rotate-45">
                  +
                </span>
              </summary>

              <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HelpPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f8fffb_0%,#f3fbf7_48%,#ffffff_100%)] pb-24 text-slate-900 sm:pb-0">
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-emerald-200 bg-white/95 px-4 py-3 shadow-[0_-12px_35px_rgba(15,23,42,0.12)] backdrop-blur sm:hidden">
        <Link
          href="/contact"
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700"
        >
          Contact SitGuru Support
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <PawPrint className="absolute left-[6%] top-28 h-10 w-10 rotate-[-18deg] text-emerald-200/70" />
        <Heart className="absolute right-[8%] top-44 h-8 w-8 text-emerald-200/70" />
        <PawPrint className="absolute right-[10%] top-[24%] h-12 w-12 rotate-[12deg] text-emerald-100" />
        <Heart className="absolute left-[8%] top-[42%] h-8 w-8 text-emerald-100" />
        <PawPrint className="absolute left-[10%] bottom-24 h-12 w-12 rotate-[-10deg] text-emerald-100" />
      </div>

      <section className="relative border-b border-emerald-100 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_34%),linear-gradient(180deg,_#f7fffb_0%,_#effcf5_100%)]">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center sm:px-6 sm:py-18 lg:px-8 lg:py-24">
          <div className="flex items-center justify-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <LifeBuoy className="h-4 w-4" />
            </span>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-emerald-700 sm:tracking-[0.32em]">
              SitGuru Help Center
            </p>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <MessageCircle className="h-4 w-4" />
            </span>
          </div>

          <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            How can we help today?
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-base font-semibold leading-8 text-slate-700 sm:text-lg">
            Get quick answers for Pet Parents, Pet Gurus, bookings, payments,
            payouts, accounts, programs, ambassadors, and trust and safety.
            SitGuru is built to make local pet care feel easier, more trusted,
            and more community focused.
          </p>

          <div className="mx-auto mt-8 max-w-3xl rounded-[26px] border border-emerald-100 bg-white p-4 text-left shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Search className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-950">
                  Looking for something specific?
                </p>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                  Browse the categories below or contact SitGuru and we’ll route
                  your question to the right place.
                </p>
              </div>

              <Link
                href="/contact"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700 sm:w-auto"
              >
                Contact Support
              </Link>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm font-bold text-slate-600">
            <span className="rounded-full border border-emerald-200 bg-white px-4 py-2">
              Free Signup
            </span>
            <span className="rounded-full border border-emerald-200 bg-white px-4 py-2">
              Pet Parent Help
            </span>
            <span className="rounded-full border border-emerald-200 bg-white px-4 py-2">
              Pet Guru Help
            </span>
            <span className="rounded-full border border-emerald-200 bg-white px-4 py-2">
              Onboarding Help
            </span>
            <span className="rounded-full border border-emerald-200 bg-white px-4 py-2">
              Payment Guides
            </span>
            <span className="rounded-full border border-emerald-200 bg-white px-4 py-2">
              Ambassador Support
            </span>
            <span className="rounded-full border border-emerald-200 bg-white px-4 py-2">
              Trust & Safety
            </span>
            <span className="rounded-full border border-emerald-200 bg-white px-4 py-2">
              SitGuru PawReport™
            </span>
            <span className="rounded-full border border-emerald-200 bg-white px-4 py-2">
              Reviews & Trust Signals
            </span>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {quickHelpCards.map((card) => (
            <HelpCard key={card.title} card={card} />
          ))}
        </div>
      </section>


      <section
        id="reviews-help"
        className="relative mx-auto max-w-7xl scroll-mt-28 px-4 pb-8 sm:px-6 lg:px-8"
      >
        <div className="overflow-hidden rounded-[36px] border border-amber-100 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.07)]">
          <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
            <div className="bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_48%,#ecfdf5_100%)] p-6 sm:p-8 lg:p-10">
              <SectionEyebrow icon={<Medal className="h-4 w-4" />}>
                Reviews & Trust Signals
              </SectionEyebrow>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Real reviews help Pet Parents choose trusted care and help Gurus grow.
              </h2>

              <p className="mt-4 text-base font-semibold leading-8 text-slate-700">
                After a completed booking, Pet Parents can rate their Guru and leave written feedback.
                Those reviews become real trust signals on Guru profiles. Gurus can use reviews to
                improve communication, PawReport Live updates, walk tracking, care notes, and future
                service quality. Ambassadors can explain reviews as one of the ways SitGuru builds
                local confidence without fake ratings or inflated review totals.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  ["⭐", "Real Star Ratings", "Ratings come from submitted booking reviews."],
                  ["💬", "Written Feedback", "Pet Parents can describe the care experience in their own words."],
                  ["🐾", "Would Book Again", "Repeat-care signals help show confidence in the Guru."],
                  ["🛡️", "Public Trust", "Public Guru profiles show real review counts or New when no reviews exist."],
                ].map(([icon, title, body]) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm"
                  >
                    <div className="text-2xl">{icon}</div>
                    <h3 className="mt-2 text-base font-black text-slate-950">
                      {title}
                    </h3>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                      {body}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 sm:p-8 lg:p-10">
              <div className="grid gap-4">
                {[
                  ["For Pet Parents", "Open the completed booking, choose a star rating, write honest feedback, mark whether you would book again, and submit the review."],
                  ["For Gurus", "Deliver reliable care, communicate clearly, use PawReport Live, complete live walks when relevant, and review feedback to improve future bookings."],
                  ["For Ambassadors", "Explain that SitGuru uses real booking-based reviews to help families choose care and help strong Gurus stand out locally."],
                ].map(([title, body]) => (
                  <div
                    key={title}
                    className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-5"
                  >
                    <h3 className="text-xl font-black text-slate-950">{title}</h3>
                    <p className="mt-2 text-sm font-semibold leading-7 text-slate-700">
                      {body}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-[1.4rem] border border-emerald-200 bg-emerald-50 p-5">
                <h3 className="text-xl font-black text-emerald-950">
                  Review rule of thumb
                </h3>
                <p className="mt-2 text-sm font-semibold leading-7 text-emerald-800">
                  Honest, specific reviews are better than generic praise. Mention communication,
                  timeliness, PawReport quality, photos, walk tracking, and how the pet seemed after care.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="pawreport-help"
        className="relative mx-auto max-w-7xl scroll-mt-28 px-4 pb-8 sm:px-6 lg:px-8"
      >
        <div className="overflow-hidden rounded-[36px] border border-emerald-100 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.07)]">
          <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
            <div className="bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_48%,#eff6ff_100%)] p-6 sm:p-8 lg:p-10">
              <SectionEyebrow icon={<PawPrint className="h-4 w-4" />}>
                SitGuru PawReport Live™
              </SectionEyebrow>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Live walks, real-time care updates, and a complete visit summary.
              </h2>

              <p className="mt-4 text-base font-semibold leading-8 text-slate-700">
                PawReport Live helps Pet Parents follow what is happening during
                care and gives Gurus a simple command center for updates,
                photos, notes, walk tracking, and final summaries. When walking
                is part of the service, Gurus can start, pause, resume, and end a
                live walk while SitGuru saves distance, duration, and walk
                activity to the booking record.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  ["🚶", "Live Walk Tracking", "Start, pause, resume, and end walks from the booking PawReport."],
                  ["📍", "Distance & Duration", "Track walk timing and distance when browser location is allowed."],
                  ["📸", "Photos & Captions", "Upload visit photos with helpful notes for Pet Parents."],
                  ["🐾", "Potty Updates", "Log pee and poop updates when relevant."],
                  ["🥣", "Food & Water", "Confirm feeding and fresh water during care."],
                  ["💊", "Medication & Care Notes", "Add medication, mood, play, and custom care notes."],
                ].map(([icon, title, body]) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm"
                  >
                    <div className="text-2xl">{icon}</div>
                    <h3 className="mt-2 text-base font-black text-slate-950">
                      {title}
                    </h3>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                      {body}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 sm:p-8 lg:p-10">
              <div className="grid gap-4">
                <div className="rounded-[28px] border border-emerald-100 bg-emerald-50 p-5">
                  <h3 className="text-xl font-black text-slate-950">
                    For Pet Parents
                  </h3>
                  <ol className="mt-4 grid gap-3 text-sm font-semibold leading-6 text-slate-700">
                    <li><span className="font-black text-emerald-700">1.</span> Open your Pet Parent dashboard and choose the active booking.</li>
                    <li><span className="font-black text-emerald-700">2.</span> Select <span className="font-black">View Live PawReport</span> when your Guru starts care or adds updates.</li>
                    <li><span className="font-black text-emerald-700">3.</span> Follow live walk status, distance, duration, photos, potty updates, food, water, medication, mood, play, care notes, and the final summary.</li>
                    <li><span className="font-black text-emerald-700">4.</span> Use Messages if you need to ask your Guru or SitGuru support a question during the booking.</li>
                  </ol>
                </div>

                <div className="rounded-[28px] border border-sky-100 bg-sky-50 p-5">
                  <h3 className="text-xl font-black text-slate-950">
                    For Gurus
                  </h3>
                  <ol className="mt-4 grid gap-3 text-sm font-semibold leading-6 text-slate-700">
                    <li><span className="font-black text-sky-700">1.</span> Open <span className="font-black">Guru Dashboard → Bookings & PawReports</span>, then select the booking.</li>
                    <li><span className="font-black text-sky-700">2.</span> Tap <span className="font-black">Start PawReport</span> when care begins so Pet Parents can follow updates.</li>
                    <li><span className="font-black text-sky-700">3.</span> For dog walks, use <span className="font-black">Start Walk</span>, <span className="font-black">Pause Walk</span>, <span className="font-black">Resume Walk</span>, and <span className="font-black">End Walk</span>. Keep the page open and allow location access.</li>
                    <li><span className="font-black text-sky-700">4.</span> Add photos, potty, food, water, medication, play, mood, and care notes during the visit.</li>
                    <li><span className="font-black text-sky-700">5.</span> Complete the PawReport with a clear final summary before leaving or shortly after service ends.</li>
                  </ol>
                </div>

                <div className="rounded-[28px] border border-amber-100 bg-amber-50 p-5">
                  <h3 className="text-xl font-black text-slate-950">
                    Good to know
                  </h3>
                  <ul className="mt-4 grid gap-3 text-sm font-semibold leading-6 text-slate-700">
                    <li>• Live walk tracking works best on a phone with location permission allowed.</li>
                    <li>• PawReports are not only for dog walks. They also support drop-ins, pet sitting, boarding, daycare, and other care visits.</li>
                    <li>• Final PawReport summaries stay connected to the booking history so Pet Parents and Gurus have a clear care record.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="onboarding-help"
        className="relative mx-auto max-w-7xl scroll-mt-6 px-4 pb-8 sm:px-6 lg:px-8"
      >
        <div className="rounded-[36px] border border-emerald-100 bg-[linear-gradient(135deg,#ffffff_0%,#f0fdf4_100%)] p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <SectionEyebrow icon={<ClipboardCheck className="h-4 w-4" />}>
                Onboarding Help
              </SectionEyebrow>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Simple setup help for every SitGuru role.
              </h2>

              <p className="mt-4 text-base font-semibold leading-7 text-slate-600">
                Use these quick onboarding guides to understand what each setup
                step means, what is optional, and what happens after information
                is submitted to SitGuru.
              </p>
            </div>

            <div className="rounded-[28px] border border-emerald-100 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <LifeBuoy className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-950">
                    Need onboarding help?
                  </h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    Email support@sitguru.com and include your role, account
                    email, and the setup step or dashboard area where you need help.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {onboardingGuides.map((guide) => (
              <OnboardingGuideCard key={guide.title} guide={guide} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-emerald-100 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <SectionEyebrow icon={<CircleHelp className="h-4 w-4" />}>
                Popular Questions
              </SectionEyebrow>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Start with the basics.
              </h2>

              <p className="mt-4 text-base font-semibold leading-7 text-slate-600">
                These are common first questions from Pet Parents, Gurus, and
                new visitors learning how SitGuru works.
              </p>
            </div>

            <div className="space-y-3">
              {popularQuestions.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 open:bg-white"
                >
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left">
                    <span className="text-base font-black leading-6 text-slate-950">
                      {item.question}
                    </span>
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm transition group-open:rotate-45">
                      +
                    </span>
                  </summary>

                  <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="payments-payouts"
        className="relative mx-auto max-w-7xl scroll-mt-6 px-4 pb-8 sm:px-6 lg:px-8"
      >
        <div className="rounded-[36px] border border-emerald-100 bg-[linear-gradient(135deg,#ffffff_0%,#f0fdf4_100%)] p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <SectionEyebrow icon={<CreditCard className="h-4 w-4" />}>
                Payments & Payouts
              </SectionEyebrow>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Stripe and payment guides for every SitGuru role.
              </h2>

              <p className="mt-4 text-base font-semibold leading-7 text-slate-600">
                Use these role-specific guides to help Gurus set up payouts,
                Ambassadors set up referral earnings, and Pet Parents pay for
                services through secure checkout.
              </p>
            </div>

            <div className="rounded-[28px] border border-emerald-100 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-950">
                    Need help with payment setup?
                  </h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    Email us anytime at{" "}
                    <a
                      href="mailto:support@sitguru.com"
                      className="font-black text-emerald-700 underline decoration-emerald-200 underline-offset-4"
                    >
                      support@sitguru.com
                    </a>{" "}
                    and include your role, account email, and a short description
                    of what you need help with.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {paymentGuides.map((guide) => (
              <PaymentGuideCard key={guide.title} guide={guide} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-emerald-200 bg-emerald-950 p-6 text-white shadow-sm sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] !text-emerald-200">
                Program Support
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight !text-white sm:text-4xl">
                Looking for SitGuru programs?
              </h2>

              <p className="mt-3 text-sm font-semibold leading-6 !text-white/85 sm:text-base sm:leading-7">
                SitGuru program pathways are listed in this order: Student Hire,
                Community Hire, and Military Hire. Ambassador opportunities help
                local supporters spread the word and grow trusted community
                connections.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/programs"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-emerald-950 transition hover:bg-emerald-50"
                >
                  View Programs
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/programs/apply"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-black !text-white transition hover:bg-white/15"
                >
                  Apply to Program
                  <Sparkles className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {programPathways.map((program) => (
                <div
                  key={program.title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-emerald-200">
                    {program.icon}
                  </div>
                  <h3 className="mt-3 text-base font-black !text-white">
                    {program.title}
                  </h3>
                  <p className="mt-2 text-sm font-semibold leading-6 !text-white/75">
                    {program.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="relative mx-auto max-w-7xl space-y-6 px-4 pb-8 sm:px-6 lg:px-8">
        {helpSections.map((section) => (
          <FaqSection key={section.title} section={section} />
        ))}
      </div>

      <section className="relative mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_100%)] p-6 text-center shadow-[0_10px_30px_rgba(16,185,129,0.08)] sm:p-10">
          <div className="flex items-center justify-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Heart className="h-4 w-4" />
            </span>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-700 sm:tracking-[0.28em]">
              Still Need Help?
            </p>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Mail className="h-4 w-4" />
            </span>
          </div>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Send SitGuru a message and we’ll route it to the right place.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600">
            Whether you are a Pet Parent, Pet Guru, program applicant,
            Ambassador, partner, or someone with a support question, SitGuru is
            built around real communication and trusted local pet care.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-emerald-600 px-7 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 sm:w-auto"
            >
              Contact Support
            </Link>

            <Link
              href="/search"
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full border border-emerald-200 bg-white px-7 py-4 text-base font-black text-emerald-700 transition hover:bg-emerald-50 sm:w-auto"
            >
              Find Care
            </Link>

            <Link
              href="/become-a-guru"
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full border border-emerald-200 bg-white px-7 py-4 text-base font-black text-emerald-700 transition hover:bg-emerald-50 sm:w-auto"
            >
              Become a Guru
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}