/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";

import OptimizedJoditEditor from "./OptimizedJoditEditor";
import { getApiBase } from "../../lib/apiBase";

const API_BASE = getApiBase();

interface AssignmentBuilderProps {
  chapterId: string;
  chapterName: string;
  onBack: () => void;
  editingItem?: any | null; // Add edit mode support
}

interface Task {
  id: string;
  taskName: string;
  instructions: string;
}

interface Content {
  id: string;
  type: "video" | "text" | "rich";
  videoBase64?: string;
  textContent?: string;
  richTextContent?: string;
}

interface Simulation {
  id: string;
  type: string;
  title: string;
  description: string;
  config: any;
  isOptional: boolean;
  // Accounting simulation specific fields
  statement?: string;
  correctEntries?: Array<{
    id: string;
    date: string;
    type: string;
    particulars: string;
    debit: string;
    credit: string;
  }>;
  accountTypes?: string[];
  accountOptions?: string[];
}

interface QuestionSet {
  id: string;
  name: string;
  description: string;
  excelBase64?: string;
  questions: Array<{
    id: string;
    question: string;
    option1: string;
    option2: string;
    option3: string;
    option4: string;
    correct: string;
  }>;
}

export default function AssignmentBuilder({
  chapterId,
  chapterName,
  onBack,
  editingItem,
}: AssignmentBuilderProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [content, setContent] = useState<Content[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [activeTab, setActiveTab] = useState<
    "tasks" | "content" | "simulations" | "questionSets"
  >("content");
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form with editing data if available
  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title || "");
      setDescription(editingItem.description || "");
      setTasks(editingItem.tasks || []);
      setContent(editingItem.content || []);
      setSimulations(editingItem.simulations || []);
      setQuestionSets(editingItem.questionSets || []);
    }
  }, [editingItem]);

  const addTask = () => {
    const newTask: Task = {
      id: Date.now().toString(),
      taskName: "",
      instructions: "",
    };
    setTasks([...tasks, newTask]);
  };

  const updateTask = (id: string, field: keyof Task, value: string) => {
    setTasks(
      tasks.map((task) => (task.id === id ? { ...task, [field]: value } : task))
    );
  };

  const removeTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const addContent = () => {
    const newContent: Content = {
      id: Date.now().toString(),
      type: "rich", // Default to rich text for better editing
      richTextContent: "",
    };
    setContent([...content, newContent]);
  };

  const updateContent = (id: string, field: keyof Content, value: any) => {
    setContent(
      content.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const removeContent = (id: string) => {
    setContent(content.filter((item) => item.id !== id));
  };

  const addSimulation = () => {
    const newSimulation: Simulation = {
      id: Date.now().toString(),
      type: "accounting",
      title: "",
      description: "",
      config: {
        accountTypes: ["Debit", "Credit"],
        accountOptions: ["Cash A/c", "Bank A/c", "Capital A/c"],
        columns: ["Date", "Type", "Particulars", "Debit", "Credit"],
      },
      isOptional: true,
      statement: "",
      correctEntries: [
        {
          id: "1",
          date: "",
          type: "",
          particulars: "",
          debit: "",
          credit: "",
        },
      ],
      accountTypes: ["Debit", "Credit"],
      accountOptions: [
        "Cash A/c",
        "Bank A/c",
        "Furniture A/c",
        "Capital A/c",
        "Purchase A/c",
        "Sales A/c",
        "Creditors A/c",
        "Debtors A/c",
      ],
    };
    setSimulations([...simulations, newSimulation]);
  };

  const updateSimulation = (
    id: string,
    field: keyof Simulation,
    value: any
  ) => {
    setSimulations(
      simulations.map((sim) =>
        sim.id === id ? { ...sim, [field]: value } : sim
      )
    );
  };

  const removeSimulation = (id: string) => {
    setSimulations(simulations.filter((sim) => sim.id !== id));
  };

  const addQuestionSet = () => {
    const newQuestionSet: QuestionSet = {
      id: Date.now().toString(),
      name: "",
      description: "",
      questions: [
        {
          id: Date.now().toString(),
          question: "",
          option1: "",
          option2: "",
          option3: "",
          option4: "",
          correct: "",
        },
      ],
    };
    setQuestionSets([...questionSets, newQuestionSet]);
  };

  const addQuestion = (questionSetId: string) => {
    const newQuestion = {
      id: Date.now().toString(),
      question: "",
      option1: "",
      option2: "",
      option3: "",
      option4: "",
      correct: "",
    };
    const questionSet = questionSets.find((qs) => qs.id === questionSetId);
    if (questionSet) {
      const updatedQuestions = [...(questionSet.questions || []), newQuestion];
      updateQuestionSet(questionSetId, "questions", updatedQuestions);
    }
  };

  const updateQuestionSet = (
    id: string,
    field: keyof QuestionSet,
    value: any
  ) => {
    setQuestionSets(
      questionSets.map((qs) => (qs.id === id ? { ...qs, [field]: value } : qs))
    );
  };

  const removeQuestionSet = (id: string) => {
    setQuestionSets(questionSets.filter((qs) => qs.id !== id));
  };

  // Excel parsing function
  const parseExcelFile = async (file: File, questionSetId: string) => {
    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;

        // For now, we'll use a simple CSV-like approach
        // In production, you might want to use a library like xlsx
        const text = await file.text();
        const lines = text.split("\n");
        const questions: Array<{
          id: string;
          question: string;
          option1: string;
          option2: string;
          option3: string;
          option4: string;
          correct: string;
        }> = [];

        // Skip header row and parse each line
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line) {
            const columns = line
              .split(",")
              .map((col) => col.trim().replace(/^"|"$/g, ""));
            if (columns.length >= 6) {
              questions.push({
                id: Date.now().toString() + i,
                question: columns[0] || "",
                option1: columns[1] || "",
                option2: columns[2] || "",
                option3: columns[3] || "",
                option4: columns[4] || "",
                correct: columns[5] || "",
              });
            }
          }
        }

        // Update the question set with parsed questions
        updateQuestionSet(questionSetId, "questions", questions);
        updateQuestionSet(questionSetId, "excelBase64", base64);

        alert(
          `Successfully parsed ${questions.length} questions from Excel file!`
        );
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error parsing Excel file:", error);
      alert(
        "Error parsing Excel file. Please ensure it's in the correct format."
      );
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Validate required fields
      if (!title.trim()) {
        alert("Please enter an assignment title");
        return;
      }

      if (!description.trim()) {
        alert("Please enter an assignment description");
        return;
      }

      // Validate simulations
      for (const sim of simulations) {
        if (sim.type === "accounting") {
          if (!sim.statement?.trim()) {
            alert(
              `Please enter a problem statement for simulation: ${sim.title}`
            );
            return;
          }
          if (!sim.correctEntries || sim.correctEntries.length === 0) {
            alert(
              `Please add at least one correct journal entry for simulation: ${sim.title}`
            );
            return;
          }
          // Validate each entry has required fields
          for (const entry of sim.correctEntries) {
            if (
              !entry.date ||
              !entry.type ||
              !entry.particulars ||
              (entry.type === "Debit" && !entry.debit) ||
              (entry.type === "Credit" && !entry.credit)
            ) {
              alert(
                `Please complete all fields for journal entries in simulation: ${sim.title}`
              );
              return;
            }
          }
        }
      }

      // Validate question sets
      for (const qs of questionSets) {
        if (qs.questions && qs.questions.length > 0) {
          for (const q of qs.questions) {
            if (
              !q.question.trim() ||
              !q.option1.trim() ||
              !q.option2.trim() ||
              !q.option3.trim() ||
              !q.option4.trim() ||
              !q.correct.trim()
            ) {
              alert(
                `Please complete all fields for questions in question set: ${qs.name}`
              );
              return;
            }
          }
        }
      }

      // Prepare assignment data
      const assignmentData = {
        title: title.trim(),
        description: description.trim(),
        chapterId,
        tasks: tasks.map((task, index) => ({
          taskName: task.taskName.trim(),
          instructions: task.instructions.trim(),
          order: index,
        })),
        content: content.map((item, index) => ({
          type: item.type,
          videoBase64: item.videoBase64,
          textContent: item.textContent,
          richTextContent: item.richTextContent,
          order: index,
        })),
        simulations: simulations.map((sim, index) => ({
          type: sim.type,
          title: sim.title.trim(),
          description: sim.description.trim(),
          config: sim.config,
          isOptional: sim.isOptional,
          order: index,
          // Include accounting simulation specific fields
          statement: sim.statement,
          correctEntries: sim.correctEntries,
          accountTypes: sim.accountTypes,
          accountOptions: sim.accountOptions,
        })),
        questionSets: questionSets.map((qs, index) => ({
          name: qs.name.trim(),
          description: qs.description.trim(),
          excelBase64: qs.excelBase64,
          questions: qs.questions.map((q) => ({
            id: q.id,
            question: q.question.trim(),
            option1: q.option1.trim(),
            option2: q.option2.trim(),
            option3: q.option3.trim(),
            option4: q.option4.trim(),
            correct: q.correct.trim(),
          })),
          order: index,
        })),
      };

      // Save to backend
      let response;
      if (editingItem) {
        // Update existing assignment
        response = await axios.put(
          `${API_BASE}/assignments/${editingItem._id}`,
          assignmentData
        );
      } else {
        // Create new assignment
        response = await axios.post(`${API_BASE}/assignments`, assignmentData);
      }

      if (response.data.success) {
        alert(
          editingItem
            ? "Assignment updated successfully!"
            : "Assignment saved successfully!"
        );
        // Reset form or redirect
        onBack();
      } else {
        alert(
          `Failed to ${editingItem ? "update" : "save"} assignment: ` +
            response.data.error
        );
      }
    } catch (error: unknown) {
      console.error("Error saving assignment:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const responseError = (error as any)?.response?.data?.error;
      alert(
        `Error ${editingItem ? "updating" : "saving"} assignment: ` +
          (responseError || errorMessage)
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {editingItem ? "Edit Assignment" : "Create New Assignment"} for
            &lsquo;{chapterName}&lsquo;
          </h2>
          <p className="text-gray-600">
            {editingItem
              ? "Update your assignment with tasks, content, simulations, and questions"
              : "Build your assignment with tasks, content, simulations, and questions"}
          </p>
        </div>
        <button
          onClick={onBack}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
        >
          ← Back to Topics
        </button>
      </div>

      {/* Basic Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignment Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter assignment title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={3}
              placeholder="Enter assignment description"
            />
          </div>
        </div>
      </div>

      {/* Component Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("tasks")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "tasks"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Tasks ({tasks.length})
            </button>
            <button
              onClick={() => setActiveTab("content")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "content"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Content ({content.length})
            </button>
            <button
              onClick={() => setActiveTab("simulations")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "simulations"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Simulations ({simulations.length})
            </button>
            <button
              onClick={() => setActiveTab("questionSets")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "questionSets"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Question Sets ({questionSets.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Tasks Tab */}
          {activeTab === "tasks" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-800">
                  Assignment Tasks (Pink Banners)
                </h4>
                <button
                  onClick={addTask}
                  className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
                >
                  + Add Task
                </button>
              </div>
              <div className="space-y-4">
                {tasks.map((task, index) => (
                  <div
                    key={task.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h5 className="text-md font-medium text-gray-800">
                        Task {index + 1}
                      </h5>
                      <button
                        onClick={() => removeTask(task.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Task Name *
                        </label>
                        <input
                          type="text"
                          value={task.taskName}
                          onChange={(e) =>
                            updateTask(task.id, "taskName", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="e.g., Complete journal entries"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Instructions *
                        </label>
                        <textarea
                          value={task.instructions}
                          onChange={(e) =>
                            updateTask(task.id, "instructions", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          rows={3}
                          placeholder="Enter task instructions"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No tasks added yet. Click &quot;Add Task&quot; to get
                    started.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Content Tab with Jodit Editor */}
          {activeTab === "content" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-800">
                  Assignment Content
                </h4>
                <button
                  onClick={addContent}
                  className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
                >
                  + Add Content
                </button>
              </div>
              <div className="space-y-4">
                {content.map((item, index) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h5 className="text-md font-medium text-gray-800">
                        Content {index + 1}
                      </h5>
                      <button
                        onClick={() => removeContent(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Content Type
                        </label>
                        <select
                          value={item.type}
                          onChange={(e) =>
                            updateContent(item.id, "type", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="text">Text</option>
                          <option value="rich">Rich Text (Jodit Editor)</option>
                          <option value="video">Video</option>
                        </select>
                      </div>

                      {item.type === "text" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Text Content
                          </label>
                          <textarea
                            value={item.textContent || ""}
                            onChange={(e) =>
                              updateContent(
                                item.id,
                                "textContent",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            rows={6}
                            placeholder="Enter your text content..."
                          />
                        </div>
                      )}

                      {item.type === "rich" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rich Text Content (Jodit Editor)
                          </label>
                          <div
                            className="border border-gray-300 rounded-md overflow-hidden"
                            style={{ minHeight: "400px" }}
                          >
                            <OptimizedJoditEditor
                              value={item.richTextContent || ""}
                              onChange={(newContent: string) =>
                                updateContent(
                                  item.id,
                                  "richTextContent",
                                  newContent
                                )
                              }
                              placeholder="Start writing your assignment content..."
                              height={400}
                              className="border border-gray-300 rounded-md"
                            />
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <p className="text-xs text-gray-500">
                              Use the toolbar above to format your content with
                              bold, italic, lists, tables, and more.
                            </p>
                            <p className="text-xs text-gray-400 italic">
                              POWERED BY JODIT
                            </p>
                          </div>
                        </div>
                      )}

                      {item.type === "video" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Video Upload
                          </label>
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  const base64 = reader.result as string;
                                  updateContent(item.id, "videoBase64", base64);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                          {item.videoBase64 && (
                            <div className="mt-2">
                              <video controls className="w-full max-w-md">
                                <source
                                  src={item.videoBase64}
                                  type="video/mp4"
                                />
                                Your browser does not support the video tag.
                              </video>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {content.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No content added yet. Click &quot;Add Content&quot; to get
                    started.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Simulations Tab */}
          {activeTab === "simulations" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-800">
                  Practice Simulations (Optional)
                </h4>
                <button
                  onClick={addSimulation}
                  className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
                >
                  + Add Simulation
                </button>
              </div>
              <div className="space-y-4">
                {simulations.map((sim, index) => (
                  <div
                    key={sim.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h5 className="text-md font-medium text-gray-800">
                        Simulation {index + 1}
                      </h5>
                      <button
                        onClick={() => removeSimulation(sim.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Simulation Type
                        </label>
                        <select
                          value={sim.type}
                          onChange={(e) =>
                            updateSimulation(sim.id, "type", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="accounting">Accounting</option>
                          <option value="financial">Financial</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Title
                        </label>
                        <input
                          type="text"
                          value={sim.title}
                          onChange={(e) =>
                            updateSimulation(sim.id, "title", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Enter simulation title"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={sim.description}
                        onChange={(e) =>
                          updateSimulation(
                            sim.id,
                            "description",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        rows={3}
                        placeholder="Enter simulation description"
                      />
                    </div>

                    {/* Accounting Simulation Specific Fields */}
                    {sim.type === "accounting" && (
                      <>
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Problem Statement *
                          </label>
                          <textarea
                            value={sim.statement || ""}
                            onChange={(e) =>
                              updateSimulation(
                                sim.id,
                                "statement",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            rows={4}
                            placeholder="Enter the accounting problem statement (e.g., 'On 15th January, Mr. A started business with cash Rs. 50,000...')"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            This statement will be displayed to students in the
                            AccountingExperimentCard component
                          </p>
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Correct Journal Entries
                          </label>
                          <div className="space-y-3">
                            {(sim.correctEntries || []).map((entry, index) => (
                              <div
                                key={entry.id}
                                className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                              >
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-gray-700">
                                    Entry {index + 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedEntries =
                                        sim.correctEntries?.filter(
                                          (e) => e.id !== entry.id
                                        ) || [];
                                      updateSimulation(
                                        sim.id,
                                        "correctEntries",
                                        updatedEntries
                                      );
                                    }}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                  >
                                    Remove
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                  <input
                                    type="text"
                                    placeholder="Date"
                                    value={entry.date}
                                    onChange={(e) => {
                                      const updatedEntries =
                                        sim.correctEntries?.map((ent) =>
                                          ent.id === entry.id
                                            ? { ...ent, date: e.target.value }
                                            : ent
                                        ) || [];
                                      updateSimulation(
                                        sim.id,
                                        "correctEntries",
                                        updatedEntries
                                      );
                                    }}
                                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                  <select
                                    value={entry.type}
                                    onChange={(e) => {
                                      const updatedEntries =
                                        sim.correctEntries?.map((ent) =>
                                          ent.id === entry.id
                                            ? { ...ent, type: e.target.value }
                                            : ent
                                        ) || [];
                                      updateSimulation(
                                        sim.id,
                                        "correctEntries",
                                        updatedEntries
                                      );
                                    }}
                                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                                  >
                                    <option value="">Type</option>
                                    <option value="Debit">Debit</option>
                                    <option value="Credit">Credit</option>
                                  </select>
                                  <input
                                    type="text"
                                    placeholder="Particulars"
                                    value={entry.particulars}
                                    onChange={(e) => {
                                      const updatedEntries =
                                        sim.correctEntries?.map((ent) =>
                                          ent.id === entry.id
                                            ? {
                                                ...ent,
                                                particulars: e.target.value,
                                              }
                                            : ent
                                        ) || [];
                                      updateSimulation(
                                        sim.id,
                                        "correctEntries",
                                        updatedEntries
                                      );
                                    }}
                                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                  <input
                                    type="number"
                                    placeholder="Debit"
                                    value={entry.debit}
                                    onChange={(e) => {
                                      const updatedEntries =
                                        sim.correctEntries?.map((ent) =>
                                          ent.id === entry.id
                                            ? { ...ent, debit: e.target.value }
                                            : ent
                                        ) || [];
                                      updateSimulation(
                                        sim.id,
                                        "correctEntries",
                                        updatedEntries
                                      );
                                    }}
                                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                                    disabled={entry.type === "Credit"}
                                  />
                                  <input
                                    type="number"
                                    placeholder="Credit"
                                    value={entry.credit}
                                    onChange={(e) => {
                                      const updatedEntries =
                                        sim.correctEntries?.map((ent) =>
                                          ent.id === entry.id
                                            ? { ...ent, credit: e.target.value }
                                            : ent
                                        ) || [];
                                      updateSimulation(
                                        sim.id,
                                        "correctEntries",
                                        updatedEntries
                                      );
                                    }}
                                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                                    disabled={entry.type === "Debit"}
                                  />
                                </div>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                const newEntry = {
                                  id: Date.now().toString(),
                                  date: "",
                                  type: "",
                                  particulars: "",
                                  debit: "",
                                  credit: "",
                                };
                                const updatedEntries = [
                                  ...(sim.correctEntries || []),
                                  newEntry,
                                ];
                                updateSimulation(
                                  sim.id,
                                  "correctEntries",
                                  updatedEntries
                                );
                              }}
                              className="bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600"
                            >
                              + Add Entry
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                    <div className="mt-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={sim.isOptional}
                          onChange={(e) =>
                            updateSimulation(
                              sim.id,
                              "isOptional",
                              e.target.checked
                            )
                          }
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">
                          Optional (students can skip)
                        </span>
                      </label>
                    </div>
                  </div>
                ))}
                {simulations.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No simulations added yet. Click &ldquo;Add Simulation&rdquo;
                    to get started.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Question Sets Tab */}
          {activeTab === "questionSets" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-800">
                  Assignment Questions (Excel Upload)
                </h4>
                <button
                  onClick={addQuestionSet}
                  className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
                >
                  + Add Question Set
                </button>
              </div>
              <div className="space-y-4">
                {questionSets.map((qs, index) => (
                  <div
                    key={qs.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h5 className="text-md font-medium text-gray-800">
                        Question Set {index + 1}
                      </h5>
                      <button
                        onClick={() => removeQuestionSet(qs.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Question Set Name
                        </label>
                        <input
                          type="text"
                          value={qs.name}
                          onChange={(e) =>
                            updateQuestionSet(qs.id, "name", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Enter question set name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <input
                          type="text"
                          value={qs.description}
                          onChange={(e) =>
                            updateQuestionSet(
                              qs.id,
                              "description",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Enter description"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Excel File Upload (CSV format)
                      </label>
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              parseExcelFile(file, qs.id);
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <p className="text-xs text-gray-500">
                          Expected CSV format:
                          Question,Option1,Option2,Option3,Option4,CorrectAnswer
                        </p>
                        <div className="flex gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => addQuestion(qs.id)}
                            className="bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600"
                          >
                            + Add Question Manually
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const sampleData =
                                "Question,Option1,Option2,Option3,Option4,CorrectAnswer\nWhat is the capital of France?,Paris,London,Berlin,Madrid,Paris\nWhat is 2+2?,3,4,5,6,4";
                              const blob = new Blob([sampleData], {
                                type: "text/csv",
                              });
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = "sample_questions.csv";
                              a.click();
                              window.URL.revokeObjectURL(url);
                            }}
                            className="bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600"
                          >
                            Download Sample CSV
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Display Parsed Questions */}
                    {qs.questions && qs.questions.length > 0 && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Parsed Questions ({qs.questions.length})
                        </label>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {qs.questions.map((question, qIndex) => (
                            <div
                              key={question.id}
                              className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-medium text-gray-700">
                                  Question {qIndex + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedQuestions =
                                      qs.questions.filter(
                                        (q) => q.id !== question.id
                                      );
                                    updateQuestionSet(
                                      qs.id,
                                      "questions",
                                      updatedQuestions
                                    );
                                  }}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  placeholder="Question"
                                  value={question.question}
                                  onChange={(e) => {
                                    const updatedQuestions = qs.questions.map(
                                      (q) =>
                                        q.id === question.id
                                          ? { ...q, question: e.target.value }
                                          : q
                                    );
                                    updateQuestionSet(
                                      qs.id,
                                      "questions",
                                      updatedQuestions
                                    );
                                  }}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    placeholder="Option 1"
                                    value={question.option1}
                                    onChange={(e) => {
                                      const updatedQuestions = qs.questions.map(
                                        (q) =>
                                          q.id === question.id
                                            ? { ...q, option1: e.target.value }
                                            : q
                                      );
                                      updateQuestionSet(
                                        qs.id,
                                        "questions",
                                        updatedQuestions
                                      );
                                    }}
                                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Option 2"
                                    value={question.option2}
                                    onChange={(e) => {
                                      const updatedQuestions = qs.questions.map(
                                        (q) =>
                                          q.id === question.id
                                            ? { ...q, option2: e.target.value }
                                            : q
                                      );
                                      updateQuestionSet(
                                        qs.id,
                                        "questions",
                                        updatedQuestions
                                      );
                                    }}
                                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Option 3"
                                    value={question.option3}
                                    onChange={(e) => {
                                      const updatedQuestions = qs.questions.map(
                                        (q) =>
                                          q.id === question.id
                                            ? { ...q, option3: e.target.value }
                                            : q
                                      );
                                      updateQuestionSet(
                                        qs.id,
                                        "questions",
                                        updatedQuestions
                                      );
                                    }}
                                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Option 4"
                                    value={question.option4}
                                    onChange={(e) => {
                                      const updatedQuestions = qs.questions.map(
                                        (q) =>
                                          q.id === question.id
                                            ? { ...q, option4: e.target.value }
                                            : q
                                      );
                                      updateQuestionSet(
                                        qs.id,
                                        "questions",
                                        updatedQuestions
                                      );
                                    }}
                                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                </div>
                                <select
                                  value={question.correct}
                                  onChange={(e) => {
                                    const updatedQuestions = qs.questions.map(
                                      (q) =>
                                        q.id === question.id
                                          ? { ...q, correct: e.target.value }
                                          : q
                                    );
                                    updateQuestionSet(
                                      qs.id,
                                      "questions",
                                      updatedQuestions
                                    );
                                  }}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                >
                                  <option value="">
                                    Select Correct Answer
                                  </option>
                                  <option value={question.option1}>
                                    {question.option1 || "Option 1"}
                                  </option>
                                  <option value={question.option2}>
                                    {question.option2 || "Option 2"}
                                  </option>
                                  <option value={question.option3}>
                                    {question.option3 || "Option 3"}
                                  </option>
                                  <option value={question.option4}>
                                    {question.option4 || "Option 4"}
                                  </option>
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {questionSets.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No question sets added yet. Click &quot;Add Question
                    Set&quot; to get started.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={onBack}
          className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors"
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Assignment"}
        </button>
      </div>
    </div>
  );
}
