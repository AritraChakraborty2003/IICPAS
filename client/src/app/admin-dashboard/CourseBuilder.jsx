"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import Swal from "sweetalert2"; // <-- Add this import
import CourseList from "./Course/CourseList";
import ChapterList from "./Course/ChapterList";
import TopicList from "./Course/TopicList";
import EditCourse from "./Course/EditCourse";
import EditChapter from "./Course/EditChapter";
import AddOrEditTopicForm from "./Course/AddOrEditTopicForm";
import CourseAddTab from "./Course/CourseAdd";
import CourseLevelManager from "./Course/CourseLevelManager";
import GroupPricingTab from "./Course/GroupPricingTab";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export default function CourseArea() {
  const [view, setView] = useState("course-list");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [editingTopic, setEditingTopic] = useState(null);
  const [editingChapter, setEditingChapter] = useState(null);
  const courseListRef = useRef();
  const chapterListRef = useRef();
  const historyReadyRef = useRef(false);
  const historyNavigationRef = useRef(false);

  const applyCourseState = useCallback((snapshot = {}) => {
    setView(snapshot.view || "course-list");
    setSelectedCourse(snapshot.selectedCourse || null);
    setSelectedChapter(snapshot.selectedChapter || null);
    setEditingTopic(snapshot.editingTopic || null);
    setEditingChapter(snapshot.editingChapter || null);
  }, []);

  const getCourseStateSnapshot = useCallback(
    () => ({
      view,
      selectedCourse,
      selectedChapter,
      editingTopic,
      editingChapter,
    }),
    [view, selectedCourse, selectedChapter, editingTopic, editingChapter]
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const currentHistoryState =
      window.history.state && typeof window.history.state === "object"
        ? window.history.state
        : {};
    const existingCourseState = currentHistoryState.courseAreaState;

    if (existingCourseState) {
      historyNavigationRef.current = true;
      applyCourseState(existingCourseState);
    } else {
      window.history.replaceState(
        {
          ...currentHistoryState,
          courseAreaState: {
            view: "course-list",
            selectedCourse: null,
            selectedChapter: null,
            editingTopic: null,
            editingChapter: null,
          },
        },
        "",
        window.location.href
      );
    }

    historyReadyRef.current = true;

    const handlePopState = (event) => {
      historyNavigationRef.current = true;
      applyCourseState(event.state?.courseAreaState);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [applyCourseState]);

  useEffect(() => {
    if (typeof window === "undefined" || !historyReadyRef.current) return;

    if (historyNavigationRef.current) {
      historyNavigationRef.current = false;
      return;
    }

    const nextSnapshot = getCourseStateSnapshot();
    const currentHistoryState =
      window.history.state && typeof window.history.state === "object"
        ? window.history.state
        : {};
    const currentSnapshot = currentHistoryState.courseAreaState;

    if (
      JSON.stringify(currentSnapshot || null) ===
      JSON.stringify(nextSnapshot || null)
    ) {
      historyNavigationRef.current = false;
      return;
    }

    const nextHistoryState = {
      ...currentHistoryState,
      courseAreaState: nextSnapshot,
    };

    window.history.pushState(nextHistoryState, "", window.location.href);
  }, [
    view,
    selectedCourse,
    selectedChapter,
    editingTopic,
    editingChapter,
    getCourseStateSnapshot,
  ]);

  const handleViewBack = useCallback(
    (fallbackView) => {
      if (typeof window !== "undefined" && window.history.length > 1) {
        window.history.back();
        return;
      }
      setView(fallbackView);
    },
    []
  );

  // Navigation handlers
  const handleShowCourseList = () => {
    setView("course-list");
    setSelectedCourse(null);
    setSelectedChapter(null);
    setEditingTopic(null);
    courseListRef.current?.fetchCourses?.();
  };

  const handleShowAddCourse = () => {
    setView("add-course");
    setSelectedCourse(null);
    setSelectedChapter(null);
    setEditingTopic(null);
  };

  const handleShowEditCourse = (course) => {
    setSelectedCourse(course);
    setView("edit-course");
    setSelectedChapter(null);
    setEditingTopic(null);
  };

  const handleShowChapters = (course) => {
    setSelectedCourse(course);
    setView("chapters");
    setSelectedChapter(null);
    setEditingTopic(null);
  };

  const handleShowTopics = (chapter) => {
    setSelectedChapter(chapter);
    setView("topics");
    setEditingTopic(null);
  };

  const handleShowAddTopic = () => {
    setEditingTopic(null);
    setView("add-topic");
  };

  const handleShowEditTopic = (topic) => {
    setEditingTopic(topic);
    setView("edit-topic");
  };

  const handleShowEditChapter = (chapter) => {
    setEditingChapter(chapter);
    setView("edit-chapter");
  };

  const handleShowCourseLevelManager = () => {
    setView("course-level-manager");
    setSelectedCourse(null);
    setSelectedChapter(null);
    setEditingTopic(null);
  };

  const handleShowGroupPricing = () => {
    setView("group-pricing");
    setSelectedCourse(null);
    setSelectedChapter(null);
    setEditingTopic(null);
  };

  // Course actions with SweetAlert2
  const handleDeleteCourse = async (course, refreshCourses) => {
    const result = await Swal.fire({
      title: `Delete course "${course.title}"?`,
      text: "This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;
    try {
      await axios.delete(`${API_BASE}/courses/${course._id}`);
      await Swal.fire("Deleted!", "Course deleted successfully.", "success");
      if (refreshCourses) refreshCourses();
    } catch (err) {
      Swal.fire("Error", err?.message || "Error deleting course", "error");
    }
  };

  const handleToggleStatus = async (course, refreshCourses) => {
    const newStatus = course.status === "Active" ? "Inactive" : "Active";
    try {
      await axios.put(`${API_BASE}/courses/${course._id}`, {
        status: newStatus,
      });
      await Swal.fire(
        "Status Changed",
        `Course status set to ${newStatus}`,
        "success"
      );
      if (refreshCourses) refreshCourses();
    } catch (err) {
      Swal.fire("Error", err?.message || "Failed to toggle status", "error");
    }
  };

  return (
    <>
      {view === "course-list" && (
        <CourseList
          ref={courseListRef}
          onAddCourse={handleShowAddCourse}
          onEditCourse={handleShowEditCourse}
          onAddChapter={handleShowChapters}
          onDeleteCourse={handleDeleteCourse}
          onToggleStatus={handleToggleStatus}
          onManageLevels={handleShowCourseLevelManager}
          onGroupPricing={handleShowGroupPricing}
        />
      )}

      {view === "add-course" && <CourseAddTab onBack={handleShowCourseList} />}

      {view === "edit-course" && selectedCourse && (
        <EditCourse
          courseId={selectedCourse._id}
          onBack={handleShowCourseList}
        />
      )}

      {view === "chapters" && selectedCourse && (
        <ChapterList
          ref={chapterListRef}
          courseId={selectedCourse._id}
          courseName={selectedCourse.title}
          onViewCourse={handleShowCourseList}
          onViewTopics={handleShowTopics}
          onEditChapter={handleShowEditChapter}
        />
      )}

      {view === "topics" && selectedChapter && (
        <TopicList
          chapterId={selectedChapter._id}
          chapterName={selectedChapter.title}
          onViewChapters={() => setView("chapters")}
          onAddTopic={handleShowAddTopic}
          onEditTopic={handleShowEditTopic}
        />
      )}

      {(view === "add-topic" || view === "edit-topic") && selectedChapter && (
        <AddOrEditTopicForm
          chapterId={selectedChapter._id}
          chapterName={selectedChapter.title}
          topic={editingTopic}
          onCancel={() => handleViewBack("topics")}
          onSaved={() => handleViewBack("topics")}
        />
      )}

      {view === "edit-chapter" && editingChapter && (
        <EditChapter
          chapterId={editingChapter._id}
          onCancel={() => handleViewBack("chapters")}
          onUpdated={() => handleViewBack("chapters")}
        />
      )}

      {view === "course-level-manager" && (
        <CourseLevelManager onBack={handleShowCourseList} />
      )}

      {view === "group-pricing" && (
        <GroupPricingTab onBack={handleShowCourseList} />
      )}
    </>
  );
}
