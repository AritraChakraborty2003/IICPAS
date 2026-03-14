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
    <Box className="bg-[linear-gradient(180deg,#f8fbff_0%,#f4f7fb_100%)] px-4 pb-14 pt-24 md:px-8">
      <Typography
        variant="h5"
        className="mb-3 flex items-center gap-2 font-bold tracking-tight text-slate-900"
      >
        <Briefcase className="text-brown-600" />
        Available Job Openings
      </Typography>
      <p className="mb-8 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
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
          <div className="max-h-[78vh] space-y-4 overflow-y-auto rounded-[28px] border border-slate-200/80 bg-white/80 p-3 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur">
            {jobs.map((job) => {
              const isActive = selectedJob?._id === job._id;

              return (
                <button
                  key={job._id}
                  type="button"
                  onClick={() => setSelectedJob(job)}
                  className={`w-full rounded-3xl border p-5 text-left transition-all duration-200 ${
                    isActive
                      ? "border-blue-500 bg-[linear-gradient(135deg,#eff6ff_0%,#f8fbff_100%)] shadow-[0_18px_45px_rgba(37,99,235,0.16)]"
                      : "border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] hover:border-blue-200 hover:shadow-[0_16px_38px_rgba(15,23,42,0.08)]"
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold leading-snug text-slate-900">
                        {job.title}
                      </h3>
                      <p className="mt-1 text-sm font-medium text-slate-600">
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

                  <div className="mb-3 flex flex-wrap gap-3 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {job.location || "Location not specified"}
                    </span>
                    <span className="font-semibold text-slate-800">{formatSalary(job.salary)}</span>
                  </div>

                  <p className="line-clamp-2 text-sm leading-6 text-slate-600">
                    {job.jd || "Job description will be shared by the recruiter."}
                  </p>

                  <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
                    <span>Posted {dayjs(job.createdAt).format("MMM DD, YYYY")}</span>
                    <span className={isActive ? "font-semibold text-blue-700" : "text-slate-500"}>
                      View details
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-[32px] border border-slate-200/80 bg-white p-6 shadow-[0_25px_70px_rgba(15,23,42,0.08)] lg:sticky lg:top-28 lg:max-h-[78vh] lg:overflow-y-auto xl:p-8">
            {selectedJob ? (
              <>
                <div className="mb-6 rounded-[28px] bg-[linear-gradient(135deg,#f8fbff_0%,#eef4ff_100%)] p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-blue-100 pb-6">
                    <div>
                      <p className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
                        Job Details
                      </p>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900 xl:text-4xl">
                        {selectedJob.title}
                      </h2>
                      <p className="mt-2 text-base font-medium text-slate-700">
                        {selectedJob.role || "Role not specified"}
                      </p>
                    </div>
                    <div className="flex flex-col items-start gap-3 sm:items-end">
                      <span className={`rounded-full px-4 py-2 text-sm font-semibold ${
                        selectedJob.source === "internal"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {selectedJob.postedBy}
                      </span>
                      <Button
                        variant="contained"
                        onClick={() => handleOpenModal(selectedJob)}
                        sx={{
                          borderRadius: "999px",
                          bgcolor: "#2563eb",
                          px: 3.5,
                          py: 1.2,
                          fontWeight: 700,
                          boxShadow: "0 14px 30px rgba(37, 99, 235, 0.28)",
                          "&:hover": { bgcolor: "#1d4ed8" },
                        }}
                      >
                        Apply Now
                      </Button>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Location
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {selectedJob.location || "Location not specified"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Salary
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {formatSalary(selectedJob.salary)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Posted
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {dayjs(selectedJob.createdAt).format("MMM DD, YYYY")}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Job description
                  </h3>
                  <div className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
                    {selectedJob.jd || "Job description will be shared by the recruiter."}
                  </div>
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
