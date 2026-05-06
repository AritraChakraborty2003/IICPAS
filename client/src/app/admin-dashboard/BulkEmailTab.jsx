"use client";

import { getApiBase } from "@/lib/apiBase";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Mail,
  Send,
  TestTube,
  Loader2,
  Eye,
  EyeOff,
  RefreshCw,
  Search,
  Plus,
  Trash2,
  CheckCircle,
  ChevronDown,
  AlertTriangle,
  Download,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";

const MAX_STUDENTS_PER_SEND = 10;

const emptySenderForm = {
  label: "",
  email: "",
  appPassword: "",
};

const extractEmailsFromText = (value) =>
  Array.from(
    new Set(
      String(value || "")
        .match(/[^\s@]+@[^\s@]+\.[^\s@]+/g)
        ?.map((email) => email.trim().toLowerCase()) || []
    )
  );

const downloadSampleMarketingCsv = () => {
  const csv = [
    "name,email",
    "Example Lead,lead@example.com",
    "Demo Contact,demo.contact@example.com",
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "marketing-emails-sample.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function BulkEmailTab() {
  const [students, setStudents] = useState([]);
  const [senderAccounts, setSenderAccounts] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingSenderAccounts, setLoadingSenderAccounts] = useState(false);
  const [sending, setSending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSenderForm, setShowSenderForm] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [selectedSenderAccountId, setSelectedSenderAccountId] = useState("");
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [recipientFile, setRecipientFile] = useState(null);
  const [recipientFileInputKey, setRecipientFileInputKey] = useState(0);
  const [senderForm, setSenderForm] = useState(emptySenderForm);
  const [savingSenderAccount, setSavingSenderAccount] = useState(false);
  const [marketingEmailsText, setMarketingEmailsText] = useState("");
  const [marketingTextCount, setMarketingTextCount] = useState(0);
  const [marketingFileCount, setMarketingFileCount] = useState(0);
  const [formData, setFormData] = useState({
    subject: "",
    htmlContent: "",
    textContent: "",
  });

  const getAdminToken = () => localStorage.getItem("adminToken");

  useEffect(() => {
    fetchStudents();
    fetchSenderAccounts();
  }, []);

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const token = getAdminToken();
      const response = await axios.get(`${getApiBase()}/v1/students`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      const studentList = Array.isArray(response.data?.students)
        ? response.data.students
        : Array.isArray(response.data?.data?.students)
          ? response.data.data.students
          : [];

      setStudents(studentList);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to fetch students");
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchSenderAccounts = async () => {
    setLoadingSenderAccounts(true);
    try {
      const token = getAdminToken();
      const response = await axios.get(
        `${getApiBase()}/bulk-email/sender-accounts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      const accounts = Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      setSenderAccounts(accounts);
      if (accounts.length > 0 && !selectedSenderAccountId) {
        setSelectedSenderAccountId(accounts[0]._id);
      }
    } catch (error) {
      console.error("Error fetching sender accounts:", error);
      toast.error("Failed to load sender accounts");
    } finally {
      setLoadingSenderAccounts(false);
    }
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSenderFormChange = (event) => {
    const { name, value } = event.target;
    setSenderForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAttachmentChange = (event) => {
    setAttachmentFile(event.target.files?.[0] || null);
  };

  const handleRecipientFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setRecipientFile(file);

    if (!file) {
      setMarketingFileCount(0);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setMarketingFileCount(extractEmailsFromText(reader.result).length);
    };
    reader.onerror = () => {
      toast.error("Could not read the recipient file");
      setMarketingFileCount(0);
    };
    reader.readAsText(file);
  };

  const selectedCount = selectedStudentIds.length;
  const searchValue = studentSearch.trim().toLowerCase();

  const filteredStudents = students.filter((student) => {
    const haystack = [
      student.name,
      student.email,
      student.phone,
      student.location,
      student.center,
      student.mode,
      student.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return !searchValue || haystack.includes(searchValue);
  });

  const selectedStudents = students.filter((student) =>
    selectedStudentIds.includes(String(student._id))
  );

  const toggleStudentSelection = (studentId) => {
    const normalizedId = String(studentId);
    setSelectedStudentIds((prev) => {
      if (prev.includes(normalizedId)) {
        return prev.filter((id) => id !== normalizedId);
      }

      if (prev.length >= MAX_STUDENTS_PER_SEND) {
        toast.error(`You can select up to ${MAX_STUDENTS_PER_SEND} students at a time`);
        return prev;
      }

      return [...prev, normalizedId];
    });
  };

  const selectVisibleStudents = () => {
    const visibleIds = filteredStudents.map((student) => String(student._id));
    const nextIds = [...selectedStudentIds];

    visibleIds.forEach((id) => {
      if (nextIds.length < MAX_STUDENTS_PER_SEND && !nextIds.includes(id)) {
        nextIds.push(id);
      }
    });

    if (nextIds.length === selectedStudentIds.length) {
      toast("All visible students are already selected");
      return;
    }

    if (visibleIds.length + selectedStudentIds.length > MAX_STUDENTS_PER_SEND) {
      toast.error(`You can only send to ${MAX_STUDENTS_PER_SEND} students at once`);
    }

    setSelectedStudentIds(nextIds.slice(0, MAX_STUDENTS_PER_SEND));
  };

  const clearSelection = () => setSelectedStudentIds([]);

  const handleMarketingEmailsChange = (event) => {
    const value = event.target.value;
    setMarketingEmailsText(value);
    setMarketingTextCount(extractEmailsFromText(value).length);
  };

  const clearMarketingRecipients = () => {
    setMarketingEmailsText("");
    setMarketingTextCount(0);
    setMarketingFileCount(0);
    setRecipientFile(null);
    setRecipientFileInputKey((prev) => prev + 1);
  };

  const handleSaveSenderAccount = async (event) => {
    event.preventDefault();

    if (!senderForm.email.trim() || !senderForm.appPassword.trim()) {
      toast.error("Sender email and app password are required");
      return;
    }

    setSavingSenderAccount(true);
    try {
      const token = getAdminToken();
      const response = await axios.post(
        `${getApiBase()}/bulk-email/sender-accounts`,
        {
          label: senderForm.label.trim(),
          email: senderForm.email.trim(),
          appPassword: senderForm.appPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      if (response.data?.success) {
        toast.success("Sender account saved");
        const savedAccount = response.data.data;
        setSenderAccounts((prev) => [savedAccount, ...prev]);
        setSelectedSenderAccountId(savedAccount._id);
        setSenderForm(emptySenderForm);
        setShowSenderForm(false);
      }
    } catch (error) {
      console.error("Error saving sender account:", error);
      toast.error(
        error.response?.data?.message || "Failed to save sender account"
      );
    } finally {
      setSavingSenderAccount(false);
    }
  };

  const resetComposer = () => {
    setFormData({
      subject: "",
      htmlContent: "",
      textContent: "",
    });
    setAttachmentFile(null);
    setRecipientFile(null);
    setRecipientFileInputKey((prev) => prev + 1);
    setMarketingEmailsText("");
    setMarketingTextCount(0);
    setMarketingFileCount(0);
  };

  const sendTestEmail = async () => {
    if (!selectedSenderAccountId) {
      toast.error("Please select a sender email account");
      return;
    }

    if (!formData.subject || (!formData.htmlContent && !formData.textContent)) {
      toast.error("Please fill in subject and content");
      return;
    }

    setTesting(true);
    try {
      const token = getAdminToken();
      const payload = new FormData();
      payload.append("subject", formData.subject);
      payload.append("htmlContent", formData.htmlContent);
      payload.append("textContent", formData.textContent);
      payload.append("senderAccountId", selectedSenderAccountId);
      if (attachmentFile) {
        payload.append("attachment", attachmentFile);
      }

      const response = await axios.post(
        `${getApiBase()}/bulk-email/test-send`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      if (response.data?.success) {
        toast.success("Test email sent successfully");
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      toast.error(error.response?.data?.message || "Failed to send test email");
    } finally {
      setTesting(false);
    }
  };

  const sendBulkEmail = async () => {
    if (!selectedSenderAccountId) {
      toast.error("Please select a sender email account");
      return;
    }

    if (!formData.subject || (!formData.htmlContent && !formData.textContent)) {
      toast.error("Please fill in subject and content");
      return;
    }

    if (totalRecipients === 0) {
      toast.error("Please select at least one student or add marketing recipients");
      return;
    }

    if (selectedCount > MAX_STUDENTS_PER_SEND) {
      toast.error(`You can send to only ${MAX_STUDENTS_PER_SEND} students at a time`);
      return;
    }

    const confirmed = window.confirm(
      `Send this formatted email to ${selectedCount} selected student${selectedCount === 1 ? "" : "s"} and ${marketingEmailsCount} marketing recipient${marketingEmailsCount === 1 ? "" : "s"}?`
    );

    if (!confirmed) return;

    setSending(true);
    try {
      const token = getAdminToken();
      const payload = new FormData();
      payload.append("subject", formData.subject);
      payload.append("htmlContent", formData.htmlContent);
      payload.append("textContent", formData.textContent);
      payload.append("selectedStudentIds", JSON.stringify(selectedStudentIds));
      payload.append("senderAccountId", selectedSenderAccountId);
      payload.append("marketingEmails", marketingEmailsText);
      if (attachmentFile) {
        payload.append("attachment", attachmentFile);
      }
      if (recipientFile) {
        payload.append("recipientFile", recipientFile);
      }

      const response = await axios.post(
        `${getApiBase()}/bulk-email/send`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      if (response.data?.success) {
        const { successCount = 0, failureCount = 0 } = response.data.data || {};
        toast.success(
          `Bulk email sent successfully. ${successCount} successful, ${failureCount} failed`
        );
        resetComposer();
        clearSelection();
      }
    } catch (error) {
      console.error("Error sending bulk email:", error);
      toast.error(error.response?.data?.message || "Failed to send bulk email");
    } finally {
      setSending(false);
    }
  };

  const selectedSenderAccount = senderAccounts.find(
    (account) => String(account._id) === String(selectedSenderAccountId)
  );

  const canSelectMore = selectedCount < MAX_STUDENTS_PER_SEND;
  const marketingEmailsCount = marketingTextCount + marketingFileCount;
  const totalRecipients = selectedCount + marketingEmailsCount;

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-blue-100 p-3">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Bulk Email for Students and Marketing
            </h1>
            <p className="text-gray-600">
              Select up to 10 students, add marketing recipients by paste or upload,
              choose a saved sender account, and send a formatted email.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            fetchStudents();
            fetchSenderAccounts();
          }}
          disabled={loadingStudents || loadingSenderAccounts}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${(loadingStudents || loadingSenderAccounts) ? "animate-spin" : ""}`}
          />
          Refresh Data
        </button>
      </div>

      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Select Students
            </h2>
            <p className="text-sm text-gray-600">
              Search and pick up to {MAX_STUDENTS_PER_SEND} students.
            </p>
          </div>
          <div className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
            {selectedCount} selected
          </div>
        </div>

        <div className="mb-4 flex gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={studentSearch}
              onChange={(event) => setStudentSearch(event.target.value)}
              placeholder="Search name, email, phone, location..."
              className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button
            type="button"
            onClick={selectVisibleStudents}
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Select visible
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={clearSelection}
            disabled={selectedCount === 0}
            className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear selection
          </button>
          <div className="rounded-full bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700">
            Hard limit: {MAX_STUDENTS_PER_SEND}
          </div>
        </div>

        {selectedCount > MAX_STUDENTS_PER_SEND ? (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4" />
            Please keep the selection at or below {MAX_STUDENTS_PER_SEND} students.
          </div>
        ) : null}

        <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
          {loadingStudents ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-600">
              Loading students...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-600">
              {studentSearch ? "No students match your search." : "No students found."}
            </div>
          ) : (
            filteredStudents.map((student) => {
              const studentId = String(student._id);
              const checked = selectedStudentIds.includes(studentId);
              const disabled = !checked && !canSelectMore;

              return (
                <label
                  key={studentId}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                    checked
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggleStudentSelection(studentId)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {student.name || "Unnamed Student"}
                      </span>
                      {student.status ? (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          {student.status}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 text-sm text-gray-600">{student.email}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      {student.phone || "No phone"}{" "}
                      {student.center ? `• ${student.center}` : ""}
                      {student.location ? ` • ${student.location}` : ""}
                    </div>
                  </div>
                </label>
              );
            })
          )}
        </div>

        <div className="mt-4 rounded-2xl bg-blue-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Selected Students</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{selectedCount}</p>
          <p className="text-sm text-blue-700">
            {selectedCount > 0
              ? `${selectedStudents.length} student${selectedStudents.length === 1 ? "" : "s"} ready to receive the message`
              : "No students selected yet"}
          </p>
          {selectedStudents.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedStudents.slice(0, 5).map((student) => (
                <span
                  key={student._id}
                  className="rounded-full bg-white px-3 py-1 text-xs font-medium text-blue-700 shadow-sm"
                >
                  {student.name || student.email}
                </span>
              ))}
              {selectedStudents.length > 5 ? (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-blue-700 shadow-sm">
                  +{selectedStudents.length - 5} more
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Compose Email
                </h2>
                <p className="text-sm text-gray-600">
                  Use HTML for styling and plain text as fallback.
                </p>
              </div>
              <div className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                {selectedCount}/{MAX_STUDENTS_PER_SEND} selected
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Subject *
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleFormChange}
                placeholder="Enter email subject"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                HTML Content *
              </label>
              <textarea
                name="htmlContent"
                value={formData.htmlContent}
                onChange={handleFormChange}
                placeholder="Enter formatted HTML content for the email"
                rows={12}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 font-mono text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Text Content (Fallback)
              </label>
              <textarea
                name="textContent"
                value={formData.textContent}
                onChange={handleFormChange}
                placeholder="Enter plain text content (optional)"
                rows={6}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="mb-6 rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Marketing Recipient List
                  </label>
                  <p className="text-xs text-gray-500">
                    Paste emails, or upload a CSV/TXT file with `name,email`.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={downloadSampleMarketingCsv}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-amber-700 shadow-sm transition hover:bg-amber-100"
                  >
                    <Download className="h-4 w-4" />
                    Download sample
                  </button>
                  <button
                    type="button"
                    onClick={clearMarketingRecipients}
                    className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-100"
                  >
                    Clear list
                  </button>
                </div>
              </div>

              <textarea
                value={marketingEmailsText}
                onChange={handleMarketingEmailsChange}
                placeholder="lead1@example.com&#10;lead2@example.com&#10;Optional format: Name,lead3@example.com"
                rows={5}
                className="mb-3 w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />

              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-amber-50">
                  <Upload className="h-4 w-4 text-amber-600" />
                  Upload CSV / TXT
                  <input
                    key={recipientFileInputKey}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleRecipientFileChange}
                    className="hidden"
                  />
                </label>
                <div className="text-xs text-gray-500">
                  {recipientFile ? `Uploaded: ${recipientFile.name}` : "No file uploaded yet"}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                  {marketingEmailsCount} marketing emails detected
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">
                  Selected students: {selectedCount}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">
                  Combined recipients: {totalRecipients}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Attachment
              </label>
              <input
                type="file"
                onChange={handleAttachmentChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp,.txt"
                className="block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="mt-2 text-xs text-gray-500">
                Optional. Attach a PDF, image, or document to send with the email.
              </p>
              {attachmentFile ? (
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  {attachmentFile.name}
                  <button
                    type="button"
                    onClick={() => setAttachmentFile(null)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    remove
                  </button>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={sendTestEmail}
                disabled={
                  testing ||
                  !selectedSenderAccountId ||
                  !formData.subject ||
                  (!formData.htmlContent && !formData.textContent)
                }
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-3 font-medium text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {testing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4" />
                )}
                Send Test Email
              </button>

              <button
                onClick={() => setShowPreview((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-600 px-4 py-3 font-medium text-white transition hover:bg-gray-700"
              >
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPreview ? "Hide" : "Show"} Preview
              </button>

              <button
                onClick={sendBulkEmail}
                disabled={
                  sending ||
                  !selectedSenderAccountId ||
                  !formData.subject ||
                  (!formData.htmlContent && !formData.textContent) ||
                  totalRecipients === 0 ||
                  selectedCount > MAX_STUDENTS_PER_SEND
                }
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {sending
                  ? "Sending..."
                  : `Send to ${selectedCount} Student${selectedCount === 1 ? "" : "s"} + ${marketingEmailsCount} Marketing Recipient${marketingEmailsCount === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>

          {showPreview && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Email Preview</h3>
                {selectedSenderAccount ? (
                  <div className="text-sm text-gray-500">
                    Sending from {selectedSenderAccount.email}
                  </div>
                ) : null}
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="mb-3 text-sm">
                  <strong>Subject:</strong> {formData.subject || "No subject"}
                </div>
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                  {formData.htmlContent ? (
                    <div
                      className="prose max-w-none p-4"
                      dangerouslySetInnerHTML={{ __html: formData.htmlContent }}
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap p-4 text-sm text-gray-700">
                      {formData.textContent || "No content"}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Sender Accounts
                </h2>
                <p className="text-sm text-gray-600">
                  Add reusable email + app password pairs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSenderForm((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
              >
                <Plus className="h-4 w-4" />
                Add Email
              </button>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Choose Sender
              </label>
              <div className="relative">
                <select
                  value={selectedSenderAccountId}
                  onChange={(event) => setSelectedSenderAccountId(event.target.value)}
                  className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-3 pr-10 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select a saved sender account</option>
                  {senderAccounts.map((account) => (
                    <option key={account._id} value={account._id}>
                      {account.label ? `${account.label} - ${account.email}` : account.email}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              {loadingSenderAccounts ? (
                <p className="mt-2 text-xs text-gray-500">Loading sender accounts...</p>
              ) : selectedSenderAccount ? (
                <p className="mt-2 text-xs text-green-600">
                  Selected: {selectedSenderAccount.label || selectedSenderAccount.email}
                </p>
              ) : (
                <p className="mt-2 text-xs text-amber-600">
                  Choose a sender account before sending.
                </p>
              )}
            </div>

            {showSenderForm && (
              <form onSubmit={handleSaveSenderAccount} className="space-y-4 rounded-xl bg-gray-50 p-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Label
                  </label>
                  <input
                    type="text"
                    name="label"
                    value={senderForm.label}
                    onChange={handleSenderFormChange}
                    placeholder="Optional label, e.g. Institute Gmail"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={senderForm.email}
                    onChange={handleSenderFormChange}
                    placeholder="sender@gmail.com"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    App Password *
                  </label>
                  <input
                    type="password"
                    name="appPassword"
                    value={senderForm.appPassword}
                    onChange={handleSenderFormChange}
                    placeholder="Enter Gmail app password"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={savingSenderAccount}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingSenderAccount ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Save Email
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSenderForm(false);
                      setSenderForm(emptySenderForm);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  App passwords are stored encrypted and only used when sending.
                </p>
              </form>
            )}

            <div className="mt-4 space-y-3">
              {senderAccounts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
                  No sender email accounts saved yet. Add one to start sending.
                </div>
              ) : (
                senderAccounts.map((account) => {
                  const isSelected = String(account._id) === String(selectedSenderAccountId);
                  return (
                    <div
                      key={account._id}
                      className={`rounded-xl border p-4 transition ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedSenderAccountId(account._id)}
                          className="flex-1 text-left"
                        >
                          <div className="text-sm font-semibold text-gray-900">
                            {account.label || "Sender Account"}
                          </div>
                          <div className="text-sm text-gray-600">{account.email}</div>
                          {account.lastUsedAt ? (
                            <div className="mt-1 text-xs text-gray-500">
                              Last used {new Date(account.lastUsedAt).toLocaleString()}
                            </div>
                          ) : null}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const token = getAdminToken();
                              await axios.delete(
                                `${getApiBase()}/bulk-email/sender-accounts/${account._id}`,
                                {
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                  },
                                  withCredentials: true,
                                }
                              );
                              setSenderAccounts((prev) =>
                                prev.filter((item) => String(item._id) !== String(account._id))
                              );
                              if (String(selectedSenderAccountId) === String(account._id)) {
                                setSelectedSenderAccountId("");
                              }
                              toast.success("Sender account deleted");
                            } catch (error) {
                              console.error("Error deleting sender account:", error);
                              toast.error(
                                error.response?.data?.message ||
                                  "Failed to delete sender account"
                              );
                            }
                          }}
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-white hover:text-red-600"
                          title="Delete sender account"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Select Students
                </h2>
                <p className="text-sm text-gray-600">
                  Search and pick up to {MAX_STUDENTS_PER_SEND} students.
                </p>
              </div>
              <div className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                {selectedCount} selected
              </div>
            </div>

            <div className="mb-4 flex gap-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                  placeholder="Search name, email, phone, location..."
                  className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <button
                type="button"
                onClick={selectVisibleStudents}
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Select visible
              </button>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={clearSelection}
                disabled={selectedCount === 0}
                className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear selection
              </button>
              <div className="rounded-full bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700">
                Hard limit: {MAX_STUDENTS_PER_SEND}
              </div>
            </div>

            {selectedCount > MAX_STUDENTS_PER_SEND ? (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertTriangle className="h-4 w-4" />
                Please keep the selection at or below {MAX_STUDENTS_PER_SEND} students.
              </div>
            ) : null}

            <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
              {loadingStudents ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-600">
                  Loading students...
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-600">
                  {studentSearch ? "No students match your search." : "No students found."}
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const studentId = String(student._id);
                  const checked = selectedStudentIds.includes(studentId);
                  const disabled = !checked && !canSelectMore;

                  return (
                    <label
                      key={studentId}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                        checked
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggleStudentSelection(studentId)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            {student.name || "Unnamed Student"}
                          </span>
                          {student.status ? (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                              {student.status}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 text-sm text-gray-600">{student.email}</div>
                        <div className="mt-1 text-xs text-gray-500">
                          {student.phone || "No phone"}{" "}
                          {student.center ? `• ${student.center}` : ""}
                          {student.location ? ` • ${student.location}` : ""}
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            <div className="mt-4 rounded-2xl bg-blue-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Selected Students</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{selectedCount}</p>
              <p className="text-sm text-blue-700">
                {selectedCount > 0
                  ? `${selectedStudents.length} student${selectedStudents.length === 1 ? "" : "s"} ready to receive the message`
                  : "No students selected yet"}
              </p>
              {selectedStudents.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedStudents.slice(0, 5).map((student) => (
                    <span
                      key={student._id}
                      className="rounded-full bg-white px-3 py-1 text-xs font-medium text-blue-700 shadow-sm"
                    >
                      {student.name || student.email}
                    </span>
                  ))}
                  {selectedStudents.length > 5 ? (
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-blue-700 shadow-sm">
                      +{selectedStudents.length - 5} more
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
