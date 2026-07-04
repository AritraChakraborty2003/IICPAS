"use client";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import AccountingExperimentCard from "../components/AccountingExperimentCard";
import TopicLessonsDisplay from "../components/TopicLessonsDisplay";
import { useAuthHeartbeat } from "../../lib/useAuthHeartbeat";
import { useStudentAutoLogout } from "../../hooks/useStudentAutoLogout";
import DigitalHubChat from "./DigitalHubChat";
import ZoomVideoModal from "../components/ZoomVideoModal";
import { getApiBase } from "@/lib/apiBase";
import {
  DEFAULT_CONTENT_FONT_FAMILY,
  normalizeDigitalHubContentHtml,
} from "../utils/contentFontFamily";
import {
  getBatchWindowState,
  getBatchChapterState,
  getBatchTopicState,
  parseDateOrNull,
} from "../utils/batchWindowState";
import { formatTopicLessonDateTime } from "@/lib/topicLessons";

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

interface CourseAccessRecord {
  _id?: string;
  courseId?: string | { _id?: string } | null;
  slug?: string;
  isLocked?: boolean;
  status?: string;
  batchLockStartsAt?: string | null;
  batchLockEndsAt?: string | null;
  batchLockActive?: boolean;
  batchWindowActive?: boolean;
  batchPreviewOnly?: boolean;
  batchAccessState?: string | null;
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
  AlertCircle,
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
  Calendar,
  ExternalLink,
  Video,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  PhoneOff,
  Users,
  Mic,
  MicOff,
  VideoOff,
  MessageSquare,
  Smile,
  Share,
  Shield,
  Sparkles,
  MoreHorizontal,
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
  topicBatchWindows?: Array<{
    topicId: string;
    hasBatchWindow: boolean;
    isLocked: boolean;
    startsAt?: string | null;
    endsAt?: string | null;
  }>;
}

interface TopicData {
  _id: string;
  title: string;
  content: string;
  introVideo?: string;
  lessons?: Array<{
    _id?: string;
    kind?: "recorded" | "live";
    title?: string;
    order?: number;
    status?: string;
    publishAt?: string;
    sourceType?: string;
    sourceUrl?: string;
    liveSessionId?:
      | string
      | {
          _id?: string;
          title?: string;
          date?: string;
          time?: string;
          link?: string;
        }
      | null;
  }>;
  quiz?: string;
  publishAt?: string;
  createdAt: string;
  updatedAt: string;
}

// A class scheduled in admin "Class Management" (ClassSession on the backend).
interface ClassSessionItem {
  _id: string;
  title: string;
  type: "live" | "recorded";
  status?: string;
  date?: string;
  time?: string;
  durationMinutes?: number;
  meetingLink?: string;
  recordingUrl?: string;
  courses?: Array<{ _id?: string; title?: string }> | string[];
  chapters?: Array<{ _id?: string; title?: string }> | string[];
  topics?: Array<{ _id?: string; title?: string }> | string[];
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

interface TourStep {
  id:
    | "welcome"
    | "progress"
    | "language"
    | "chapters"
    | "actions"
    | "topics"
    | "study";
  title: string;
  description: string;
}

interface TourSeenState {
  seen: boolean;
}

const QUIZ_QUESTION_LIMIT = 5;
const LAST_SELECTION_STORAGE_KEY = "digitalHub:lastSelection";
const DIGITAL_HUB_TOUR_STORAGE_PREFIX = "digital-hub-client-tour:v1";

const extractCourseRecord = (
  payload: unknown,
): Record<string, unknown> | null => {
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
    return candidate.data.course as Record<string, unknown>;
  }

  if (
    candidate.data &&
    typeof candidate.data === "object" &&
    !Array.isArray(candidate.data)
  ) {
    return candidate.data;
  }

  return candidate;
};

const extractCourseList = (payload: unknown): CourseAccessRecord[] => {
  if (!payload || typeof payload !== "object") return [];
  if (Array.isArray(payload)) return payload as CourseAccessRecord[];

  const candidate = payload as {
    courses?: CourseAccessRecord[];
    data?: CourseAccessRecord[] | { courses?: CourseAccessRecord[] };
  };

  if (Array.isArray(candidate.courses)) {
    return candidate.courses;
  }

  if (candidate.data && typeof candidate.data === "object") {
    if (Array.isArray(candidate.data)) {
      return candidate.data as CourseAccessRecord[];
    }
    const dataObj = candidate.data as { courses?: CourseAccessRecord[] };
    if (Array.isArray(dataObj.courses)) {
      return dataObj.courses;
    }
  }

  return [];
};

const getRandomQuestions = (
  questions: QuizQuestion[],
  limit: number = QUIZ_QUESTION_LIMIT,
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
  progressSummaries: ChapterProgressSummary[] = [],
) => {
  const progressMap = new Map(
    progressSummaries.map((chapter) => [String(chapter.chapterId), chapter]),
  );

  return (Array.isArray(chapters) ? [...chapters] : []).map(
    (chapter, index) => {
      const summary = progressMap.get(String(chapter._id));
      return {
        ...chapter,
        isLocked:
          typeof summary?.isLocked === "boolean" ? summary.isLocked : false,
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
        completedAssignmentCount: Number(
          summary?.completedAssignmentCount || 0,
        ),
        totalAssignmentCount: Number(summary?.totalAssignmentCount || 0),
        completedQuestionSetCount: Number(
          summary?.completedQuestionSetCount || 0,
        ),
        totalQuestionSetCount: Number(summary?.totalQuestionSetCount || 0),
        completedTopicIds: summary?.completedTopicIds || [],
        completedAssignmentIds: summary?.completedAssignmentIds || [],
        completedQuestionSetIds: summary?.completedQuestionSetIds || [],
        topicBatchWindows: Array.isArray((summary as any)?.topicBatchWindows)
          ? ((summary as any)
              .topicBatchWindows as ChapterData["topicBatchWindows"])
          : chapter.topicBatchWindows || [],
      };
    },
  );
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
    Math.min(100, Math.round((completedItems / totalItems) * 100)),
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
  index?: number,
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

  return candidates.some(
    (candidate) => String(candidate) === normalizedIdentifier,
  );
};

const findChapterByIdentifier = (
  chapters: ChapterData[],
  identifier?: string | null,
) => {
  if (!identifier) return null;

  return (
    chapters.find((chapter) => matchesChapterIdentifier(chapter, identifier)) ||
    chapters.find((chapter, index) =>
      matchesChapterIdentifier(chapter, identifier, index),
    ) ||
    null
  );
};

const formatPlaybackTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const totalSeconds = Math.floor(seconds);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const toIdString = (value?: string | { _id?: string } | null) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && typeof value._id === "string") {
    return value._id;
  }
  return "";
};

const getCourseEnrollmentAt = (
  bookings: CourseBookingRecord[],
  courseId?: string | null,
) => {
  if (!courseId) return null;

  const normalizedCourseId = String(courseId);
  const matches = (Array.isArray(bookings) ? bookings : []).filter(
    (booking) =>
      booking &&
      booking.status !== "cancelled" &&
      booking.itemType === "single_course" &&
      toIdString(booking.courseId) === normalizedCourseId,
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

const hardenVideoElements = (container: HTMLElement | null) => {
  if (!container) return;

  container.querySelectorAll("video").forEach((video) => {
    video.setAttribute("controlsList", "nodownload");
    video.setAttribute("disablePictureInPicture", "");
    const controlsList = (
      video as HTMLVideoElement & {
        controlsList?: DOMTokenList;
      }
    ).controlsList;
    controlsList?.add("nodownload");
    controlsList?.add("noplaybackrate");
    controlsList?.add("noremoteplayback");
    (
      video as HTMLVideoElement & { disableRemotePlayback?: boolean }
    ).disableRemotePlayback = true;
    video.oncontextmenu = (event) => {
      event.preventDefault();
      return false;
    };
  });
};

const DIGITAL_HUB_TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome",
    description:
      "This is your Digital Hub home. It helps you confirm the active learning workspace and student context.",
  },
  {
    id: "progress",
    title: "Track progress",
    description:
      "Use this section to monitor completion and keep an eye on your current points while you move through the course.",
  },
  {
    id: "language",
    title: "Choose language",
    description:
      "Change the reading language here whenever you want a translated view of the current topic content.",
  },
  {
    id: "chapters",
    title: "Switch chapters",
    description:
      "Open the chapter selector to move across the course and confirm which chapter is currently active.",
  },
  {
    id: "actions",
    title: "Quick actions",
    description:
      "These shortcuts control the menu, dashboard back navigation, dark mode, and support ticket access.",
  },
  {
    id: "topics",
    title: "Browse topics",
    description:
      "Use the topics panel to move through the chapter in order and unlock the next topic as you progress.",
  },
  {
    id: "study",
    title: "Study area",
    description:
      "This is the main learning space where topic content, supporting lessons, and practice questions appear together.",
  },
];

const DIGITAL_HUB_FONT_STACK = DEFAULT_CONTENT_FONT_FAMILY;

const normalizeDigitalHubContent = (html: string) =>
  normalizeDigitalHubContentHtml(html, DIGITAL_HUB_FONT_STACK);

function MoreVideoOptionsButton({
  videoRef,
}: {
  videoRef: React.RefObject<HTMLVideoElement>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(1);

  const handleSpeedChange = (newSpeed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = newSpeed;
      setSpeed(newSpeed);
    }
  };

  const handleVolumeChange = (delta: number) => {
    if (videoRef.current) {
      const newVol = Math.max(0, Math.min(1, videoRef.current.volume + delta));
      videoRef.current.volume = newVol;
      setVolume(newVol);
    }
  };

  return (
    <div className="relative">
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-48 rounded-xl bg-slate-800 p-2 shadow-xl border border-white/10 text-slate-200 text-sm z-50">
          <div className="mb-2 border-b border-white/10 pb-2">
            <div className="mb-1 font-semibold text-xs text-slate-400 text-left">
              Playback Speed
            </div>
            <div className="flex gap-1">
              {[1, 2, 3].map((s) => (
                <button
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  className={`flex-1 rounded py-1 text-center transition-colors ${speed === s ? "bg-indigo-600 text-white" : "bg-white/5 hover:bg-white/10"}`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 font-semibold text-xs text-slate-400 text-left">
              Volume ({(volume * 100).toFixed(0)}%)
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => handleVolumeChange(-0.1)}
                className="flex-1 rounded bg-white/5 py-1 hover:bg-white/10"
              >
                -
              </button>
              <button
                onClick={() => handleVolumeChange(0.1)}
                className="flex-1 rounded bg-white/5 py-1 hover:bg-white/10"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="hidden flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-slate-200 transition-colors hover:bg-white/10 sm:flex sm:px-3"
      >
        <MoreHorizontal className="h-5 w-5" />
        <span className="text-[11px]">More</span>
      </button>
    </div>
  );
}
