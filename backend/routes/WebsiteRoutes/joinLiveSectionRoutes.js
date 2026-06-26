import express from "express";
import JoinLiveSection from "../../models/Website/JoinLiveSection.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { isAdmin } from "../../middleware/isAdmin.js";

const router = express.Router();

// Get current Join Live Section content (public endpoint)
router.get("/", async (req, res) => {
  try {
    const sectionData = await JoinLiveSection.findOne({ isActive: true }).sort({ createdAt: -1 });
    if (!sectionData) {
      // Return default content if no content found
      return res.json({
        badgeText: "🎓 Join Live",
        title: "Join Our Live Class, \\nStart Your Online",
        titleHighlight: "Journey",
        description: "Experience interactive learning with our expert instructors in real-time sessions",
        liveTagText: "LIVE · 01:30:56",
        buttonText: "Join Live Class Now",
        image: {
          url: "/images/live-class.jpg",
          alt: "Live Class Session"
        }
      });
    }
    res.json(sectionData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all Join Live Section entries (admin only)
router.get("/all", requireAuth, isAdmin, async (req, res) => {
  try {
    const entries = await JoinLiveSection.find().sort({ createdAt: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new Join Live Section content (admin only)
router.post("/", requireAuth, isAdmin, async (req, res) => {
  try {
    // Deactivate all existing entries
    await JoinLiveSection.updateMany({}, { isActive: false });
    
    // Create new entry
    const newEntry = await JoinLiveSection.create(req.body);
    res.status(201).json(newEntry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Join Live Section content (admin only)
router.put("/:id", requireAuth, isAdmin, async (req, res) => {
  try {
    const updatedEntry = await JoinLiveSection.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedEntry) {
      return res.status(404).json({ error: "Join Live Section content not found" });
    }
    
    res.json(updatedEntry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Activate Join Live Section content (admin only)
router.put("/activate/:id", requireAuth, isAdmin, async (req, res) => {
  try {
    // Deactivate all entries first
    await JoinLiveSection.updateMany({}, { isActive: false });
    
    // Activate the selected entry
    const activatedEntry = await JoinLiveSection.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );
    
    if (!activatedEntry) {
      return res.status(404).json({ error: "Join Live Section content not found" });
    }
    
    res.json(activatedEntry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Join Live Section content (admin only)
router.delete("/:id", requireAuth, isAdmin, async (req, res) => {
  try {
    const deletedEntry = await JoinLiveSection.findByIdAndDelete(req.params.id);
    
    if (!deletedEntry) {
      return res.status(404).json({ error: "Join Live Section content not found" });
    }
    
    res.json({ message: "Join Live Section content deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
