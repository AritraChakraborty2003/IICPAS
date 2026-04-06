"use client";
import { getApiBase } from "@/lib/apiBase";

import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Mail, 
  Users, 
  Send, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Eye,
  EyeOff,
  Download,
  RefreshCw
} from "lucide-react";
import toast from "react-hot-toast";

export default function BulkEmailTab() {
  const [emailData, setEmailData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    subject: "",
    htmlContent: "",
    textContent: "",
    recipientTypes: ["Student", "Teacher", "College", "Company", "Individual", "Newsletter"]
  });

  // Email statistics
  const [emailStats, setEmailStats] = useState({
    total: 0,
    students: 0,
    teachers: 0,
    colleges: 0,
    companies: 0,
    individuals: 0,
    newsletter: 0
  });

  // Fetch email addresses on component mount
  useEffect(() => {
    fetchEmailAddresses();
  }, []);

  const getAdminToken = () => localStorage.getItem("adminToken");

  const fetchEmailAddresses = async () => {
    setLoading(true);
    try {
      const token = getAdminToken();
      const response = await axios.get(
        `${getApiBase()}/bulk-email/emails`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );
      
      if (response.data.success) {
        setEmailData(response.data.data);
        setEmailStats({
          total: response.data.data.totalEmails,
          students: response.data.data.breakdown.students,
          teachers: response.data.data.breakdown.teachers,
          colleges: response.data.data.breakdown.colleges,
          companies: response.data.data.breakdown.companies,
          individuals: response.data.data.breakdown.individuals,
          newsletter: response.data.data.breakdown.newsletter
        });
        toast.success(`Found ${response.data.data.totalEmails} email addresses`);
      }
    } catch (error) {
      console.error("Error fetching email addresses:", error);
      toast.error("Failed to fetch email addresses");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRecipientTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      recipientTypes: prev.recipientTypes.includes(type)
        ? prev.recipientTypes.filter(t => t !== type)
        : [...prev.recipientTypes, type]
    }));
  };

  const getSelectedRecipientCount = () => {
    if (!emailData) return 0;
    
    return emailData.emails.filter(email => 
      formData.recipientTypes.includes(email.type)
    ).length;
  };

  const sendTestEmail = async () => {
    if (!formData.subject || (!formData.htmlContent && !formData.textContent)) {
      toast.error("Please fill in subject and content");
      return;
    }

    setTesting(true);
    try {
      const token = getAdminToken();
      const response = await axios.post(
        `${getApiBase()}/bulk-email/test-send`,
        {
          subject: formData.subject,
          htmlContent: formData.htmlContent,
          textContent: formData.textContent
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        toast.success("Test email sent successfully!");
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      toast.error("Failed to send test email");
    } finally {
      setTesting(false);
    }
  };

  const sendBulkEmail = async () => {
    if (!formData.subject || (!formData.htmlContent && !formData.textContent)) {
      toast.error("Please fill in subject and content");
      return;
    }

    const selectedCount = getSelectedRecipientCount();
    if (selectedCount === 0) {
      toast.error("Please select at least one recipient type");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to send this email to ${selectedCount} recipients?`
    );
    
    if (!confirmed) return;

    setSending(true);
    try {
      const token = getAdminToken();
      const response = await axios.post(
        `${getApiBase()}/bulk-email/send`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        toast.success(
          `Bulk email sent successfully! ${response.data.data.successCount} successful, ${response.data.data.failureCount} failed`
        );
        
        // Reset form
        setFormData(prev => ({
          ...prev,
          subject: "",
          htmlContent: "",
          textContent: ""
        }));
      }
    } catch (error) {
      console.error("Error sending bulk email:", error);
      toast.error("Failed to send bulk email");
    } finally {
      setSending(false);
    }
  };

  const recipientTypes = [
    { key: "Student", label: "Students", count: emailStats.students },
    { key: "Teacher", label: "Teachers", count: emailStats.teachers },
    { key: "College", label: "Colleges", count: emailStats.colleges },
    { key: "Company", label: "Companies", count: emailStats.companies },
    { key: "Individual", label: "Individuals", count: emailStats.individuals },
    { key: "Newsletter", label: "Newsletter Subscribers", count: emailStats.newsletter }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bulk Email System</h1>
            <p className="text-gray-600">Send emails to all registered users</p>
          </div>
        </div>

        {/* Email Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Total</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{emailStats.total}</p>
          </div>
          
          {recipientTypes.map((type) => (
            <div key={type.key} className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  formData.recipientTypes.includes(type.key) ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <span className="text-sm font-medium text-gray-600">{type.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{type.count}</p>
            </div>
          ))}
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={fetchEmailAddresses}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Compose Email</h2>
            
            {/* Subject */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Enter email subject"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* HTML Content */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HTML Content *
              </label>
              <textarea
                name="htmlContent"
                value={formData.htmlContent}
                onChange={handleInputChange}
                placeholder="Enter HTML content for the email"
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>

            {/* Text Content */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text Content (Fallback)
              </label>
              <textarea
                name="textContent"
                value={formData.textContent}
                onChange={handleInputChange}
                placeholder="Enter plain text content (optional)"
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={sendTestEmail}
                disabled={testing || !formData.subject || (!formData.htmlContent && !formData.textContent)}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                Send Test Email
              </button>

              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showPreview ? 'Hide' : 'Show'} Preview
              </button>

              <button
                onClick={sendBulkEmail}
                disabled={sending || !formData.subject || (!formData.htmlContent && !formData.textContent) || getSelectedRecipientCount() === 0}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? 'Sending...' : `Send to ${getSelectedRecipientCount()} Recipients`}
              </button>
            </div>
          </div>
        </div>

        {/* Recipient Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Recipients</h2>
            
            <div className="space-y-3">
              {recipientTypes.map((type) => (
                <label key={type.key} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.recipientTypes.includes(type.key)}
                    onChange={() => handleRecipientTypeChange(type.key)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{type.label}</span>
                      <span className="text-sm text-gray-500">({type.count})</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Selected Recipients</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{getSelectedRecipientCount()}</p>
              <p className="text-sm text-blue-700">emails will be sent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Email Preview */}
      {showPreview && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Preview</h3>
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="mb-2">
              <strong>Subject:</strong> {formData.subject || 'No subject'}
            </div>
            <div className="border rounded p-4 bg-white">
              {formData.htmlContent ? (
                <div dangerouslySetInnerHTML={{ __html: formData.htmlContent }} />
              ) : (
                <pre className="whitespace-pre-wrap">{formData.textContent || 'No content'}</pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
