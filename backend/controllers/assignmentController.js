import Assignment from "../models/Assignment.js";

// Create new assignment
export const createAssignment = async (req, res) => {
  try {
    const {
      title,
      description,
      chapterId,
      tasks,
      content,
      simulations,
      questionSets,
    } = req.body;

    const assignment = new Assignment({
      title,
      description,
      chapterId,
      tasks: tasks || [],
      content: content || [],
      simulations: simulations || [],
      questionSets: (questionSets || []).map((qs) => ({
        name: qs.name,
        description: qs.description,
        excelBase64: qs.excelBase64,
        totalQuestions: qs.totalQuestions,
        timeLimit: qs.timeLimit,
        passingScore: qs.passingScore,
        order: qs.order,
        questions: (qs.questions || []).map((q) => ({
          question: q.question,
          options: Array.isArray(q.options) ? q.options : [],
          correctAnswer: q.correctAnswer,
          context: q.context,
          type: q.type,
          explanation: q.explanation,
        })),
      })),
    });

    await assignment.save();
    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all assignments
export const getAllAssignments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build query
    let query = { isActive: true };

    // Add search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination and sorting
    const assignments = await Assignment.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("chapterId", "title chapterNumber")
      .lean();

    // Get total count for pagination
    const total = await Assignment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: assignments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get assignments by status
export const getAssignmentsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Validate status
    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be "active" or "inactive"',
      });
    }

    // Build query
    const isActive = status === "active";
    let query = { isActive };

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination and sorting
    const assignments = await Assignment.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("chapterId", "title chapterNumber")
      .lean();

    // Get total count for pagination
    const total = await Assignment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: assignments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all assignments for a chapter
export const getAssignmentsByChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const assignments = await Assignment.find({
      chapterId,
      isActive: true,
    }).sort({ order: 1 });
    res.status(200).json({ success: true, data: assignments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single assignment
export const getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res
        .status(404)
        .json({ success: false, error: "Assignment not found" });
    }
    res.status(200).json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update assignment
export const updateAssignment = async (req, res) => {
  try {
    const { title, description, chapterId, tasks, content, simulations, questionSets } = req.body;

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, error: "Assignment not found" });
    }

    if (title !== undefined) assignment.title = title;
    if (description !== undefined) assignment.description = description;
    if (chapterId !== undefined) assignment.chapterId = chapterId;
    if (tasks !== undefined) assignment.tasks = tasks;
    if (content !== undefined) assignment.content = content;
    if (simulations !== undefined) assignment.simulations = simulations;
    if (questionSets !== undefined) {
      assignment.questionSets = questionSets.map((qs) => ({
        name: qs.name,
        description: qs.description,
        excelBase64: qs.excelBase64,
        totalQuestions: qs.totalQuestions,
        timeLimit: qs.timeLimit,
        passingScore: qs.passingScore,
        order: qs.order,
        questions: (qs.questions || []).map((q) => ({
          question: q.question,
          options: Array.isArray(q.options) ? q.options : [],
          correctAnswer: q.correctAnswer,
          context: q.context,
          type: q.type,
          explanation: q.explanation,
        })),
      }));
    }

    await assignment.save();
    res.status(200).json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete assignment
export const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) {
      return res
        .status(500)
        .json({ success: false, error: "Assignment not found" });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add task to assignment
export const addTask = async (req, res) => {
  try {
    const { taskName, instructions } = req.body;
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res
        .status(404)
        .json({ success: false, error: "Assignment not found" });
    }

    const newTask = {
      taskName,
      instructions,
      order: assignment.tasks.length,
    };

    assignment.tasks.push(newTask);
    await assignment.save();

    res.status(200).json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add content to assignment
export const addContent = async (req, res) => {
  try {
    const { type, videoBase64, textContent, richTextContent } = req.body;
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res
        .status(404)
        .json({ success: false, error: "Assignment not found" });
    }

    const newContent = {
      type,
      videoBase64,
      textContent,
      richTextContent,
      order: assignment.content.length,
    };

    assignment.content.push(newContent);
    await assignment.save();

    res.status(200).json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add simulation to assignment
export const addSimulation = async (req, res) => {
  try {
    const { type, title, description, config, isOptional } = req.body;
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res
        .status(404)
        .json({ success: false, error: "Assignment not found" });
    }

    const newSimulation = {
      type,
      title,
      description,
      config,
      isOptional,
      order: assignment.simulations.length,
    };

    assignment.simulations.push(newSimulation);
    await assignment.save();

    res.status(200).json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add question set to assignment
export const addQuestionSet = async (req, res) => {
  try {
    const {
      name,
      description,
      excelBase64,
      questions,
      totalQuestions,
      timeLimit,
      passingScore,
    } = req.body;
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res
        .status(500)
        .json({ success: false, error: "Assignment not found" });
    }

    const newQuestionSet = {
      name,
      description,
      excelBase64,
      questions,
      totalQuestions,
      timeLimit,
      passingScore,
      order: assignment.questionSets.length,
    };

    assignment.questionSets.push(newQuestionSet);
    await assignment.save();

    res.status(200).json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get assignments with advanced filtering
export const getAssignmentsWithFilter = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      startDate,
      endDate,
      hasVideo,
      hasSimulation,
      hasQuestions,
      minTasks,
      maxTasks,
    } = req.query;

    // Build query
    let query = { isActive: true };

    // Add search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Date range filtering
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Content type filtering
    if (hasVideo === "true") {
      query["content.type"] = { $in: ["video", "rich"] };
    }

    if (hasSimulation === "true") {
      query["simulations.0"] = { $exists: true };
    }

    if (hasQuestions === "true") {
      query["questionSets.0"] = { $exists: true };
    }

    // Task count filtering
    if (minTasks) {
      query["tasks.0"] = { $exists: true };
    }

    if (maxTasks) {
      query["tasks"] = { $not: { $size: { $gt: parseInt(maxTasks) } } };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination and sorting
    const assignments = await Assignment.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("chapterId", "title chapterNumber")
      .lean();

    // Get total count for pagination
    const total = await Assignment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: assignments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
      filters: {
        search,
        startDate,
        endDate,
        hasVideo,
        hasSimulation,
        hasQuestions,
        minTasks,
        maxTasks,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
