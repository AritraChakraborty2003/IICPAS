import express from "express";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
const router = express.Router();

// DELETE application
router.delete("/applications/:id", async (req, res) => {
  try {
    await Application.findByIdAndDelete(req.params.id);
    res.json({ message: "Application deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new Application for a Job
router.post("/:id/applications", async (req, res) => {
  try {
    const { name, email, phone, resumeLink } = req.body;
    const application = await Application.create({
      jobId: req.params.id,
      name,
      email,
      phone,
      resumeLink,
    });
    res.status(201).json(application);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Job
router.post("/", async (req, res) => {
  try {
    const job = await Job.create(req.body);
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Jobs
router.get("/", async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Single Job
router.get("/:id", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Job
router.put("/:id", async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Job
router.delete("/:id", async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: "Job deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Applications for a Job
router.get("/:id/applications", async (req, res) => {
  try {
    const applications = await Application.find({ jobId: req.params.id });
    res.json(applications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Shortlist Application
router.put("/applications/:id/shortlist", async (req, res) => {
  try {
    const app = await Application.findByIdAndUpdate(
      req.params.id,
      { shortlisted: true },
      { new: true }
    );
    res.json(app);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/applications/:id/shortlist", async (req, res) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ error: "Application not found" });

    // ✅ If already shortlisted
    if (app.shortlisted) {
      return res.status(200).json({ message: "Already shortlisted." });
    }
    app.shortlisted = true;
    await app.save();

    const canSendEmail = process.env.EMAIL_USER && process.env.EMAIL_PASS && app.email;

    if (!canSendEmail) {
      return res.json({
        message: "Application shortlisted successfully.",
        emailSent: false,
      });
    }

    try {
      const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: app.email,
        subject: "Shortlisted for Job",
        html: `
          <p>Dear ${app.name},</p>
          <p>Congratulations!</p>
          <p>You’ve been <strong>shortlisted</strong> for the job you applied to at IICPA Institute.</p>
          <p>Our team will be in touch with the next steps soon.</p>
          <br/>
          <p>Regards,<br/>IICPA HR Team</p>
        `,
      });

      return res.json({
        message: "Application shortlisted and email sent successfully.",
        emailSent: true,
      });
    } catch (emailError) {
      console.error("Shortlist email error:", emailError);
      return res.json({
        message: "Application shortlisted successfully, but email could not be sent.",
        emailSent: false,
      });
    }
  } catch (err) {
    console.error("Shortlist error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
