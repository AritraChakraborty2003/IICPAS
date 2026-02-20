"use client";

import React, { useState, useEffect } from "react";
import {
  Typography,
  Card,
  CardContent,
  Button,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import { FaClock, FaArrowLeft } from "react-icons/fa";
import axios from "axios";
import Swal from "sweetalert2";

interface Question {
  _id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

interface RevisionTest {
  _id: string;
  course: {
    _id: string;
    title: string;
    category: string;
    level: string;
  };
  level: string;
  title: string;
  timeLimit: number;
  questions: Question[];
  totalQuestions: number;
}

interface CourseWithTests {
  _id: string;
  title: string;
  category: string;
  level: string;
  tests: RevisionTest[];
}

const RevisionTab: React.FC = () => {
  const [courses, setCourses] = useState<CourseWithTests[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTest, setCurrentTest] = useState<RevisionTest | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: number]: string;
  }>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalMarks, setTotalMarks] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(
    null
  );
  const [quizStarted, setQuizStarted] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";
  const totalTests = courses.reduce((sum, course) => sum + course.tests.length, 0);

  useEffect(() => {
    fetchRevisionTests();
  }, []);

  const fetchRevisionTests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/revision-tests`);
      const tests = response.data.data;

      // Group tests by course
      const courseMap = new Map<string, CourseWithTests>();
      tests.forEach((test: RevisionTest) => {
        const courseId = test.course._id;
        if (!courseMap.has(courseId)) {
          courseMap.set(courseId, {
            _id: courseId,
            title: test.course.title || "Unknown Course",
            category: test.course.category || "General",
            level: test.course.level || "Beginner",
            tests: [],
          });
        }
        courseMap.get(courseId)!.tests.push(test);
      });

      setCourses(Array.from(courseMap.values()));
      setError(null);
    } catch (err) {
      console.error("Error fetching revision tests:", err);
      setError("Failed to load revision tests");
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "level 1":
        return "bg-red-500";
      case "level 2":
        return "bg-orange-500";
      case "level 3":
        return "bg-green-500";
      case "pro":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getLevelNumber = (level: string) => {
    switch (level.toLowerCase()) {
      case "level 1":
        return "1";
      case "level 2":
        return "2";
      case "level 3":
        return "3";
      case "pro":
        return "pro";
      default:
        return "?";
    }
  };

  const sortTestsByLevel = (tests: RevisionTest[]) => {
    return [...tests].sort((a, b) => {
      const levelOrder = {
        "level 1": 1,
        "level 2": 2,
        "level 3": 3,
        pro: 4,
      };
      const aLevel = a.level.toLowerCase() as keyof typeof levelOrder;
      const bLevel = b.level.toLowerCase() as keyof typeof levelOrder;
      return (levelOrder[aLevel] || 0) - (levelOrder[bLevel] || 0);
    });
  };

  const startQuiz = (test: RevisionTest) => {
    setCurrentTest(test);
    setSelectedAnswers({});
    setTotalMarks(0);
    setTimeLeft(test.timeLimit * 60);
    setQuizStarted(true);

    // Start timer
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimerInterval(interval);
  };

  const closeQuiz = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    setQuizStarted(false);
    setCurrentTest(null);
    setSelectedAnswers({});
    setTotalMarks(0);
    setTimeLeft(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerSelect = (
    questionIndex: number,
    selectedOption: string
  ) => {
    const question = currentTest!.questions[questionIndex];
    const isCorrect = selectedOption === question.correctAnswer;

    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: selectedOption,
    }));

    if (isCorrect) {
      setTotalMarks((prev) => prev + 10);
    }
  };

  const handleSubmitQuiz = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    // Calculate final score
    let calculatedScore = 0;
    currentTest!.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        calculatedScore += 10;
      }
    });

    setQuizStarted(false);

    setTimeout(() => {
      Swal.fire({
        title: "Quiz Completed!",
        html: `
          <div class="text-center">
            <div class="text-6xl text-green-500 mb-4">✓</div>
            <div class="text-2xl font-bold text-gray-800 mb-2">Your Score</div>
            <div class="text-4xl font-bold text-blue-600">${calculatedScore}/${
          currentTest!.questions.length * 10
        }</div>
            <div class="text-gray-600 mt-2">Great job! Keep practicing to improve your skills.</div>
          </div>
        `,
        icon: undefined,
        confirmButtonText: "Close",
        confirmButtonColor: "#3B82F6",
        customClass: {
          popup: "rounded-xl",
          confirmButton: "px-8 py-3 rounded-lg font-semibold",
        },
      });
    }, 100);

    closeQuiz();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-8">
        <Typography variant="h6">{error}</Typography>
        <Button onClick={fetchRevisionTests} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  // Show full-screen quiz interface
  if (quizStarted && currentTest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 text-gray-800 p-4 md:p-6 pt-8 md:pt-10">
        {/* Quiz Header */}
        <div className="mb-6 md:mb-8">
          <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-blue-700 p-5 md:p-6 shadow-[0_20px_45px_rgba(15,23,42,0.28)]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={closeQuiz}
                  className="flex items-center gap-2 text-slate-200 hover:text-white transition-colors bg-white/10 border border-white/20 px-3 py-2 rounded-lg"
                >
                  <FaArrowLeft />
                  <span>Back to Tests</span>
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-red-600 px-4 py-2 rounded-lg shadow-md">
                  <FaClock className="text-white" />
                  <span className="font-bold text-white">
                    Time Left: {formatTime(timeLeft)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <Typography variant="h3" className="font-bold !text-white mb-2">
                {currentTest.course.title}
              </Typography>
              <Typography variant="body1" className="!text-blue-100">
                {currentTest.questions.length} questions • 10 marks each
              </Typography>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-white border border-slate-200 px-4 py-3 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Typography variant="body2" className="!font-semibold !text-slate-700">
                Attempted: {Object.keys(selectedAnswers).length}/{currentTest.questions.length}
              </Typography>
            </div>
            <Typography variant="body2" className="!font-semibold !text-blue-700">
              Marks: {totalMarks}
            </Typography>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-5">
          {currentTest.questions.map((question, questionIndex) => (
            <Card
              key={questionIndex}
              className="bg-white border border-slate-200 rounded-2xl shadow-[0_10px_28px_rgba(15,23,42,0.08)] overflow-hidden"
            >
              <CardContent className="p-0">
                <div className="px-5 md:px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50">
                  <Typography
                    variant="h6"
                    className="!text-slate-800 !font-semibold"
                  >
                    Question {questionIndex + 1}
                  </Typography>
                </div>
                <div className="px-5 md:px-6 py-5">
                <Typography
                  variant="body1"
                  className="text-slate-800 font-semibold mb-6 text-lg"
                >
                  {question.question}
                </Typography>

                <div className="pl-0">
                  <FormControl component="fieldset" className="w-full">
                    <RadioGroup
                      value={selectedAnswers[questionIndex] || ""}
                      onChange={(e) =>
                        handleAnswerSelect(questionIndex, e.target.value)
                      }
                      className="grid grid-cols-1 md:grid-cols-2 gap-3"
                    >
                      {question.options.map((option, optionIndex) => (
                        <FormControlLabel
                          key={optionIndex}
                          value={option}
                          control={<Radio className="text-blue-600" />}
                          label={option}
                          className={`mx-0 rounded-xl border-2 transition-all duration-200 cursor-pointer px-3 py-2 ${
                            selectedAnswers[questionIndex] === option
                              ? "border-blue-500 bg-blue-50 shadow-sm"
                              : "border-slate-200 hover:border-blue-300 bg-white hover:bg-blue-50/30"
                          }`}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit Button */}
        <div className="mt-8 text-center pb-6">
          <Button
            variant="contained"
            onClick={handleSubmitQuiz}
            className="!px-8 !py-3 !bg-emerald-600 hover:!bg-emerald-700 !text-white !font-bold !text-lg !rounded-xl !shadow-lg"
          >
            Submit Quiz
          </Button>
        </div>
      </div>
    );
  }

  // Show course selection interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 text-gray-800 p-4 md:p-6 pt-8 md:pt-10">
      {/* Header */}
      <div className="mb-7 rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-sky-50 p-5 md:p-7 shadow-[0_20px_55px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700">
              Assessment Center
            </p>
            <Typography variant="h3" className="!font-bold !text-slate-900 !mt-2 !mb-3">
              Prepare
            </Typography>
            <Typography variant="body1" className="!text-slate-600 !text-base">
              Choose a topic and take tests. Measure your skills and get
              detailed information on improving your skills.
            </Typography>
          </div>
          <div className="grid grid-cols-2 gap-3 md:w-[340px]">
            <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Courses
              </p>
              <p className="text-3xl font-bold text-slate-900 leading-none mt-2">
                {courses.length}
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Tests
              </p>
              <p className="text-3xl font-bold text-slate-900 leading-none mt-2">
                {totalTests}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Revision Tests Grid */}
      <div className="grid gap-6">
        {courses.map((course) => (
          <Card
            key={course._id}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-[0_14px_34px_rgba(15,23,42,0.08)]"
          >
            <CardContent className="p-6">
              <div className="mb-5">
                <Typography
                  variant="h5"
                  className="font-bold text-slate-800 mb-4"
                >
                  {course.title}
                </Typography>
                <div className="flex items-center gap-3 text-sm text-gray-600 mt-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 font-medium">
                    Category: {course.category}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                    Level: {course.level}
                  </span>
                  <span className="ml-auto font-semibold text-blue-900">
                    Tests Available: {course.tests.length}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {sortTestsByLevel(course.tests).map((test) => (
                    <div key={test._id} className="text-center">
                      <button
                        onClick={() => startQuiz(test)}
                        className={`w-20 h-20 rounded-full ${getLevelColor(
                          test.level
                        )} text-white font-bold text-xl flex items-center justify-center hover:scale-105 transition-all duration-200 mb-2 mx-auto shadow-md`}
                      >
                        {getLevelNumber(test.level)}
                      </button>
                      <Typography
                        variant="body2"
                        className="text-gray-700 font-medium"
                      >
                        {test.level}
                      </Typography>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RevisionTab;
