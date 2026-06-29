import fs from "fs";
import csv from "csv-parser";
import BlogContent from "../models/BlogContent.js";

// @desc    Get all blog contents
// @route   GET /api/blog-content
// @access  Private (API Key)
export const getBlogContents = async (req, res) => {
  try {
    const blogContents = await BlogContent.find({});
    res.status(200).json({ success: true, count: blogContents.length, data: blogContents });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Upload CSV and insert blog contents
// @route   POST /api/blog-content
// @access  Private (API Key)
export const uploadBlogContent = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "Please upload a CSV file" });
  }

  const results = [];
  
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (data) => {
      // Clean keys in case of BOM or whitespace
      const cleanData = {};
      for (const key in data) {
        const cleanKey = key.trim().replace(/^\uFEFF/, "");
        cleanData[cleanKey] = data[key];
      }
      results.push(cleanData);
    })
    .on("end", async () => {
      try {
        const docsToInsert = results.map((row) => ({
          name: row.name || row.Name,
          ref: row.ref || row.Ref,
          topic: row.topic || row.Topic,
          date: row.date || row.Date,
          category: row.category || row.Category,
          year: row.year || row.Year,
          status: row.status || row.Status || "unpublished",
        }));

        // Filter out empty rows without name
        const validDocs = docsToInsert.filter(doc => doc.name);

        if (validDocs.length === 0) {
          fs.unlinkSync(req.file.path);
          return res.status(400).json({ success: false, message: "No valid rows found to insert" });
        }

        // insertMany with ordered: false to skip duplicates
        const inserted = await BlogContent.insertMany(validDocs, { ordered: false }).catch(err => {
          // If some documents failed due to duplicate keys, insertMany throws an error but still inserts the rest
          if (err.code === 11000) {
            return err.insertedDocs || [];
          }
          throw err;
        });

        fs.unlinkSync(req.file.path);
        res.status(201).json({
          success: true,
          message: "Data processed",
          insertedCount: Array.isArray(inserted) ? inserted.length : 0,
        });
      } catch (error) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ success: false, message: "Error processing data", error: error.message });
      }
    })
    .on("error", (error) => {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(500).json({ success: false, message: "Error parsing CSV file", error: error.message });
    });
};

// @desc    Update blog content
// @route   PATCH /api/blog-content/:name
// @access  Private (API Key)
export const updateBlogContent = async (req, res) => {
  try {
    const { name } = req.params;
    
    const blogContent = await BlogContent.findOneAndUpdate(
      { name },
      req.body,
      { new: true, runValidators: true }
    );

    if (!blogContent) {
      return res.status(404).json({ success: false, message: `No blog content found with name ${name}` });
    }

    res.status(200).json({ success: true, data: blogContent });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Delete blog content
// @route   DELETE /api/blog-content/:name
// @access  Private (API Key)
export const deleteBlogContent = async (req, res) => {
  try {
    const { name } = req.params;

    const blogContent = await BlogContent.findOneAndDelete({ name });

    if (!blogContent) {
      return res.status(404).json({ success: false, message: `No blog content found with name ${name}` });
    }

    res.status(200).json({ success: true, message: "Blog content deleted successfully", data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Create a single blog content
// @route   POST /api/blog-content/single
// @access  Private (API Key)
export const createSingleBlogContent = async (req, res) => {
  try {
    const { name, ref, topic, date, category, year, status } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Please provide a name" });
    }

    const blogContent = await BlogContent.create({
      name,
      ref,
      topic,
      date,
      category,
      year,
      status: status || "unpublished",
    });

    res.status(201).json({ success: true, data: blogContent });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Blog content with this name already exists" });
    }
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Delete all blog contents
// @route   DELETE /api/blog-content/delete-all
// @access  Private (API Key)
export const deleteAllBlogContents = async (req, res) => {
  try {
    const result = await BlogContent.deleteMany({});
    res.status(200).json({ 
      success: true, 
      message: "All blog contents deleted successfully", 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Get the first unpublished blog content
// @route   GET /api/blog-content/first-unpublished
// @access  Private (API Key)
export const getFirstUnpublishedBlogContent = async (req, res) => {
  try {
    const blogContent = await BlogContent.findOne({ status: "unpublished" }).sort({ createdAt: 1 });
    
    if (!blogContent) {
      return res.status(404).json({ success: false, message: "No unpublished blog content found" });
    }

    res.status(200).json({ success: true, data: blogContent });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
