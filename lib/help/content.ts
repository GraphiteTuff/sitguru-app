// lib/help/content.ts
/** Structured FAQ / step bodies migrated from legacy /help-center (modernized). */

import { VETERANS_MILITARY_FAMILIES_PROGRAM } from "@/lib/programs/veterans-military-families";

export type HelpFaqItem = { question: string; answer: string };
export type HelpStepBlock = {
  title: string;
  audience: string;
  steps: string[];
  tips?: string[];
};

/** Shared modernization note used across PawReport-related answers */
export const AUTOMATED_WALK_REALITY =
  "Gurus track walks live via the high-accuracy phone dashboard, sending instant push alerts for potty breaks and a beautiful responsive email report the moment a walk ends.";

export const gettingStartedFaqs: HelpFaqItem[] = [
  {
    question: "What is SitGuru?",
    answer:
      "SitGuru is a trusted pet care marketplace that helps Pet Parents connect with local Pet Gurus for walks, sitting, drop-ins, boarding, training support, and other local pet care needs.",
  },
  {
    question: "How does SitGuru work?",
    answer:
      "SitGuru helps Pet Parents discover and book local Gurus for walks, sitting, boarding, drop-ins, daycare, training support, and other pet care needs. The dashboard keeps profiles, bookings, messages, PawReport Live updates, payments, and support context organized. During walks, " +
      AUTOMATED_WALK_REALITY,
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
    question: "What is a Pet Guru?",
    answer:
      "A Pet Guru is a local pet care provider on SitGuru. That can include dog walkers, sitters, drop-in caregivers, boarding providers, trainers, groomers, and experienced pet people who want to help local families.",
  },
  {
    question: "What dashboards are available?",
    answer:
      "Pet Parents use the customer dashboard for pets, bookings, messages, live PawReports, PawPerks, and SitGuru University. Gurus use their dashboard as a workstation for profile setup, pricing, My Calendar, bookings, the high-accuracy phone walk publisher, reviews, messages, and payouts. Ambassadors use their dashboard for referrals, outreach, and program activity.",
  },
];

export const accountFaqs: HelpFaqItem[] = [
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
    question: "What should I do if I cannot log in or reset my password?",
    answer:
      "Check that you are using the correct phone number or email. Try requesting a fresh login code. If you still cannot access your account, contact SitGuru through the contact page and include the email or phone number connected to your account.",
  },
  {
    question: "Can I update my profile photo, pet bio, or account details later?",
    answer:
      "Yes. Update account details, profile photo, pet bio and care notes, Guru service area, pricing, Ambassador contact information, and notification preferences from the proper dashboard area when tools are available.",
  },
  {
    question: "What does Guru approval mean?",
    answer:
      "After you submit your Guru onboarding packet and complete required trust and safety steps, SitGuru reviews your account. “Submitted” means we received your packet and will review it — you are not fully bookable until approval steps are complete.",
  },
];

export const onboardingGuides: HelpStepBlock[] = [
  {
    title: "Guru Onboarding",
    audience: "For Gurus",
    steps: [
      "Step 1: Complete your profile with name, bio, photo, and experience.",
      "Step 2: Set your service area so local Pet Parents can find you.",
      "Step 3: Add services, pricing, and request public visibility.",
      "Step 4: Complete Trust & Safety Screening when required or view the launch-year waiver.",
      "Step 5: Submit your Guru Onboarding Packet with acknowledgments and typed signature.",
      "Step 6: Connect Stripe payouts so SitGuru can pay eligible earnings.",
      "Step 7: Practice PawReport Live on /guru/walk/[bookingId] so you can publish GPS, potty taps, and automated end-of-walk reports.",
    ],
    tips: [
      "Submitted means SitGuru received your packet and will review it (Guru approval).",
      "You can continue to Stripe setup while the onboarding packet is pending review.",
      "Only upload documents if SitGuru specifically requested them.",
    ],
  },
  {
    title: "Ambassador Onboarding",
    audience: "For Ambassadors",
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
    steps: [
      "Create your Pet Parent account.",
      "Add pet details, a clear pet bio, photos, and helpful care instructions.",
      "Search for a Guru and review their profile, services, and location.",
      "Request a booking and review the service details.",
      "Pay securely through SitGuru checkout when prompted.",
      "Use your dashboard and live walk link to track bookings, messages, receipts, push alerts, and automated PawReport emails.",
    ],
    tips: [
      "Clear pet details help Gurus provide better care.",
      "Keep booking conversations organized through SitGuru when available.",
      "Contact support if checkout or booking details look incorrect.",
    ],
  },
];

export const billingFaqs: HelpFaqItem[] = [
  {
    question: "How do Pet Parents pay for services?",
    answer:
      "Pet Parents pay through SitGuru checkout only. Depending on what is available, they may use credit/debit card, Apple Pay, Google Pay, Link by Stripe, saved payment methods, ACH/bank when available, PawPerks credits, referral credits, promo codes, gift cards, SitGuru credits, and optional Guru tips. Receipts, booking status, PawReports, messages, and reviews stay connected to the SitGuru dashboard.",
  },
  {
    question: "Can I pay or get paid outside SitGuru?",
    answer:
      "No. SitGuru bookings should be paid through SitGuru only. Do not use cash, Venmo, Zelle, Cash App, PayPal, direct bank transfer, personal card readers, checks, or other outside payment arrangements for SitGuru bookings. This keeps receipts, booking records, support, PawReport history, reviews, credits, tips, and payout tracking connected.",
  },
  {
    question: "Why do Gurus need to set up Stripe?",
    answer:
      "Gurus need Stripe setup before eligible booking payouts, tips, commission, or referral earnings can be sent. Complete business type, personal details, bank account connection, and return to the Earnings tab when finished.",
  },
  {
    question: "Why do Ambassadors need to set up Stripe?",
    answer:
      "Ambassadors may need Stripe setup before eligible ambassador payouts, commission, or referral earnings can be sent.",
  },
  {
    question: "How do tips work?",
    answer:
      "When tips are available, Pet Parents should add tips through SitGuru checkout or the SitGuru booking flow only. Tip records stay connected to the booking so Admin and Guru payout views can track them correctly.",
  },
  {
    question: "How do credits, promo codes, and gift cards work?",
    answer:
      "PawPerks credits, referral credits, promo codes, gift cards, and SitGuru credits should be entered or tracked through SitGuru only. If a credit or code does not appear correctly, contact support before paying.",
  },
  {
    question: "How do refunds work?",
    answer:
      "Refund eligibility depends on booking status, cancellation timing, and the service details. Contact support@sitguru.com with your booking ID, role, and a clear description — Admin can review checkout status, payouts, and Stripe references to help resolve refund questions.",
  },
  {
    question: "Who do I contact for payment or payout help?",
    answer:
      "Use the contact page or email support@sitguru.com. Include your name, account email, role, booking details if applicable, and a clear description of the issue.",
  },
];

export const paymentFlows: HelpStepBlock[] = [
  {
    title: "Pet Parents: paying for care",
    audience: "Pet Parents",
    steps: [
      "Choose a Guru from SitGuru search or a Guru profile.",
      "Select the service, dates, pet, care location, notes, and any available pricing options.",
      "Review the SitGuru checkout summary before payment, including service subtotal, SitGuru fees when applicable, credits, promo codes, gift cards, and optional Guru tip.",
      "Pay through SitGuru checkout only using secure options such as card, Apple Pay, Google Pay, Link by Stripe, saved methods, ACH when available, or credits/promo codes.",
      "Return to your Pet Parent dashboard for booking status, receipts, messages, live PawReport tracking, instant potty push alerts, and the automated email report when the walk ends.",
    ],
  },
  {
    title: "Gurus: getting paid for SitGuru bookings",
    audience: "Gurus",
    steps: [
      "Complete Guru onboarding, profile, service area, services, pricing, and My Calendar setup.",
      "Connect Stripe payout setup from the Guru dashboard before eligible payouts can be sent.",
      "Keep all SitGuru booking payments inside SitGuru checkout. Do not ask Pet Parents to pay off-platform.",
      "Use the booking dashboard to track payment status, payout status, estimated Guru payout, tips, booking history, PawReports, and reviews.",
      "Contact SitGuru support if a payout, Stripe account, booking total, or tip looks incorrect.",
    ],
  },
  {
    title: "Ambassadors: referral and reward payouts",
    audience: "Ambassadors",
    steps: [
      "Use your SitGuru referral code or link so referrals can be tracked correctly.",
      "Direct Pet Parents and Gurus to SitGuru signup, Guru profiles, and SitGuru checkout instead of off-platform payment arrangements.",
      "Complete Stripe payout setup if eligible Ambassador, referral, or commission payouts apply to your role.",
      "Track referral activity from the Ambassador dashboard as tools become available.",
      "Contact SitGuru support if your referral code, link, reward, or payout setup looks incorrect.",
    ],
  },
  {
    title: "Custom quotes, credits, and support review",
    audience: "All roles",
    steps: [
      "Some bookings may use custom quotes when pricing needs review before checkout.",
      "Credits, promo codes, gift cards, and optional Guru tips should be entered or tracked through SitGuru only.",
      "If checkout does not look right, stop before paying and contact SitGuru support with the booking, Guru, pet, date, and payment issue.",
      "Admin may review quote requests, payment options, checkout status, credits, tips, payout status, and Stripe references to help resolve questions.",
    ],
  },
];

export const guruStripeSteps: string[] = [
  "Open Guru Stripe setup from your Guru dashboard or the Billing help guide.",
  "Choose the correct business type and enter personal / business details Stripe requires.",
  "Connect the bank account where eligible booking payouts, tips, and commission should land.",
  "Confirm payout account details and complete any Stripe identity verification prompts.",
  "Return to the Earnings tab to confirm setup status and track future payouts.",
  "Never request cash, Venmo, Zelle, Cash App, or other off-platform payments for SitGuru bookings.",
];

export const parentPaymentSteps: string[] = [
  "Select a Guru and booking details (service, dates, pet, location, notes).",
  "Open SitGuru checkout and review the full summary before paying.",
  "Apply credits, promo codes, or gift cards when available.",
  "Add an optional Guru tip when the checkout flow offers it.",
  "Pay with a supported method (card, Apple Pay, Google Pay, Link, saved method, or ACH when available).",
  "Confirm the receipt in your dashboard — live PawReport tracking, push alerts, and the end-of-walk email stay attached to the same booking.",
];

export const ambassadorStripeSteps: string[] = [
  "Open Ambassador Stripe setup from your Ambassador dashboard or Billing help.",
  "Complete Stripe payout onboarding for eligible referral or commission earnings.",
  "Share only SitGuru referral links and direct users to SitGuru checkout.",
  "Track referral activity in the Ambassador dashboard as tools become available.",
  "Contact support if your code, link, or payout status looks incorrect.",
];

export const bookingFaqs: HelpFaqItem[] = [
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
    question: "How do schedules and holiday surge pricing work?",
    answer:
      "Gurus manage availability and rates in My Calendar, including peak-time and holiday surge pricing when offered. Pet Parents see the applicable price in checkout before confirming. If a holiday rate looks unexpected, message the Guru early or contact support before paying.",
  },
  {
    question: "How do I cancel a visit or rebook?",
    answer:
      "Open the booking from your dashboard and follow the cancel or reschedule options when available, or message the Guru promptly to cancel a visit and request a rebook for a new time. Cancellation timing can affect refunds — see Billing & Refunds if you need a payout or checkout review.",
  },
  {
    question: "Why use SitGuru for repeat care?",
    answer:
      "Using SitGuru for repeat care helps keep pet instructions, service history, reviews, communication, receipts, automated PawReports, and support context in one place.",
  },
  {
    question: "What if something changes after a booking is requested?",
    answer:
      "Message early. If timing, location, pet needs, walk expectations, access details, or service details change, Pet Parents and Gurus should clarify those details before care happens.",
  },
];

export const liveCareFaqs: HelpFaqItem[] = [
  {
    question: "What is PawReport Live?",
    answer:
      "PawReport Live is the automated care update system connected to a booking. It shows when care starts, live walk activity, distance and duration, photos, potty updates, food and water confirmations, medication, play, mood, notes, and a final summary. " +
      AUTOMATED_WALK_REALITY,
  },
  {
    question: "Do Gurus still text or email me manually when the walk is done?",
    answer:
      "No. SitGuru replaced manual “I’ll text you later” updates. " +
      AUTOMATED_WALK_REALITY +
      " You can also open the live map anytime at /parent/walk/[bookingId].",
  },
  {
    question: "How does live walk tracking work for Gurus?",
    answer:
      "Open /guru/walk/[bookingId] on your phone, allow high-accuracy location, keep the tab in the foreground, start the walk, tap potty or break actions as they happen, and end the walk when finished. Instant push alerts fire for potty events; SitGuru sends the responsive PawReport email automatically when the walk ends.",
  },
  {
    question: "What should Pet Parents expect to see?",
    answer:
      "Expect live map movement, distance and duration, potty push alerts, break badges, photos and care notes when logged, a home-safe success card on your phone when the walk ends, and a beautiful responsive email report with metrics and timeline — without waiting for a manual text from your Guru.",
  },
  {
    question: "Why does location permission matter?",
    answer:
      "Live walk tracking uses the phone’s location permission on the Guru publisher page. If the Guru blocks location access, closes the tab, or locks the screen for long periods, tracking may pause until the tab is active again.",
  },
  {
    question: "Are PawReports only for dog walks?",
    answer:
      "No. PawReports support dog walks, drop-ins, pet sitting, boarding, daycare, house sitting, and other services. Live GPS walk tracking is used when walking is part of the booking; other updates support many care types.",
  },
];

export const safetyFaqs: HelpFaqItem[] = [
  {
    question: "How does SitGuru support trust and safety?",
    answer:
      "SitGuru may use profile reviews, trust and safety / compliance steps, communication tools, support records, user reports, PawReport history (including GPS and automated visit timelines), and platform rules to help protect pets, Pet Parents, Gurus, Ambassadors, and the community.",
  },
  {
    question: "Why does SitGuru encourage organized records?",
    answer:
      "Organized communication, booking details, care notes, service records, automated PawReports, walk summaries, and support records help everyone understand what was requested, what was confirmed, and what happened if a question comes up later.",
  },
  {
    question: "Does SitGuru provide insurance?",
    answer:
      "Marketplace protections and any insurance or coverage programs (when offered) are described during onboarding and in platform terms. Always confirm what applies to your booking. No online marketplace removes every real-world risk.",
  },
  {
    question: "What if I have an urgent pet safety issue?",
    answer:
      "For urgent pet safety, medical, or emergency issues, contact your veterinarian, local emergency services (emergency phone / 911), or the proper local authority first. SitGuru support can help with platform-related questions after the animal is safe.",
  },
  {
    question: "How do I file an incident report or report a concern?",
    answer:
      "Use the contact page and include as much detail as possible (booking ID, times, what happened, and screenshots if relevant). For urgent pet safety, contact local professionals first, then follow up with SitGuru for an incident report on the platform record.",
  },
  {
    question: "Does trust and safety remove all risk?",
    answer:
      "No online marketplace can remove every risk. Pet care involves real people, real pets, and real-world circumstances. SitGuru’s goal is to support better information, clearer communication, and safer decisions.",
  },
];

export const reviewFaqs: HelpFaqItem[] = [
  {
    question: "When can a Pet Parent leave a review?",
    answer:
      "Pet Parents should leave a review after a completed booking. Open the booking details from the Pet Parent dashboard, choose a star rating, write clear feedback, mark whether you would book again, and submit.",
  },
  {
    question: "What should Pet Parents include in a helpful review?",
    answer:
      "Mention the service booked, communication, whether live PawReport updates and automated push/email reports were useful, whether the Guru followed pet instructions, and what made the experience feel safe or trustworthy.",
  },
  {
    question: "How do Guru ratings and review counts appear?",
    answer:
      "Guru public profiles show real review counts and rating averages from completed booking reviews. When a Guru has no real reviews yet, SitGuru shows New Guru / New instead of fake ratings.",
  },
  {
    question: "Can Gurus ask for reviews?",
    answer:
      "Gurus may politely remind Pet Parents to review a completed booking, but should not pressure them or ask for dishonest feedback. Reliable care plus accurate live tracking and automated PawReports is the best path to strong reviews.",
  },
  {
    question: "How should Ambassadors explain reviews?",
    answer:
      "Ambassadors can tell new users that SitGuru uses real booking-based reviews to build trust — not inflated numbers — so families can choose care confidently.",
  },
];

export const programFaqs: HelpFaqItem[] = [
  {
    question: "What does an Ambassador do?",
    answer:
      "Ambassadors help introduce SitGuru to Pet Parents, future Gurus, local partners, students, community groups, and military-connected networks by sharing referral links, answering basic questions, and routing people to the correct signup path.",
  },
  {
    question: `What are Student Hire, Community Hire, and ${VETERANS_MILITARY_FAMILIES_PROGRAM.shortName}?`,
    answer:
      `These are SitGuru program pathways for students and recent grads, local community members, and military-connected applicants such as veterans, spouses, and eligible dependents through the ${VETERANS_MILITARY_FAMILIES_PROGRAM.displayName}. Applications do not guarantee approval, placement, bookings, or payouts.`,
  },
  {
    question: "How do Ambassador referrals work?",
    answer:
      "Use your Ambassador referral code or link when sharing SitGuru. Referral activity may be tracked in the Ambassador dashboard. Contact SitGuru if your code, link, or dashboard looks incorrect.",
  },
  {
    question: "Do Ambassadors need Stripe?",
    answer:
      "Ambassadors may need Stripe payout setup before eligible referral, commission, or ambassador payouts can be sent. See the Ambassador Stripe Setup Guide under Billing & Refunds.",
  },
];

export const findingGuruFaqs: HelpFaqItem[] = [
  {
    question: "How do I find the right Guru?",
    answer:
      "Search by service and location, review Guru profiles, services, service area, pricing, photos, care style, and any available reviews. Choose the Guru who feels like the best match for your pet’s routine, personality, and care needs.",
  },
  {
    question: "What should I add to my pet profile?",
    answer:
      "Add routines, feeding details, walking preferences, medication notes, temperament, health details you choose to share, emergency contacts, access instructions, photos, and anything a Guru should know before care begins.",
  },
  {
    question: "Where do I see live care updates?",
    answer:
      "When a Guru starts PawReport Live, open the booking and choose View Live PawReport (or /parent/walk/[bookingId]). You’ll see the live map plus " +
      AUTOMATED_WALK_REALITY,
  },
  {
    question: "Can I message my Guru?",
    answer:
      "Use SitGuru messaging when available so booking questions, care details, timing, access notes, and support context stay organized in one place.",
  },
];

export const guruOpsFaqs: HelpFaqItem[] = [
  {
    question: "What should a Guru do first?",
    answer:
      "Complete your profile, service area, ZIP/location details, services, pricing, onboarding packet, trust and safety steps when required, and Stripe payout setup. Then practice the phone walk publisher so Pet Parents receive automated push alerts and end-of-walk emails.",
  },
  {
    question: "How do Gurus manage pricing and availability?",
    answer:
      "Use My Calendar and pricing tools to manage service rates, daily custom prices, multi-pet settings, multi-day discounts, peak-time and holiday surge pricing, availability, and service rules.",
  },
  {
    question: "Where do Gurus start PawReports and walks?",
    answer:
      "Open the assigned booking’s high-accuracy phone dashboard at /guru/walk/[bookingId] (or Bookings & PawReports → Live Care). Start the walk, log potty/break events, and end the session — SitGuru sends instant push alerts and the responsive email report automatically. You no longer need to manually text or email the Pet Parent when the walk is done.",
  },
  {
    question: "Are Gurus employees of SitGuru?",
    answer:
      "Pet Gurus provide services as independent local providers through the SitGuru marketplace. More detailed onboarding, tax, and provider information is shared during approval and setup.",
  },
];
