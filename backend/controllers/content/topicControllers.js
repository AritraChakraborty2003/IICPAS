import Topic from "../../models/Content/Topic.js";
import Chapter from "../../models/Content/Chapter.js";

export const getTopicsByChapter = async (req, res) => {
  const topics = await Topic.find({
    _id: { $in: (await Chapter.findById(req.params.chapterId)).topics },
  }).populate("quiz");
  res.json(topics);
};

export const getTopic = async (req, res) => {
  const topic = await Topic.findById(req.params.id).populate("quiz");
  if (!topic) return res.status(404).json({ error: "Topic not found" });
  res.json(topic);
};

export const createTopic = async (req, res) => {
  const { publishAt, ...rest } = req.body;
  const topic = new Topic({
    ...rest,
    ...(publishAt ? { publishAt: new Date(publishAt) } : {}),
  });
  await topic.save();
  // Add topic to chapter
  await Chapter.findByIdAndUpdate(req.params.chapterId, {
    $push: { topics: topic._id },
  });
  res.status(201).json(topic);
};

export const updateTopic = async (req, res) => {
  const { publishAt, ...rest } = req.body;
  const updateData = {
    ...rest,
    updatedAt: new Date(),
  };
  if (publishAt !== undefined) {
    updateData.publishAt = new Date(publishAt);
  }
  const topic = await Topic.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
  });
  if (!topic) return res.status(404).json({ error: "Topic not found" });
  res.json(topic);
};

export const deleteTopic = async (req, res) => {
  const topic = await Topic.findByIdAndDelete(req.params.id);
  if (!topic) return res.status(404).json({ error: "Topic not found" });
  // Remove topic from any chapter
  await Chapter.updateMany({}, { $pull: { topics: topic._id } });
  res.json({ message: "Topic deleted" });
};
