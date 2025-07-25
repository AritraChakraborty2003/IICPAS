import mongoose from "mongoose";

const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  descr: { type: String, required: true },
  link: { type: String, required: true },
});

const News = mongoose.model("News", newsSchema);
export default News;
