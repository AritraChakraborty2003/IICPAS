import express from "express";
import DemoDigitalHub from "../../models/Website/DemoDigitalHub.js";

const router = express.Router();

const getOrCreateDemoDigitalHub = async () => {
  let demoDigitalHub = await DemoDigitalHub.findOne().sort({
    updatedAt: -1,
  });

  if (!demoDigitalHub) {
    demoDigitalHub = new DemoDigitalHub();
    await demoDigitalHub.save();
  }

  return demoDigitalHub;
};

// Get demo digital hub data
router.get("/", async (req, res) => {
  try {
    const demoDigitalHub = await getOrCreateDemoDigitalHub();
    res.json(demoDigitalHub);
  } catch (error) {
    console.error("Error fetching demo digital hub:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update demo digital hub data
router.put("/", async (req, res) => {
  try {
    let demoDigitalHub = await DemoDigitalHub.findOne().sort({
      updatedAt: -1,
    });

    if (!demoDigitalHub) {
      demoDigitalHub = new DemoDigitalHub();
    }

    Object.assign(demoDigitalHub, req.body);
    await demoDigitalHub.save();

    res.json(demoDigitalHub);
  } catch (error) {
    console.error("Error updating demo digital hub:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create demo digital hub data
router.post("/", async (req, res) => {
  try {
    let demoDigitalHub = await DemoDigitalHub.findOne().sort({
      updatedAt: -1,
    });

    if (!demoDigitalHub) {
      demoDigitalHub = new DemoDigitalHub(req.body);
    } else {
      Object.assign(demoDigitalHub, req.body);
    }

    await demoDigitalHub.save();

    res.status(201).json(demoDigitalHub);
  } catch (error) {
    console.error("Error creating demo digital hub:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete demo digital hub data
router.delete("/", async (req, res) => {
  try {
    await DemoDigitalHub.deleteMany();
    res.json({ message: "Demo digital hub deleted successfully" });
  } catch (error) {
    console.error("Error deleting demo digital hub:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
