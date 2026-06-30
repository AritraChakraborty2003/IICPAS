import mongoose from "mongoose";
import dotenv from "dotenv";
import Course from "../models/Content/Course.js";
import Chapter from "../models/Content/Chapter.js";
import Topic from "../models/Content/Topic.js";

dotenv.config({ quiet: true });

const COURSE_ID = "6883d69cdac73382a0aa2b15";

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const topic = await Topic.create({
    title: "Overview",
    content: "<p>Test seed content</p>",
  });

  const chapter = await Chapter.create({
    title: "Introduction to Basic Accounting",
    topics: [topic._id],
  });

  await Course.create({
    _id: new mongoose.Types.ObjectId(COURSE_ID),
    category: "Accounting",
    title: "Accounting and Tally Certification Course (TEST SEED)",
    slug: "accounting-and-tally-certification-course",
    price: 1,
    chapters: [chapter._id],
  });

  console.log("Seeded course:", COURSE_ID, "chapter:", chapter._id, "topic:", topic._id);
}

main()
  .catch((err) => console.error(err))
  .finally(() => mongoose.disconnect());
