import { Metadata } from "next";

export interface CourseIntroContent {
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  level: string;
  mode: string;
  intro: string;
  highlights: string[];
  outcomes: string[];
  audience: string[];
  metaTitle: string;
  metaDescription: string;
  keywords: string;
}

export const courseIntroPages: Record<string, CourseIntroContent> = {
  "basic-accounting-and-tally-certification-course": {
    title: "Basic Accounting and Tally Certification Course",
    subtitle:
      "Start with accounting fundamentals and move into practical Tally workflows used in day-to-day business operations.",
    description:
      "An introductory course for learners who want clear exposure to bookkeeping, accounting basics, voucher entries, inventory handling, and Tally-based business processes.",
    duration: "6-8 weeks",
    level: "Beginner",
    mode: "Practical + Instructor-led",
    intro:
      "This page introduces the Basic Accounting and Tally Certification Course for students, job seekers, and working professionals who want a structured starting point in accounting software and foundational financial records.",
    highlights: [
      "Covers accounting basics from journal entries to ledgers and final accounts.",
      "Introduces Tally interface, company creation, vouchers, GST basics, and reports.",
      "Built for practical understanding with business-oriented examples.",
    ],
    outcomes: [
      "Understand the purpose of core accounting records and workflows.",
      "Create and manage routine transactions in Tally with confidence.",
      "Build a stronger base for accounting, GST, and office finance roles.",
    ],
    audience: [
      "Students starting an accounting or commerce track.",
      "Job seekers targeting entry-level accounts roles.",
      "Business owners or staff handling day-to-day bookkeeping.",
    ],
    metaTitle:
      "Basic Accounting and Tally Certification Course - IICPA Institute",
    metaDescription:
      "Explore the Basic Accounting and Tally Certification Course at IICPA. Learn accounting fundamentals, bookkeeping, voucher entries, and practical Tally workflows.",
    keywords:
      "basic accounting and tally certification course, tally course, accounting basics, bookkeeping training, tally prime, IICPA",
  },
  "income-tax-certification-course": {
    title: "Income Tax Certification Course",
    subtitle:
      "Learn the fundamentals of income tax structure, filing concepts, deductions, and compliance in a practical way.",
    description:
      "A focused introductory course designed to help learners understand income tax concepts for individuals and business contexts with process-oriented clarity.",
    duration: "6-8 weeks",
    level: "Beginner to Intermediate",
    mode: "Concept + Compliance Oriented",
    intro:
      "This page introduces the Income Tax Certification Course for learners aiming to build practical knowledge around tax computation, return filing concepts, deductions, and real-world compliance requirements.",
    highlights: [
      "Introduces tax basics, residential status, heads of income, and deductions.",
      "Covers return filing concepts, tax planning basics, and compliance flow.",
      "Structured for learners who need job-ready tax fundamentals.",
    ],
    outcomes: [
      "Understand the structure and logic of income tax computation.",
      "Identify common deductions, filing processes, and documentation needs.",
      "Develop a stronger base for tax assistant, accounting, and compliance roles.",
    ],
    audience: [
      "Commerce students and fresh graduates entering tax roles.",
      "Accounts executives expanding into tax work.",
      "Individuals seeking practical tax knowledge for career growth.",
    ],
    metaTitle: "Income Tax Certification Course - IICPA Institute",
    metaDescription:
      "Explore the Income Tax Certification Course at IICPA. Build practical knowledge of income tax concepts, deductions, filing processes, and compliance basics.",
    keywords:
      "income tax certification course, tax filing course, income tax training, tax compliance course, IICPA",
  },
  "individual-gst-return-filing": {
    title: "Individual GST Return Filing",
    subtitle:
      "Get introduced to GST return filing concepts, records, reconciliations, and submission workflows for practical compliance handling.",
    description:
      "An introductory page for learners who want a practical overview of GST return filing steps, return types, data checks, and routine compliance work.",
    duration: "4-6 weeks",
    level: "Beginner to Intermediate",
    mode: "Practical Compliance Training",
    intro:
      "This page introduces the Individual GST Return Filing course for learners and professionals who want direct exposure to GST return processes, working papers, and filing readiness.",
    highlights: [
      "Explains GST return structure, filing timelines, and record requirements.",
      "Covers practical return preparation, reconciliation, and common compliance checks.",
      "Suitable for learners moving into GST support and filing assistance work.",
    ],
    outcomes: [
      "Understand the flow of GST data from records to final return filing.",
      "Recognize common filing requirements, reconciliations, and reporting steps.",
      "Prepare for operational GST compliance responsibilities with more confidence.",
    ],
    audience: [
      "Learners starting out in GST and indirect tax work.",
      "Accounts staff supporting GST records and return preparation.",
      "Freelancers and professionals offering filing support services.",
    ],
    metaTitle: "Individual GST Return Filing - IICPA Institute",
    metaDescription:
      "Explore Individual GST Return Filing at IICPA. Learn GST return concepts, reconciliations, filing workflows, and practical compliance basics.",
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
