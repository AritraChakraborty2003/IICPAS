"use client";

import { useEffect, useState } from "react";
import {
  Typography,
  Button,
  Box,
  Modal,
  TextField,
  Alert,
} from "@mui/material";
import axios from "axios";
import { Briefcase, MapPin } from "lucide-react";
import dayjs from "dayjs";

export default function AllJobsWithModalApply() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    resumeLink: "",
  });
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      // Fetch both internal and external jobs
      const [internalJobsRes, externalJobsRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs-internal`),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs-external`)
      ]);
      
      // Combine both job types and normalize field names
      const internalJobs = (internalJobsRes.data || []).map(job => ({
        ...job,
        role: job.type || job.role,
        jd: job.description || job.jd,
        salary: job.salary || "0", // Ensure salary field exists
        source: 'internal',
        postedBy: 'IICPA Institute'
      }));
      
      const externalJobs = (externalJobsRes.data || []).map(job => ({
        ...job,
        source: 'external',
        postedBy: 'IICPA Institute' // Always show IICPA Institute for consistency
      }));
      
      // Combine all jobs and filter only active ones for public display
      const allJobs = [...internalJobs, ...externalJobs];
      const activeJobs = allJobs.filter(job => 
        job.status === 'active' || job.status === undefined
      );
      
      setJobs(activeJobs);
      setSelectedJob(activeJobs[0] || null);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      // Fallback to external jobs only
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs-external`);
        const activeJobs = (res.data || []).filter(job => job.status === 'active');
        setJobs(activeJobs);
        setSelectedJob(activeJobs[0] || null);
      } catch (fallbackError) {
        console.error("Error fetching external jobs:", fallbackError);
        setJobs([]);
        setSelectedJob(null);
      }
    }
  };

  const handleOpenModal = (job) => {
    setSelectedJob(job);
    setOpen(true);
  };

  const handleCloseModal = () => {
    setOpen(false);
    setForm({ name: "", email: "", phone: "", resumeLink: "" });
    setSubmitted(false);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      console.log("Submitting application for job:", selectedJob);
      console.log("Form data:", form);
      
      // Use appropriate endpoint based on job source
      const endpoint = selectedJob.source === 'internal' 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/jobs-internal/${selectedJob._id}/applications`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/apply/jobs-external`;
      
      const applicationData = {
        jobId: selectedJob._id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        resumeLink: form.resumeLink,
        // Add company email from the job data
        companyEmail: selectedJob.email || 'admin@iicpa.com'
      };
      
      console.log("Sending application data:", applicationData);
      console.log("To endpoint:", endpoint);
      
      const response = await axios.post(endpoint, applicationData);
      console.log("Application response:", response.data);
      
      setSubmitted(true);
    } catch (err) {
      console.error("Error applying", err);
      console.error("Error details:", err.response?.data);
      alert("Failed to submit application. Please try again.");
    }
  };

  const formatSalary = (salary) => {
    if (salary === null || salary === undefined || salary === "") {
      return "Not disclosed";
    }

    const numericSalary = Number(String(salary).replace(/[^\d.]/g, ""));
    return Number.isFinite(numericSalary) && numericSalary > 0
      ? `₹${numericSalary.toLocaleString("en-IN")}`
      : `₹${salary}`;
  };

  return (
    <Box className="bg-[#f9f9f9] px-4 pb-12 pt-24 md:px-8">
      <Typography
        variant="h5"
        className="mb-3 flex items-center gap-2 font-bold"
      >
        <Briefcase className="text-brown-600" />
        Available Job Openings
      </Typography>
      <p className="mb-8 max-w-3xl text-sm text-gray-600 md:text-base">
        Browse openings from the list and view complete job details on the right before applying.
      </p>

      {jobs.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">💼</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            No Job Openings Available
          </h3>
          <p className="text-gray-600 mb-6">
            We don't have any job openings at the moment. Please check back later for new opportunities.
          </p>
          <p className="text-sm text-gray-500">
            You can also follow us on social media to stay updated about new job postings.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)] xl:grid-cols-[420px_minmax(0,1fr)]">
          <div className="max-h-[78vh] space-y-4 overflow-y-auto pr-1">
            {jobs.map((job) => {
              const isActive = selectedJob?._id === job._id;

              return (
                <button
                  key={job._id}
                  type="button"
                  onClick={() => setSelectedJob(job)}
                  className={`w-full rounded-2xl border p-5 text-left transition-all ${
                    isActive
                      ? "border-blue-600 bg-blue-50 shadow-lg shadow-blue-100"
                      : "border-gray-200 bg-white shadow-sm hover:border-blue-300 hover:shadow-md"
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold leading-snug text-gray-900">
                        {job.title}
                      </h3>
                      <p className="mt-1 text-sm font-medium text-gray-600">
                        {job.role || "Role not specified"}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      job.source === "internal"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {job.postedBy}
                    </span>
                  </div>

                  <div className="mb-3 flex flex-wrap gap-3 text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {job.location || "Location not specified"}
                    </span>
                    <span>{formatSalary(job.salary)}</span>
                  </div>

                  <p className="line-clamp-2 text-sm text-gray-600">
                    {job.jd || "Job description will be shared by the recruiter."}
                  </p>

                  <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                    <span>Posted {dayjs(job.createdAt).format("MMM DD, YYYY")}</span>
                    <span className={isActive ? "text-blue-700" : "text-gray-500"}>
                      View details
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm lg:sticky lg:top-28 lg:max-h-[78vh] lg:overflow-y-auto xl:p-8">
            {selectedJob ? (
              <>
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-6">
                  <div>
                    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                      Job Details
                    </p>
                    <h2 className="text-2xl font-bold text-gray-900 xl:text-3xl">
                      {selectedJob.title}
                    </h2>
                    <p className="mt-2 text-base font-medium text-gray-700">
                      {selectedJob.role || "Role not specified"}
                    </p>
                  </div>
                  <span className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    selectedJob.source === "internal"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {selectedJob.postedBy}
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Location
                    </p>
                    <p className="mt-2 text-sm font-medium text-gray-800">
                      {selectedJob.location || "Location not specified"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Salary
                    </p>
                    <p className="mt-2 text-sm font-medium text-gray-800">
                      {formatSalary(selectedJob.salary)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Posted
                    </p>
                    <p className="mt-2 text-sm font-medium text-gray-800">
                      {dayjs(selectedJob.createdAt).format("MMM DD, YYYY")}
                    </p>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Job description
                  </h3>
                  <div className="mt-3 whitespace-pre-line text-sm leading-7 text-gray-700">
                    {selectedJob.jd || "Job description will be shared by the recruiter."}
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-blue-600 px-5 py-4 text-white">
                  <div>
                    <p className="text-sm font-semibold">Interested in this role?</p>
                    <p className="text-sm text-blue-100">
                      Apply now to share your profile with the hiring team.
                    </p>
                  </div>
                  <Button
                    variant="contained"
                    onClick={() => handleOpenModal(selectedJob)}
                    sx={{
                      bgcolor: "#fff",
                      color: "#2563eb",
                      fontWeight: 700,
                      px: 3,
                      "&:hover": { bgcolor: "#eff6ff" },
                    }}
                  >
                    Apply Now
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex min-h-[320px] items-center justify-center text-center text-gray-500">
                Select a job from the left to view the full details.
              </div>
            )}
          </div>
        </div>
      )}

      <Modal open={open} onClose={handleCloseModal}>
        <Box className="bg-white rounded-xl shadow-2xl w-[90%] max-w-lg mx-auto mt-24 p-6">
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Apply for: {selectedJob?.title}
          </Typography>

          {submitted ? (
            <Alert severity="success">
              Application submitted successfully!
            </Alert>
          ) : (
            <>
              <TextField
                label="Full Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Email"
                name="email"
                value={form.email}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Resume Link"
                name="resumeLink"
                value={form.resumeLink}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />

              <div className="flex justify-end gap-3 mt-4">
                <Button onClick={handleCloseModal}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit}>
                  Submit
                </Button>
              </div>
            </>
          )}
        </Box>
      </Modal>
    </Box>
  );
}
