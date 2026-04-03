"use client";
import { getApiBase } from "@/lib/apiBase";
import { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button, Box, IconButton, Tooltip, Chip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AddIcon from "@mui/icons-material/Add";
import { showDeleteConfirmation, showSuccess, showError } from "@/utils/sweetAlert";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";

const API_BASE = getApiBase();

export default function CourseCategoryExcelGrid() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [form, setForm] = useState({
    category: "",
    status: "Active",
    title: "",
    keywords: "",
    description: "",
  });
  const { hasPermission } = useAuth();

  // Fetch data
  const loadRows = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/categories`);
      setRows(
        res.data.map((row, idx) => ({
          ...row,
          id: row._id || idx + 1, // DataGrid needs id property
        }))
      );
    } catch {
      setRows([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!showForm) loadRows();
  }, [showForm]);

  // Form handlers
  const handleFormChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleAdd = () => {
    setEditRow(null);
    setForm({
      category: "",
      status: "Active",
      title: "",
      keywords: "",
      description: "",
    });
    setShowForm(true);
  };

  const handleEdit = (row) => {
    setEditRow(row);
    setForm({
      category: row.category || "",
      status: row.status || "Active",
      title: row.title || "",
      keywords: row.keywords || "",
      description: row.description || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const confirmed = await showDeleteConfirmation("category");
    
    if (confirmed) {
      try {
        await axios.delete(`${API_BASE}/categories/${id}`);
        loadRows();
        showSuccess("Deleted!", "Category has been deleted.");
      } catch (error) {
        console.error("Error deleting category:", error);
        showError("Error!", "Failed to delete category.");
      }
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
      await axios.put(`${API_BASE}/categories/${id}`, { status: newStatus });
      loadRows();
      showSuccess("Status Updated!", `Category is now ${newStatus}.`);
    } catch (error) {
      console.error("Error toggling status:", error);
      showError("Error!", "Failed to update status.");
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editRow) {
        await axios.put(`${API_BASE}/categories/${editRow._id}`, form);
        showSuccess("Updated!", "Category updated successfully.");
      } else {
        await axios.post(`${API_BASE}/categories`, form);
        showSuccess("Created!", "Category created successfully.");
      }
      setShowForm(false);
      setEditRow(null);
      setForm({
        category: "",
        status: "Active",
        title: "",
        keywords: "",
        description: "",
      });
      loadRows();
    } catch (error) {
      console.error("Error saving category:", error);
      showError("Error!", "Failed to save category.");
    }
  };

  // Grid columns
  const columns = [
    {
      field: "category",
      headerName: "Category Name",
      flex: 1,
      headerAlign: "center",
      align: "center",
      minWidth: 200,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.7,
      headerAlign: "center",
      align: "center",
      minWidth: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === "Active" ? "success" : "default"}
          variant="outlined"
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: "0.75rem",
            borderRadius: "12px",
            borderWidth: "2px",
            "&.MuiChip-colorSuccess": {
              backgroundColor: "#ecfdf5",
              borderColor: "#10b981",
              color: "#059669",
            },
            "&.MuiChip-colorDefault": {
              backgroundColor: "#fef2f2",
              borderColor: "#ef4444",
              color: "#dc2626",
            },
          }}
        />
      ),
    },
    {
      field: "actions",
      headerName: "Action",
      flex: 1.2,
      sortable: false,
      headerAlign: "center",
      align: "center",
      minWidth: 200,
      renderCell: (params) => (
        <Box
          display="flex"
          gap={1}
          justifyContent="center"
          alignItems="center"
          sx={{ height: "100%" }}
        >
          {hasPermission("course-category", "update") && (
            <Tooltip title="Edit Category" arrow>
              <IconButton
                onClick={() => handleEdit(params.row)}
                size="small"
                sx={{
                  bgcolor: "#e3f2fd",
                  color: "#1976d2",
                  "&:hover": {
                    bgcolor: "#bbdefb",
                  },
                  width: 32,
                  height: 32,
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          {hasPermission("course-category", "active") && (
            <Tooltip title={`${params.row.status === "Active" ? "Deactivate" : "Activate"} Category`} arrow>
              <IconButton
                onClick={() => handleToggleStatus(params.row._id, params.row.status)}
                size="small"
                sx={{
                  bgcolor: params.row.status === "Active" ? "#e8f5e8" : "#fff3e0",
                  color: params.row.status === "Active" ? "#2e7d32" : "#f57c00",
                  "&:hover": {
                    bgcolor: params.row.status === "Active" ? "#c8e6c9" : "#ffe0b2",
                  },
                  width: 32,
                  height: 32,
                }}
              >
                {params.row.status === "Active" ? (
                  <CancelIcon fontSize="small" />
                ) : (
                  <CheckCircleIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          )}
          
          {hasPermission("course-category", "delete") && (
            <Tooltip title="Delete Category" arrow>
              <IconButton
                onClick={() => handleDelete(params.row._id)}
                size="small"
                sx={{
                  bgcolor: "#ffebee",
                  color: "#d32f2f",
                  "&:hover": {
                    bgcolor: "#ffcdd2",
                  },
                  width: 32,
                  height: 32,
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ width: "100%", maxWidth: "1200px", mx: "auto", mt: 4, px: 2 }}>
      {!showForm ? (
        <>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={3}
          >
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                margin: 0,
                color: "#1a237e",
              }}
            >
              Course Categories
            </h1>
            {hasPermission("course-category", "add") && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{
                  background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)",
                  },
                  fontWeight: 600,
                  px: 3,
                  py: 1.5,
                  fontSize: 16,
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
                  textTransform: "none",
                  "&:hover": {
                    boxShadow: "0 6px 16px rgba(25, 118, 210, 0.4)",
                  },
                }}
                onClick={handleAdd}
              >
                ADD COURSE CATEGORY
              </Button>
            )}
          </Box>
          
          <Box
            sx={{
              borderRadius: 3,
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              border: "1px solid #e8eaf6",
            }}
          >
            <DataGrid
              rows={rows}
              columns={columns}
              loading={loading}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 100]}
              disableRowSelectionOnClick
              sx={{
                "& .MuiDataGrid-columnHeaders": {
                  background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                  fontWeight: 700,
                  fontSize: 15,
                  borderBottom: "2px solid #dee2e6",
                },
                "& .MuiDataGrid-cell": {
                  borderBottom: "1px solid #f0f0f0",
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                },
                "& .MuiDataGrid-row": {
                  fontSize: 15,
                  minHeight: "60px !important",
                  "&:hover": {
                    backgroundColor: "#f8f9fa",
                  },
                },
                "& .MuiDataGrid-cell:focus": {
                  outline: "none",
                },
                border: "none",
                backgroundColor: "transparent",
              }}
              getRowHeight={() => 60}
              autoHeight
            />
          </Box>
        </>
      ) : (
        // ----- FORM SECTION -----
        <Box
          sx={{
            maxWidth: "100%",
            margin: "0 auto",
            background: "transparent",
            padding: "20px",
            overflow: "hidden",
          }}
        >
          <form onSubmit={handleFormSubmit}>
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                marginBottom: 20,
                marginTop: 8,
                color: "#1a237e",
              }}
            >
              Course Categories
            </h1>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 26,
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <h2 style={{ fontSize: "1.5rem", fontWeight: 500, margin: 0 }}>
                {editRow ? "Edit Course Category" : "Add New Category"}
              </h2>
              <Button
                variant="contained"
                sx={{
                  bgcolor: "#0f265c",
                  "&:hover": { bgcolor: "#233772" },
                  fontWeight: 600,
                  px: 3,
                  fontSize: 16,
                  borderRadius: 2,
                  boxShadow: "none",
                  textTransform: "none",
                }}
                onClick={() => {
                  setShowForm(false);
                  setEditRow(null);
                  setForm({
                    category: "",
                    status: "Active",
                    title: "",
                    keywords: "",
                    description: "",
                  });
                }}
              >
                View List
              </Button>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: 24,
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: 6,
                    color: "#374151",
                  }}
                >
                  Category Name *
                </label>
                <input
                  type="text"
                  name="category"
                  style={{
                    width: "100%",
                    border: "1.5px solid #d1d5db",
                    borderRadius: 8,
                    padding: "12px 16px",
                    fontSize: 14,
                    outline: "none",
                    marginBottom: 10,
                    transition: "border-color 0.2s ease",
                  }}
                  value={form.category}
                  onChange={handleFormChange}
                  required
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: 6,
                    color: "#374151",
                  }}
                >
                  Status
                </label>
                <select
                  name="status"
                  style={{
                    width: "100%",
                    border: "1.5px solid #d1d5db",
                    borderRadius: 8,
                    padding: "12px 16px",
                    fontSize: 14,
                    outline: "none",
                    marginBottom: 10,
                    transition: "border-color 0.2s ease",
                  }}
                  value={form.status}
                  onChange={handleFormChange}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: 6,
                    color: "#374151",
                  }}
                >
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  style={{
                    width: "100%",
                    border: "1.5px solid #d1d5db",
                    borderRadius: 8,
                    padding: "12px 16px",
                    fontSize: 14,
                    outline: "none",
                    marginBottom: 10,
                    transition: "border-color 0.2s ease",
                  }}
                  value={form.title}
                  onChange={handleFormChange}
                  placeholder="Enter title"
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: 6,
                    color: "#374151",
                  }}
                >
                  Keywords
                </label>
                <input
                  type="text"
                  name="keywords"
                  style={{
                    width: "100%",
                    border: "1.5px solid #d1d5db",
                    borderRadius: 8,
                    padding: "12px 16px",
                    fontSize: 14,
                    outline: "none",
                    marginBottom: 10,
                    transition: "border-color 0.2s ease",
                  }}
                  value={form.keywords}
                  onChange={handleFormChange}
                  placeholder="Enter keywords (comma separated)"
                />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label
                style={{
                  display: "block",
                  fontWeight: 600,
                  marginBottom: 6,
                  color: "#374151",
                }}
              >
                Description
              </label>
              <textarea
                name="description"
                style={{
                  width: "100%",
                  border: "1.5px solid #d1d5db",
                  borderRadius: 8,
                  padding: "12px 16px",
                  fontSize: 14,
                  outline: "none",
                  marginBottom: 10,
                  minHeight: 100,
                  resize: "vertical",
                  transition: "border-color 0.2s ease",
                }}
                value={form.description}
                onChange={handleFormChange}
                placeholder="Enter description"
              />
            </div>
            <div style={{ marginTop: 24, textAlign: "left" }}>
              <Button
                type="submit"
                variant="contained"
                sx={{
                  bgcolor: "#0f265c",
                  "&:hover": { bgcolor: "#233772" },
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  fontSize: 15,
                  borderRadius: 8,
                  boxShadow: "0 4px 12px rgba(15, 38, 92, 0.3)",
                  textTransform: "none",
                  letterSpacing: 0,
                  "&:hover": {
                    boxShadow: "0 6px 16px rgba(15, 38, 92, 0.4)",
                  },
                }}
              >
                {editRow ? "Update Category" : "Create Category"}
              </Button>
            </div>
          </form>
        </Box>
      )}
    </Box>
  );
}
