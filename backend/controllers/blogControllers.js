import Blog from "../models/Blogs.js";

// CREATE BLOG
export const createBlog = async (req, res) => {
  try {
    const { title, author, content, status, videoUrl } = req.body;
    let imageUrl = "";
    if (req.file) {
      imageUrl = req.file.path.replace(/\\/g, "/");
    }
    const blog = new Blog({
      title,
      author,
      content,
      imageUrl,
      videoUrl,
      status: status || "active",
    });
    await blog.save();
    res.status(201).json(blog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ALL BLOGS
export const getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET SINGLE BLOG BY ID
export const getBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: "Not found" });
    res.json(blog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE BLOG
export const updateBlog = async (req, res) => {
  try {
    const { title, author, content, status, videoUrl } = req.body;
    let imageUrl;
    if (req.file) {
      imageUrl = req.file.path.replace(/\\/g, "/");
    }
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: "Not found" });
    if (title) blog.title = title;
    if (author) blog.author = author;
    if (content) blog.content = content;
    if (typeof status !== "undefined") blog.status = status;
    if (imageUrl) blog.imageUrl = imageUrl;
    if (typeof videoUrl !== "undefined") blog.videoUrl = videoUrl;
    await blog.save();
    res.json(blog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE BLOG
export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// TOGGLE STATUS (active <-> inactive)
export const toggleBlogStatus = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: "Not found" });
    blog.status = blog.status === "active" ? "inactive" : "active";
    await blog.save();
    res.json({ status: blog.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
