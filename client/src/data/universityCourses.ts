export interface UniversityCourse {
  slug: string;
  name: string;
  category: "UG Programs" | "PG Programs" | "Ph.D Programs";
  about: string;
  description: string;
  eligibility: string[];
  highlights: string[];
  duration?: string;
  careerProspects: string[];
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
}

export const universityCourses: UniversityCourse[] = [
  // UG Programs
  {
    slug: "b-tech-all-specializations",
    name: "B.Tech (All Specializations)",
    category: "UG Programs",
    about:
      "Bachelor of Technology (B.Tech) is a comprehensive undergraduate engineering program that provides students with strong technical foundations and practical skills across various engineering disciplines. Our B.Tech program combines theoretical knowledge with hands-on experience to prepare students for successful careers in technology and engineering.",
    description:
      "Our B.Tech program offers specialization in Computer Science, Mechanical Engineering, Civil Engineering, Electronics & Communication, and Information Technology. The curriculum is designed to meet industry standards and includes practical projects, internships, and industry collaborations.",
    eligibility: [
      "10+2 with Physics, Chemistry, and Mathematics",
      "Minimum 50% aggregate marks in 10+2",
      "Valid JEE Main score (for some specializations)",
      "English proficiency",
      "Age limit: 17-25 years",
    ],
    highlights: [
      "Industry-aligned curriculum",
      "Practical lab sessions",
      "Industry internships",
      "Expert faculty guidance",
      "Modern infrastructure",
      "Placement assistance",
    ],
    duration: "4 Years",
    careerProspects: [
      "Software Engineer",
      "Mechanical Engineer",
      "Civil Engineer",
      "Electronics Engineer",
      "Project Manager",
      "Research & Development",
    ],
    seo: {
      title:
        "B.Tech All Specializations - IICPA Institute | Engineering Courses",
      description:
        "Pursue B.Tech in Computer Science, Mechanical, Civil, Electronics & Communication Engineering. Industry-aligned curriculum with practical training and placement assistance.",
      keywords:
        "B.Tech, engineering courses, computer science, mechanical engineering, civil engineering, electronics engineering, undergraduate programs",
    },
  },
  {
    slug: "bba",
    name: "BBA",
    category: "UG Programs",
    about:
      "Bachelor of Business Administration (BBA) is a comprehensive undergraduate program designed to develop business acumen and leadership skills. Our BBA program provides students with a strong foundation in business principles, management practices, and entrepreneurial thinking.",
    description:
      "The BBA program covers essential business subjects including Marketing, Finance, Human Resources, Operations Management, and Strategic Planning. Students gain practical experience through case studies, projects, and industry interactions.",
    eligibility: [
      "10+2 in any stream",
      "Minimum 50% aggregate marks",
      "English proficiency",
      "Age limit: 17-25 years",
      "Basic mathematics knowledge",
    ],
    highlights: [
      "Comprehensive business curriculum",
      "Case study methodology",
      "Industry guest lectures",
      "Internship opportunities",
      "Leadership development",
      "Entrepreneurship focus",
    ],
    duration: "3 Years",
    careerProspects: [
      "Business Analyst",
      "Marketing Manager",
      "HR Manager",
      "Operations Manager",
      "Financial Analyst",
      "Entrepreneur",
    ],
    seo: {
      title: "BBA - Bachelor of Business Administration | IICPA Institute",
      description:
        "Enroll in BBA program with comprehensive business curriculum, industry exposure, and leadership development. Prepare for management roles in corporate world.",
      keywords:
        "BBA, business administration, management course, undergraduate business program, corporate training",
    },
  },
  {
    slug: "bca",
    name: "BCA",
    category: "UG Programs",
    about:
      "Bachelor of Computer Applications (BCA) is a specialized undergraduate program focused on computer science and applications development. Our BCA program equips students with programming skills, software development knowledge, and IT industry expertise.",
    description:
      "The BCA curriculum includes programming languages, database management, web development, software engineering, and computer networks. Students work on real-world projects and gain hands-on experience with modern technologies.",
    eligibility: [
      "10+2 in any stream",
      "Mathematics as a subject in 10+2",
      "Minimum 50% aggregate marks",
      "English proficiency",
      "Age limit: 17-25 years",
    ],
    highlights: [
      "Programming languages (C, C++, Java, Python)",
      "Database management systems",
      "Web development technologies",
      "Software engineering principles",
      "Project-based learning",
      "Industry certifications",
    ],
    duration: "3 Years",
    careerProspects: [
      "Software Developer",
      "Web Developer",
      "Database Administrator",
      "System Analyst",
      "IT Consultant",
      "Mobile App Developer",
    ],
    seo: {
      title: "BCA - Bachelor of Computer Applications | IICPA Institute",
      description:
        "Study BCA with focus on programming, software development, and IT skills. Learn modern technologies and prepare for software industry careers.",
      keywords:
        "BCA, computer applications, programming course, software development, IT education, computer science",
    },
  },
  {
    slug: "b-pharm",
    name: "B.Pharma",
    category: "UG Programs",
    about:
      "Bachelor of Pharmacy (B.Pharma) is a professional undergraduate program that prepares students for careers in pharmaceutical sciences, drug development, and healthcare. Our B.Pharma program combines theoretical knowledge with practical training in pharmaceutical sciences.",
    description:
      "The B.Pharma curriculum covers pharmaceutical chemistry, pharmacology, pharmaceutics, pharmacognosy, and pharmaceutical analysis. Students gain hands-on experience in drug formulation, quality control, and regulatory affairs.",
    eligibility: [
      "10+2 with Physics, Chemistry, and Biology/Mathematics",
      "Minimum 50% aggregate marks",
      "English proficiency",
      "Age limit: 17-25 years",
      "Valid entrance exam score (if applicable)",
    ],
    highlights: [
      "Comprehensive pharmaceutical curriculum",
      "Modern laboratory facilities",
      "Industry internships",
      "Drug development projects",
      "Quality control training",
      "Regulatory compliance knowledge",
    ],
    duration: "4 Years",
    careerProspects: [
      "Pharmacist",
      "Drug Inspector",
      "Pharmaceutical Researcher",
      "Quality Control Manager",
      "Medical Representative",
      "Pharmaceutical Consultant",
    ],
    seo: {
      title: "B.Pharma - Bachelor of Pharmacy | IICPA Institute",
      description:
        "Pursue B.Pharma degree with comprehensive pharmaceutical education, laboratory training, and industry exposure. Prepare for pharmacy and healthcare careers.",
      keywords:
        "B.Pharma, pharmacy course, pharmaceutical sciences, drug development, healthcare education",
    },
  },
  {
    slug: "d-pharm",
    name: "D.Pharma",
    category: "UG Programs",
    about:
      "Diploma in Pharmacy (D.Pharma) is a two-year diploma program that provides foundational knowledge in pharmaceutical sciences and prepares students for entry-level positions in the pharmaceutical industry and healthcare sector.",
    description:
      "The D.Pharma program covers basic pharmaceutical subjects including pharmaceutical chemistry, pharmacology, pharmaceutics, and pharmacy practice. Students learn about drug dispensing, patient counseling, and pharmacy management.",
    eligibility: [
      "10+2 with Physics, Chemistry, and Biology/Mathematics",
      "Minimum 50% aggregate marks",
      "English proficiency",
      "Age limit: 17-25 years",
    ],
    highlights: [
      "Foundation in pharmaceutical sciences",
      "Practical pharmacy training",
      "Drug dispensing skills",
      "Patient counseling techniques",
      "Pharmacy management",
      "Industry exposure",
    ],
    duration: "2 Years",
    careerProspects: [
      "Pharmacy Technician",
      "Drug Store Manager",
      "Medical Representative",
      "Pharmaceutical Sales Executive",
      "Hospital Pharmacist",
      "Community Pharmacist",
    ],
    seo: {
      title: "D.Pharma - Diploma in Pharmacy | IICPA Institute",
      description:
        "Enroll in D.Pharma diploma program for foundational pharmaceutical education. Learn drug dispensing, patient care, and pharmacy management skills.",
      keywords:
        "D.Pharma, diploma pharmacy, pharmaceutical diploma, pharmacy technician, drug dispensing",
    },
  },
  {
    slug: "llb",
    name: "LLB",
    category: "UG Programs",
    about:
      "Bachelor of Laws (LLB) is a professional undergraduate program that provides comprehensive legal education and prepares students for careers in law, judiciary, and legal services. Our LLB program combines theoretical legal knowledge with practical legal training.",
    description:
      "The LLB curriculum covers constitutional law, criminal law, civil law, corporate law, and legal procedures. Students participate in moot courts, legal clinics, and internships to gain practical experience in legal practice.",
    eligibility: [
      "Graduation in any discipline",
      "Minimum 50% aggregate marks",
      "English proficiency",
      "Age limit: No upper limit",
      "Valid entrance exam score (if applicable)",
    ],
    highlights: [
      "Comprehensive legal curriculum",
      "Moot court participation",
      "Legal clinic experience",
      "Internship opportunities",
      "Expert legal faculty",
      "Court visit programs",
    ],
    duration: "3 Years",
    careerProspects: [
      "Advocate",
      "Legal Advisor",
      "Corporate Lawyer",
      "Judicial Officer",
      "Legal Consultant",
      "Public Prosecutor",
    ],
    seo: {
      title: "LLB - Bachelor of Laws | IICPA Institute",
      description:
        "Study LLB for comprehensive legal education with moot courts, internships, and practical training. Prepare for legal practice and judiciary careers.",
      keywords:
        "LLB, law degree, legal education, advocate, lawyer, judiciary, legal practice",
    },
  },
  {
    slug: "ba-llb",
    name: "BA LLB",
    category: "UG Programs",
    about:
      "Bachelor of Arts and Bachelor of Laws (BA LLB) is an integrated five-year program that combines liberal arts education with legal studies. This program provides students with a broad understanding of social sciences along with comprehensive legal knowledge.",
    description:
      "The BA LLB program includes subjects from arts disciplines like Political Science, Economics, History, and Sociology, combined with core legal subjects. Students develop critical thinking, analytical skills, and legal expertise.",
    eligibility: [
      "10+2 in any stream",
      "Minimum 50% aggregate marks",
      "English proficiency",
      "Age limit: 17-25 years",
      "Valid entrance exam score (if applicable)",
    ],
    highlights: [
      "Integrated arts and law curriculum",
      "Interdisciplinary approach",
      "Critical thinking development",
      "Legal research skills",
      "Moot court participation",
      "Social awareness programs",
    ],
    duration: "5 Years",
    careerProspects: [
      "Advocate",
      "Legal Researcher",
      "Policy Analyst",
      "Social Worker",
      "Legal Journalist",
      "Human Rights Activist",
    ],
    seo: {
      title: "BA LLB - Integrated Arts and Law Program | IICPA Institute",
      description:
        "Pursue BA LLB integrated program combining arts education with legal studies. Develop critical thinking and legal expertise for diverse career opportunities.",
      keywords:
        "BA LLB, integrated law program, arts and law, legal education, social sciences",
    },
  },
  {
    slug: "bba-llb",
    name: "BBA LLB",
    category: "UG Programs",
    about:
      "Bachelor of Business Administration and Bachelor of Laws (BBA LLB) is an integrated five-year program that combines business management education with legal studies. This program prepares students for careers in corporate law, business law, and legal management.",
    description:
      "The BBA LLB program includes business subjects like Management, Finance, Marketing, and Human Resources, along with comprehensive legal education. Students develop both business acumen and legal expertise.",
    eligibility: [
      "10+2 in any stream",
      "Minimum 50% aggregate marks",
      "English proficiency",
      "Age limit: 17-25 years",
      "Valid entrance exam score (if applicable)",
    ],
    highlights: [
      "Integrated business and law curriculum",
      "Corporate law focus",
      "Business management skills",
      "Legal expertise development",
      "Industry internships",
      "Case study methodology",
    ],
    duration: "5 Years",
    careerProspects: [
      "Corporate Lawyer",
      "Legal Manager",
      "Business Consultant",
      "Compliance Officer",
      "Legal Advisor",
      "Corporate Legal Counsel",
    ],
    seo: {
      title: "BBA LLB - Integrated Business and Law Program | IICPA Institute",
      description:
        "Study BBA LLB integrated program combining business management with legal education. Prepare for corporate law and business legal careers.",
      keywords:
        "BBA LLB, business law, corporate law, integrated program, legal management",
    },
  },
  {
    slug: "b-ed",
    name: "B.Ed",
    category: "UG Programs",
    about:
      "Bachelor of Education (B.Ed) is a professional undergraduate program that prepares students for teaching careers in schools and educational institutions. Our B.Ed program combines pedagogical knowledge with practical teaching experience.",
    description:
      "The B.Ed curriculum covers educational psychology, teaching methodologies, curriculum development, and classroom management. Students gain hands-on teaching experience through internships and practice teaching sessions.",
    eligibility: [
      "Graduation in any discipline",
      "Minimum 50% aggregate marks",
      "English proficiency",
      "Age limit: 21-35 years",
      "Teaching aptitude",
    ],
    highlights: [
      "Comprehensive pedagogical training",
      "Teaching methodology courses",
      "Practice teaching sessions",
      "Educational psychology",
      "Curriculum development",
      "Classroom management skills",
    ],
    duration: "2 Years",
    careerProspects: [
      "School Teacher",
      "Educational Consultant",
      "Curriculum Developer",
      "Educational Administrator",
      "Training Coordinator",
      "Academic Counselor",
    ],
    seo: {
      title: "B.Ed - Bachelor of Education | IICPA Institute",
      description:
        "Pursue B.Ed degree for teaching career preparation. Learn pedagogical methods, classroom management, and educational psychology.",
      keywords:
        "B.Ed, teaching degree, education program, teacher training, pedagogical education",
    },
  },

  // PG Programs
  {
    slug: "mba",
    name: "MBA",
    category: "PG Programs",
    about:
      "Master of Business Administration (MBA) is a prestigious postgraduate program designed to develop advanced business management skills and leadership capabilities. Our MBA program provides comprehensive training in all aspects of business management and administration.",
    description:
      "The MBA program offers specializations in Finance, Marketing, Human Resources, Operations Management, and Information Technology. Students engage in case studies, live projects, internships, and industry interactions to gain practical business experience.",
    eligibility: [
      "Graduation in any discipline",
      "Minimum 50% aggregate marks",
      "Valid CAT/MAT/XAT/GMAT score",
      "English proficiency",
      "Work experience preferred",
      "Age limit: 21-35 years",
    ],
    highlights: [
      "Specialized MBA tracks",
      "Industry-relevant curriculum",
      "Case study methodology",
      "Live project opportunities",
      "Internship programs",
      "Leadership development",
      "Networking opportunities",
    ],
    duration: "2 Years",
    careerProspects: [
      "Business Manager",
      "Marketing Manager",
      "Financial Analyst",
      "HR Manager",
      "Operations Manager",
      "Management Consultant",
      "Entrepreneur",
    ],
    seo: {
      title: "MBA - Master of Business Administration | IICPA Institute",
      description:
        "Enroll in MBA program with specializations in Finance, Marketing, HR, and Operations. Industry-focused curriculum with practical training and placement assistance.",
      keywords:
        "MBA, business administration, management course, postgraduate program, business management",
    },
  },
  {
    slug: "llm",
    name: "LLM",
    category: "PG Programs",
    about:
      "Master of Laws (LLM) is an advanced postgraduate program that provides specialized legal education and research opportunities. Our LLM program offers in-depth study of specific areas of law and prepares students for advanced legal practice and academic careers.",
    description:
      "The LLM program offers specializations in Corporate Law, Criminal Law, Constitutional Law, International Law, and Intellectual Property Law. Students engage in advanced legal research, thesis writing, and specialized legal practice.",
    eligibility: [
      "LLB degree from recognized university",
      "Minimum 50% aggregate marks",
      "English proficiency",
      "Age limit: No upper limit",
      "Valid entrance exam score (if applicable)",
    ],
    highlights: [
      "Specialized legal tracks",
      "Advanced legal research",
      "Thesis writing",
      "Specialized internships",
      "Expert legal faculty",
      "International law exposure",
      "Research methodology",
    ],
    duration: "2 Years",
    careerProspects: [
      "Senior Advocate",
      "Legal Researcher",
      "Corporate Legal Counsel",
      "Academic Professor",
      "Legal Consultant",
      "Policy Advisor",
      "International Lawyer",
    ],
    seo: {
      title: "LLM - Master of Laws | IICPA Institute",
      description:
        "Pursue LLM for advanced legal education with specializations. Develop expertise in corporate law, criminal law, and international law.",
      keywords:
        "LLM, master of laws, advanced legal education, legal specialization, corporate law",
    },
  },

  // Ph.D Programs
  {
    slug: "phd-all-specializations",
    name: "Ph.D (All Specializations)",
    category: "Ph.D Programs",
    about:
      "Doctor of Philosophy (Ph.D) is the highest academic degree that prepares students for advanced research careers in academia, industry, and research institutions. Our Ph.D program offers research opportunities across various disciplines with expert supervision and state-of-the-art facilities.",
    description:
      "The Ph.D program covers research methodologies, advanced theoretical frameworks, and independent research projects. Students work closely with experienced faculty members and contribute to original research in their chosen field of specialization.",
    eligibility: [
      "Master's degree in relevant field",
      "Minimum 55% aggregate marks",
      "Valid UGC NET/JRF score (preferred)",
      "Research proposal",
      "English proficiency",
      "Age limit: No upper limit",
    ],
    highlights: [
      "Independent research projects",
      "Expert faculty supervision",
      "Research methodology training",
      "Publication opportunities",
      "Conference participation",
      "International collaborations",
      "State-of-the-art facilities",
    ],
    duration: "3-5 Years",
    careerProspects: [
      "University Professor",
      "Research Scientist",
      "Policy Researcher",
      "Industry Researcher",
      "Consultant",
      "Academic Administrator",
      "Think Tank Researcher",
    ],
    seo: {
      title: "Ph.D Programs - Doctor of Philosophy | IICPA Institute",
      description:
        "Pursue Ph.D degree with expert supervision and research opportunities. Prepare for academic and research careers with comprehensive doctoral training.",
      keywords:
        "Ph.D, doctorate, research program, academic degree, research career, doctoral studies",
    },
  },
];

// Helper function to get course by slug
const normalizeSlug = (value = "") =>
  decodeURIComponent(value)
    .trim()
    .toLowerCase()
    .replace(/[–—−]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

export function getCourseBySlug(slug: string): UniversityCourse | undefined {
  const normalized = normalizeSlug(slug);
  return universityCourses.find(
    (course) => normalizeSlug(course.slug) === normalized
  );
}

// Helper function to get all course slugs
export function getAllCourseSlugs(): string[] {
  return universityCourses.map((course) => normalizeSlug(course.slug));
}

// Helper function to get courses by category
export function getCoursesByCategory(
  category: UniversityCourse["category"]
): UniversityCourse[] {
  return universityCourses.filter((course) => course.category === category);
}
