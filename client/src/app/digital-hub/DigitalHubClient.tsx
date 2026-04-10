"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import AccountingExperimentCard from "../components/AccountingExperimentCard";
import { useAuthHeartbeat } from "../../lib/useAuthHeartbeat";
import { getApiBase } from "@/lib/apiBase";

// Type definitions
interface Task {
  _id: string;
  taskName: string;
  instructions: string;
  order: number;
}

interface Content {
  _id: string;
  type: "video" | "text" | "rich";
  videoUrl?: string;
  videoBase64?: string;
  textContent?: string;
  richTextContent?: string;
  order: number;
}

interface Simulation {
  _id: string;
  type: string;
  title: string;
  description: string;
  config: Record<string, unknown>;
  isOptional: boolean;
  order: number;
  // Accounting simulation specific fields
  statement?: string;
  correctEntries?: Array<{
    id: string;
    date: string;
    type: string;
    particulars: string;
    debit: string;
    credit: string;
  }>;
  accountTypes?: string[];
  accountOptions?: string[];
}

interface Question {
  _id: string;
  question: string;
  context: string;
  type: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface QuestionSet {
  passingScore: React.JSX.Element;
  _id: string;
  name: string;
  description: string;
  excelFile?: string;
  excelBase64?: string;
  questions: Question[];
  totalQuestions: number;
  timeLimit: number;
  order: number;
}

interface CaseStudy {
  _id: string;
  title: string;
  description: string;
  chapterId: string;
  order: number;
  isActive: boolean;
  tasks: Task[];
  content: Content[];
  simulations: Simulation[];
  questionSets: QuestionSet[];
  createdAt: string;
  updatedAt: string;
}

interface Assignment {
  _id: string;
  title: string;
  description: string;
  chapterId: string;
  order: number;
  isActive: boolean;
  tasks: Task[];
  content: Content[];
  simulations: Simulation[];
  questionSets: QuestionSet[];
  createdAt: string;
  updatedAt: string;
}

interface CourseBookingRecord {
  _id: string;
  courseId?: string | { _id?: string } | null;
  itemType?: string;
  status?: string;
  createdAt?: string;
  payments?: Array<{
    paidAt?: string;
  }>;
}

// Add Google Translate types
declare global {
  interface Window {
    google: {
      translate: {
        TranslateElement: {
          new (options: Record<string, unknown>, elementId: string): unknown;
          getInstance?: () => {
            translatePage: (languageCode: string) => void;
          };
          InlineLayout: {
            SIMPLE: number;
          };
        };
      };
    };
    googleTranslateElementInit: () => void;
  }
}
import {
  CheckCircle,
  Moon,
  Sun,
  ArrowLeft,
  Menu,
  X,
  Target,
  BarChart3,
  FileText,
  BookOpen,
  ChevronDown,
  Globe,
  Lock,
  PlayCircle,
} from "lucide-react";

type ContentKey =
  | "intro"
  | "identifying"
  | "recording"
  | "classifying"
  | "summarizing"
  | "analyzing"
  | "comparison";

interface Topic {
  id: ContentKey;
  title: string;
  completed: boolean;
  icon: React.ComponentType<{ className?: string }>;
  subtopics: string[];
}

interface ChapterData {
  _id: string;
  title: string;
  topics: TopicData[];
  order: number;
  status: string;
  isLocked?: boolean;
  isCompleted?: boolean;
  completion?: number;
  completedTopicCount?: number;
  totalTopicCount?: number;
  completedAssignmentCount?: number;
  totalAssignmentCount?: number;
  completedQuestionSetCount?: number;
  totalQuestionSetCount?: number;
  completedTopicIds?: string[];
  completedAssignmentIds?: string[];
  completedQuestionSetIds?: string[];
}

interface TopicData {
  _id: string;
  title: string;
  content: string;
  introVideo?: string;
  quiz?: string;
  publishAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface QuizQuestion {
  _id: string;
  question: string;
  options: string[];
  answer: string;
}

interface QuizData {
  _id: string;
  topic: string;
  questions: QuizQuestion[];
  createdAt: string;
  updatedAt: string;
}

interface QuizRewardSummary {
  correctAnswers: number;
  totalQuestions: number;
  coinsAwarded: number;
}

interface DigitalHubClientProps {
  courseSlugOrId: string;
  chapterId?: string;
  isDemo: boolean;
}

interface ChapterProgressSummary {
  chapterId: string;
  isLocked: boolean;
  isCompleted: boolean;
  completionPercent: number;
  completedTopicCount: number;
  totalTopicCount: number;
  completedAssignmentCount: number;
  totalAssignmentCount: number;
  completedQuestionSetCount: number;
  totalQuestionSetCount: number;
  completedTopicIds: string[];
  completedAssignmentIds: string[];
  completedQuestionSetIds: string[];
}

const QUIZ_QUESTION_LIMIT = 5;
const LAST_SELECTION_STORAGE_KEY = "digitalHub:lastSelection";

const extractCourseRecord = (payload: unknown): Record<string, unknown> | null => {
  if (!payload || typeof payload !== "object") return null;

  const candidate = payload as {
    course?: Record<string, unknown>;
    data?: Record<string, unknown> | { course?: Record<string, unknown> };
  };

  if (candidate.course && typeof candidate.course === "object") {
    return candidate.course;
  }

  if (
    candidate.data &&
    typeof candidate.data === "object" &&
    "course" in candidate.data &&
    candidate.data.course &&
    typeof candidate.data.course === "object"
  ) {
    return candidate.data.course;
  }

  if (candidate.data && typeof candidate.data === "object" && !Array.isArray(candidate.data)) {
    return candidate.data;
  }

  return candidate;
};

const getRandomQuestions = (
  questions: QuizQuestion[],
  limit: number = QUIZ_QUESTION_LIMIT
) => {
  const shuffled = [...questions];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled.slice(0, Math.min(limit, shuffled.length));
};

const mergeChapterProgress = (
  chapters: ChapterData[],
  progressSummaries: ChapterProgressSummary[] = []
) => {
  const progressMap = new Map(
    progressSummaries.map((chapter) => [String(chapter.chapterId), chapter])
  );

  return (Array.isArray(chapters) ? [...chapters] : []).map((chapter, index) => {
    const summary = progressMap.get(String(chapter._id));
    return {
      ...chapter,
      isLocked:
        typeof summary?.isLocked === "boolean" ? summary.isLocked : index > 0,
      isCompleted: Boolean(summary?.isCompleted),
      completion:
        typeof summary?.completionPercent === "number"
          ? summary.completionPercent
          : Number(chapter.completion || 0),
      completedTopicCount: Number(summary?.completedTopicCount || 0),
      totalTopicCount:
        typeof summary?.totalTopicCount === "number"
          ? summary.totalTopicCount
          : Array.isArray(chapter.topics)
          ? chapter.topics.length
          : 0,
      completedAssignmentCount: Number(summary?.completedAssignmentCount || 0),
      totalAssignmentCount: Number(summary?.totalAssignmentCount || 0),
      completedQuestionSetCount: Number(summary?.completedQuestionSetCount || 0),
      totalQuestionSetCount: Number(summary?.totalQuestionSetCount || 0),
      completedTopicIds: summary?.completedTopicIds || [],
      completedAssignmentIds: summary?.completedAssignmentIds || [],
      completedQuestionSetIds: summary?.completedQuestionSetIds || [],
    };
  });
};

const getChapterCompletionPercent = (chapter?: ChapterData | null) => {
  if (!chapter) return 0;

  if (chapter.isCompleted) {
    return 100;
  }

  const explicitCompletion = Number(chapter.completion);
  if (Number.isFinite(explicitCompletion) && explicitCompletion > 0) {
    return Math.max(0, Math.min(100, Math.round(explicitCompletion)));
  }

  const totalItems =
    Number(chapter.totalTopicCount || 0) +
    Number(chapter.totalAssignmentCount || 0) +
    Number(chapter.totalQuestionSetCount || 0);
  if (totalItems <= 0) {
    return 0;
  }

  const completedItems =
    Number(chapter.completedTopicCount || 0) +
    Number(chapter.completedAssignmentCount || 0) +
    Number(chapter.completedQuestionSetCount || 0);

  return Math.max(
    0,
    Math.min(100, Math.round((completedItems / totalItems) * 100))
  );
};

const getPreferredUnlockedChapter = (chapters: ChapterData[]) => {
  const unlockedChapters = chapters.filter((chapter) => !chapter.isLocked);
  if (unlockedChapters.length === 0) {
    return chapters[0] || null;
  }

  return (
    unlockedChapters.find((chapter) => !chapter.isCompleted) ||
    unlockedChapters[unlockedChapters.length - 1]
  );
};

const matchesChapterIdentifier = (
  chapter: ChapterData | null | undefined,
  identifier: string,
  index?: number
) => {
  if (!chapter || !identifier) return false;

  const normalizedIdentifier = String(identifier);
  const candidates = [
    chapter._id,
    (chapter as ChapterData & { id?: string | number }).id,
    (chapter as ChapterData & { chapterId?: string | number }).chapterId,
    index !== undefined ? String(index) : null,
    index !== undefined ? String(index + 1) : null,
  ].filter(Boolean);

  return candidates.some((candidate) => String(candidate) === normalizedIdentifier);
};

const findChapterByIdentifier = (
  chapters: ChapterData[],
  identifier?: string | null
) => {
  if (!identifier) return null;

  return (
    chapters.find((chapter) =>
      matchesChapterIdentifier(chapter, identifier)
    ) ||
    chapters.find((chapter, index) =>
      matchesChapterIdentifier(chapter, identifier, index)
    ) ||
    null
  );
};

const toIdString = (value?: string | { _id?: string } | null) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && typeof value._id === "string") {
    return value._id;
  }
  return "";
};

const parseDateOrNull = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const getCourseEnrollmentAt = (
  bookings: CourseBookingRecord[],
  courseId?: string | null
) => {
  if (!courseId) return null;

  const normalizedCourseId = String(courseId);
  const matches = (Array.isArray(bookings) ? bookings : []).filter(
    (booking) =>
      booking &&
      booking.status !== "cancelled" &&
      booking.itemType === "single_course" &&
      toIdString(booking.courseId) === normalizedCourseId
  );

  const timestamps = matches
    .map((booking) => {
      const paymentTimestamp = booking.payments?.[0]?.paidAt || null;
      return parseDateOrNull(paymentTimestamp || booking.createdAt || null);
    })
    .filter((value): value is Date => Boolean(value))
    .sort((left, right) => left.getTime() - right.getTime());

  return timestamps[0]?.toISOString() || null;
};

const getEffectiveEnrollmentAt = (
  bookings: CourseBookingRecord[],
  courseId?: string | null,
  studentRegisteredAt?: string | null
) => {
  const bookingEnrollmentAt = parseDateOrNull(
    getCourseEnrollmentAt(bookings, courseId)
  );
  const registeredAt = parseDateOrNull(studentRegisteredAt || null);

  if (bookingEnrollmentAt && registeredAt) {
    return bookingEnrollmentAt.getTime() > registeredAt.getTime()
      ? bookingEnrollmentAt.toISOString()
      : registeredAt.toISOString();
  }

  if (bookingEnrollmentAt) return bookingEnrollmentAt.toISOString();
  if (registeredAt) return registeredAt.toISOString();
  return null;
};

const isTopicLockedForBatch = (
  topic?: TopicData | null,
  enrollmentAt?: string | null
) => {
  if (!topic?.publishAt || !enrollmentAt) return false;

  const cutoffAt = new Date(topic.publishAt);
  const enrolledAt = new Date(enrollmentAt);

  if (Number.isNaN(cutoffAt.getTime()) || Number.isNaN(enrolledAt.getTime())) {
    return false;
  }

  return enrolledAt.getTime() > cutoffAt.getTime();
};

const getFirstAccessibleTopic = (
  chapter: ChapterData,
  completedTopicIds: string[],
  enrollmentAt?: string | null
) => {
  const topics = chapter?.topics || [];

  for (let index = 0; index < topics.length; index += 1) {
    const previousTopicId = index > 0 ? topics[index - 1]?._id : null;
    const sequenceUnlocked =
      index === 0 ||
      (previousTopicId && completedTopicIds.includes(previousTopicId));
    const batchLocked = isTopicLockedForBatch(topics[index], enrollmentAt);

    if (sequenceUnlocked && !batchLocked) {
      return topics[index] || null;
    }
  }

  return null;
};

const hardenVideoElements = (container: HTMLElement | null) => {
  if (!container) return;

  container.querySelectorAll("video").forEach((video) => {
    video.setAttribute("controlsList", "nodownload");
    video.setAttribute("disablePictureInPicture", "");
    const controlsList = (video as HTMLVideoElement & {
      controlsList?: DOMTokenList;
    }).controlsList;
    controlsList?.add("nodownload");
    controlsList?.add("noplaybackrate");
    controlsList?.add("noremoteplayback");
    (video as HTMLVideoElement & { disableRemotePlayback?: boolean }).disableRemotePlayback = true;
    video.oncontextmenu = (event) => {
      event.preventDefault();
      return false;
    };
  });
};

export default function DigitalHubClient({
  courseSlugOrId,
  chapterId,
  isDemo,
}: DigitalHubClientProps) {
  const router = useRouter();
  const routeParams = useParams<Record<string, string | string[]>>();
  const routeCourseSlugOrId =
    typeof routeParams?.courseSlug === "string"
      ? routeParams.courseSlug
      : Array.isArray(routeParams?.courseSlug)
      ? routeParams.courseSlug[0] || ""
      : "";
  const routeChapterId =
    typeof routeParams?.chapterId === "string"
      ? routeParams.chapterId
      : Array.isArray(routeParams?.chapterId)
      ? routeParams.chapterId[0] || ""
      : "";
  const effectiveCourseSlugOrId = courseSlugOrId || routeCourseSlugOrId;
  const effectiveChapterId = chapterId || routeChapterId;
  const API_BASE = getApiBase();
  const API_ORIGIN = API_BASE.replace(/\/api\/?$/i, "");
  const [resolvedCourseId, setResolvedCourseId] = useState<string | null>(null);

  const [chapterDropdownOpen, setChapterDropdownOpen] = useState(false);
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isIntroVideoModalOpen, setIsIntroVideoModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [ticketForm, setTicketForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [quizSoundSettings, setQuizSoundSettings] = useState({
    correctAnswerSound: "/sounds/success.mp3",
    wrongAnswerSound: "/sounds/error.mp3",
  });

  // Language dropdown state
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const translateWidgetRef = useRef<{
    translatePage: (languageCode: string) => void;
  } | null>(null);
  const contentScrollRef = useRef<HTMLDivElement | null>(null);
  const topicContentRef = useRef<HTMLDivElement | null>(null);
  const [isTranslateReady, setIsTranslateReady] = useState(false);
  const pendingLanguageRef = useRef<string | null>(null);
  const googleTranslateScriptRef = useRef<HTMLScriptElement | null>(null);
  const googleTranslateStyleRef = useRef<HTMLStyleElement | null>(null);
  const isTranslateTeardownDoneRef = useRef(false);

  const applyLanguageToGoogleWidget = useCallback((languageCode: string) => {
    if (typeof document === "undefined") return false;

    // Google Translate checks this cookie while applying the selected target language.
    document.cookie = `googtrans=/en/${languageCode};path=/`;
    const combo = document.querySelector(
      ".goog-te-combo"
    ) as HTMLSelectElement | null;
    if (!combo) return false;

    combo.value = languageCode;
    combo.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }, []);

  const scrollContentToTop = useCallback(() => {
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    } else if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const loadLastSelection = useCallback(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(LAST_SELECTION_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      const courseKey = String(parsed.courseKey || "");
      if (courseKey !== String(effectiveCourseSlugOrId)) return null;
      const chapterId = typeof parsed.chapterId === "string" ? parsed.chapterId : "";
      const topicId = typeof parsed.topicId === "string" ? parsed.topicId : "";
      return { chapterId, topicId };
    } catch {
      return null;
    }
  }, [effectiveCourseSlugOrId]);

  const storeLastSelection = useCallback(
    (chapterIdValue?: string, topicIdValue?: string) => {
      if (typeof window === "undefined") return;
      if (!chapterIdValue || !topicIdValue) return;
      const payload = {
        courseKey: String(effectiveCourseSlugOrId),
        chapterId: chapterIdValue,
        topicId: topicIdValue,
      };
      try {
        window.localStorage.setItem(
          LAST_SELECTION_STORAGE_KEY,
          JSON.stringify(payload)
        );
      } catch {
        // Ignore write failures.
      }
    },
    [effectiveCourseSlugOrId]
  );

  const resetGoogleTranslateState = useCallback(() => {
    if (typeof document === "undefined") return;
    if (isTranslateTeardownDoneRef.current) return;
    isTranslateTeardownDoneRef.current = true;

    // Reset Google Translate language cookie to English and clear stale values.
    document.cookie = "googtrans=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "googtrans=/en/en;path=/";

    const hostname = window.location.hostname;
    if (hostname) {
      document.cookie = `googtrans=;path=/;domain=.${hostname};expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      document.cookie = `googtrans=/en/en;path=/;domain=.${hostname}`;
    }

    pendingLanguageRef.current = null;
    translateWidgetRef.current = null;
    setIsTranslateReady(false);

    const cleanupSelectors = [
      ".goog-te-banner-frame",
      ".goog-te-balloon-frame",
      ".goog-te-spinner-pos",
      ".skiptranslate",
      "#goog-gt-tt",
      ".goog-tooltip",
      ".goog-text-highlight",
    ];

    cleanupSelectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((node) => {
        node.parentNode?.removeChild(node);
      });
    });

    if (googleTranslateScriptRef.current) {
      googleTranslateScriptRef.current.parentNode?.removeChild(
        googleTranslateScriptRef.current
      );
      googleTranslateScriptRef.current = null;
    }

    if (googleTranslateStyleRef.current) {
      googleTranslateStyleRef.current.parentNode?.removeChild(
        googleTranslateStyleRef.current
      );
      googleTranslateStyleRef.current = null;
    }
  }, []);

  const handleBackNavigation = useCallback(() => {
    resetGoogleTranslateState();
    const courseIdentifier = resolvedCourseId || effectiveCourseSlugOrId;
    if (courseIdentifier) {
      router.push(
        `/student-dashboard?tab=courses&courseId=${encodeURIComponent(
          courseIdentifier
        )}&view=detailed`
      );
      return;
    }
    router.push("/student-dashboard?tab=courses");
  }, [
    effectiveCourseSlugOrId,
    resetGoogleTranslateState,
    resolvedCourseId,
    router,
  ]);

  // New state for dynamic content
  const [courseChapters, setCourseChapters] = useState<ChapterData[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<ChapterData | null>(
    null
  );
  const [topics, setTopics] = useState<TopicData[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<TopicData | null>(null);
  const [topicContent, setTopicContent] = useState("");
  const [loading, setLoading] = useState(true);

  // Demo mode state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDemoLimit, setShowDemoLimit] = useState(false);
  const [showPurchasePopup, setShowPurchasePopup] = useState(false);

  // New state for case studies and assignments
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<CaseStudy | null>(
    null
  );
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);

  // Quiz state
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: string]: string;
  }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [quizRewardSummary, setQuizRewardSummary] =
    useState<QuizRewardSummary | null>(null);
  const [quizCoinsPerCorrect, setQuizCoinsPerCorrect] = useState(0);
  const [progress, setProgress] = useState(0);
  const [points, setPoints] = useState(0);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState("");
  const [studentRegisteredAt, setStudentRegisteredAt] = useState<string | null>(
    null
  );
  const [authResolved, setAuthResolved] = useState(false);
  const [studentCourseBookings, setStudentCourseBookings] = useState<
    CourseBookingRecord[]
  >([]);
  const [studentCourseBookingsLoaded, setStudentCourseBookingsLoaded] =
    useState(false);
  const [progressMutationKey, setProgressMutationKey] = useState<string | null>(
    null
  );

  useAuthHeartbeat({
    enabled: !!studentId,
    heartbeatUrl: `${API_BASE}/auth/heartbeat`,
  });

  useEffect(() => {
    hardenVideoElements(topicContentRef.current);
  }, [topicContent, selectedTopic?._id, selectedAssignment?._id]);

  const visibleChapters = isDemo ? courseChapters.slice(0, 1) : courseChapters;
  const visibleTopics = isDemo ? topics.slice(0, 1) : topics;

  const applyProgressSummary = useCallback(
    (
      progressPayload: {
        overallProgress?: number;
        chapters?: ChapterProgressSummary[];
      },
      baseChapters: ChapterData[]
    ) => {
      const mergedChapters = mergeChapterProgress(
        baseChapters,
        Array.isArray(progressPayload?.chapters) ? progressPayload.chapters : []
      );
      setCourseChapters(mergedChapters);
      setProgress(Number(progressPayload?.overallProgress || 0));
      setSelectedChapter((currentSelectedChapter) => {
        if (!currentSelectedChapter?._id) {
          return currentSelectedChapter;
        }

        return (
          mergedChapters.find(
            (chapter) => String(chapter._id) === String(currentSelectedChapter._id)
          ) || currentSelectedChapter
        );
      });

      return mergedChapters;
    },
    []
  );

  // Derived state and common logic
  const completedTopicIds = useMemo(
    () => selectedChapter?.completedTopicIds || [],
    [selectedChapter?.completedTopicIds]
  );
  const completedAssignmentIds = selectedChapter?.completedAssignmentIds || [];
  const completedQuestionSetIds =
    selectedChapter?.completedQuestionSetIds || [];
  const activeCourseEnrollmentAt = getEffectiveEnrollmentAt(
    studentCourseBookings,
    resolvedCourseId,
    studentRegisteredAt
  );
  const currentTopicIndex = selectedTopic
    ? visibleTopics.findIndex((topic) => topic._id === selectedTopic._id)
    : -1;
  const previousTopic =
    currentTopicIndex > 0 ? visibleTopics[currentTopicIndex - 1] : null;
  const nextTopic =
    currentTopicIndex >= 0 && currentTopicIndex < visibleTopics.length - 1
      ? visibleTopics[currentTopicIndex + 1]
      : null;

  const isSelectedTopicCompleted = Boolean(
    selectedTopic?._id && completedTopicIds.includes(selectedTopic._id)
  );
  const selectedTopicIntroVideo = selectedTopic?.introVideo?.trim() || "";
  const isSelectedTopicLockedForBatch = isTopicLockedForBatch(
    selectedTopic,
    activeCourseEnrollmentAt
  );
  const selectedTopicBatchMessage = isSelectedTopicLockedForBatch
    ? "Open on next batch start"
    : null;
  const isSelectedAssignmentCompleted = Boolean(
    selectedAssignment?._id &&
      completedAssignmentIds.includes(selectedAssignment._id)
  );

  const allTopicsCompleted =
    topics.length > 0 &&
    topics.every((t) => completedTopicIds.includes(t._id));

  // Function to split content into pages
  const splitContentIntoPages = useCallback(
    (content: string, maxPages: number = 3) => {
      if (!content) return { pages: [], totalPages: 0 };

      // Split content by paragraphs or sections
      const paragraphs = content.split(/(?=<h[1-6]|<\/p>|<\/div>|<\/section>)/i);
      const pages = [];
      const itemsPerPage = Math.ceil(paragraphs.length / maxPages);

      for (let i = 0; i < paragraphs.length; i += itemsPerPage) {
        const pageContent = paragraphs.slice(i, i + itemsPerPage).join("");
        if (pageContent.trim()) {
          pages.push(pageContent);
        }
      }

      return { pages, totalPages: Math.min(pages.length, maxPages) };
    },
    []
  );

  // Load quiz for a specific topic
  const loadQuizForTopic = useCallback(
    async (topicId: string) => {
      try {
        console.log("Loading quiz for topic:", topicId);
        setQuizLoading(true);
        setQuizData(null);
        setSelectedAnswers({});
        setShowQuizResults(false);
        setQuizSubmitted(false);
        setQuizRewardSummary(null);

        const response = await axios.get(`${API_BASE}/quizzes/topic/${topicId}`);
        console.log("Quiz API response:", response.data);

        if (response.data.success && response.data.quiz) {
          const quiz = response.data.quiz as QuizData;
          const randomizedQuestions = getRandomQuestions(quiz.questions || []);
          const randomizedQuiz = {
            ...quiz,
            questions: randomizedQuestions,
          };

          console.log("Quiz loaded successfully:", randomizedQuiz);
          setQuizData(randomizedQuiz);
        } else {
          console.log("No quiz found or invalid response");
        }
      } catch (error) {
        console.error("Error loading quiz:", error);
        // Quiz might not exist for this topic, which is fine
      } finally {
        setQuizLoading(false);
      }
    },
    [API_BASE]
  );

  // Handle topic selection
  const handleTopicSelect = useCallback(
    (topic: TopicData, options?: { completedTopicIds?: string[] }) => {
      const topicCompletionIds = options?.completedTopicIds || completedTopicIds;
      const topicIndex = visibleTopics.findIndex(
        (entry) => entry._id === topic._id
      );
      const previousTopicId =
        topicIndex > 0 ? visibleTopics[topicIndex - 1]?._id : null;
      const sequenceLocked =
        topicIndex > 0 &&
        !(previousTopicId && topicCompletionIds.includes(previousTopicId));
      const batchLocked = isTopicLockedForBatch(topic, activeCourseEnrollmentAt);

      if (sequenceLocked || batchLocked) {
        setToastMessage(
          batchLocked
            ? "Open on next batch start."
            : "Complete the previous topic to unlock this one."
        );
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return;
      }

      console.log("Topic selected:", topic);
      setSelectedTopic(topic);
      setIsIntroVideoModalOpen(false);
      setSelectedCaseStudy(null);
      setSelectedAssignment(null);
      if (selectedChapter?._id) {
        storeLastSelection(selectedChapter._id, topic._id);
      }
      scrollContentToTop();

      // Decode and set topic content
      if (topic.content) {
        try {
          const decodedContent = atob(topic.content);

          if (isDemo) {
            // For demo mode, split content into pages and limit to 1 page
            const { pages, totalPages } = splitContentIntoPages(
              decodedContent,
              1
            );
            setTotalPages(totalPages);
            setCurrentPage(1);
            setTopicContent(pages[0] || "Content not available");
            setShowDemoLimit(totalPages > 0);
          } else {
            // For full mode, show all content
            setTopicContent(decodedContent);
            setTotalPages(1);
            setCurrentPage(1);
            setShowDemoLimit(false);
          }
        } catch (error) {
          console.error("Error decoding topic content:", error);
          setTopicContent(topic.content || "Content not available");
          setTotalPages(1);
          setCurrentPage(1);
          setShowDemoLimit(false);
        }
      }

      // Load quiz for the selected topic
      console.log("Calling loadQuizForTopic with topic ID:", topic._id);
      loadQuizForTopic(topic._id);
    },
    [
      activeCourseEnrollmentAt,
      completedTopicIds,
      isDemo,
      loadQuizForTopic,
      scrollContentToTop,
      selectedChapter?._id,
      splitContentIntoPages,
      storeLastSelection,
      visibleTopics,
    ]
  );

  // Handle case study selection
  const handleCaseStudySelect = (caseStudy: CaseStudy) => {
    console.log("Case study selected:", caseStudy);
    setIsIntroVideoModalOpen(false);
    setSelectedCaseStudy(caseStudy);
    setSelectedTopic(null);
    setSelectedAssignment(null);
    setTopicContent("");
  };

  // Handle assignment selection
  const handleAssignmentSelect = (assignment: Assignment) => {
    console.log("Assignment selected:", assignment);
    setIsIntroVideoModalOpen(false);
    setSelectedAssignment(assignment);
    setSelectedTopic(null);
    setSelectedCaseStudy(null);
    setTopicContent("");
  };

  const fetchStudentCoins = useCallback(
    async (currentStudentId: string) => {
      try {
        const response = await axios.get(
          `${API_BASE}/v1/students/coins/${currentStudentId}`,
          { withCredentials: true }
        );
        setPoints(response.data?.coinBalance ?? 0);
      } catch {
        setPoints(0);
      }
    },
    [API_BASE]
  );

  // Ticket submission functions
  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_BASE}/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ticketForm),
      });

      if (response.ok) {
        setToastMessage(
          "Ticket submitted successfully! We'll get back to you soon."
        );
        setShowToast(true);
        setIsModalOpen(false);
        setTicketForm({
          name: "",
          email: "",
          phone: "",
          message: "",
        });

        // Hide toast after 3 seconds
        setTimeout(() => setShowToast(false), 3000);
      } else {
        setToastMessage("Failed to submit ticket. Please try again.");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch {
      setToastMessage("Error submitting ticket. Please try again.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setTicketForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const closeSidebarIfMobile = useCallback(() => {
    if (!isDesktopViewport) {
      setHamburgerOpen(false);
    }
  }, [isDesktopViewport]);

  // Fetch case studies for a chapter
  const fetchCaseStudies = useCallback(
    async (chapterId: string) => {
      try {
        const response = await axios.get(`${API_BASE}/case-studies/chapter/${chapterId}`);
        if (response.data.success) {
          setCaseStudies(response.data.data || []);
        }
      } catch (error) {
        console.error("Error fetching case studies:", error);
        setCaseStudies([]);
      }
    },
    [API_BASE]
  );

  // Fetch assignments for a chapter
  const fetchAssignments = useCallback(
    async (chapterId: string) => {
      try {
        const response = await axios.get(`${API_BASE}/assignments/chapter/${chapterId}`);
        if (response.data.success) {
          setAssignments(response.data.data || []);
        }
      } catch (error) {
        console.error("Error fetching assignments:", error);
        setAssignments([]);
      }
    },
    [API_BASE]
  );

  const buildChapterPath = useCallback(
    (targetChapterId?: string) => {
      const basePath = isDemo
        ? `/digital-hub/demo/${encodeURIComponent(effectiveCourseSlugOrId)}`
        : `/digital-hub/${encodeURIComponent(effectiveCourseSlugOrId)}`;

      if (!targetChapterId) {
        return basePath;
      }

      return `${basePath}/${encodeURIComponent(targetChapterId)}`;
    },
    [effectiveCourseSlugOrId, isDemo]
  );


  const selectChapterContent = useCallback(
    (
      chapter: ChapterData,
      navigationMode: "push" | "replace" | "none" = "none",
      preferredTopicId?: string
    ) => {
      const availableTopics = chapter.topics || [];
      setIsIntroVideoModalOpen(false);
      setSelectedChapter(chapter);
      setTopics(availableTopics);
      setSelectedCaseStudy(null);
      setSelectedAssignment(null);

      fetchCaseStudies(chapter._id);
      fetchAssignments(chapter._id);

      if (!isDemo && navigationMode !== "none") {
        const targetPath = buildChapterPath(chapter._id);
        if (navigationMode === "replace") {
          router.replace(targetPath);
        } else {
          router.push(targetPath);
        }
      }

      if (availableTopics.length > 0) {
        const completedIds = chapter.completedTopicIds || [];
        const storedTopic = preferredTopicId
          ? availableTopics.find((topic) => topic._id === preferredTopicId)
          : null;
        const storedTopicIndex = storedTopic
          ? availableTopics.findIndex((topic) => topic._id === storedTopic._id)
          : -1;
        const storedTopicUnlocked =
          storedTopicIndex === 0
            ? true
            : storedTopicIndex > 0 &&
              completedIds.includes(availableTopics[storedTopicIndex - 1]?._id);
        const storedTopicBatchLocked = isTopicLockedForBatch(
          storedTopic,
          activeCourseEnrollmentAt
        );
        const fallbackTopic = getFirstAccessibleTopic(
          { ...chapter, topics: availableTopics },
          completedIds,
          activeCourseEnrollmentAt
        );
        const firstTopic =
          storedTopic && storedTopicUnlocked && !storedTopicBatchLocked
            ? storedTopic
            : fallbackTopic;
        setSelectedTopic(firstTopic);
        if (firstTopic?._id) {
          storeLastSelection(chapter._id, firstTopic._id);
        }
        scrollContentToTop();

        if (firstTopic?.content) {
          try {
            const decodedContent = atob(firstTopic.content);
            if (isDemo) {
              const { pages, totalPages } = splitContentIntoPages(
                decodedContent,
                1
              );
              setTotalPages(totalPages);
              setCurrentPage(1);
              setTopicContent(pages[0] || "Content not available");
              setShowDemoLimit(totalPages > 0);
            } else {
              setTopicContent(decodedContent);
              setTotalPages(1);
              setCurrentPage(1);
              setShowDemoLimit(false);
            }
          } catch (error) {
            console.error("Error decoding topic content:", error);
            setTopicContent(firstTopic.content || "Content not available");
            setTotalPages(1);
            setCurrentPage(1);
            setShowDemoLimit(false);
          }
        } else {
          setTopicContent(
            "This chapter is locked for this batch. Open on next batch start."
          );
          setTotalPages(1);
          setCurrentPage(1);
          setShowDemoLimit(false);
        }

        if (firstTopic?._id) {
          loadQuizForTopic(firstTopic._id);
        } else {
          setQuizData(null);
          setQuizLoading(false);
          setSelectedAnswers({});
          setQuizSubmitted(false);
          setShowQuizResults(false);
          setQuizRewardSummary(null);
        }
      } else {
        setIsIntroVideoModalOpen(false);
        setSelectedTopic(null);
        setTopicContent("No topics available for this chapter.");
        setQuizData(null);
      }
    },
    [
      buildChapterPath,
      fetchAssignments,
      fetchCaseStudies,
      activeCourseEnrollmentAt,
      isDemo,
      loadQuizForTopic,
      router,
      scrollContentToTop,
      storeLastSelection,
      splitContentIntoPages,
    ]
  );

  const handleChapterSelect = useCallback(
    (chapter: ChapterData) => {
      if (chapter.isLocked) {
        setToastMessage("Complete the previous chapter first to unlock this chapter.");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return;
      }

      const firstTopic = getFirstAccessibleTopic(
        chapter,
        chapter.completedTopicIds || [],
        activeCourseEnrollmentAt
      );
      selectChapterContent(chapter, "push", firstTopic?._id);
    },
    [activeCourseEnrollmentAt, selectChapterContent]
  );

  const markProgressItemComplete = useCallback(
    async (
      itemType: "topic" | "assignment" | "questionSet",
      itemId: string,
      successMessage: string
    ) => {
      if (!studentId || !resolvedCourseId || !selectedChapter?._id) {
        setToastMessage("Login is required to save chapter progress.");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return;
      }

      const progressSegment =
        itemType === "topic"
          ? `topics/${itemId}/complete`
          : itemType === "assignment"
          ? `assignments/${itemId}/complete`
          : `question-sets/${itemId}/complete`;
      const mutationKey = `${itemType}:${itemId}`;

      try {
        setProgressMutationKey(mutationKey);
        const response = await axios.post(
          `${API_BASE}/v1/students/${studentId}/digital-hub-progress/${resolvedCourseId}/${progressSegment}`,
          { chapterId: selectedChapter._id },
          { withCredentials: true }
        );

        const mergedChapters = applyProgressSummary(
          response.data,
          courseChapters
        );
        const refreshedChapter = mergedChapters.find(
          (chapter) => String(chapter._id) === String(selectedChapter._id)
        );

        const chapterCompletionMessage =
          refreshedChapter?.isCompleted && !selectedChapter.isCompleted
            ? " Chapter completed and the next chapter is now unlocked."
            : "";

        if (itemType === "topic" && selectedTopic?._id === itemId) {
          const updatedChapter = refreshedChapter || selectedChapter;
          const updatedTopics = updatedChapter?.topics || [];
          const updatedCompletedTopicIds =
            updatedChapter?.completedTopicIds || [];
          const currentIndex = updatedTopics.findIndex(
            (topic) => topic._id === itemId
          );
          const nextTopicCandidate =
            currentIndex >= 0 && currentIndex < updatedTopics.length - 1
              ? updatedTopics[currentIndex + 1]
              : null;

          if (
            nextTopicCandidate &&
            updatedCompletedTopicIds.includes(itemId)
          ) {
            if (!isTopicLockedForBatch(nextTopicCandidate, activeCourseEnrollmentAt)) {
              handleTopicSelect(nextTopicCandidate, {
                completedTopicIds: updatedCompletedTopicIds,
              });
            }
          } else if (
            refreshedChapter?.isCompleted &&
            !selectedChapter.isCompleted
          ) {
            const currentChapterIndex = mergedChapters.findIndex(
              (chapter) => String(chapter._id) === String(selectedChapter._id)
            );
            const nextChapter =
              currentChapterIndex >= 0 &&
              currentChapterIndex < mergedChapters.length - 1
                ? mergedChapters[currentChapterIndex + 1]
                : null;
            if (nextChapter && !nextChapter.isLocked) {
              selectChapterContent(nextChapter, "replace");
            }
          }
        }

        setToastMessage(`${successMessage}${chapterCompletionMessage}`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3500);
      } catch (error) {
        const message =
          axios.isAxiosError(error) &&
          (error.response?.data?.message || error.response?.data?.error)
            ? error.response?.data?.message || error.response?.data?.error
            : "Failed to save chapter progress.";
        setToastMessage(message);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3500);
      } finally {
        setProgressMutationKey(null);
      }
    },
    [
      API_BASE,
      applyProgressSummary,
      courseChapters,
      handleTopicSelect,
      resolvedCourseId,
      selectedChapter,
      selectedTopic?._id,
      selectChapterContent,
      activeCourseEnrollmentAt,
      studentId,
    ]
  );

  // Handle answer selection
  const handleAnswerSelect = (questionId: string, selectedAnswer: string) => {
    if (quizSubmitted) return; // Don't allow changes after submission
    if (selectedAnswers[questionId] === selectedAnswer) return;

    const currentQuestion = quizData?.questions.find(
      (question) => question._id === questionId
    );
    if (currentQuestion) {
      const isCorrect = selectedAnswer === currentQuestion.answer;
      playAnswerFeedbackSound(isCorrect);
    }

    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: selectedAnswer,
    }));
  };

  const resolveSoundUrl = useCallback(
    (value: string | undefined, fallback: string) => {
      const raw = (value || "").toString().trim();
      if (!raw) return fallback;
      if (/^https?:\/\//i.test(raw)) return raw;
      if (raw.startsWith("/uploads/")) return `${API_ORIGIN}${raw}`;
      if (raw.startsWith("/")) return raw;
      return `${API_ORIGIN}/${raw.replace(/^\/+/, "")}`;
    },
    [API_ORIGIN]
  );

  const playAnswerFeedbackSound = useCallback(
    (isCorrect: boolean) => {
      const audio = new Audio(
        resolveSoundUrl(
          isCorrect
            ? quizSoundSettings.correctAnswerSound
            : quizSoundSettings.wrongAnswerSound,
          isCorrect ? "/sounds/success.mp3" : "/sounds/error.mp3"
        )
      );
      audio.play().catch(() => {
        // Fallback or mute if autoplay blocked
      });
    },
    [quizSoundSettings, resolveSoundUrl]
  );

  const playCelebrationSound = useCallback(() => {
    const audio = new Audio(
      resolveSoundUrl(quizSoundSettings.correctAnswerSound, "/sounds/success.mp3")
    );
    audio.play().catch(() => {
      // Fallback
    });
  }, [quizSoundSettings, resolveSoundUrl]);


  const handleQuizSubmit = useCallback(async () => {
    if (!quizData || quizSubmitted) return;

    const totalQuestions = quizData.questions.length;
    if (totalQuestions === 0) return;

    const unansweredQuestions = quizData.questions.filter(
      (question) => !selectedAnswers[question._id]
    );
    if (unansweredQuestions.length > 0) {
      setToastMessage("Please answer all questions before submitting.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    const correctAnswers = quizData.questions.filter(
      (question) => selectedAnswers[question._id] === question.answer
    ).length;

    setQuizSubmitted(true);
    setShowQuizResults(true);
    setQuizRewardSummary({
      correctAnswers,
      totalQuestions,
      coinsAwarded: 0,
    });

    if (!studentId) {
      setToastMessage("Quiz submitted. Login to earn coins.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE}/v1/students/digital-hub-quizzes/${studentId}/complete`,
        {
          quizId: quizData._id,
          topicId: selectedTopic?._id,
          selectedAnswers,
          totalQuestions,
        },
        { withCredentials: true }
      );

      const coinsAwarded = Number(response.data?.coinsAwarded || 0);
      const awarded = Boolean(response.data?.coinAwarded);

      setQuizRewardSummary({
        correctAnswers,
        totalQuestions,
        coinsAwarded,
      });

      if (awarded && coinsAwarded > 0) {
        playCelebrationSound();
        window.dispatchEvent(new Event("coins:updated"));
      }

      const awardedMessage =
        awarded && coinsAwarded > 0
          ? `Great job! You earned ${coinsAwarded} coins.`
          : response.data?.message || "Quiz submitted successfully.";
      setToastMessage(awardedMessage);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);

      // Automatically mark topic as complete when quiz is submitted
      if (selectedTopic?._id) {
        markProgressItemComplete(
          "topic",
          selectedTopic._id,
          awardedMessage || "Quiz submitted and topic marked as complete."
        );
      }
    } catch (error) {
      const message =
        axios.isAxiosError(error) &&
        (error.response?.data?.message || error.response?.data?.error)
          ? error.response?.data?.message || error.response?.data?.error
          : "Quiz submitted, but coin update failed.";
      setToastMessage(message);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
    }
  }, [
    API_BASE,
    playCelebrationSound,
    quizData,
    quizSubmitted,
    selectedAnswers,
    selectedTopic?._id,
    studentId,
    markProgressItemComplete,
  ]);

  // Handle language selection
  const handleLanguageSelect = (language: {
    code: string;
    name: string;
  }) => {
    setSelectedLanguage(language.name);
    setLanguageDropdownOpen(false);

    const changedFromWidget = applyLanguageToGoogleWidget(language.code);
    if (changedFromWidget) {
      pendingLanguageRef.current = null;
    } else if (isTranslateReady && translateWidgetRef.current) {
      translateWidgetRef.current.translatePage(language.code);
    } else {
      pendingLanguageRef.current = language.code;
    }
    setToastMessage(`Language changed to ${language.name}`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    const resolveCourseId = async () => {
      if (!effectiveCourseSlugOrId) {
        setResolvedCourseId(null);
        return;
      }

      try {
        const response = await axios.get(
          `${API_BASE}/courses/${encodeURIComponent(effectiveCourseSlugOrId)}`
        );
        const courseRecord = extractCourseRecord(response.data);
        const resolvedId = courseRecord?._id;
        setResolvedCourseId(typeof resolvedId === "string" ? resolvedId : null);
      } catch (error) {
        console.error("Error resolving course identifier:", error);
        setResolvedCourseId(null);
      }
    };

    resolveCourseId();
  }, [API_BASE, effectiveCourseSlugOrId]);

  // Fetch course data using resolved id first, falling back to slug
  useEffect(() => {
    const fetchCourseData = async () => {
      const chapterCourseIdentifier = resolvedCourseId || effectiveCourseSlugOrId;

      if (
        !chapterCourseIdentifier ||
        (!isDemo && !authResolved) ||
        (!isDemo && studentId && !studentCourseBookingsLoaded)
      ) {
        if (!chapterCourseIdentifier || (!isDemo && !authResolved)) {
          setLoading(false);
        } else {
          setLoading(true);
        }
        return;
      }

      try {
        setLoading(true);

        if (!resolvedCourseId && effectiveCourseSlugOrId) {
          console.warn(
            "Using course slug fallback for chapter fetch:",
            effectiveCourseSlugOrId
          );
        }

        const [chaptersResponse, progressResponse] = await Promise.all([
          axios.get(
            `${API_BASE}/chapters/course/${encodeURIComponent(
              chapterCourseIdentifier
            )}`
          ),
          !isDemo && studentId && resolvedCourseId
            ? axios
                .get(
                  `${API_BASE}/v1/students/${studentId}/digital-hub-progress/${resolvedCourseId}`,
                  { withCredentials: true }
                )
                .catch(() => null)
            : Promise.resolve(null),
        ]);

        if (!chaptersResponse.data.success || chaptersResponse.data.chapters.length === 0) {
          setCourseChapters([]);
          setSelectedChapter(null);
          setTopics([]);
          setSelectedTopic(null);
          setTopicContent("No chapters available for this course.");
          return;
        }

        const rawChapters = isDemo
          ? chaptersResponse.data.chapters.slice(0, 1)
          : chaptersResponse.data.chapters;
        const mergedChapters =
          !isDemo && progressResponse?.data
            ? applyProgressSummary(progressResponse.data, rawChapters)
            : mergeChapterProgress(rawChapters, []);

        if (!progressResponse?.data) {
          setCourseChapters(mergedChapters);
          setProgress(0);
        }

        const storedSelection = loadLastSelection();
        const requestedChapter = findChapterByIdentifier(
          mergedChapters,
          effectiveChapterId
        );
        const storedChapter = findChapterByIdentifier(
          mergedChapters,
          storedSelection?.chapterId || null
        );
        const fallbackChapter = getPreferredUnlockedChapter(mergedChapters);
        const chapterToOpen = requestedChapter || storedChapter || fallbackChapter;

        if (!chapterToOpen) {
          return;
        }

        const needsRouteReplace =
          !isDemo &&
          (!effectiveChapterId ||
            !requestedChapter ||
            requestedChapter._id !== chapterToOpen._id);
        const preferredTopicId =
          storedSelection?.chapterId === chapterToOpen._id
            ? storedSelection.topicId
            : undefined;

        selectChapterContent(
          chapterToOpen,
          needsRouteReplace ? "replace" : "none",
          preferredTopicId
        );
      } catch (error) {
        console.error("Error fetching course data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [
    resolvedCourseId,
    effectiveCourseSlugOrId,
    authResolved,
    effectiveChapterId,
    isDemo,
    API_BASE,
    studentId,
    studentCourseBookingsLoaded,
    applyProgressSummary,
    loadLastSelection,
    selectChapterContent,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const updateViewportMode = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktopViewport(desktop);
      setHamburgerOpen((prev) => (desktop ? true : prev));
    };

    updateViewportMode();
    window.addEventListener("resize", updateViewportMode);

    return () => {
      window.removeEventListener("resize", updateViewportMode);
    };
  }, []);

  useEffect(() => {
    if (!selectedChapter || typeof window === "undefined") return;
    if (window.innerWidth >= 1024) {
      setHamburgerOpen(true);
    }
  }, [selectedChapter]);

  useEffect(() => {
    const fetchCoinSettings = async () => {
      try {
        const response = await axios.get(`${API_BASE}/coins/settings`);
        const configuredCoins = Number(response.data?.settings?.quizCompleteCoins);
        setQuizCoinsPerCorrect(
          Number.isFinite(configuredCoins) && configuredCoins > 0
            ? configuredCoins
            : 0
        );
      } catch {
        setQuizCoinsPerCorrect(0);
      }
    };

    fetchCoinSettings();
  }, [API_BASE]);

  useEffect(() => {
    const fetchQuizSoundSettings = async () => {
      try {
        const response = await axios.get(`${API_BASE}/quiz-sounds/settings`);
        if (response.data?.settings) {
          setQuizSoundSettings((prev) => ({
            ...prev,
            ...response.data.settings,
          }));
        }
      } catch {
        // Keep default sound settings
      }
    };

    fetchQuizSoundSettings();
  }, [API_BASE]);

  useEffect(() => {
    const fetchStudentContext = async () => {
      try {
        const response = await axios.get(`${API_BASE}/v1/students/isstudent`, {
          withCredentials: true,
        });
        const currentStudentId = response.data?.student?._id;
        if (currentStudentId) {
          setStudentId(currentStudentId);
          setStudentName(response.data?.student?.name || "");
          setStudentRegisteredAt(response.data?.student?.createdAt || null);
          await fetchStudentCoins(currentStudentId);
          return;
        }
      } catch {
        // Keep points as 0 when user isn't authenticated in demo/public access.
      } finally {
        setAuthResolved(true);
      }

      setStudentId(null);
      setStudentName("");
      setStudentRegisteredAt(null);
      setPoints(0);
    };

    fetchStudentContext();
  }, [API_BASE, fetchStudentCoins]);

  useEffect(() => {
    if (!authResolved) return;

    if (isDemo || !studentId) {
      setStudentCourseBookings([]);
      setStudentCourseBookingsLoaded(true);
      return;
    }

    let cancelled = false;

    const fetchStudentCourseBookings = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/v1/course-bookings/student`,
          {
            withCredentials: true,
          }
        );
        if (cancelled) return;
        setStudentCourseBookings(
          Array.isArray(response.data?.bookings) ? response.data.bookings : []
        );
      } catch {
        if (!cancelled) {
          setStudentCourseBookings([]);
        }
      } finally {
        if (!cancelled) {
          setStudentCourseBookingsLoaded(true);
        }
      }
    };

    setStudentCourseBookingsLoaded(false);
    fetchStudentCourseBookings();

    return () => {
      cancelled = true;
    };
  }, [API_BASE, authResolved, isDemo, studentId]);

  useEffect(() => {
    if (!studentId || typeof window === "undefined") return undefined;

    const handleCoinUpdate = () => {
      fetchStudentCoins(studentId);
    };

    window.addEventListener("coins:updated", handleCoinUpdate);
    return () => {
      window.removeEventListener("coins:updated", handleCoinUpdate);
    };
  }, [fetchStudentCoins, studentId]);

  // Initialize Google Translate with enhanced styling
  useEffect(() => {
    isTranslateTeardownDoneRef.current = false;

    const initializeGoogleTranslateWidget = () => {
      if (!window.google?.translate?.TranslateElement) return;
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
        },
        "google_translate_element"
      );
      const instance =
        window.google.translate.TranslateElement.getInstance?.() ?? null;
      translateWidgetRef.current = instance;
      setIsTranslateReady(true);
      if (pendingLanguageRef.current) {
        const pendingLanguage = pendingLanguageRef.current;
        const changedFromWidget = applyLanguageToGoogleWidget(pendingLanguage);
        if (changedFromWidget) {
          pendingLanguageRef.current = null;
        } else if (instance) {
          instance.translatePage(pendingLanguage);
          pendingLanguageRef.current = null;
        }
      }
    };

    // Define the callback function
    window.googleTranslateElementInit = initializeGoogleTranslateWidget;

    const existingScript = document.querySelector(
      'script[src*="translate.google.com/translate_a/element.js"]'
    ) as HTMLScriptElement | null;

    if (existingScript) {
      googleTranslateScriptRef.current = existingScript;
      initializeGoogleTranslateWidget();
    } else {
      const script = document.createElement("script");
      script.src =
        "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      googleTranslateScriptRef.current = script;
      document.head.appendChild(script);
    }

    // Add enhanced CSS for Google Translate styling
    const style = document.createElement("style");
    style.setAttribute("data-google-translate", "true");
    style.textContent = `
      .goog-te-banner-frame {
        display: none !important;
      }

      .skiptranslate iframe,
      iframe.goog-te-banner-frame,
      .goog-te-banner,
      .goog-logo-link,
      .goog-te-gadget span,
      #goog-gt-tt,
      .goog-te-balloon-frame,
      .goog-tooltip,
      .goog-tooltip:hover,
      .goog-text-highlight {
        display: none !important;
      }

      body {
        top: 0 !important;
      }

      body > .skiptranslate {
        display: none !important;
      }
      
      /* Enhanced Google Translate Container */
      #google_translate_element {
        position: fixed;
        width: 0;
        height: 0;
        overflow: hidden;
        opacity: 0;
        pointer-events: none;
      }
      
      /* Hide default Google Translate elements */
      .goog-te-banner {
        display: none !important;
      }
      
      /* Enhanced dropdown styling */
      .goog-te-gadget {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
        font-size: 14px !important;
        color: #334155 !important;
      }
      
      .goog-te-gadget-simple {
        background: #ffffff !important;
        border: 1px solid #cbd5e1 !important;
        border-radius: 12px !important;
        padding: 8px 16px !important;
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08) !important;
        transition: all 0.3s ease !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        min-width: 180px !important;
      }
      
      .goog-te-gadget-simple:hover {
        border-color: #10b981 !important;
        box-shadow: 0 10px 28px rgba(15, 23, 42, 0.12) !important;
      }
      
      .goog-te-gadget-simple .goog-te-menu-value {
        color: #0f172a !important;
        font-weight: 500 !important;
        font-size: 14px !important;
        text-decoration: none !important;
        display: flex !important;
        align-items: center !important;
        gap: 6px !important;
      }
      
      .goog-te-gadget-simple .goog-te-menu-value span {
        color: #0f172a !important;
        font-weight: 500 !important;
      }
      
      .goog-te-gadget-simple .goog-te-menu-value span:first-child {
        color: #0f172a !important;
        font-weight: 500 !important;
      }
      
      /* Custom dropdown arrow */
      .goog-te-gadget-simple .goog-te-menu-value::after {
        content: '▼' !important;
        color: #10b981 !important;
        font-size: 10px !important;
        margin-left: auto !important;
        transition: transform 0.2s ease !important;
      }
      
      .goog-te-gadget-simple:hover .goog-te-menu-value::after {
        transform: rotate(180deg) !important;
      }
      
      /* Dropdown options styling */
      .goog-te-menu-frame {
        border-radius: 8px !important;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
        border: none !important;
        background: white !important;
      }
      
      .goog-te-menu2 {
        border-radius: 8px !important;
        overflow: hidden !important;
      }
      
      .goog-te-menu2-item {
        padding: 12px 16px !important;
        color: #374151 !important;
        font-weight: 500 !important;
        transition: background-color 0.2s ease !important;
      }
      
      .goog-te-menu2-item:hover {
        background-color: #f3f4f6 !important;
        color: #1f2937 !important;
      }
      
      /* Hide Google Translate attribution */
      .goog-te-gadget img {
        display: none !important;
      }
      
      /* Enhanced Simple Dropdown Styling */
      .goog-te-combo {
        background: #ffffff !important;
        border: 1px solid #cbd5e1 !important;
        border-radius: 12px !important;
        padding: 10px 16px !important;
        color: #0f172a !important;
        font-weight: 500 !important;
        font-size: 14px !important;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08) !important;
        transition: all 0.3s ease !important;
        cursor: pointer !important;
        outline: none !important;
        min-width: 160px !important;
        appearance: none !important;
        -webkit-appearance: none !important;
        -moz-appearance: none !important;
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2310b981' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e") !important;
        background-repeat: no-repeat !important;
        background-position: right 12px center !important;
        background-size: 16px !important;
        padding-right: 40px !important;
      }
      
      .goog-te-combo:hover {
        border-color: #10b981 !important;
        box-shadow: 0 10px 28px rgba(15, 23, 42, 0.12) !important;
      }
      
      .goog-te-combo:focus {
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2) !important;
      }
      
      .goog-te-combo option {
        background: white !important;
        color: #374151 !important;
        font-weight: 500 !important;
        padding: 12px 16px !important;
        border: none !important;
      }
      
      .goog-te-combo option:hover {
        background: #f3f4f6 !important;
        color: #1f2937 !important;
      }
      
      /* Alternative simple styling for different Google Translate versions */
      .goog-te-gadget .goog-te-combo {
        background: #ffffff !important;
        border: 1px solid #cbd5e1 !important;
        border-radius: 12px !important;
        padding: 10px 16px !important;
        color: #0f172a !important;
        font-weight: 500 !important;
        font-size: 14px !important;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08) !important;
        transition: all 0.3s ease !important;
        cursor: pointer !important;
        outline: none !important;
        min-width: 160px !important;
        appearance: none !important;
        -webkit-appearance: none !important;
        -moz-appearance: none !important;
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2310b981' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e") !important;
        background-repeat: no-repeat !important;
        background-position: right 12px center !important;
        background-size: 16px !important;
        padding-right: 40px !important;
      }
      
      .goog-te-gadget .goog-te-combo:hover {
        border-color: #10b981 !important;
        box-shadow: 0 10px 28px rgba(15, 23, 42, 0.12) !important;
      }
      
      .goog-te-gadget .goog-te-combo:focus {
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2) !important;
      }
      
      .goog-te-gadget .goog-te-combo option {
        background: white !important;
        color: #374151 !important;
        font-weight: 500 !important;
        padding: 12px 16px !important;
        border: none !important;
      }
      
      .goog-te-gadget .goog-te-combo option:hover {
        background: #f3f4f6 !important;
        color: #1f2937 !important;
      }
    `;
    googleTranslateStyleRef.current = style;
    document.head.appendChild(style);

    return () => {
      resetGoogleTranslateState();
      window.googleTranslateElementInit = () => {};
    };
  }, [applyLanguageToGoogleWidget, resetGoogleTranslateState]);

  const chapters = [
    "Basic Accounting",
    "Company creation and data management",
    "Voucher Entries in Tally",
    "Method of Accounting",
    "Finalisation of ledger balances",
    "Bank Reconciliation Statement",
  ];

  const learningContent = {
    intro: {
      title: "Accounting",
      content: `
        <p class="mb-6 text-lg leading-relaxed text-gray-700">Accounting is the systematic procedure of identifying, recording, classifying, summarizing, analyzing, and reporting business transactions. The primary objective is to reveal the profits and losses of a business. It plays a crucial role in managing and maintaining financial records, making informed business decisions, and ensuring compliance with financial regulations. It therefore, safeguards the interests of stakeholders.</p>
        
        <div class="flex justify-center my-12">
          <div class="relative">
            <div class="w-48 h-48 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg z-10">Accounting</div>
            <div class="absolute -top-12 -left-12 w-32 h-32 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-md z-20">
              <span class="text-center leading-tight px-2">Identifying</span>
            </div>
            <div class="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-md z-20">
              <span class="text-center leading-tight px-2">Recording</span>
            </div>
            <div class="absolute -bottom-12 -right-12 w-32 h-32 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-md z-20">
              <span class="text-center leading-tight px-2">Classifying</span>
            </div>
            <div class="absolute -bottom-12 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-gradient-to-br from-blue-700 to-blue-800 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-md z-20">
              <span class="text-center leading-tight px-2">Summarising</span>
            </div>
            <div class="absolute -bottom-12 -left-12 w-32 h-32 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-md z-20">
              <span class="text-center leading-tight px-2">Analysing</span>
            </div>
            <div class="absolute -top-12 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-md z-20">
              <span class="text-center leading-tight px-2">Reporting</span>
            </div>
          </div>
        </div>
      `,
    },
    identifying: {
      title: "1. Identifying",
      content: `
        <p class="mb-6 text-lg leading-relaxed text-gray-700">This is the initial step in accounting, where financial transactions are recognized and recorded. Accountants identify and document each transaction, ensuring they are classified correctly as income, expenses, assets, liabilities, or equity.</p>
        
        <div class="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <h4 class="font-semibold mb-4 text-green-800 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Key Points:
          </h4>
          <ul class="space-y-3">
            <li class="flex items-start">
              <div class="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span class="text-gray-700">Recognize financial transactions</span>
            </li>
            <li class="flex items-start">
              <div class="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span class="text-gray-700">Document each transaction</span>
            </li>
            <li class="flex items-start">
              <div class="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span class="text-gray-700">Classify as income, expenses, assets, liabilities, or equity</span>
            </li>
          </ul>
        </div>
      `,
    },
    recording: {
      title: "2. Recording",
      content: `
        <p class="mb-6 text-lg leading-relaxed text-gray-700">It is a fundamental step in the accounting cycle and involves documenting these events accurately for the purpose of maintaining complete and reliable financial records. Entering financial transactions in a systematic manner, as and when they occur. And to do so, we use Journal or subsidiary books.</p>
        
        <div class="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <h4 class="font-semibold mb-4 text-green-800 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Methods:
          </h4>
          <ul class="space-y-3">
            <li class="flex items-start">
              <div class="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span class="text-gray-700">Journal entries</span>
            </li>
            <li class="flex items-start">
              <div class="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span class="text-gray-700">Subsidiary books</span>
            </li>
            <li class="flex items-start">
              <div class="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span class="text-gray-700">Systematic documentation</span>
            </li>
          </ul>
        </div>
      `,
    },
    classifying: {
      title: "3. Classifying",
      content: `
        <p class="mb-6 text-lg leading-relaxed text-gray-700">After the recording of data, the transactions of similar nature or type are grouped together. For this purpose, the firm opens various accounts in a ledger which is a secondary book. Thereafter, the posting of transactions in those accounts takes place. Proper classification is essential for accurately representing an entity's financial position and performance.</p>
        
        <div class="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <h4 class="font-semibold mb-4 text-green-800 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Process:
          </h4>
          <ul class="space-y-3">
            <li class="flex items-start">
              <div class="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span class="text-gray-700">Group similar transactions</span>
            </li>
            <li class="flex items-start">
              <div class="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span class="text-gray-700">Open ledger accounts</span>
            </li>
            <li class="flex items-start">
              <div class="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span class="text-gray-700">Post transactions</span>
            </li>
          </ul>
        </div>
      `,
    },
    summarizing: {
      title: "4. Summarizing",
      content: `
        <p class="mb-6 text-lg leading-relaxed text-gray-700">It involves the preparation and presentation of the classified data. The classification takes place in a manner that is useful to the users. In this step, the firm prepares financial statements. Summarising is the basic function of accounting. All business transactions of a financial characters evidenced by some documents such as sales bill, pass book, salary slip etc. are recorded in the books of account.</p>
        
        <div class="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <h4 class="font-semibold mb-4 text-green-800 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Output:
          </h4>
          <ul class="space-y-3">
            <li class="flex items-start">
              <div class="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span class="text-gray-700">Financial statements</span>
            </li>
            <li class="flex items-start">
              <div class="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span class="text-gray-700">Useful presentation</span>
            </li>
            <li class="flex items-start">
              <div class="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span class="text-gray-700">Documented evidence</span>
            </li>
          </ul>
        </div>
      `,
    },
    analyzing: {
      title: "5. Analyzing",
      content: `
        <p class="mb-6 text-lg leading-relaxed text-gray-700">Analysis is the systematic classification of data provided in the financial statements. It refers to the process of examining financial data to understand the financial health and performance of a business.</p>
        
        <div class="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <h4 class="font-semibold mb-4 text-green-800 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Analysis Types:
          </h4>
          <ul class="space-y-3">
            <li class="flex items-start">
              <div class="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span class="text-gray-700">Ratio analysis</span>
            </li>
            <li class="flex items-start">
              <div class="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span class="text-gray-700">Trend analysis</span>
            </li>
            <li class="flex items-start">
              <div class="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span class="text-gray-700">Comparative analysis</span>
            </li>
          </ul>
        </div>
      `,
    },
    comparison: {
      title: "Difference between Accounting & Finance",
      content: `
        <p class="mb-8 text-lg leading-relaxed text-gray-700">In summary, accounting is more focused on recording and presenting financial data accurately, while finance is focused on managing financial resources strategically to maximize value. Both fields are integral to the success of businesses and play complementary roles in decision-making and overall financial management.</p>
        
        <div class="overflow-x-auto bg-white rounded-xl shadow-lg border border-green-200">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-gradient-to-r from-green-50 to-green-100">
                <th class="border border-green-200 px-6 py-4 text-left font-semibold text-green-800">BASIS FOR COMPARISON</th>
                <th class="border border-green-200 px-6 py-4 text-left font-semibold text-green-800">ACCOUNTING</th>
                <th class="border border-green-200 px-6 py-4 text-left font-semibold text-green-800">FINANCE</th>
              </tr>
            </thead>
            <tbody>
              <tr class="hover:bg-green-50 transition-colors">
                <td class="border border-green-200 px-6 py-4 font-medium text-gray-800">Meaning</td>
                <td class="border border-green-200 px-6 py-4">A methodical record-keeping of transactions of business.</td>
                <td class="border border-green-200 px-6 py-4">The study of the management of funds in the best possible manner.</td>
              </tr>
              <tr class="bg-green-50 hover:bg-green-100 transition-colors">
                <td class="border border-green-200 px-6 py-4 font-medium text-gray-800">Part of</td>
                <td class="border border-green-200 px-6 py-4">Finance</td>
                <td class="border border-green-200 px-6 py-4">Economics</td>
              </tr>
              <tr class="hover:bg-green-50 transition-colors">
                <td class="border border-green-200 px-6 py-4 font-medium text-gray-800">Focuses on</td>
                <td class="border border-green-200 px-6 py-4">Past</td>
                <td class="border border-green-200 px-6 py-4">Future</td>
              </tr>
              <tr class="bg-green-50 hover:bg-green-100 transition-colors">
                <td class="border border-green-200 px-6 py-4 font-medium text-gray-800">Concerned with</td>
                <td class="border border-green-200 px-6 py-4">Ensuring that all the financial transactions are recorded in the financial system with accuracy.</td>
                <td class="border border-green-200 px-6 py-4">Understanding financial data of the enterprise keeping in mind the growth and strategy.</td>
              </tr>
              <tr class="hover:bg-green-50 transition-colors">
                <td class="border border-green-200 px-6 py-4 font-medium text-gray-800">Thinking Process</td>
                <td class="border border-green-200 px-6 py-4">Rules-Based</td>
                <td class="border border-green-200 px-6 py-4">Analysis Based</td>
              </tr>
              <tr class="bg-green-50 hover:bg-green-100 transition-colors">
                <td class="border border-green-200 px-6 py-4 font-medium text-gray-800">Financial Statements</td>
                <td class="border border-green-200 px-6 py-4">It is prepared</td>
                <td class="border border-green-200 px-6 py-4">It is analyzed</td>
              </tr>
              <tr class="hover:bg-green-50 transition-colors">
                <td class="border border-green-200 px-6 py-4 font-medium text-gray-800">Drive</td>
                <td class="border border-green-200 px-6 py-4">Tax Driven</td>
                <td class="border border-green-200 px-6 py-4">Plan Driven</td>
              </tr>
              <tr class="bg-green-50 hover:bg-green-100 transition-colors">
                <td class="border border-green-200 px-6 py-4 font-medium text-gray-800">Career</td>
                <td class="border border-green-200 px-6 py-4">Accounting professionals can become accountants, auditors, tax consultants, etc.</td>
                <td class="border border-green-200 px-6 py-4">Finance professionals can become investment bankers, financial analysts, finance consultants, etc.</td>
              </tr>
            </tbody>
          </table>
        </div>
      `,
    },
  };

  const allTopics: Topic[] = [
    {
      id: "intro",
      title: "Introduction",
      completed: true,
      icon: BookOpen,
      subtopics: [
        "Overview of Accounting",
        "Definition & Purpose",
        "Accounting Process",
        "Business Transactions",
        "Financial Regulations",
      ],
    },
    {
      id: "identifying",
      title: "Identifying",
      completed: true,
      icon: Target,
      subtopics: [
        "Transaction Recognition",
        "Income Classification",
        "Expense Classification",
        "Asset Classification",
        "Liability Classification",
        "Equity Classification",
      ],
    },
    {
      id: "recording",
      title: "Recording",
      completed: true,
      icon: FileText,
      subtopics: [
        "Journal Entries",
        "Double Entry System",
        "Ledger Accounts",
        "Subsidiary Books",
        "Source Documents",
        "Systematic Documentation",
      ],
    },
    {
      id: "classifying",
      title: "Classifying",
      completed: true,
      icon: BarChart3,
      subtopics: [
        "Grouping Transactions",
        "Account Types",
        "Chart of Accounts",
        "Posting Process",
        "Trial Balance",
        "Account Categories",
      ],
    },
    {
      id: "summarizing",
      title: "Summarizing",
      completed: true,
      icon: FileText,
      subtopics: [
        "Financial Statements",
        "Income Statement",
        "Balance Sheet",
        "Cash Flow Statement",
        "Data Presentation",
        "Documentary Evidence",
      ],
    },
    {
      id: "analyzing",
      title: "Analyzing",
      completed: true,
      icon: BarChart3,
      subtopics: [
        "Ratio Analysis",
        "Trend Analysis",
        "Comparative Analysis",
        "Financial Health",
        "Performance Metrics",
        "Decision Making",
      ],
    },
    {
      id: "comparison",
      title: "Comparison",
      completed: false,
      icon: BookOpen,
      subtopics: [
        "Accounting vs Finance",
        "Role Differences",
        "Career Paths",
        "Skills Required",
        "Industry Applications",
        "Future Trends",
      ],
    },
  ];

  // Language options
  const languages = [
    { code: "hi", name: "Hindi" },
    { code: "bn", name: "Bengali" },
    { code: "mr", name: "Marathi" },
    { code: "gu", name: "Gujarati" },
    { code: "ta", name: "Tamil" },
    { code: "te", name: "Telugu" },
    { code: "ml", name: "Malayalam" },
    { code: "pa", name: "Punjabi" },
    { code: "kn", name: "Kannada" },
    { code: "en", name: "English (Original)" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "pt", name: "Portuguese" },
    { code: "ru", name: "Russian" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "zh", name: "Chinese" },
    { code: "ar", name: "Arabic" },
    { code: "tr", name: "Turkish" },
    { code: "nl", name: "Dutch" },
    { code: "sv", name: "Swedish" },
    { code: "no", name: "Norwegian" },
    { code: "da", name: "Danish" },
    { code: "fi", name: "Finnish" },
  ];

  const liveCorrectAnswers =
    quizData?.questions?.reduce(
      (count, question) =>
        selectedAnswers[question._id] === question.answer ? count + 1 : count,
      0
    ) ?? 0;
  const pendingQuizPoints =
    studentId && !quizSubmitted ? liveCorrectAnswers * quizCoinsPerCorrect : 0;
  const visiblePoints = points + pendingQuizPoints;
  const firstCaseStudy = caseStudies.length > 0 ? caseStudies[0] : null;
  const firstAssignment = assignments.length > 0 ? assignments[0] : null;

  return (
    <div
      className={`h-screen overflow-hidden transition-colors duration-300 ${
        isDarkMode ? "bg-slate-950 text-slate-100" : "bg-stone-50 text-slate-900"
      }`}
    >
      <div
        id="google_translate_element"
        className="hidden"
        aria-hidden="true"
      ></div>
      {/* Enhanced Header with Chapters Dropdown */}
      <div
        className={`sticky top-0 z-40 border-b transition-colors duration-300 ${
          isDarkMode
            ? "border-slate-800 bg-slate-900/95"
            : "border-stone-200 bg-white/90"
        } px-2 py-3 shadow-sm backdrop-blur sm:px-3 lg:px-4`}
      >
        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div
              className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 sm:px-4 ${
                isDarkMode
                  ? "bg-slate-900 border-slate-700"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <CheckCircle
                className={`w-5 h-5 ${
                  isDarkMode ? "text-slate-300" : "text-blue-600"
                }`}
              />
              <h1
                className={`text-lg font-semibold ${
                  isDarkMode ? "text-slate-100" : "text-blue-900"
                }`}
              >
                Digital Hub
              </h1>
            </div>
            {studentName ? (
              <div
                className={`hidden max-w-[220px] truncate rounded-xl border px-3 py-2 text-sm font-semibold sm:block sm:max-w-[260px] ${
                  isDarkMode
                    ? "border-slate-700 bg-slate-900 text-slate-100"
                    : "border-blue-200 bg-white text-blue-900"
                }`}
                title={studentName}
              >
                Hi, {studentName}
              </div>
            ) : null}
          </div>

          <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end sm:gap-3 lg:w-auto lg:flex-nowrap lg:gap-4">
            {/* Progress Bar */}
            <div className="col-span-2 flex items-center justify-between gap-2 sm:col-span-1 sm:justify-start">
              <div className="h-2 flex-1 rounded-full bg-stone-200 sm:w-24 sm:flex-none lg:w-32">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isDarkMode ? "bg-emerald-600" : "bg-blue-600"
                  }`}
                  style={{ width: `${progress}%` } as React.CSSProperties}
                ></div>
              </div>
              <span className="shrink-0 text-sm font-medium">{progress}%</span>
            </div>

            {/* Custom Language Dropdown */}
            <div className="relative min-w-0 shrink notranslate" translate="no">
              <button
                type="button"
                onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
                className={`flex w-full min-w-0 items-center justify-between rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-300 shadow-sm hover:shadow sm:min-w-[148px] lg:min-w-[160px] ${
                  isDarkMode
                    ? "bg-slate-900 border-slate-700 text-slate-100 hover:bg-slate-800"
                    : "bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100"
                }`}
              >
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <Globe
                    className={`w-4 h-4 ${
                      isDarkMode ? "text-emerald-400" : "text-blue-600"
                    }`}
                  />
                  <span className="truncate">{selectedLanguage}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    languageDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {languageDropdownOpen && (
                <div className="absolute top-full left-0 w-full bg-white border border-stone-200 rounded-xl shadow-xl z-50 mt-1 max-h-60 overflow-y-auto">
                  {languages.map((language) => (
                    <button
                      type="button"
                      key={language.code}
                      onClick={() => handleLanguageSelect(language)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors text-slate-700 border-b border-stone-200 last:border-b-0"
                    >
                      <span className="font-medium">{language.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Chapters Dropdown - Moved to Header */}
            <div className="relative col-span-2 min-w-0 shrink sm:col-span-1">
              <button
                onClick={() => setChapterDropdownOpen(!chapterDropdownOpen)}
                className={`flex w-full min-w-0 items-center justify-between rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-300 sm:min-w-[220px] sm:max-w-[260px] lg:min-w-[260px] lg:max-w-[320px] ${
                  isDarkMode
                    ? "bg-slate-900 border-slate-700 text-slate-100 hover:bg-slate-800"
                    : "bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100"
                }`}
              >
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <BookOpen
                    className={`w-4 h-4 ${
                      isDarkMode ? "text-slate-300" : "text-blue-600"
                    }`}
                  />
                  <span className="truncate">
                    {selectedChapter ? selectedChapter.title : "Select Chapter"}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    chapterDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {chapterDropdownOpen && (
                <div className="absolute top-full left-0 w-full bg-white border border-stone-200 rounded-xl shadow-xl z-50 mt-1 max-h-60 overflow-y-auto">
                  {visibleChapters.length > 0 ? (
                    visibleChapters.map((chapter: ChapterData, index) => (
                      <button
                        key={chapter._id}
                        onClick={() => {
                          setChapterDropdownOpen(false);
                          handleChapterSelect(chapter);
                        }}
                        disabled={chapter.isLocked}
                        className={`w-full border-b border-stone-200 last:border-b-0 px-4 py-3 text-left transition-colors flex items-center justify-between gap-3 ${
                          chapter.isLocked
                            ? "cursor-not-allowed bg-stone-50 text-slate-400"
                            : "text-slate-700 hover:bg-blue-50"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                        <div
                          className={`w-6 h-6 text-white rounded-full flex items-center justify-center text-xs font-medium ${
                            isDarkMode ? "bg-emerald-600" : "bg-amber-500"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <span className="font-medium">{chapter.title}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {chapter.isLocked ? (
                            <>
                              <Lock className="h-4 w-4" />
                              <span>Locked</span>
                            </>
                          ) : (
                            <span className="rounded-full bg-blue-100 px-2 py-1 font-semibold text-blue-700">
                              {getChapterCompletionPercent(chapter)}%
                            </span>
                          )}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500 text-center">
                      No chapters available
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Points Badge */}
            <div
              className={`flex shrink-0 items-center justify-center rounded-full border px-3 py-1.5 ${
                isDarkMode
                  ? "bg-slate-900 border-slate-700 text-slate-200"
                  : "bg-amber-50 border-amber-300 text-amber-800"
              }`}
            >
              <span className="text-xs sm:text-sm font-medium">
                Points {visiblePoints}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex h-[calc(100vh-89px)] min-h-0">
        {/* Narrow Left Sidebar */}
        <div
          className={`w-12 sm:w-16 transition-colors duration-300 ${
            isDarkMode
              ? "bg-slate-900 border-slate-800"
              : "bg-stone-100 border-stone-200"
          } border-r h-full shrink-0 flex flex-col items-center py-4 notranslate`}
          translate="no"
        >
          {/* Navigation Icons */}
          <div className="flex flex-col items-center space-y-6">
            <button
              onClick={() => setHamburgerOpen(!hamburgerOpen)}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode ? "hover:bg-slate-800" : "hover:bg-stone-200"
              }`}
              aria-label="Toggle menu"
            >
              <Menu
                className={`w-5 h-5 ${
                  isDarkMode ? "text-slate-200" : "text-slate-700"
                }`}
              />
            </button>
            <button
              onClick={handleBackNavigation}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode ? "hover:bg-slate-800" : "hover:bg-stone-200"
              }`}
              aria-label="Go to dashboard"
            >
              <ArrowLeft
                className={`w-5 h-5 ${
                  isDarkMode ? "text-slate-200" : "text-slate-700"
                }`}
              />
            </button>
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? "hover:bg-slate-800 bg-slate-800"
                  : "hover:bg-stone-200"
              }`}
              title={
                isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
              }
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-slate-100" />
              ) : (
                <Moon className="w-5 h-5 text-slate-700" />
              )}
            </button>
          </div>

          {/* Bottom Icons */}
          <div className="mt-auto flex flex-col items-center space-y-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode ? "hover:bg-slate-800" : "hover:bg-stone-200"
              }`}
              title="Submit a ticket"
            >
              <Target
                className={`w-5 h-5 ${
                  isDarkMode ? "text-slate-200" : "text-slate-700"
                }`}
              />
            </button>
          </div>
        </div>

        {!isDesktopViewport && hamburgerOpen ? (
          <button
            type="button"
            aria-label="Close sidebar overlay"
            className="absolute inset-0 z-30 bg-slate-950/30 backdrop-blur-[1px] lg:hidden"
            onClick={() => setHamburgerOpen(false)}
          />
        ) : null}

        {/* Hamburger Menu Sidebar */}
        <div
          className={`${
            isDesktopViewport
              ? `relative transition-all duration-300 ease-in-out ${
                  hamburgerOpen ? "w-80" : "w-0"
                }`
              : `absolute inset-y-0 left-12 sm:left-16 z-40 w-80 max-w-[calc(100vw-4rem)] transform transition-transform duration-300 ease-in-out ${
                  hamburgerOpen ? "translate-x-0" : "-translate-x-full"
                }`
          } overflow-hidden ${
            isDarkMode
              ? "bg-slate-900 border-slate-800"
              : "bg-white border-stone-200"
          } border-r h-full shrink-0 notranslate`}
          translate="no"
        >
          <div className="h-full w-80 overflow-y-auto overflow-x-hidden p-4">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2
                className={`text-lg font-semibold ${
                  isDarkMode ? "text-slate-100" : "text-slate-800"
                }`}
              >
                Topics
              </h2>
              {hamburgerOpen ? (
                <button
                  type="button"
                  onClick={() => setHamburgerOpen(false)}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                    isDarkMode
                      ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                      : "border-stone-200 bg-stone-50 text-slate-600 hover:bg-stone-100"
                  }`}
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              ) : null}
            </div>
            <div className="space-y-2">
              {selectedChapter ? (
                <>
                  {/* Topics Section */}
                  {topics.length > 0 && (
                    <>
                      <h3 className="text-sm font-semibold text-slate-500 mb-2">
                        Topics
                      </h3>
                      {visibleTopics.map((topic: TopicData, index) => {
                        const isSequenceLocked =
                          index > 0 &&
                          !completedTopicIds.includes(
                            visibleTopics[index - 1]._id
                          );
                        const isBatchLocked = isTopicLockedForBatch(
                          topic,
                          activeCourseEnrollmentAt
                        );
                        const isLocked = isSequenceLocked || isBatchLocked;
                        const batchMessage = isBatchLocked
                          ? "Open on next batch start"
                          : null;

                        return (
                          <button
                            key={topic._id}
                            onClick={() => {
                              if (isLocked) {
                                setToastMessage(
                                  isBatchLocked
                                    ? "Open on next batch start."
                                    : "Complete the previous topic to unlock this one."
                                );
                                setShowToast(true);
                                setTimeout(() => setShowToast(false), 3000);
                                return;
                              }
                              closeSidebarIfMobile();
                              handleTopicSelect(topic);
                            }}
                            className={`w-full text-left p-3 rounded-xl transition-colors border ${
                              isLocked
                                ? "opacity-60 cursor-not-allowed bg-slate-50 border-stone-100"
                                : isDarkMode
                                ? selectedTopic?._id === topic._id
                                  ? "bg-slate-800 border-slate-600 text-slate-100"
                                  : "bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800"
                                : selectedTopic?._id === topic._id
                                ? "bg-emerald-50 border-emerald-300 text-slate-900"
                                : "border-stone-200 text-slate-700 hover:bg-emerald-50 hover:text-slate-900"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-6 h-6 ${
                                  isLocked ? "bg-slate-400" : "bg-emerald-600"
                                } text-white rounded-full flex items-center justify-center text-sm font-medium`}
                              >
                                {isLocked ? (
                                  <Lock className="h-3 w-3" />
                                ) : (
                                  index + 1
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium">{topic.title}</div>
                                {batchMessage ? (
                                  <div className="mt-1 text-xs text-slate-500">
                                    {batchMessage}
                                  </div>
                                ) : null}
                              </div>
                              {selectedChapter?.completedTopicIds?.includes(
                                topic._id
                              ) ? (
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                              ) : null}
                            </div>
                          </button>
                        );
                      })}
                    </>
                  )}

                  {/* Case Studies Section */}
                  {caseStudies.length > 0 && (
                    <>
                      <h3 className="text-sm font-semibold text-slate-500 mb-2 mt-4">
                        Simulations
                      </h3>
                      {caseStudies
                        .slice(0, 2)
                        .map((caseStudy: CaseStudy, index) => {
                          const isLocked = !allTopicsCompleted;

                          return (
                            <button
                              key={caseStudy._id}
                              onClick={() => {
                                if (isLocked) {
                                  setToastMessage(
                                    "Complete all topics to unlock simulations."
                                  );
                                  setShowToast(true);
                                  setTimeout(() => setShowToast(false), 3000);
                                  return;
                                }
                                closeSidebarIfMobile();
                                handleCaseStudySelect(caseStudy);
                              }}
                              className={`w-full text-left p-3 rounded-xl transition-colors border ${
                                isLocked
                                  ? "opacity-60 cursor-not-allowed bg-slate-50 border-stone-100"
                                  : selectedCaseStudy?._id === caseStudy._id
                                  ? "bg-emerald-50 border-emerald-300"
                                  : "hover:bg-emerald-50 hover:text-slate-900 border-stone-200"
                              } ${
                                isDarkMode ? "text-slate-100" : "text-slate-700"
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <div
                                  className={`w-6 h-6 ${
                                    isLocked ? "bg-slate-400" : "bg-emerald-600"
                                  } text-white rounded-full flex items-center justify-center text-sm font-medium`}
                                >
                                  {isLocked ? (
                                    <Lock className="h-3 w-3" />
                                  ) : (
                                    `S${index + 1}`
                                  )}
                                </div>
                                <span className="font-medium">
                                  Simulation {index + 1}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                    </>
                  )}

                  {/* Assignments Section */}
                  {assignments.length > 0 && (
                    <>
                      <h3 className="text-sm font-semibold text-slate-500 mb-2 mt-4">
                        Assessments
                      </h3>
                      {assignments
                        .slice(0, 2)
                        .map((assignment: Assignment, index) => {
                          const isLocked = !allTopicsCompleted;

                          return (
                            <button
                              key={assignment._id}
                              onClick={() => {
                                if (isLocked) {
                                  setToastMessage(
                                    "Complete all topics to unlock assessments."
                                  );
                                  setShowToast(true);
                                  setTimeout(() => setShowToast(false), 3000);
                                  return;
                                }
                                closeSidebarIfMobile();
                                handleAssignmentSelect(assignment);
                              }}
                              className={`w-full text-left p-3 rounded-xl transition-colors border ${
                                isLocked
                                  ? "opacity-60 cursor-not-allowed bg-slate-50 border-stone-100"
                                  : selectedAssignment?._id === assignment._id
                                  ? "bg-emerald-50 border-emerald-300"
                                  : "hover:bg-emerald-50 hover:text-slate-900 border-stone-200"
                              } ${
                                isDarkMode ? "text-slate-100" : "text-slate-700"
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <div
                                  className={`w-6 h-6 ${
                                    isLocked ? "bg-slate-400" : "bg-emerald-600"
                                  } text-white rounded-full flex items-center justify-center text-sm font-medium`}
                                >
                                  {isLocked ? (
                                    <Lock className="h-3 w-3" />
                                  ) : (
                                    `A${index + 1}`
                                  )}
                                </div>
                                <span className="font-medium">
                                  Assessment {index + 1}
                                </span>
                                {selectedChapter?.completedAssignmentIds?.includes(
                                  assignment._id
                                ) ? (
                                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                                ) : null}
                              </div>
                            </button>
                          );
                        })}
                    </>
                  )}

                  {topics.length === 0 &&
                    caseStudies.length === 0 &&
                    assignments.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <BookOpen className="mx-auto mb-2 w-8 h-8 text-gray-300" />
                        <p className="text-sm">
                          No content available for this chapter
                        </p>
                      </div>
                    )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="mx-auto mb-2 w-8 h-8 text-gray-300" />
                  <p className="text-sm">Select a chapter to view content</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div
          ref={contentScrollRef}
          className={`flex-1 min-w-0 overflow-y-auto p-3 sm:p-5 lg:p-8 transition-colors duration-300 ${
            isDarkMode ? "bg-slate-950" : "bg-stone-50"
          }`}
        >
          <div className="w-full">
            {/* Content Display */}
            <div className="prose max-w-none">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-lg text-gray-600">
                    Loading content...
                  </div>
                </div>
              ) : selectedTopic ? (
                <>
                  <h1
                    className={`mb-5 text-xl font-bold sm:mb-8 sm:text-2xl ${
                      isDarkMode ? "text-slate-100" : "text-blue-700"
                    }`}
                  >
                    {selectedTopic.title}
                    {selectedTopicBatchMessage ? (
                      <span
                        className={`ml-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                          isSelectedTopicLockedForBatch
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        <Lock className="h-3.5 w-3.5" />
                        {selectedTopicBatchMessage}
                      </span>
                    ) : null}
                    {isDemo && (
                      <span className="ml-4 text-sm bg-amber-100 text-amber-800 px-3 py-1 rounded-full border border-amber-200">
                        DEMO MODE
                      </span>
                    )}
                  </h1>

                  {!isDemo ? (
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                          isSelectedTopicCompleted
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {isSelectedTopicCompleted
                          ? "Topic completed"
                          : "Topic pending"}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
                        Chapter topics {selectedChapter?.completedTopicCount || 0}/
                        {selectedChapter?.totalTopicCount || 0}
                      </span>
                      {selectedTopicIntroVideo && !isSelectedTopicLockedForBatch ? (
                        <button
                          type="button"
                          onClick={() => setIsIntroVideoModalOpen(true)}
                          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                        >
                          <PlayCircle className="h-4 w-4" />
                          Watch Intro Video
                        </button>
                      ) : null}
                    </div>
                  ) : null}

                  {isSelectedTopicLockedForBatch ? (
                    <div
                      className={`mb-6 rounded-2xl border px-5 py-4 ${
                        isDarkMode
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-100"
                          : "border-amber-200 bg-amber-50 text-amber-900"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-full bg-amber-400/20 p-2">
                          <Lock className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-semibold">
                            Open on next batch start.
                          </div>
                          <div className="mt-1 text-sm opacity-90">
                            This topic will unlock when the next batch starts.
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Demo Limit Banner */}
                  {isDemo && showDemoLimit && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-amber-300 rounded-full flex items-center justify-center">
                            <span className="text-amber-900 font-bold text-sm">
                              !
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-amber-900">
                              Demo Content - Page {currentPage} of {totalPages}
                            </h3>
                            <p className="text-amber-800 text-sm">
                              You&apos;re viewing a preview of this course
                              content.
                              {totalPages > 1 &&
                                ` Only the first ${totalPages} pages are available in demo mode.`}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => router.push("/student-login")}
                          className={`text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 shadow-sm hover:shadow ${
                            isDarkMode
                              ? "bg-emerald-600 hover:bg-emerald-700"
                              : "bg-blue-600 hover:bg-blue-700"
                          }`}
                        >
                          Get Full Access
                        </button>
                      </div>
                    </div>
                  )}

                  <div
                    className={`bg-white border border-stone-200 rounded-2xl p-4 text-base leading-relaxed shadow-sm text-slate-900 sm:p-6 sm:text-lg lg:p-8 ${
                      isDarkMode ? "topic-content-dark" : "topic-content-light"
                    }`}
                  >
                    {isSelectedTopicLockedForBatch ? null : (
                      <div
                        ref={topicContentRef}
                        dangerouslySetInnerHTML={{
                          __html: topicContent,
                        }}
                      />
                    )}

                    {/* Demo Mode Controls */}
                    {isDemo && !isSelectedTopicLockedForBatch && (
                      <div className="mt-8">
                        {/* Pagination Controls for Multi-page Content */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between mb-4">
                            <button
                              onClick={() => {
                                if (currentPage > 1) {
                                  const { pages } = splitContentIntoPages(
                                    atob(selectedTopic?.content || ""),
                                    1
                                  );
                                  setCurrentPage(currentPage - 1);
                                  setTopicContent(pages[currentPage - 2] || "");
                                }
                              }}
                              disabled={currentPage === 1}
                              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                                currentPage === 1
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : isDarkMode
                                  ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow"
                                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow"
                              }`}
                            >
                              ← Previous
                            </button>

                            <div className="flex items-center space-x-2">
                              {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                  key={i}
                                  onClick={() => {
                                    const { pages } = splitContentIntoPages(
                                      atob(selectedTopic?.content || ""),
                                      1
                                    );
                                    setCurrentPage(i + 1);
                                    setTopicContent(pages[i] || "");
                                  }}
                                  className={`w-8 h-8 rounded-full font-medium transition-all duration-300 ${
                                    currentPage === i + 1
                                      ? isDarkMode
                                        ? "bg-emerald-600 text-white shadow-sm"
                                        : "bg-blue-600 text-white shadow-sm"
                                      : "bg-stone-200 text-slate-700 hover:bg-stone-300"
                                  }`}
                                >
                                  {i + 1}
                                </button>
                              ))}
                            </div>

                            <button
                              onClick={() => {
                                if (isDemo) {
                                  // In demo mode, show purchase popup instead of next page
                                  setShowPurchasePopup(true);
                                } else if (currentPage < totalPages) {
                                  const { pages } = splitContentIntoPages(
                                    atob(selectedTopic?.content || ""),
                                    1
                                  );
                                  setCurrentPage(currentPage + 1);
                                  setTopicContent(pages[currentPage] || "");
                                }
                              }}
                              disabled={!isDemo && currentPage === totalPages}
                              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                                !isDemo && currentPage === totalPages
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : isDarkMode
                                  ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow"
                                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow"
                              }`}
                            >
                              {isDemo ? "Purchase Course →" : "Next Topics →"}
                            </button>
                          </div>
                        )}

                      </div>
                    )}

                    {/* Quiz Questions - Directly in main content */}
                    {!isSelectedTopicLockedForBatch && quizLoading ? (
                      <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-center text-gray-600">
                          Loading questions...
                        </div>
                      </div>
                    ) : !isSelectedTopicLockedForBatch &&
                      quizData &&
                      quizData.questions &&
                      quizData.questions.length > 0 ? (
                      <div className="mt-8">
                        <div className="space-y-6">
                          {quizData.questions.map(
                            (question: QuizQuestion, questionIndex: number) => (
                              <div
                                key={question._id}
                                className="bg-gray-50 rounded-lg p-6 border border-gray-200"
                              >
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                  Question {questionIndex + 1}:{" "}
                                  {question.question}
                                </h3>

                                <div className="space-y-3">
                                  {question.options.map(
                                    (option: string, optionIndex: number) => {
                                      const isSelected =
                                        selectedAnswers[question._id] ===
                                        option;
                                      const isCorrect =
                                        option === question.answer;
                                      const hasAnswered =
                                        selectedAnswers[question._id];

                                      return (
                                        <div
                                          key={optionIndex}
                                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                            isSelected
                                              ? isCorrect
                                                ? "bg-green-100 border-green-500"
                                                : "bg-red-100 border-red-500"
                                              : hasAnswered && isCorrect
                                              ? "bg-green-100 border-green-500"
                                              : "bg-white border-gray-300 hover:border-gray-400"
                                          }`}
                                          onClick={() => {
                                            handleAnswerSelect(
                                              question._id,
                                              option
                                            );
                                          }}
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="text-gray-800">
                                              {String.fromCharCode(
                                                65 + optionIndex
                                              )}
                                              . {option}
                                            </span>
                                            {(isSelected ||
                                              (hasAnswered && isCorrect)) && (
                                              <span className="text-xl font-bold">
                                                {isCorrect ? (
                                                  <span className="text-green-600">
                                                    ✓
                                                  </span>
                                                ) : (
                                                  <span className="text-red-600">
                                                    ✗
                                                  </span>
                                                )}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                        <div className="mt-6 flex flex-wrap items-center gap-4">
                          <button
                            onClick={handleQuizSubmit}
                            disabled={quizSubmitted}
                            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
                              quizSubmitted
                                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                : isDarkMode
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                          >
                            {quizSubmitted ? "Quiz Submitted" : "Submit Quiz"}
                          </button>
                          {showQuizResults && quizRewardSummary && (
                            <div className="text-sm font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2">
                              Score {quizRewardSummary.correctAnswers}/
                              {quizRewardSummary.totalQuestions}
                              {quizRewardSummary.coinsAwarded > 0 && (
                                <span className="ml-2 text-green-700">
                                  +{quizRewardSummary.coinsAwarded} coins
                                </span>
                              )}
                            </div>
                          )}
                          {!quizSubmitted && studentId && quizCoinsPerCorrect > 0 && (
                            <div className="text-sm font-medium text-slate-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                              Correct: {liveCorrectAnswers}/{quizData.questions.length} |
                              Potential +{pendingQuizPoints} points
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}

                    {isDemo && (
                      <div className="mt-6 flex justify-center">
                        <button
                          onClick={() => {
                            router.push("/course");
                          }}
                          className={`px-5 py-2 text-sm text-white rounded-lg font-semibold transition-all duration-300 shadow-sm hover:shadow ${
                            isDarkMode
                              ? "bg-emerald-600 hover:bg-emerald-700"
                              : "bg-blue-600 hover:bg-blue-700"
                          }`}
                        >
                          💳 Subscribe Full Course
                        </button>
                      </div>
                    )}

                    {!isSelectedTopicLockedForBatch &&
                      (previousTopic || nextTopic) && (
                      <div className="mt-8 flex items-center justify-between gap-4">
                        <div>
                          {previousTopic ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  isTopicLockedForBatch(
                                    previousTopic,
                                    activeCourseEnrollmentAt
                                  )
                                ) {
                                  setToastMessage(
                                    "Open on next batch start."
                                  );
                                  setShowToast(true);
                                  setTimeout(() => setShowToast(false), 3000);
                                  return;
                                }
                                handleTopicSelect(previousTopic);
                              }}
                              className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all ${
                                isDarkMode
                                  ? "bg-slate-700 hover:bg-slate-600"
                                  : "bg-slate-700 hover:bg-slate-800"
                              }`}
                            >
                              <span aria-hidden="true">←</span>
                              <span>Previous</span>
                            </button>
                          ) : null}
                        </div>

                        <div>
                          {nextTopic ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  isTopicLockedForBatch(
                                    nextTopic,
                                    activeCourseEnrollmentAt
                                  )
                                ) {
                                  setToastMessage(
                                    "Open on next batch start."
                                  );
                                  setShowToast(true);
                                  setTimeout(() => setShowToast(false), 3000);
                                  return;
                                }
                                if (quizData && !quizSubmitted) {
                                  setToastMessage(
                                    "Please complete the quiz before moving to the next topic."
                                  );
                                  setShowToast(true);
                                  setTimeout(() => setShowToast(false), 3000);
                                  return;
                                }
                                if (
                                  selectedTopic?._id &&
                                  !isSelectedTopicCompleted
                                ) {
                                  markProgressItemComplete(
                                    "topic",
                                    selectedTopic._id,
                                    "Topic marked as completed."
                                  );
                                  return;
                                }
                                handleTopicSelect(nextTopic);
                              }}
                              disabled={Boolean(quizData && !quizSubmitted)}
                              className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all ${
                                quizData && !quizSubmitted
                                  ? "bg-slate-400 cursor-not-allowed"
                                  : isDarkMode
                                  ? "bg-emerald-600 hover:bg-emerald-700"
                                  : "bg-blue-600 hover:bg-blue-700"
                              }`}
                            >
                              <span>Next Topic</span>
                              <span aria-hidden="true">→</span>
                            </button>
                          ) : null}
                        </div>
                      </div>
                    )}
                    {!nextTopic && selectedTopic && firstCaseStudy ? (
                      <div className="mt-6 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            handleCaseStudySelect(firstCaseStudy);
                          }}
                          className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all ${
                            isDarkMode
                              ? "bg-emerald-600 hover:bg-emerald-700"
                              : "bg-blue-600 hover:bg-blue-700"
                          }`}
                        >
                          <span>Next Simulation</span>
                          <span aria-hidden="true">→</span>
                        </button>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : selectedCaseStudy ? (
                <>
                  <div className="text-lg leading-relaxed bg-white border border-stone-200 rounded-2xl p-8 shadow-sm text-slate-900">
                    <div className="mb-6">
                      <p className="text-slate-700">
                        {selectedCaseStudy.description}
                      </p>
                    </div>

                    {/* Task Instructions */}
                    {selectedCaseStudy.tasks &&
                      selectedCaseStudy.tasks.length > 0 && (
                        <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-xl">
                          <p className="text-amber-800">
                            {selectedCaseStudy.tasks[0].instructions}
                          </p>
                        </div>
                      )}

                    {/* Simulations */}
                    <div className="space-y-6">
                      {selectedCaseStudy.simulations &&
                      selectedCaseStudy.simulations.length > 0 ? (
                        selectedCaseStudy.simulations.map(
                          (simulation: Simulation, index: number) => (
                            <div
                              key={simulation._id}
                              className="bg-stone-50 border border-stone-200 rounded-lg p-6"
                            >
                              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                                {simulation.title}
                              </h3>
                              <p className="text-slate-700 mb-4">
                                {simulation.description}
                              </p>

                              {/* Render AccountingExperimentCard */}
                              <AccountingExperimentCard
                                experimentNumber={index + 1}
                                statement={
                                  simulation.description ||
                                  "Mock transaction: Paid wages to employees for the first two weeks of January, aggregating Rs.25000."
                                }
                                correctEntries={
                                  simulation.correctEntries || [
                                    {
                                      id: "1",
                                      date: "15/01/2025",
                                      type: "Debit",
                                      particulars: "Salary A/c",
                                      debit: "25000",
                                      credit: "",
                                    },
                                    {
                                      id: "2",
                                      date: "15/01/2025",
                                      type: "Credit",
                                      particulars: "Cash A/c",
                                      debit: "",
                                      credit: "25000",
                                    },
                                  ]
                                }
                                onComplete={(isCorrect) => {
                                  console.log(
                                    `Experiment ${index + 1} completed:`,
                                    isCorrect
                                  );
                                }}
                              />
                            </div>
                          )
                        )
                      ) : (
                        /* Mock Simulation when no simulations exist */
                        <div className="bg-stone-50 border border-stone-200 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-slate-800 mb-4">
                            Mock Simulation
                          </h3>
                          <p className="text-slate-700 mb-4">
                            This is a mock simulation to demonstrate the
                            AccountingExperimentCard component.
                          </p>

                          {/* Render AccountingExperimentCard with mock data */}
                          <AccountingExperimentCard
                            experimentNumber={1}
                            statement="Mock transaction: Paid wages to employees for the first two weeks of January, aggregating Rs.25000."
                            correctEntries={[
                              {
                                id: "1",
                                date: "15/01/2025",
                                type: "Debit",
                                particulars: "Salary A/c",
                                debit: "25000",
                                credit: "",
                              },
                              {
                                id: "2",
                                date: "15/01/2025",
                                type: "Credit",
                                particulars: "Cash A/c",
                                debit: "",
                                credit: "25000",
                              },
                            ]}
                            onComplete={(isCorrect) => {
                              console.log(
                                "Mock experiment completed:",
                                isCorrect
                              );
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {firstAssignment ? (
                      <div className="mt-8 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            handleAssignmentSelect(firstAssignment);
                          }}
                          className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all ${
                            isDarkMode
                              ? "bg-emerald-600 hover:bg-emerald-700"
                              : "bg-blue-600 hover:bg-blue-700"
                          }`}
                        >
                          <span>Continue</span>
                          <span aria-hidden="true">→</span>
                        </button>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : selectedAssignment ? (
                <>
                  <h1 className="text-4xl font-bold text-orange-500 mb-8">
                    {selectedAssignment.title}
                  </h1>
                  <div className="text-lg leading-relaxed bg-white border border-stone-200 rounded-2xl p-8 shadow-sm text-slate-900">
                    <div className="mb-6">
                      <p className="text-slate-700">
                        {selectedAssignment.description}
                      </p>
                    </div>
                    <div className="mb-6 flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                          isSelectedAssignmentCompleted
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {isSelectedAssignmentCompleted
                          ? "Assignment completed"
                          : "Assignment pending"}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
                        Assignments {selectedChapter?.completedAssignmentCount || 0}/
                        {selectedChapter?.totalAssignmentCount || 0}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          markProgressItemComplete(
                            "assignment",
                            selectedAssignment._id,
                            "Assignment marked as completed."
                          )
                        }
                        disabled={
                          isSelectedAssignmentCompleted ||
                          progressMutationKey ===
                            `assignment:${selectedAssignment._id}`
                        }
                        className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all ${
                          isSelectedAssignmentCompleted
                            ? "cursor-not-allowed bg-emerald-300"
                            : "bg-emerald-600 hover:bg-emerald-700"
                        }`}
                      >
                        {isSelectedAssignmentCompleted
                          ? "Completed"
                          : progressMutationKey ===
                            `assignment:${selectedAssignment._id}`
                          ? "Saving..."
                          : "Mark Assignment Complete"}
                      </button>
                    </div>

                    {/* Tasks Section */}
                    {selectedAssignment.tasks &&
                      selectedAssignment.tasks.length > 0 && (
                        <div className="mb-8">
                          <h3 className="text-xl font-semibold text-emerald-800 mb-4">
                            Tasks ({selectedAssignment.tasks.length})
                          </h3>
                          <div className="space-y-4">
                            {selectedAssignment.tasks.map((task, index) => (
                              <div
                                key={task._id || index}
                                className="p-6 bg-emerald-50 border border-emerald-200 rounded-lg"
                              >
                                <h4 className="text-lg font-semibold text-emerald-800 mb-2">
                                  Task {index + 1}: {task.taskName}
                                </h4>
                                <p className="text-emerald-700">
                                  {task.instructions}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Content Section */}
                    {selectedAssignment.content &&
                      selectedAssignment.content.length > 0 && (
                        <div className="mb-8">
                          <h3 className="text-xl font-semibold text-emerald-800 mb-4">
                            Content ({selectedAssignment.content.length})
                          </h3>
                          <div className="space-y-4">
                            {selectedAssignment.content.map(
                              (content, index) => (
                                <div
                                  key={content._id || index}
                                  className="p-6 bg-stone-50 border border-stone-200 rounded-lg"
                                >
                                  <h4 className="text-lg font-semibold text-slate-800 mb-2">
                                    Content {index + 1} - {content.type}
                                  </h4>
                                  {content.type === "video" &&
                                    content.videoUrl && (
                                      <div className="mb-4">
                                        <video
                                          controls
                                          controlsList="nodownload noplaybackrate noremoteplayback"
                                          disablePictureInPicture
                                          disableRemotePlayback
                                          onContextMenu={(event) =>
                                            event.preventDefault()
                                          }
                                          className="w-full max-w-5xl rounded-lg"
                                        >
                                          <source
                                            src={content.videoUrl}
                                            type="video/mp4"
                                          />
                                          Your browser does not support the
                                          video tag.
                                        </video>
                                      </div>
                                    )}
                                  {content.type === "text" &&
                                    content.textContent && (
                                      <div className="text-slate-700 whitespace-pre-wrap">
                                        {content.textContent}
                                      </div>
                                    )}
                                  {content.type === "rich" &&
                                    content.richTextContent && (
                                      <div
                                        className="text-slate-700"
                                        ref={topicContentRef}
                                        dangerouslySetInnerHTML={{
                                          __html: content.richTextContent,
                                        }}
                                      />
                                    )}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Simulations Section */}
                    {selectedAssignment.simulations &&
                      selectedAssignment.simulations.length > 0 && (
                        <div className="mb-8">
                          <h3 className="text-xl font-semibold text-emerald-800 mb-4">
                            Simulations ({selectedAssignment.simulations.length}
                            )
                          </h3>
                          <div className="space-y-4">
                            {selectedAssignment.simulations.map(
                              (simulation, index) => (
                                <div
                                  key={simulation._id || index}
                                  className="p-6 bg-green-50 border border-green-200 rounded-lg"
                                >
                                  <h4 className="text-lg font-semibold text-green-800 mb-2">
                                    Simulation {index + 1}: {simulation.title}
                                  </h4>
                                  <p className="text-green-700 mb-2">
                                    {simulation.description}
                                  </p>
                                  <p className="text-sm text-green-600">
                                    Type: {simulation.type} |
                                    {simulation.isOptional
                                      ? " Optional"
                                      : " Required"}
                                  </p>
                                  {simulation.config && (
                                    <div className="mt-3 p-3 bg-white rounded border">
                                      <p className="text-sm text-gray-600">
                                        Configuration available for this
                                        simulation
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Assessment Questions */}
                    {selectedAssignment.questionSets &&
                    selectedAssignment.questionSets.length > 0 ? (
                      <div className="space-y-6">
                        {selectedAssignment.questionSets.map(
                          (questionSet: QuestionSet) => (
                            <div
                              key={questionSet._id}
                              className="bg-emerald-50 border border-emerald-200 rounded-lg p-6"
                            >
                              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <h3 className="text-lg font-semibold text-emerald-800">
                                    {questionSet.name}
                                  </h3>
                                  <p className="text-emerald-700 mt-1">
                                    {questionSet.description}
                                  </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                  <span
                                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                                      completedQuestionSetIds.includes(questionSet._id)
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-amber-100 text-amber-700"
                                    }`}
                                  >
                                    {completedQuestionSetIds.includes(questionSet._id)
                                      ? "Question set completed"
                                      : "Question set pending"}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      markProgressItemComplete(
                                        "questionSet",
                                        questionSet._id,
                                        "Question set submitted and marked as completed."
                                      )
                                    }
                                    disabled={
                                      completedQuestionSetIds.includes(questionSet._id) ||
                                      progressMutationKey ===
                                        `questionSet:${questionSet._id}`
                                    }
                                    className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all ${
                                      completedQuestionSetIds.includes(questionSet._id)
                                        ? "cursor-not-allowed bg-emerald-300"
                                        : "bg-emerald-600 hover:bg-emerald-700"
                                    }`}
                                  >
                                    {completedQuestionSetIds.includes(questionSet._id)
                                      ? "Completed"
                                      : progressMutationKey ===
                                        `questionSet:${questionSet._id}`
                                      ? "Saving..."
                                      : "Submit Question Set"}
                                  </button>
                                </div>
                              </div>

                              {/* Dynamic Questions */}
                              <div className="bg-white border border-gray-200 rounded-lg p-6">
                                <h4 className="text-lg font-semibold text-emerald-800 mb-6">
                                  Assessment Questions
                                </h4>

                                {questionSet.questions &&
                                questionSet.questions.length > 0 ? (
                                  <div className="space-y-6">
                                    {questionSet.questions.map(
                                      (question, qIndex) => (
                                        <div
                                          key={qIndex}
                                          className="mb-8 p-4 bg-gray-50 rounded-lg"
                                        >
                                          <h5 className="text-md font-semibold text-gray-800 mb-3">
                                            {qIndex + 1}. {question.question}
                                          </h5>
                                          {question.context && (
                                            <p className="text-sm text-gray-600 mb-3 italic">
                                              {question.context}
                                            </p>
                                          )}
                                          <div className="space-y-2">
                                            {question.options &&
                                              question.options.map(
                                                (option, oIndex) => (
                                                  <label
                                                    key={oIndex}
                                                    className="flex items-center space-x-3 cursor-pointer"
                                                  >
                                                    <input
                                                      type="checkbox"
                                                      className="w-4 h-4 text-emerald-600 rounded"
                                                    />
                                                    <span className="text-gray-700">
                                                      {option}
                                                    </span>
                                                  </label>
                                                )
                                              )}
                                          </div>
                                          {question.explanation && (
                                            <div className="mt-3 p-3 bg-stone-50 rounded border-l-4 border-emerald-400">
                                              <p className="text-sm text-slate-800">
                                                <strong>Explanation:</strong>{" "}
                                                {question.explanation}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      )
                                    )}

                                    {/* Question Set Info */}
                                    <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        {questionSet.totalQuestions && (
                                          <div>
                                            <span className="font-semibold text-emerald-800">
                                              Total Questions:
                                            </span>
                                            <span className="ml-2 text-emerald-700">
                                              {questionSet.totalQuestions}
                                            </span>
                                          </div>
                                        )}
                                        {questionSet.timeLimit && (
                                          <div>
                                            <span className="font-semibold text-emerald-800">
                                              Time Limit:
                                            </span>
                                            <span className="ml-2 text-emerald-700">
                                              {questionSet.timeLimit} minutes
                                            </span>
                                          </div>
                                        )}
                                        {questionSet.passingScore && (
                                          <div>
                                            <span className="font-semibold text-emerald-800">
                                              Passing Score:
                                            </span>
                                            <span className="ml-2 text-emerald-700">
                                              {questionSet.passingScore}%
                                            </span>
                                          </div>
                                        )}
                                        <div>
                                          <span className="font-semibold text-emerald-800">
                                            Questions:
                                          </span>
                                          <span className="ml-2 text-emerald-700">
                                            {questionSet.questions.length}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-8 text-gray-500">
                                    <p>
                                      No questions available for this question
                                      set.
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-emerald-800 mb-6">
                          Assessment Questions
                        </h4>
                        <div className="text-center py-8 text-gray-500">
                          <p>No question sets available for this assignment.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : selectedChapter ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-amber-400/20 p-2">
                      <Lock className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold">
                        Open on next batch start
                      </h4>
                      <p className="mt-1 text-sm text-amber-800">
                        No accessible topic is available yet for this chapter.
                        Please wait for the next batch to start.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-lg text-gray-600">
                    Select a chapter and topic to view content
                  </div>
                </div>
              )}
            </div>
      </div>
    </div>
  </div>

      {/* Intro Video Modal */}
      {isIntroVideoModalOpen && selectedTopicIntroVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
            onClick={() => setIsIntroVideoModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-2xl bg-slate-950 shadow-2xl ring-1 ring-white/10">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-300">
                  Intro Video
                </p>
                <h3 className="text-lg font-semibold text-white sm:text-xl">
                  {selectedTopic?.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsIntroVideoModalOpen(false)}
                className="rounded-full p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close intro video"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-black">
              <video
                key={selectedTopicIntroVideo}
                controls
                controlsList="nodownload noplaybackrate noremoteplayback"
                disablePictureInPicture
                disableRemotePlayback
                autoPlay
                playsInline
                onContextMenu={(event) => event.preventDefault()}
                className="aspect-video w-full bg-black"
              >
                <source src={selectedTopicIntroVideo} />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Submission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Hazy transparent background overlay */}
          <div
            className="absolute inset-0 bg-transparent bg-opacity-50 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></div>

          {/* Modal content */}
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Submit a Ticket
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleTicketSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={ticketForm.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={ticketForm.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={ticketForm.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  name="message"
                  value={ticketForm.message}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Describe your issue or request..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Purchase Popup Modal */}
      {showPurchasePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  Unlock Full Course
                </h3>
                <button
                  onClick={() => setShowPurchasePopup(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close popup"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <div className="bg-emerald-50 rounded-lg p-4 mb-4 border border-emerald-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Get Full Access
                      </h4>
                      <p className="text-sm text-gray-600">
                        Access all chapters, assignments, and resources
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">
                      Complete course content
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">
                      Interactive assignments
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">
                      Case studies & simulations
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">
                      Certificate of completion
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPurchasePopup(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Maybe Later
                </button>
                <button
                  onClick={() => {
                    setShowPurchasePopup(false);
                    router.push("/student-login");
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
                >
                  Purchase Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .topic-content-light h1,
        .topic-content-light h2,
        .topic-content-light h3,
        .topic-content-light h4,
        .topic-content-light h5,
        .topic-content-light h6 {
          color: #1d4ed8 !important;
        }

        .topic-content-light ul li::marker,
        .topic-content-light ol li::marker {
          color: #f59e0b !important;
          font-weight: 700;
        }

        .topic-content-light .bg-green-500 {
          background-color: #fbbf24 !important;
        }

        .topic-content-light .text-green-800,
        .topic-content-light .text-green-700 {
          color: #1d4ed8 !important;
        }

        .topic-content-light .bg-green-50 {
          background-color: #eff6ff !important;
        }

        .topic-content-light .border-green-200 {
          border-color: #bfdbfe !important;
        }

        .topic-content-light table,
        .topic-content-dark table {
          width: 100% !important;
          border-collapse: collapse !important;
          margin: 1.5rem 0 !important;
          table-layout: auto !important;
          background: transparent !important;
        }

        .topic-content-light th,
        .topic-content-light td,
        .topic-content-dark th,
        .topic-content-dark td {
          border: 1px solid #e5e7eb !important;
          padding: 12px 10px !important;
          vertical-align: top !important;
          text-align: left !important;
          line-height: 1.5 !important;
          white-space: normal !important;
          word-break: break-word !important;
        }

        .topic-content-light th,
        .topic-content-dark th {
          font-weight: 700 !important;
          background: #f8fafc !important;
          color: #0f172a !important;
        }

        .topic-content-light tr:nth-child(even) td,
        .topic-content-dark tr:nth-child(even) td {
          background: rgba(248, 250, 252, 0.65) !important;
        }

        .topic-content-light tbody tr:hover td,
        .topic-content-dark tbody tr:hover td {
          background: rgba(239, 246, 255, 0.75) !important;
        }

        .topic-content-light img,
        .topic-content-dark img {
          border: none !important;
          box-shadow: none !important;
          background: transparent !important;
          border-radius: 0 !important;
          min-width: 0 !important;
          max-width: 100% !important;
          height: auto !important;
        }

        .topic-content-light img[style],
        .topic-content-dark img[style] {
          border: none !important;
          box-shadow: none !important;
          background: transparent !important;
          border-radius: 0 !important;
          min-width: 0 !important;
        }
      `}</style>
    </div>
  );
}
