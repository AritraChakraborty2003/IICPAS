"use client";
import { getApiBase } from "@/lib/apiBase";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Modal,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import * as XLSX from "xlsx";

const API = getApiBase();

export default function RevisionTestsTab() {
  const [revisionTests, setRevisionTests] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTests, setSelectedTests] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    course: "",
    level: "",
    title: "",
    timeLimit: "",
    difficulty: "Normal",
  });
  const [questions, setQuestions] = useState([]);
  const [excelFile, setExcelFile] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTest, setPreviewTest] = useState(null);

  const levels = ["Level 1", "Level 2", "Pro"];
  const difficulties = ["Normal", "Hard", "Hardest"];

  useEffect(() => {
    fetchRevisionTests();
    fetchCourses();
  }, []);

  const fetchRevisionTests = async () => {
    try {
      const response = await fetch(`${API}/revision-tests`);
      const data = await response.json();
      if (data.success) {
        setRevisionTests(data.data);
      }
    } catch (error) {
      console.error("Error fetching revision tests:", error);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch(`${API}/courses`);
      const data = await response.json();
      if (Array.isArray(data)) {
        // Filter active courses and format them
        const activeCourses = data
          .filter((course) => course.status === "Active")
          .map((course) => ({
            _id: course._id,
            title: course.title,
            category: course.category,
            level: course.level,
          }));
        setCourses(activeCourses);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setExcelFile(file);
      parseExcelFile(file);
    }
  };

  const parseExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Skip header row and parse questions
        const parsedQuestions = data
          .slice(1)
          .map((row, index) => {
            if (row.length >= 5) {
              return {
                question: row[0] || "",
                options: [
                  row[1] || "",
                  row[2] || "",
                  row[3] || "",
                  row[4] || "",
                ],
                correctAnswer: row[5] || "",
                explanation: row[6] || "",
              };
            }
            return null;
          })
          .filter((q) => q && q.question);

        setQuestions(parsedQuestions);
        Swal.fire(
          "Success",
          `${parsedQuestions.length} questions parsed successfully!`,
          "success"
        );
      } catch (error) {
        console.error("Error parsing Excel:", error);
        Swal.fire("Error", "Failed to parse Excel file", "error");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !form.course ||
      !form.level ||
      !form.title ||
      !form.timeLimit ||
      questions.length === 0
    ) {
      Swal.fire(
        "Error",
        "Please fill all fields and upload questions",
        "error"
      );
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        timeLimit: parseInt(form.timeLimit),
        questions,
      };

      const url = editId
        ? `${API}/revision-tests/${editId}`
        : `${API}/revision-tests`;

      const method = editId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        Swal.fire(
          "Success",
          editId ? "Revision test updated!" : "Revision test created!",
          "success"
        );
        resetForm();
        fetchRevisionTests();
      } else {
        Swal.fire(
          "Error",
          data.message || "Failed to save revision test",
          "error"
        );
      }
    } catch (error) {
      console.error("Error saving revision test:", error);
      Swal.fire("Error", "Failed to save revision test", "error");
    }
    setLoading(false);
  };

  const handleEdit = (test) => {
    setEditId(test._id);
    setForm({
      course: test.course._id,
      level: test.level,
      title: test.title,
      timeLimit: test.timeLimit.toString(),
      difficulty: test.difficulty || "Normal",
    });
    setQuestions(test.questions);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete this revision test?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
    });

    if (confirm.isConfirmed) {
      try {
        const response = await fetch(`${API}/revision-tests/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          Swal.fire(
            "Deleted!",
            "Revision test deleted successfully.",
            "success"
          );
          fetchRevisionTests();
        }
      } catch (error) {
        Swal.fire("Error", "Failed to delete revision test", "error");
      }
    }
  };

  const toggleStatus = async (id) => {
    try {
      const response = await fetch(`${API}/revision-tests/toggle/${id}`, {
        method: "PATCH",
      });
      if (response.ok) {
        fetchRevisionTests();
      }
    } catch (error) {
      Swal.fire("Error", "Failed to toggle status", "error");
    }
  };

  const handlePreview = (test) => {
    setPreviewTest(test);
    setPreviewOpen(true);
  };

  const resetForm = () => {
    setForm({
      course: "",
      level: "",
      title: "",
      timeLimit: "",
      difficulty: "Normal",
    });
    setQuestions([]);
    setExcelFile(null);
    setEditId(null);
    setModalOpen(false);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedTests(revisionTests.map((t) => t._id));
    } else {
      setSelectedTests([]);
    }
  };

  const handleSelectTest = (testId) => {
    setSelectedTests((prev) =>
      prev.includes(testId)
        ? prev.filter((id) => id !== testId)
        : [...prev, testId]
    );
  };

  const exportToCSV = () => {
    if (selectedTests.length === 0) {
      Swal.fire("Warning", "Please select tests to export", "warning");
      return;
    }

    const selectedData = revisionTests.filter((t) =>
      selectedTests.includes(t._id)
    );

    const headers = [
      "Course",
      "Level",
      "Difficulty",
      "Title",
      "Time Limit",
      "Questions",
      "Status",
    ];
    const csvContent = [
      headers.join(","),
      ...selectedData.map((test) =>
        [
          `"${test.course.title}"`,
          `"${test.level}"`,
          `"${test.difficulty || "Normal"}"`,
          `"${test.title}"`,
          test.timeLimit,
          test.totalQuestions,
          test.status,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revision-tests-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    Swal.fire("Success", "Tests exported successfully!", "success");
  };

  const bulkDelete = async () => {
    if (selectedTests.length === 0) {
      Swal.fire("Warning", "Please select tests to delete", "warning");
      return;
    }

    const confirm = await Swal.fire({
      title: `Delete ${selectedTests.length} test(s)?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
    });

    if (confirm.isConfirmed) {
      try {
        const deletePromises = selectedTests.map((id) =>
          fetch(`${API}/revision-tests/${id}`, { method: "DELETE" })
        );

        await Promise.all(deletePromises);
        await fetchRevisionTests();
        setSelectedTests([]);
        Swal.fire(
          "Deleted!",
          `${selectedTests.length} test(s) deleted.`,
          "success"
        );
      } catch (error) {
        Swal.fire("Error", "Failed to delete some tests", "error");
      }
    }
  };

  return (
    <div className="w-[75vw] mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl lg:text-3xl font-bold">Revision Tests</h1>
        <div className="flex items-center gap-4">
          {selectedTests.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={exportToCSV}
                sx={{ borderColor: "#0f265c", color: "#0f265c" }}
              >
                Export ({selectedTests.length})
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={bulkDelete}
              >
                Delete ({selectedTests.length})
              </Button>
            </div>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              bgcolor: "#0f265c",
              borderRadius: 2,
              fontWeight: 600,
              px: 3,
            }}
            onClick={() => setModalOpen(true)}
          >
            Add Revision Test
          </Button>
        </div>
      </div>

      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f5f5f5" }}>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={
                    selectedTests.length === revisionTests.length &&
                    revisionTests.length > 0
                  }
                  indeterminate={
                    selectedTests.length > 0 &&
                    selectedTests.length < revisionTests.length
                  }
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Course</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Level</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Difficulty</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Title</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Time Limit</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Questions</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {revisionTests.map((test) => (
              <TableRow key={test._id} hover>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedTests.includes(test._id)}
                    onChange={() => handleSelectTest(test._id)}
                  />
                </TableCell>
                <TableCell>{test.course?.title}</TableCell>
                <TableCell>{test.level}</TableCell>
                <TableCell>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      backgroundColor:
                        test.difficulty === "Normal"
                          ? "#e3f2fd"
                          : test.difficulty === "Hard"
                          ? "#fff3e0"
                          : "#ffebee",
                      color:
                        test.difficulty === "Normal"
                          ? "#1976d2"
                          : test.difficulty === "Hard"
                          ? "#f57c00"
                          : "#d32f2f",
                    }}
                  >
                    {test.difficulty || "Normal"}
                  </span>
                </TableCell>
                <TableCell>{test.title}</TableCell>
                <TableCell>{test.timeLimit} min</TableCell>
                <TableCell>{test.totalQuestions}</TableCell>
                <TableCell>
                  <Switch
                    checked={test.status === "active"}
                    onChange={() => toggleStatus(test._id)}
                    color="success"
                    size="small"
                  />
                  <span className="ml-2 text-xs">
                    {test.status === "active" ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Tooltip title="View">
                      <IconButton
                        size="small"
                        onClick={() => handlePreview(test)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEdit(test)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(test._id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={resetForm}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            maxHeight: "90vh",
            overflow: "auto",
          }}
        >
          <Typography variant="h6" component="h2" mb={3}>
            {editId ? "Edit Revision Test" : "Add Revision Test"}
          </Typography>

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <FormControl fullWidth>
                <InputLabel>Course</InputLabel>
                <Select
                  value={form.course}
                  onChange={(e) => setForm({ ...form, course: e.target.value })}
                  label="Course"
                >
                  {courses.map((course) => (
                    <MenuItem key={course._id} value={course._id}>
                      {course.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Level</InputLabel>
                <Select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  label="Level"
                >
                  {levels.map((level) => (
                    <MenuItem key={level} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={form.difficulty}
                  onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                  label="Difficulty"
                >
                  {difficulties.map((difficulty) => (
                    <MenuItem key={difficulty} value={difficulty}>
                      {difficulty}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />

              <TextField
                fullWidth
                label="Time Limit (minutes)"
                type="number"
                value={form.timeLimit}
                onChange={(e) =>
                  setForm({ ...form, timeLimit: e.target.value })
                }
              />

              <div>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                  id="excel-upload"
                />
                <label htmlFor="excel-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadFileIcon />}
                    fullWidth
                  >
                    Upload Excel File
                  </Button>
                </label>
                {excelFile && (
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    File: {excelFile.name}
                  </Typography>
                )}
              </div>

              {questions.length > 0 && (
                <div>
                  <Typography variant="subtitle1" mb={2}>
                    Parsed Questions ({questions.length})
                  </Typography>
                  <Box
                    sx={{
                      maxHeight: 200,
                      overflow: "auto",
                      border: 1,
                      borderColor: "grey.300",
                      p: 2,
                    }}
                  >
                    {questions.map((q, index) => (
                      <Typography key={index} variant="body2" mb={1}>
                        {index + 1}. {q.question}
                      </Typography>
                    ))}
                  </Box>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{ bgcolor: "#0f265c", flex: 1 }}
                >
                  {loading ? (
                    <CircularProgress size={24} />
                  ) : editId ? (
                    "Update"
                  ) : (
                    "Create"
                  )}
                </Button>
                <Button variant="outlined" onClick={resetForm} sx={{ flex: 1 }}>
                  Cancel
                </Button>
              </div>
            </Stack>
          </form>
        </Box>
      </Modal>

      {/* Preview Modal */}
      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 800,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            maxHeight: "90vh",
            overflow: "auto",
          }}
        >
          {previewTest && (
            <>
              <Typography variant="h6" component="h2" mb={3}>
                {previewTest.title}
              </Typography>

              <Typography variant="body1" mb={2}>
                <strong>Course:</strong> {previewTest.course?.title}
              </Typography>
              <Typography variant="body1" mb={2}>
                <strong>Level:</strong> {previewTest.level}
              </Typography>
              <Typography variant="body1" mb={2}>
                <strong>Difficulty:</strong> {previewTest.difficulty || "Normal"}
              </Typography>
              <Typography variant="body1" mb={2}>
                <strong>Time Limit:</strong> {previewTest.timeLimit} minutes
              </Typography>
              <Typography variant="body1" mb={2}>
                <strong>Questions:</strong> {previewTest.totalQuestions}
              </Typography>

              <Typography variant="h6" mt={3} mb={2}>
                Questions Preview:
              </Typography>

              {previewTest.questions.map((q, index) => (
                <Box
                  key={index}
                  sx={{
                    mb: 3,
                    p: 2,
                    border: 1,
                    borderColor: "grey.300",
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="subtitle1" mb={1}>
                    {index + 1}. {q.question}
                  </Typography>
                  <Box sx={{ ml: 2 }}>
                    {q.options.map((option, optIndex) => (
                      <Typography
                        key={optIndex}
                        variant="body2"
                        color="text.secondary"
                      >
                        {String.fromCharCode(65 + optIndex)}. {option}
                      </Typography>
                    ))}
                  </Box>
                  <Typography variant="body2" color="success.main" mt={1}>
                    <strong>Correct Answer:</strong> {q.correctAnswer}
                  </Typography>
                </Box>
              ))}

              <Button
                variant="contained"
                onClick={() => setPreviewOpen(false)}
                sx={{ bgcolor: "#0f265c" }}
              >
                Close
              </Button>
            </>
          )}
        </Box>
      </Modal>
    </div>
  );
}
