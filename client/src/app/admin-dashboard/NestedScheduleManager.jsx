import React, { useState } from "react";
import { ChevronDown, ChevronRight, Clock, Trash2, Calendar as CalendarIcon } from "lucide-react";

export function NestedScheduleManager({ courseLocks, sortedCourses, courseHierarchy, onSelectScheduleItem, removeCourseLock, toggleExpanded, expandedItems }) {
  return (
    <div className="mt-4 space-y-4">
      {courseLocks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500">
          Select one or more courses on the left to configure lock windows.
        </div>
      ) : (
        courseLocks.map((lock) => {
          const course = sortedCourses.find(
            (item) => String(item._id || item.courseId || item.id).trim() === String(lock.courseId)
          );
          const isExpanded = expandedItems[`course-${lock.courseId}`];
          const chapters = courseHierarchy[lock.courseId] || [];

          return (
            <div key={lock.courseId} className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <button type="button" onClick={() => toggleExpanded(`course-${lock.courseId}`)} className="p-1 rounded bg-white shadow-sm hover:bg-gray-100">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  <div className="flex-1">
                    <h5 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] uppercase">Course</span>
                      {course?.title || course?.name || lock.courseId}
                    </h5>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      {lock.start_time && lock.end_time ? (
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                          <Clock className="h-3 w-3" /> {new Date(lock.start_time).toLocaleDateString()} - {new Date(lock.end_time).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-600">
                          <Clock className="h-3 w-3" /> No schedule
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectScheduleItem({ id: lock.courseId, type: 'course', title: course?.title || lock.courseId, start_time: lock.start_time, end_time: lock.end_time, parentIds: {} })}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100"
                    title="Edit course time"
                  >
                    <CalendarIcon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeCourseLock(lock.courseId)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm transition hover:bg-red-50 hover:text-red-600"
                    title="Remove course"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {isExpanded && chapters.length > 0 && (
                <div className="mt-4 ml-6 space-y-3 border-l-2 border-gray-200 pl-4">
                  {chapters.map((chapter) => {
                    const chapterLock = (lock.chapters || []).find(c => String(c.chapterId) === String(chapter._id)) || {};
                    const isChapterExpanded = expandedItems[`chapter-${chapter._id}`];
                    const topics = chapter.topics || [];

                    return (
                      <div key={chapter._id} className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 flex-1">
                            {topics.length > 0 ? (
                              <button type="button" onClick={() => toggleExpanded(`chapter-${chapter._id}`)} className="p-1 rounded hover:bg-gray-50">
                                {isChapterExpanded ? <ChevronDown className="h-3.5 w-3.5 text-gray-400" /> : <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
                              </button>
                            ) : <div className="w-5" />}
                            <div className="flex-1">
                              <h6 className="text-xs font-semibold text-gray-800 flex items-center gap-2">
                                <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[9px] uppercase">Chapter</span>
                                {chapter.title || chapter.name}
                              </h6>
                              <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500">
                                {chapterLock.start_time && chapterLock.end_time ? (
                                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                    <Clock className="h-3 w-3" /> {new Date(chapterLock.start_time).toLocaleDateString()} - {new Date(chapterLock.end_time).toLocaleDateString()}
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> Default (Course)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => onSelectScheduleItem({ id: chapter._id, type: 'chapter', title: chapter.title, start_time: chapterLock.start_time, end_time: chapterLock.end_time, parentIds: { courseId: lock.courseId } })}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100"
                            title="Edit chapter time"
                          >
                            <CalendarIcon className="h-3 w-3" />
                          </button>
                        </div>

                        {isChapterExpanded && topics.length > 0 && (
                          <div className="mt-3 ml-6 space-y-2 border-l border-gray-100 pl-3">
                            {topics.map((topic) => {
                              const topicLock = (chapterLock.topics || []).find(t => String(t.topicId) === String(topic._id)) || {};
                              return (
                                <div key={topic._id} className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-gray-50">
                                  <div className="flex-1">
                                    <h6 className="text-[11px] font-medium text-gray-700 flex items-center gap-1.5">
                                      <span className="bg-amber-100 text-amber-700 px-1 py-0.5 rounded text-[8px] uppercase">Topic</span>
                                      {topic.title}
                                    </h6>
                                    {topicLock.start_time && topicLock.end_time && (
                                      <span className="flex items-center gap-1 text-emerald-600 font-medium text-[10px] mt-0.5">
                                        <Clock className="h-2.5 w-2.5" /> {new Date(topicLock.start_time).toLocaleDateString()} - {new Date(topicLock.end_time).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => onSelectScheduleItem({ id: topic._id, type: 'topic', title: topic.title, start_time: topicLock.start_time, end_time: topicLock.end_time, parentIds: { courseId: lock.courseId, chapterId: chapter._id } })}
                                    className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100"
                                    title="Edit topic time"
                                  >
                                    <CalendarIcon className="h-3 w-3" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
