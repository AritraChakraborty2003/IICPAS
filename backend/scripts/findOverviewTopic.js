import mongoose from "mongoose";
import dotenv from "dotenv";
import Course from "../models/Content/Course.js";
import Chapter from "../models/Content/Chapter.js";
import Topic from "../models/Content/Topic.js";

dotenv.config({ quiet: true });

const COURSE_ID = "6883d69cdac73382a0aa2b15";

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const course = await Course.findById(COURSE_ID).populate({
    path: "chapters",
    populate: { path: "topics" },
  });

  if (!course) {
    console.log("Course not found");
    return;
  }

  console.log("Course:", course.title);
  for (const chapter of course.chapters) {
    console.log(`  Chapter: ${chapter.title} (${chapter._id})`);
    for (const topic of chapter.topics) {
      console.log(
        `    Topic: ${topic.title} (${topic._id}) introVideo="${topic.introVideo || ""}"`
      );
    }
  }
}

main()
  .catch((err) => console.error(err))
  .finally(() => mongoose.disconnect());
