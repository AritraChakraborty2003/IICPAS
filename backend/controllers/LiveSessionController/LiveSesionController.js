import LiveSession from "../../models/LiveSession/LiveSession.js";
import Student from "../../models/Students.js";
import Booking from "../../models/Booking.js";

export const createLiveSession = async (req, res) => {
  try {
    // Ensure imageUrl is set to thumbnail if not provided
    const sessionData = {
      ...req.body,
      imageUrl: req.body.imageUrl || req.body.thumbnail,
    };

    const session = await LiveSession.create(sessionData);
    res.status(201).json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getAllLiveSessions = async (req, res) => {
  try {
    const sessions = await LiveSession.find().populate(
      "enrolledStudents",
      "name email"
    );
    const sessionIds = sessions.map((session) => session._id);
    const paidBookings = await Booking.aggregate([
      {
        $match: {
          liveSessionId: { $in: sessionIds },
          paymentStatus: { $in: ["paid", "free"] },
          status: { $in: ["booked", "approved"] },
        },
      },
      {
        $group: {
          _id: "$liveSessionId",
          total: { $sum: 1 },
        },
      },
    ]);
    const bookingCountMap = new Map(
      paidBookings.map((entry) => [String(entry._id), Number(entry.total || 0)])
    );

    // Transform sessions to include enrollment status for authenticated user
    const transformedSessions = sessions.map((session) => {
      const sessionObj = session.toObject();

      // Calculate dynamic status based on date/time
      const now = new Date();
      const sessionDate = new Date(session.date);
      const [startTime, endTime] = session.time
        ? session.time.split(" - ")
        : ["10:00", "12:00"];

      const sessionStart = new Date(sessionDate);
      const [startHour, startMinute] = startTime.split(":").map(Number);
      sessionStart.setHours(startHour, startMinute, 0, 0);

      const sessionEnd = new Date(sessionDate);
      const [endHour, endMinute] = endTime.split(":").map(Number);
      sessionEnd.setHours(endHour, endMinute, 0, 0);

      // Calculate duration in minutes
      const durationMs = sessionEnd.getTime() - sessionStart.getTime();
      const durationMinutes = Math.round(durationMs / (1000 * 60));

      let dynamicStatus = session.status;

      // Only calculate dynamic status if session is active in database
      if (session.status === "active") {
        if (now < sessionStart) {
          dynamicStatus = "upcoming";
        } else if (now >= sessionStart && now <= sessionEnd) {
          dynamicStatus = "live";
        } else if (now > sessionEnd) {
          dynamicStatus = "completed";
        }
      }
      // If session is inactive in database, keep it as inactive

      // Handle image URLs - prioritize uploaded images, then fallback to client images
      let finalImageUrl = session.imageUrl || session.thumbnail;

      // If it's an uploaded image (starts with /uploads), use it as is
      // If it's a client image (starts with /images), use it as is
      // If it's empty, use a default fallback
      if (!finalImageUrl) {
        finalImageUrl = "/images/live-class.jpg"; // Default fallback
      }

      return {
        ...sessionObj,
        status: dynamicStatus,
        duration: durationMinutes, // Use calculated duration
        enrolledCount: Math.max(
          session.enrolledStudents.length,
          bookingCountMap.get(String(session._id)) || 0
        ),
        imageUrl: finalImageUrl,
      };
    });

    res.status(200).json(transformedSessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getLiveSessionById = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id).populate(
      "enrolledStudents",
      "name email"
    );
    if (!session) return res.status(404).json({ error: "Session not found" });

    // Calculate dynamic status
    const now = new Date();
    const sessionDate = new Date(session.date);
    const [startTime, endTime] = session.time
      ? session.time.split(" - ")
      : ["10:00", "12:00"];

    const sessionStart = new Date(sessionDate);
    const [startHour, startMinute] = startTime.split(":").map(Number);
    sessionStart.setHours(startHour, startMinute, 0, 0);

    const sessionEnd = new Date(sessionDate);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    sessionEnd.setHours(endHour, endMinute, 0, 0);

    // Calculate duration in minutes
    const durationMs = sessionEnd.getTime() - sessionStart.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));

    let dynamicStatus = session.status;

    // Only calculate dynamic status if session is active in database
    if (session.status === "active") {
      if (now < sessionStart) {
        dynamicStatus = "upcoming";
      } else if (now >= sessionStart && now <= sessionEnd) {
        dynamicStatus = "live";
      } else if (now > sessionEnd) {
        dynamicStatus = "completed";
      }
    }
    // If session is inactive in database, keep it as inactive

    const sessionObj = session.toObject();
    const paidBookingCount = await Booking.countDocuments({
      liveSessionId: session._id,
      paymentStatus: { $in: ["paid", "free"] },
      status: { $in: ["booked", "approved"] },
    });
    // Handle image URLs - prioritize uploaded images, then fallback to client images
    let finalImageUrl = session.imageUrl || session.thumbnail;

    // If it's an uploaded image (starts with /uploads), use it as is
    // If it's a client image (starts with /images), use it as is
    // If it's empty, use a default fallback
    if (!finalImageUrl) {
      finalImageUrl = "/images/live-class.jpg"; // Default fallback
    }

    res.status(200).json({
      ...sessionObj,
      status: dynamicStatus,
      duration: durationMinutes, // Use calculated duration
      enrolledCount: Math.max(session.enrolledStudents.length, paidBookingCount),
      imageUrl: finalImageUrl,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const enrollInLiveSession = async (req, res) => {
  try {
    const { studentId } = req.body;
    const sessionId = req.params.id;

    if (!studentId) {
      return res.status(400).json({ error: "Student ID is required" });
    }

    // Check if session exists
    const session = await LiveSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Check if already enrolled
    if (session.enrolledStudents.includes(studentId)) {
      return res
        .status(400)
        .json({ error: "Student already enrolled in this session" });
    }

    // Check if session is full
    if (session.enrolledStudents.length >= session.maxParticipants) {
      return res.status(400).json({ error: "Session is full" });
    }

    // Enroll student
    session.enrolledStudents.push(studentId);
    session.enrolledCount = session.enrolledStudents.length;
    await session.save();

    // Add session to student's enrolled sessions
    if (!student.enrolledLiveSessions.includes(sessionId)) {
      student.enrolledLiveSessions.push(sessionId);
      await student.save();
    }

    // Emit real-time update to all clients in the session room
    if (global.io) {
      global.io.to(`session-${sessionId}`).emit("enrollment-update", {
        sessionId: session._id,
        enrolledCount: session.enrolledCount,
        maxParticipants: session.maxParticipants,
        studentName: student.name,
      });
    }

    res.status(200).json({
      message: "Successfully enrolled in live session",
      session: {
        _id: session._id,
        title: session.title,
        enrolledCount: session.enrolledCount,
        maxParticipants: session.maxParticipants,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const unenrollFromLiveSession = async (req, res) => {
  try {
    const { studentId } = req.body;
    const sessionId = req.params.id;

    if (!studentId) {
      return res.status(400).json({ error: "Student ID is required" });
    }

    // Check if session exists
    const session = await LiveSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Check if enrolled
    if (!session.enrolledStudents.includes(studentId)) {
      return res
        .status(400)
        .json({ error: "Student is not enrolled in this session" });
    }

    // Unenroll student
    session.enrolledStudents = session.enrolledStudents.filter(
      (id) => id.toString() !== studentId
    );
    session.enrolledCount = session.enrolledStudents.length;
    await session.save();

    // Remove session from student's enrolled sessions
    student.enrolledLiveSessions = student.enrolledLiveSessions.filter(
      (id) => id.toString() !== sessionId
    );
    await student.save();

    res.status(200).json({
      message: "Successfully unenrolled from live session",
      session: {
        _id: session._id,
        title: session.title,
        enrolledCount: session.enrolledCount,
        maxParticipants: session.maxParticipants,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateLiveSession = async (req, res) => {
  try {
    // Ensure imageUrl is set to thumbnail if not provided
    const updateData = {
      ...req.body,
      imageUrl: req.body.imageUrl || req.body.thumbnail,
    };

    const session = await LiveSession.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.status(200).json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteLiveSession = async (req, res) => {
  try {
    const deleted = await LiveSession.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Session not found" });
    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const toggleStatus = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    // Toggle between active and inactive in database
    // The dynamic status calculation will handle upcoming/live/completed
    session.status = session.status === "active" ? "inactive" : "active";
    await session.save();

    // Return the session with updated status
    res.status(200).json({
      message: "Session status updated successfully",
      session: {
        _id: session._id,
        title: session.title,
        status: session.status,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
