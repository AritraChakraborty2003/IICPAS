import { Metadata } from "next";

export interface CourseIntroContent {
  title: string;
  eyebrow: string;
  subtitle: string;
  description: string;
  duration: string;
  level: string;
  mode: string;
  certification: string;
  admissionsNote: string;
  intro: string;
  highlights: string[];
  outcomes: string[];
  audience: string[];
  admissionsPoints: string[];
  metaTitle: string;
  metaDescription: string;
  keywords: string;
}

export const courseIntroPages: Record<string, CourseIntroContent> = {
  "basic-accounting-and-tally-certification-course": {
    title: "Basic Accounting and Tally Certification Course",
    eyebrow: "Admissions Open Across India",
    subtitle:
      "Build job-ready accounting skills with practical Tally training, GST-oriented entries, and real office workflow exposure designed for the Indian job market.",
    description:
      "A practical admission-focused course for students and job seekers who want to start in accounts, billing, GST support, and Tally-based office work.",
    duration: "6-8 weeks",
    level: "Beginner",
    mode: "Practical Classroom + Guided Learning",
    certification: "Industry-Oriented Certificate from IICPA",
    admissionsNote:
      "Ideal for freshers, commerce students, and candidates looking for entry-level jobs in accounts and back-office operations.",
    intro:
      "The Basic Accounting and Tally Certification Course is positioned as a strong starting point for students, graduates, and working learners who want to enter the accounts domain with practical software knowledge and confidence in daily bookkeeping work.",
    highlights: [
      "Covers journal entries, ledger posting, trial balance, final accounts, and day-to-day bookkeeping practice.",
      "Introduces Tally workflows including company creation, voucher entries, inventory handling, GST basics, and reporting.",
      "Focused on practical office use cases commonly seen in Indian SMEs, traders, and service businesses.",
    ],
    outcomes: [
      "Develop confidence in routine accounting records and business transaction flow.",
      "Work on Tally-based entry processes relevant for accounts assistant and billing support roles.",
      "Create a stronger foundation for further study in GST, taxation, payroll, and office accounting.",
    ],
    audience: [
      "Commerce students, B.Com learners, and beginners starting their accounting journey.",
      "Job seekers applying for accounts assistant, billing executive, and tally operator roles.",
      "Small business owners and office staff managing day-to-day books and records.",
    ],
    admissionsPoints: [
      "Admission-oriented page built for candidates evaluating a practical skill course before enrollment.",
      "Suitable for learners from Kolkata and other Indian cities seeking employability-focused accounting training.",
      "Useful for candidates who want a short-term certification with direct relevance to entry-level hiring needs.",
    ],
    metaTitle:
      "Basic Accounting and Tally Certification Course - IICPA Institute",
    metaDescription:
      "Take admission in IICPA's Basic Accounting and Tally Certification Course. Learn bookkeeping, accounting fundamentals, Tally workflows, and practical office skills.",
    keywords:
      "basic accounting and tally certification course, tally course, accounting basics, bookkeeping training, tally prime, IICPA",
  },
  "income-tax-certification-course": {
    title: "Income Tax Certification Course",
    eyebrow: "Admissions Open Across India",
    subtitle:
      "Prepare for practical tax work with hands-on exposure to Indian income tax concepts, return filing structure, deductions, and compliance-oriented processes.",
    description:
      "A career-focused admission page for students and professionals who want to build practical understanding of Indian income tax and job-relevant compliance work.",
    duration: "6-8 weeks",
    level: "Beginner to Intermediate",
    mode: "Tax Concepts + Practical Filing Orientation",
    certification: "Professional Certificate from IICPA",
    admissionsNote:
      "Designed for learners seeking careers in tax support, accounting, return preparation, and compliance assistance.",
    intro:
      "The Income Tax Certification Course is created for Indian learners who want admission into a practical tax program that connects theory with real filing structure, deduction logic, tax documentation, and compliance responsibilities seen in offices and consultancy environments.",
    highlights: [
      "Introduces residential status, heads of income, deductions, exemptions, and tax computation logic in the Indian system.",
      "Explains ITR-oriented workflow, filing concepts, documentation, tax planning basics, and compliance sequence.",
      "Built for candidates who want stronger admission value and employability in taxation support roles.",
    ],
    outcomes: [
      "Understand how income tax is structured and applied in real Indian filing scenarios.",
      "Identify common deductions, proofs, documentation needs, and return-related workflow.",
      "Build practical readiness for tax assistant, accounts executive, and compliance support roles.",
    ],
    audience: [
      "Commerce students, graduates, and freshers targeting taxation and finance jobs.",
      "Accounts executives who want to move into direct tax and return support work.",
      "Working professionals and aspirants seeking a short-term professional certification in taxation.",
    ],
    admissionsPoints: [
      "Admission-focused content for candidates comparing tax training before enrolling.",
      "Suitable for learners looking for practical exposure aligned with Indian compliance expectations.",
      "Positioned as a strong skill-building course for employability, office work, and career growth in taxation.",
    ],
    metaTitle: "Income Tax Certification Course - IICPA Institute",
    metaDescription:
      "Take admission in IICPA's Income Tax Certification Course. Learn Indian income tax concepts, deductions, filing workflow, and compliance-oriented tax practice.",
    keywords:
      "income tax certification course, tax filing course, income tax training, tax compliance course, IICPA",
  },
  "individual-gst-return-filing": {
    title: "Individual GST Return Filing",
    eyebrow: "Admissions Open Across India",
    subtitle:
      "Learn practical GST return filing workflow with Indian compliance context, reconciliation exposure, and filing-ready documentation understanding.",
    description:
      "A practical admission page for candidates who want GST-focused skill development for accounts, taxation, and indirect tax support roles.",
    duration: "4-6 weeks",
    level: "Beginner to Intermediate",
    mode: "GST Compliance + Filing Practice",
    certification: "Practical GST Certificate from IICPA",
    admissionsNote:
      "Useful for learners targeting GST filing assistance, accounts support, and indirect tax compliance roles in Indian businesses.",
    intro:
      "The Individual GST Return Filing course is built for Indian learners who want admission into a short-term practical program covering GST returns, data checks, reconciliations, timelines, and routine compliance support expected in business and consultancy settings.",
    highlights: [
      "Explains GST return structure, filing due dates, sales and purchase record needs, and return preparation flow.",
      "Covers practical reconciliation logic, return review points, and common compliance checks used in Indian filing work.",
      "Designed for learners who want fast-track practical relevance for GST support and filing assistance roles.",
    ],
    outcomes: [
      "Understand how GST data moves from books and invoices to return-ready reporting.",
      "Recognize routine filing requirements, reconciliations, and compliance-sensitive checkpoints.",
      "Gain more confidence for GST executive, accounts support, and indirect tax assistance work.",
    ],
    audience: [
      "Beginners and commerce learners starting out in GST and indirect taxation.",
      "Accounts staff handling invoicing, purchase records, and GST return support.",
      "Freelancers and professionals offering return filing assistance to clients.",
    ],
    admissionsPoints: [
      "Admission-driven page for candidates evaluating a practical GST skill course.",
      "Useful for learners seeking short-term training with strong relevance to Indian business compliance.",
      "A strong fit for candidates aiming to improve employability in accounts and taxation support functions.",
    ],
    metaTitle: "Individual GST Return Filing - IICPA Institute",
    metaDescription:
      "Take admission in IICPA's Individual GST Return Filing course. Learn GST return workflow, reconciliation, compliance checks, and practical filing concepts.",
    keywords:
      "individual gst return filing, gst return filing course, gst compliance training, indirect tax course, IICPA",
  },
};

export function getCourseIntroMetadata(
  slug: keyof typeof courseIntroPages
): Metadata {
  const content = courseIntroPages[slug];

  return {
    title: content.metaTitle,
    description: content.metaDescription,
    keywords: content.keywords,
    openGraph: {
      title: content.metaTitle,
      description: content.metaDescription,
      url: `https://www.iicpa.in/course/${slug}`,
      siteName: "IICPA Institute",
      images: [
        {
          url: "https://iicpa.in/images/og-default.jpg",
          width: 1200,
          height: 630,
          alt: content.title,
        },
      ],
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: content.metaTitle,
      description: content.metaDescription,
      images: ["https://iicpa.in/images/og-default.jpg"],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}
