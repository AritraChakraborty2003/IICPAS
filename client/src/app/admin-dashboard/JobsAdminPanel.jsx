"use client";
import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Box,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import axios from "axios";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export default function JobsAdminPanel() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [mode, setMode] = useState("list");
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState({
    title: "",
    type: "",
    location: "",
    description: "",
    salary: "",
    source: ""
  });
  const [editId, setEditId] = useState(null);
  const { hasPermission } = useAuth();

  const getApplicationStatusLabel = (application) => {
    if (!application) return "Pending";
    if (selectedJob?.source === "external") {
      const status = String(application.status || "pending");
      return status.charAt(0).toUpperCase() + status.slice(1);
    }
    return application.shortlisted ? "Shortlisted" : "Pending";
  };

  const isApplicationApproved = (application) => {
    if (!application) return false;
    return selectedJob?.source === "external"
      ? application.status === "shortlisted"
      : Boolean(application.shortlisted);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      // Fetch both internal and external (company) jobs
      const [internalJobsRes, externalJobsRes] = await Promise.all([
        axios.get(`${API_BASE}/jobs-internal`),
        axios.get(`${API_BASE}/jobs-external`)
      ]);
      
      // Combine both job types and add a source identifier
      const internalJobs = (internalJobsRes.data || []).map(job => ({
        ...job,
        role: job.type || job.role, // Normalize role field
        salary: job.salary || "0", // Ensure salary field exists
        source: 'internal',
        sourceLabel: 'Internal'
      }));
      
      const externalJobs = (externalJobsRes.data || []).map(job => ({
        ...job,
        source: 'external',
        sourceLabel: 'Company Posted'
      }));
      
      // Combine all jobs
      const allJobs = [...internalJobs, ...externalJobs];
      setJobs(allJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      // Fallback to internal jobs only if external fetch fails
      try {
        const res = await axios.get(`${API_BASE}/jobs-internal`);
        setJobs((res.data || []).map(job => ({
          ...job,
          source: 'internal',
          sourceLabel: 'Internal'
        })));
      } catch (fallbackError) {
        console.error('Error fetching internal jobs:', fallbackError);
        setJobs([]);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!form.title || !form.type || !form.location || !form.description || !form.salary) {
      Swal.fire("Error!", "Please fill in all required fields including salary.", "error");
      return;
    }
    
    // Validate salary is a positive number
    if (isNaN(form.salary) || parseFloat(form.salary) < 0) {
      Swal.fire("Error!", "Please enter a valid salary amount.", "error");
      return;
    }
    
    try {
      if (editId) {
        // Determine the correct endpoint based on job source
        const endpoint = form.source === 'external' 
          ? `${API_BASE}/jobs-external/${editId}`
          : `${API_BASE}/jobs-internal/${editId}`;
        
        // Prepare data for external jobs (they use different field names)
        const submitData = form.source === 'external' 
          ? {
              title: form.title,
              role: form.type,
              location: form.location,
              salary: form.salary,
              jd: form.description
            }
          : form;
        
        await axios.put(endpoint, submitData);
      } else {
        // For new jobs, always create as internal
        // Map form fields to backend expected fields
        const newJobData = {
          title: form.title,
          type: form.type,
          location: form.location,
          description: form.description,
          salary: form.salary || "0", // Ensure salary is not empty
          status: "active" // Set default status
        };
        console.log("Creating new job with data:", newJobData);
        await axios.post(`${API_BASE}/jobs-internal`, newJobData);
      }
      
      resetForm();
      fetchJobs();
      setMode("list");
      Swal.fire("Success!", editId ? "Job updated successfully!" : "Job created successfully!", "success");
    } catch (error) {
      console.error('Error submitting job:', error);
      Swal.fire("Error!", "Failed to update job. Please try again.", "error");
    }
  };

  const resetForm = () => {
    setForm({ title: "", type: "", location: "", description: "", salary: "", source: "" });
    setEditId(null);
  };

  const handleDelete = async (jobId, source) => {
    const confirm = await Swal.fire({
      title: "Delete job?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (confirm.isConfirmed) {
      try {
        // Use appropriate endpoint based on job source
        const endpoint = source === 'internal' 
          ? `${API_BASE}/jobs-internal/${jobId}`
          : `${API_BASE}/jobs-external/${jobId}`;
        
        await axios.delete(endpoint);
        fetchJobs();
        Swal.fire("Deleted!", "The job has been removed.", "success");
      } catch (error) {
        console.error('Error deleting job:', error);
        Swal.fire("Error!", "Failed to delete the job.", "error");
      }
    }
  };

  const handleDeleteApplication = async (applicant) => {
    const confirm = await Swal.fire({
      title: `Delete application for ${applicant.name}?`,
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (confirm.isConfirmed) {
      try {
        const endpoint =
          selectedJob.source === "internal"
            ? `${API_BASE}/jobs-internal/applications/${applicant._id}`
            : `${API_BASE}/apply/jobs-external/${applicant._id}`;
        
        await axios.delete(endpoint);
        fetchApplications(selectedJob);
        Swal.fire("Deleted!", "The application has been removed.", "success");
      } catch (error) {
        console.error('Error deleting application:', error);
        Swal.fire("Error!", "Failed to delete the application.", "error");
      }
    }
  };

  // Utility to refresh applications
  const fetchApplications = async (job) => {
    try {
      // Use appropriate endpoint based on job source
      const endpoint = job.source === 'internal' 
        ? `${API_BASE}/jobs-internal/${job._id}/applications`
        : `${API_BASE}/jobs-external/${job._id}/applications`;
      
      const res = await axios.get(endpoint);
      setApplications(res.data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
    }
  };

  const handleEdit = (job) => {
    // Set form data for both internal and external jobs
    setForm({
      title: job.title,
      type: job.type || job.role,
      location: job.location,
      description: job.description || job.jd || "",
      salary: job.salary || "",
      // Add source info for handling
      source: job.source
    });
    setEditId(job._id);
    setMode("edit");
  };

  const viewApplications = async (job) => {
    setSelectedJob(job);
    try {
      // Use appropriate endpoint based on job source
      const endpoint = job.source === 'internal' 
        ? `${API_BASE}/jobs-internal/${job._id}/applications`
        : `${API_BASE}/jobs-external/${job._id}/applications`;
      
      const res = await axios.get(endpoint);
      setApplications(res.data || []);
      setMode("applications");
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
      setMode("applications");
      Swal.fire("Info", "No applications found for this job.", "info");
    }
  };

  const handleShortlist = async (applicant) => {
    const confirm = await Swal.fire({
      title: `Shortlist ${applicant.name}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, shortlist",
    });

    if (confirm.isConfirmed) {
      try {
        if (selectedJob.source === "internal") {
          await axios.post(
            `${API_BASE}/jobs-internal/applications/${applicant._id}/shortlist`
          );
        } else {
          await axios.put(
            `${API_BASE}/apply/jobs-external/${applicant._id}/status`,
            { status: "shortlisted" }
          );
        }

        fetchApplications(selectedJob); // Refresh the list
        Swal.fire(
          "Shortlisted!",
          `${applicant.name} has been shortlisted.`,
          "success"
        );
      } catch (error) {
        console.error('Error shortlisting applicant:', error);
        Swal.fire("Error!", "Failed to shortlist the applicant.", "error");
      }
    }
  };

  const exportToExcel = () => {
    const data = applications.map((a) => ({
      Name: a.name,
      Email: a.email,
      Phone: a.phone,
      Status: getApplicationStatusLabel(a),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Applications");
    XLSX.writeFile(wb, `${selectedJob.title}_applications.xlsx`);
  };

  return (
    <div className="p-6">
      {mode === "list" && (
        <>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">Jobs Management</h2>
              <p className="text-gray-600 mt-1">
                Total: {jobs.length} jobs ({jobs.filter(j => j.source === 'internal').length} Internal, {jobs.filter(j => j.source === 'external').length} Company Posted)
              </p>
            </div>
            {hasPermission("jobs", "add") && (
              <Button variant="contained" onClick={() => setMode("add")}>
                Add Internal Job
              </Button>
            )}
          </div>

          <Table className="bg-white shadow rounded-md w-full">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Company</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job._id}>
                  <TableCell>{job.title}</TableCell>
                  <TableCell>{job.type || job.role}</TableCell>
                  <TableCell>{job.location}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      job.source === 'internal' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {job.sourceLabel}
                    </span>
                  </TableCell>
                  <TableCell>
                    IICPA Institute
                  </TableCell>
                  <TableCell align="center">
                    <div className="flex items-center justify-center gap-1">
                      <IconButton 
                        onClick={() => handleEdit(job)} 
                        title={job.source === 'external' ? "Edit Company Job" : "Edit Internal Job"}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => viewApplications(job)} 
                        title="View Applications"
                        size="small"
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleDelete(job._id, job.source)} 
                        title="Delete Job"
                        size="small"
                      >
                        <DeleteIcon color="error" />
                      </IconButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {(mode === "add" || mode === "edit") && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded  w-full max-w-6xl mx-auto"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              {mode === "add" ? "Add New Job" : "Edit Job"}
            </h2>
            {mode === "edit" && form.source && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                form.source === 'internal' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {form.source === 'internal' ? 'Internal Job' : 'Company Job'}
              </span>
            )}
          </div>
          
          {mode === "edit" && form.source === 'external' && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> You are editing a job posted by a company. Changes will be reflected in their job posting.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextField
              label="Job Title"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              fullWidth
            />
            <TextField
              label="Job Type / Role"
              required
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              fullWidth
            />
            <TextField
              label="Location"
              required
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              fullWidth
            />
            <TextField
              label="Salary"
              required
              type="number"
              value={form.salary}
              onChange={(e) => setForm({ ...form, salary: e.target.value })}
              fullWidth
              inputProps={{ min: 0 }}
              helperText="Enter salary amount in rupees"
            />
          </div>

          <div className="mt-6">
            <TextField
              label="Job Description"
              required
              multiline
              rows={4}
              fullWidth
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button type="submit" variant="contained">
              {mode === "edit" ? "Update Job" : "Create Job"}
            </Button>
            <Button variant="outlined" onClick={() => setMode("list")}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {mode === "applications" && (
        <div className="bg-white rounded shadow p-6 w-full">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold">
                Applications for: {selectedJob.title}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Job Type: <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedJob.source === 'internal' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {selectedJob.sourceLabel}
                </span>
                <span className="ml-2 text-gray-500">
                  • Posted by: IICPA Institute
                </span>
              </p>
            </div>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportToExcel}
            >
              Export to Excel
            </Button>
          </div>

          <Table className="bg-white">
            <TableHead className="bg-gray-100">
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Resume</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.map((applicant) => (
                <TableRow key={applicant._id}>
                  <TableCell>{applicant.name}</TableCell>
                  <TableCell>{applicant.email}</TableCell>
                  <TableCell>{applicant.phone}</TableCell>
                  <TableCell>
                    <a href={applicant.resumeLink} target="_blank">
                      View Resume
                    </a>
                  </TableCell>
                  <TableCell>
                    {getApplicationStatusLabel(applicant)}
                  </TableCell>
                  <TableCell>
                    {!isApplicationApproved(applicant) && (
                      <IconButton
                        color="primary"
                        onClick={() => handleShortlist(applicant)}
                      >
                        <CheckIcon />
                      </IconButton>
                    )}
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteApplication(applicant)}
                    >
                      <CloseIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-end mt-4">
            <Button variant="outlined" onClick={() => setMode("list")}>
              Back to Jobs
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
