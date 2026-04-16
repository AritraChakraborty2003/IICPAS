export const TOPIC_LESSON_POPULATE = [
  { path: "quiz" },
  { path: "lessons.liveSessionId" },
];

export const POPULATE_TOPICS_WITH_LESSONS = {
  path: "topics",
  populate: TOPIC_LESSON_POPULATE,
};
