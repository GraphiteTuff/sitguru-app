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
      "Get help finding Gurus, understanding pet care details, preparing for bookings, and managing your SitGuru experience.",
    href: "/search",
    cta: "Find Care",
    icon: <PawPrint className="h-6 w-6" />,
  },
  {
    title: "Pet Guru Help",
    eyebrow: "Join as a local provider",
    description:
      "Get help joining as a Pet Guru, building your profile, choosing services, setting your local area, and connecting with Pet Parents.",
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
      "Learn about Student Hire, Community Hire, Military Hire, and Ambassador pathways that help SitGuru grow locally.",
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
      "Complete Stripe payout setup so you can receive payouts for bookings, commission, and referral earnings.",
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
      "Complete Stripe payout setup so you can receive ambassador payouts, commission, and referral earnings.",
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
          "SitGuru helps Pet Parents discover and connect with Gurus who offer trusted local pet care services. Pet Parents can search for care, review profiles, and use SitGuru tools to support communication and booking-related details.",
      },
      {
        question: "Is SitGuru free to join?",
        answer:
          "Yes. SitGuru is designed to keep signup simple for Pet Parents and Pet Gurus. Create an account, build your profile, and use SitGuru to find local pet care connections or local pet care opportunities.",
      },
      {
        question: "Who is SitGuru for?",
        answer:
          "SitGuru is for Pet Parents who need trusted care and for Pet Gurus who provide pet care services such as sitting, walking, boarding, drop-ins, grooming support, training support, and more.",
      },
      {
        question: "Is SitGuru only for one city or state?",
        answer:
          "No. SitGuru is built to support local pet care connections across states, cities, towns, neighborhoods, communities, and townships as the marketplace grows.",
      },
    ],
  },
  {
    title: "Onboarding & Setup",
    description:
      "Help understanding SitGuru onboarding steps, submitted statuses, documents, and what happens after setup tasks are completed.",
    icon: <ClipboardCheck className="h-5 w-5" />,
    items: [
      {
        question: "What does Submitted mean on Guru Step 5?",
        answer:
          "Submitted means SitGuru received the Guru Onboarding Packet and it is waiting for admin review. Gurus can continue to Step 6 while SitGuru reviews Step 5.",
      },
      {
        question: "Why is Step 5 amber instead of green?",
        answer:
          "Amber means Step 5 was submitted and is pending SitGuru review. Once SitGuru approves the packet, Step 5 turns green and shows Complete.",
      },
      {
        question: "Do Gurus have to upload documents during Step 5?",
        answer:
          "Only upload documents if SitGuru specifically requested them. Do not upload W-9 forms, full SSNs, banking details, or sensitive payment information through the onboarding packet page.",
      },
      {
        question: "Can a Guru continue to Step 6 before Step 5 is approved?",
        answer:
          "Yes. Gurus can save Step 5 and continue to Step 6 to connect Stripe payouts while SitGuru reviews the submitted onboarding packet.",
      },
      {
        question: "What happens after all Guru onboarding steps are complete?",
        answer:
          "SitGuru reviews profile readiness, onboarding packet status, trust and safety status, services, pricing, public visibility, and payout readiness before a Guru becomes fully bookable.",
      },
      {
        question: "Where can users get help during onboarding?",
        answer:
          "Users can review the Help Center, open the relevant dashboard section, or contact SitGuru support at support@sitguru.com for onboarding, payment, profile, or booking questions.",
      },
    ],
  },
  {
    title: "Pet Parents",
    description: "Help for families looking for trusted local pet care.",
    icon: <PawPrint className="h-5 w-5" />,
    items: [
      {
        question: "How do I find the right Guru?",
        answer:
          "Review Guru profiles, services, experience, location, care style, and other details. Choose someone who feels like a good fit for your pet’s needs, routine, personality, and care expectations.",
      },
      {
        question: "What details should I share about my pet?",
        answer:
          "Helpful details include feeding routines, medication or health notes you choose to provide, behavior notes, walking preferences, emergency contacts, veterinarian information, access instructions, and anything a Guru should know to provide thoughtful care.",
      },
      {
        question: "Can I ask questions before booking?",
        answer:
          "Yes. Clear communication helps everyone. Pet Parents should ask questions early so they feel comfortable with the Pet Guru, the service, timing, care expectations, and any special instructions.",
      },
      {
        question: "How do Pet Parents pay for services?",
        answer:
          "Pet Parents can use SitGuru’s secure checkout to review booking details, add a payment method, confirm billing details, submit payment, and manage bookings, receipts, and messages from their dashboard.",
      },
      {
        question: "Why should I keep care details organized through SitGuru?",
        answer:
          "Keeping care details organized through SitGuru helps preserve service notes, pet instructions, message history, booking records, and support context if anyone needs to review what was discussed.",
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
    description: "Help for expert pet care providers using SitGuru.",
    icon: <UsersRound className="h-5 w-5" />,
    items: [
      {
        question: "How do I become a Pet Guru?",
        answer:
          "Visit the Become a Guru page, create your profile, choose the services you are interested in offering, share your local service area, and begin building a profile that helps Pet Parents understand your care style.",
      },
      {
        question: "What should I include in my Pet Guru profile?",
        answer:
          "Include your services, experience, general service area, availability preferences, photos, care approach, pet types you support, and anything that helps Pet Parents feel confident choosing you.",
      },
      {
        question: "Do Pet Gurus choose their own services and availability?",
        answer:
          "Yes. Pet Gurus can choose the services they are interested in offering, the areas they prefer to serve, and the requests that fit their availability as SitGuru grows.",
      },
      {
        question: "How do Gurus set up Stripe payouts?",
        answer:
          "Gurus can use the Guru Stripe Setup Guide to select Individual as the business type, enter personal details, add business details, connect a bank account, choose a payout account, review the setup, and return to the Earnings tab to track payout activity.",
      },
      {
        question: "Is SitGuru only for new pet care providers?",
        answer:
          "No. SitGuru is also for existing sitters, walkers, trainers, groomers, boarding providers, and trusted caregivers who want another way to connect with Pet Parents.",
      },
      {
        question: "Are Pet Gurus employees of SitGuru?",
        answer:
          "Pet Gurus provide services as independent local providers through the SitGuru marketplace. More detailed onboarding, tax, and provider information is shared during the approval and setup process.",
      },
      {
        question: "What are trust and safety steps?",
        answer:
          "Trust and safety steps are simple review or verification steps designed to help protect pets, Pet Parents, Gurus, and the SitGuru community. These steps may vary depending on role, location, services, and platform needs.",
      },
    ],
  },
  {
    title: "Bookings & Communication",
    description:
      "Help with requests, schedules, messages, and care details.",
    icon: <CalendarCheck className="h-5 w-5" />,
    items: [
      {
        question: "How do bookings work on SitGuru?",
        answer:
          "SitGuru may support booking requests, service details, scheduling, communication, confirmations, care notes, and related care information. Exact booking workflows may evolve as SitGuru grows.",
      },
      {
        question: "Why use SitGuru for repeat care?",
        answer:
          "Using SitGuru for repeat care helps keep pet instructions, service history, reviews, communication, and support context in one place. That makes future care easier for both Pet Parents and Pet Gurus.",
      },
      {
        question: "What should be confirmed before care starts?",
        answer:
          "Pet Parents and Gurus should confirm service type, date, time, location, pet details, care instructions, access details, emergency contacts, and expectations before care begins.",
      },
      {
        question: "Can Pet Parents and Gurus message each other?",
        answer:
          "Where messaging features are available, SitGuru is designed to support clearer communication between Pet Parents and Gurus. Good communication helps avoid confusion and supports better care.",
      },
      {
        question: "What if something changes after a booking is requested?",
        answer:
          "Communicate as early as possible. If timing, location, pet needs, or service details change, Pet Parents and Gurus should clarify those details before care happens.",
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
          "Use the signup page and choose whether you are joining as a Pet Parent, Future Guru, or both. You may be able to continue with phone or email depending on the account flow.",
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
          "Yes, where profile tools are available, users should be able to update account details, profile information, and certain preferences through their dashboard or profile area.",
      },
    ],
  },
  {
    title: "Programs",
    description: "Help with SitGuru program pathways and applications.",
    icon: <GraduationCap className="h-5 w-5" />,
    items: [
      {
        question: "What programs does SitGuru offer?",
        answer:
          "SitGuru program pathways include Student Hire, Community Hire, and Military Hire. These programs help qualified students, local community members, veterans, military spouses, and military-connected applicants explore ways to grow with SitGuru.",
      },
      {
        question: "What order are the programs listed in?",
        answer:
          "SitGuru lists programs in this order: Student Hire, Community Hire, and Military Hire.",
      },
      {
        question: "What is the Ambassador Program?",
        answer:
          "The Ambassador Program is for trusted local supporters, students, pet professionals, community partners, and military-connected advocates who want to help introduce Pet Parents and Pet Gurus to SitGuru.",
      },
      {
        question: "Can PA CareerLink, colleges, or community partners refer applicants?",
        answer:
          "Yes. SitGuru welcomes referrals from workforce partners, schools, colleges, community groups, local organizations, veteran representatives, and trusted pet-care networks. Applicants should apply through SitGuru so their information is routed correctly.",
      },
      {
        question: "How do Ambassadors set up Stripe payouts?",
        answer:
          "Ambassadors can use the Ambassador Stripe Setup Guide to complete Stripe setup, connect a bank account, choose a payout account, and return to the SitGuru dashboard to track referral activity, ambassador earnings, and payout status.",
      },
      {
        question: "Does applying to a program guarantee approval?",
        answer:
          "No. Applying to a program does not guarantee acceptance, approval, Guru activation, bookings, rewards, or placement. Applications may be reviewed based on program fit, eligibility, onboarding needs, and trust and safety steps.",
      },
      {
        question: "Where do I apply?",
        answer:
          "Use the programs application page to apply for Student Hire, Community Hire, Military Hire, or Ambassador consideration.",
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
          "Gurus need Stripe setup to receive payouts for bookings, commission, and referral earnings. The Guru Stripe Setup Guide walks through choosing business type, entering personal details, connecting a bank, choosing a payout account, and returning to the Earnings tab.",
      },
      {
        question: "Why do Ambassadors need to set up Stripe?",
        answer:
          "Ambassadors need Stripe setup to receive ambassador payouts, commission, and referral earnings. The Ambassador Stripe Setup Guide explains how to connect a payout account and track referral-related earnings in SitGuru.",
      },
      {
        question: "How do Pet Parents pay for services?",
        answer:
          "Pet Parents can use SitGuru’s secure checkout to review booking details, add a payment method, confirm billing information, submit payment, receive confirmation, and manage bookings and receipts from their dashboard.",
      },
      {
        question: "Is payment information secure?",
        answer:
          "SitGuru may use trusted third-party payment providers such as Stripe to support secure checkout, payout setup, and payment processing. Users should only enter payment details through the official SitGuru or Stripe checkout flow.",
      },
      {
        question: "Who do I contact for payment or payout help?",
        answer:
          "Email support@sitguru.com or use the contact page. Include your name, account email, role, booking details if applicable, and a clear description of the issue.",
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
          "SitGuru may use profile reviews, trust and safety steps, communication tools, support records, user reports, and platform rules to help protect pets, Pet Parents, Gurus, and the community.",
      },
      {
        question: "Why does SitGuru encourage organized communication and records?",
        answer:
          "Organized communication, care details, service notes, and support records help everyone understand what was requested, what was confirmed, and what happened if a question comes up later.",
      },
      {
        question: "Does trust and safety remove all risk?",
        answer:
          "No online marketplace can remove every risk. Pet care involves real people, real pets, and real-world circumstances. SitGuru’s goal is to support better information, clearer communication, and safer decisions.",
      },
      {
        question: "How do I report a concern?",
        answer:
          "Use the contact page and include as much detail as possible. For urgent pet safety, medical, or emergency concerns, contact your veterinarian, local emergency services, or the proper local authority first.",
      },
      {
        question: "What should users do to help keep SitGuru safe?",
        answer:
          "Be honest, communicate clearly, keep account information secure, share accurate pet care details, respect homes and property, follow platform rules, and report concerns when needed.",
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