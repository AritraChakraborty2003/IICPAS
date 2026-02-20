"use client";
import React, { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import {
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Modal,
  IconButton,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import TimerIcon from "@mui/icons-material/Timer";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";

export default function RevisionTab() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [currentTest, setCurrentTest] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [totalMarks, setTotalMarks] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const totalTests = useMemo(
    () => courses.reduce((count, course) => count + course.tests.length, 0),
    [courses]
  );

  useEffect(() => {
    fetchRevisionTests();
  }, []);

  useEffect(() => {
    let timer;
    if (quizStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [quizStarted, timeLeft]);

  const fetchRevisionTests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/revision-tests`);
      if (response.data.success) {
        const tests = response.data.data;
        
        // Group tests by course
        const courseMap = {};
        tests.forEach((test) => {
          if (!courseMap[test.course._id]) {
            courseMap[test.course._id] = {
              _id: test.course._id,
              title: test.course.title || `Course ${test.course._id.slice(-4)}`, // Fallback if title is missing
              category: test.course.category || "General",
              level: test.course.level || "Foundation",
              tests: [],
            };
          }
          courseMap[test.course._id].tests.push(test);
        });
        setCourses(Object.values(courseMap));
      }
    } catch (error) {
      console.error("Error fetching revision tests:", error);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = (test) => {
    setCurrentTest(test);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setTimeLeft(test.timeLimit * 60); // Convert minutes to seconds
    setQuizStarted(true);
    setShowResults(false);
    setTotalMarks(0);
    setQuizModalOpen(true);
  };

  const handleAnswerSelect = (questionIndex, selectedOption) => {
    if (selectedAnswers[questionIndex] !== undefined) return; // Already answered

    const question = currentTest.questions[questionIndex];
    const isCorrect = selectedOption === question.correctAnswer;

    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: selectedOption,
    }));

    if (isCorrect) {
      setTotalMarks((prev) => prev + 10);
      Swal.fire({
        title: "+10 Marks!",
        text: "Correct answer!",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    } else {
      // Show correct answer in green
      setTimeout(() => {
        Swal.fire({
          title: "Incorrect!",
          text: `Correct answer: ${question.correctAnswer}`,
          icon: "error",
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
      }, 500);
    }
  };

  const handleSubmitQuiz = () => {
    setQuizStarted(false);
    setShowResults(true);

    const totalQuestions = currentTest.questions.length;
    const answeredQuestions = Object.keys(selectedAnswers).length;
    const correctAnswers = Object.values(selectedAnswers).filter(
      (answer, index) => answer === currentTest.questions[index].correctAnswer
    ).length;

    const finalMarks = correctAnswers * 10;
    const percentage = (correctAnswers / totalQuestions) * 100;

    Swal.fire({
      title: "Quiz Completed!",
      html: `
        <div style="text-align: center;">
          <h3>Your Score: ${finalMarks} marks</h3>
          <p>Correct Answers: ${correctAnswers}/${totalQuestions}</p>
          <p>Percentage: ${percentage.toFixed(1)}%</p>
          <p>Time Taken: ${Math.floor(
            (currentTest.timeLimit * 60 - timeLeft) / 60
          )}:${String((currentTest.timeLimit * 60 - timeLeft) % 60).padStart(
        2,
        "0"
      )}</p>
        </div>
      `,
      icon: percentage >= 70 ? "success" : "info",
      confirmButtonText: "Close",
    });
  };

  const closeQuiz = () => {
    setQuizModalOpen(false);
    setCurrentTest(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setTimeLeft(0);
    setQuizStarted(false);
    setShowResults(false);
    setTotalMarks(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getLevelColor = (level, difficulty) => {
    // Base colors for levels
    const baseColors = {
      "Level 1": "#ef4444", // red
      "Level 2": "#f97316", // orange
      Pro: "#2563eb", // blue
    };
    
    const baseColor = baseColors[level] || "#6b7280";
    
    // Adjust color based on difficulty
    if (difficulty === "Hard") {
      // Make color darker for hard difficulty
      return darkenColor(baseColor, 0.2);
    } else if (difficulty === "Hardest") {
      // Make color even darker for hardest difficulty
      return darkenColor(baseColor, 0.4);
    }
    
    return baseColor;
  };

  const darkenColor = (color, amount) => {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * amount * 100);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  };

  const getDifficultyLabel = (level, difficulty) => {
    const difficultyLabels = {
      "Level 1": { "Normal": "Normal", "Hard": "Hard", "Hardest": "Hardest" },
      "Level 2": { "Normal": "Normal", "Hard": "Hard", "Hardest": "Hardest" },
      "Pro": { "Normal": "Normal", "Hard": "Hard", "Hardest": "Hardest" }
    };
    
    return difficultyLabels[level]?.[difficulty] || difficulty || "Normal";
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case "Level 1":
        return "1";
      case "Level 2":
        return "2";
      case "Pro":
        return "PRO";
      default:
        return "?";
    }
  };

  const getDifficultyTone = (difficulty) => {
    switch (difficulty) {
      case "Hard":
        return { bg: "#fff7ed", text: "#c2410c", border: "#fdba74" };
      case "Hardest":
        return { bg: "#fef2f2", text: "#b91c1c", border: "#fca5a5" };
      default:
        return { bg: "#eff6ff", text: "#1d4ed8", border: "#93c5fd" };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6">
      <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-sky-50 p-5 md:p-7 shadow-[0_20px_55px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700">
              Assessment Center
            </p>
            <h1 className="mt-2 text-3xl md:text-5xl font-bold text-slate-900">
              Prepare
            </h1>
            <p className="mt-3 text-sm md:text-base text-slate-600 max-w-3xl leading-relaxed">
              Choose a topic and take tests. Track level-wise performance and
              build exam readiness with timed assessments.
            </p>
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

      {/* Soft Skills Banner */}
      <Card
        sx={{
          mt: 3,
          mb: 4,
          background: "linear-gradient(120deg, #0f172a 0%, #1e3a8a 55%, #2563eb 100%)",
          color: "white",
          borderRadius: "24px",
          boxShadow: "0 24px 48px rgba(15, 23, 42, 0.25)",
        }}
      >
        <CardContent className="flex justify-between items-center gap-3 p-5 md:p-7">
          <div>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 800 }}>
              Upgrade your Soft Skills!
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, maxWidth: 460 }}>
              Watch curated videos on communication, interviews, and workplace
              confidence.
            </Typography>
          </div>
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "12px",
              px: 2.2,
              py: 1,
              color: "#0f172a",
              bgcolor: "#f8fafc",
              "&:hover": { bgcolor: "white" },
            }}
          >
            Explore videos
          </Button>
        </CardContent>
      </Card>

      {/* Course Cards */}
      <div className="grid grid-cols-1 gap-5">
        {courses.map((course) => (
          <Card
            key={course._id}
            sx={{
              border: "1px solid #dbe3f0",
              borderRadius: "22px",
              background:
                "linear-gradient(180deg, #ffffff 0%, #fbfdff 70%, #f8fbff 100%)",
              boxShadow: "0 14px 34px rgba(15, 23, 42, 0.08)",
            }}
          >
            <CardContent className="p-5 md:p-6">
              <Typography
                variant="h5"
                gutterBottom
                sx={{ fontWeight: 800, color: "#0f172a" }}
              >
                {course.title}
              </Typography>

              {/* Course Info */}
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <Typography
                  variant="body2"
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    borderRadius: "999px",
                    bgcolor: "#e0f2fe",
                    color: "#075985",
                    fontWeight: 600,
                  }}
                >
                  Category: {course.category}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    borderRadius: "999px",
                    bgcolor: "#f8fafc",
                    color: "#334155",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  Level: {course.level}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    ml: "auto",
                    color: "#1e3a8a",
                    fontWeight: 700,
                  }}
                >
                  Tests Available: {course.tests.length}
                </Typography>
              </div>

              <div className="h-px w-full bg-slate-200 mb-6" />

              {/* Level Badges - Dynamically show only available test levels */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
                {course.tests.map((test) => {
                  const isCompleted = false; // TODO: Add completion tracking
                  const difficulty = test?.difficulty || "Normal";
                  const tone = getDifficultyTone(difficulty);

                  return (
                    <button
                      type="button"
                      key={test._id}
                      className="relative rounded-2xl border border-slate-200 bg-white px-3 py-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-blue-300"
                      onClick={() => startQuiz(test)}
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div
                          className="min-w-[56px] h-14 rounded-full px-3 flex items-center justify-center text-white font-bold text-sm shadow-sm"
                          style={{
                            backgroundColor: getLevelColor(test.level, difficulty),
                            opacity: 1,
                          }}
                        >
                          {getLevelIcon(test.level)}
                        </div>
                        <Typography
                          variant="caption"
                          className="text-center !font-semibold !text-slate-900"
                        >
                          {test.level}
                        </Typography>
                        <Typography
                          variant="caption"
                          className="text-xs text-slate-500 text-center"
                        >
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 border"
                            style={{
                              backgroundColor: tone.bg,
                              color: tone.text,
                              borderColor: tone.border,
                            }}
                          >
                            {getDifficultyLabel(test.level, difficulty)}
                          </span>
                        </Typography>
                      </div>
                      {isCompleted && (
                        <CheckCircleIcon
                          sx={{
                            fontSize: 16,
                            color: "green",
                            position: "absolute",
                            top: 8,
                            right: 8,
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quiz Modal */}
      <Modal open={quizModalOpen} onClose={closeQuiz}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            maxWidth: 920,
            bgcolor: "#f8fafc",
            borderRadius: "22px",
            boxShadow: "0 30px 70px rgba(15, 23, 42, 0.3)",
            p: { xs: 2, md: 3 },
            maxHeight: "90vh",
            overflow: "auto",
          }}
        >
          {currentTest && (
            <>
              {/* Header */}
              <div className="mb-5 rounded-2xl border border-blue-100 bg-gradient-to-r from-slate-900 via-blue-900 to-blue-700 p-4 md:p-5 text-white">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      {currentTest.title}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.92, mt: 0.5 }}>
                      Level: {currentTest.level} • Difficulty:{" "}
                      {currentTest.difficulty || "Normal"}
                    </Typography>
                    {!showResults && (
                      <Typography
                        variant="body2"
                        sx={{ opacity: 0.85, mt: 1.2, fontWeight: 500 }}
                      >
                        Question {currentQuestionIndex + 1} of{" "}
                        {currentTest.questions.length}
                      </Typography>
                    )}
                  </div>
                  <Typography
                    variant="body2"
                    sx={{
                      px: 1.2,
                      py: 0.4,
                      borderRadius: "999px",
                      bgcolor: "rgba(255,255,255,0.18)",
                      border: "1px solid rgba(255,255,255,0.3)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    10 marks each
                  </Typography>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 mb-4">
                {quizStarted && !showResults ? (
                  <Chip
                    icon={<TimerIcon />}
                    label={`Time: ${formatTime(timeLeft)}`}
                    sx={{
                      bgcolor: timeLeft < 120 ? "#fee2e2" : "#dbeafe",
                      color: timeLeft < 120 ? "#b91c1c" : "#1e3a8a",
                      fontWeight: 700,
                      border: `1px solid ${timeLeft < 120 ? "#fca5a5" : "#93c5fd"}`,
                    }}
                  />
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
                  {!showResults && (
                    <Typography variant="body2" className="text-slate-600 font-semibold">
                      Marks: {totalMarks}
                    </Typography>
                  )}
                  <IconButton
                    onClick={closeQuiz}
                    sx={{
                      bgcolor: "white",
                      border: "1px solid #e2e8f0",
                      "&:hover": { bgcolor: "#f1f5f9" },
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </div>
              </div>

              {!showResults ? (
                /* Quiz Questions */
                <div>
                  {currentTest.questions[currentQuestionIndex] && (
                    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{ fontWeight: 700, color: "#0f172a" }}
                      >
                        Question {currentQuestionIndex + 1} of{" "}
                        {currentTest.questions.length}
                      </Typography>

                      <Typography
                        variant="body1"
                        className="mb-5"
                        sx={{ fontSize: "1.1rem", color: "#1e293b", fontWeight: 500 }}
                      >
                        {currentTest.questions[currentQuestionIndex].question}
                      </Typography>

                      <div className="space-y-3.5">
                        {currentTest.questions[
                          currentQuestionIndex
                        ].options.map((option, optionIndex) => {
                          const optionLetter = String.fromCharCode(
                            65 + optionIndex
                          );
                          const isSelected =
                            selectedAnswers[currentQuestionIndex] === option;
                          const isCorrect =
                            option ===
                            currentTest.questions[currentQuestionIndex]
                              .correctAnswer;
                          const isWrong = isSelected && !isCorrect;

                          return (
                            <div
                              key={optionIndex}
                              className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                                isSelected
                                  ? isCorrect
                                    ? "border-emerald-500 bg-emerald-50 shadow-[0_8px_20px_rgba(16,185,129,0.15)]"
                                    : "border-rose-500 bg-rose-50 shadow-[0_8px_20px_rgba(244,63,94,0.14)]"
                                  : isCorrect &&
                                    selectedAnswers[currentQuestionIndex] !==
                                      undefined
                                  ? "border-emerald-500 bg-emerald-50"
                                  : "border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/40"
                              }`}
                              onClick={() =>
                                handleAnswerSelect(currentQuestionIndex, option)
                              }
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="h-8 w-8 rounded-full border border-slate-300 bg-slate-50 flex items-center justify-center font-semibold text-slate-700">
                                    {optionLetter}
                                  </span>
                                  <span className="text-slate-800 font-medium">{option}</span>
                                </div>
                                {isSelected && (
                                  <div>
                                    {isCorrect ? (
                                      <CheckCircleIcon
                                        sx={{ color: "green" }}
                                      />
                                    ) : (
                                      <CancelIcon sx={{ color: "red" }} />
                                    )}
                                  </div>
                                )}
                                {!isSelected &&
                                  isCorrect &&
                                  selectedAnswers[currentQuestionIndex] !==
                                    undefined && (
                                    <CheckCircleIcon sx={{ color: "green" }} />
                                  )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 md:p-4 flex justify-between items-center">
                    <Button
                      variant="outlined"
                      disabled={currentQuestionIndex === 0}
                      onClick={() =>
                        setCurrentQuestionIndex((prev) => prev - 1)
                      }
                      sx={{
                        textTransform: "none",
                        borderColor: "#cbd5e1",
                        color: "#334155",
                        fontWeight: 600,
                        borderRadius: "10px",
                        px: 2.2,
                      }}
                    >
                      Previous
                    </Button>

                    <Typography variant="body2" className="text-slate-600 font-semibold">
                      {Object.keys(selectedAnswers).length}/{currentTest.questions.length} answered
                    </Typography>

                    {currentQuestionIndex ===
                    currentTest.questions.length - 1 ? (
                      <Button
                        variant="contained"
                        onClick={handleSubmitQuiz}
                        sx={{
                          bgcolor: "#0f265c",
                          textTransform: "none",
                          fontWeight: 700,
                          borderRadius: "10px",
                          px: 2.2,
                          "&:hover": { bgcolor: "#0b1d46" },
                        }}
                      >
                        Submit Quiz
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={() =>
                          setCurrentQuestionIndex((prev) => prev + 1)
                        }
                        sx={{
                          bgcolor: "#0f265c",
                          textTransform: "none",
                          fontWeight: 700,
                          borderRadius: "10px",
                          px: 2.2,
                          "&:hover": { bgcolor: "#0b1d46" },
                        }}
                      >
                        Next
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                /* Results */
                <div className="text-center rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
                  <Typography variant="h4" gutterBottom sx={{ fontWeight: 800 }}>
                    Quiz Completed!
                  </Typography>
                  <Typography variant="h5" color="primary" gutterBottom sx={{ fontWeight: 700 }}>
                    Total Marks: {totalMarks}
                  </Typography>
                  <Typography variant="body1" gutterBottom sx={{ color: "#334155" }}>
                    Correct Answers:{" "}
                    {
                      Object.values(selectedAnswers).filter(
                        (answer, index) =>
                          answer === currentTest.questions[index].correctAnswer
                      ).length
                    }
                    /{currentTest.questions.length}
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={closeQuiz}
                    sx={{
                      bgcolor: "#0f265c",
                      mt: 2,
                      textTransform: "none",
                      borderRadius: "10px",
                      fontWeight: 700,
                      px: 3,
                      "&:hover": { bgcolor: "#0b1d46" },
                    }}
                  >
                    Close
                  </Button>
                </div>
              )}
            </>
          )}
        </Box>
      </Modal>
    </div>
  );
}
