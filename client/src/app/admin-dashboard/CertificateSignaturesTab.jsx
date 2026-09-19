"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FaUpload, FaTrash, FaPenNib, FaSave, FaCheckCircle } from "react-icons/fa";

export default function CertificateSignaturesTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [lokeshTitle, setLokeshTitle] = useState("LOKESH GUPTA");
  const [lokeshSubTitle, setLokeshSubTitle] = useState("FOUNDER & DIRECTOR");
  const [lokeshSignUrl, setLokeshSignUrl] = useState("");
  const [lokeshSignFile, setLokeshSignFile] = useState(null);
  const [lokeshPreview, setLokeshPreview] = useState("");

  const [poonamTitle, setPoonamTitle] = useState("POONAM GUPTA");
  const [poonamSubTitle, setPoonamSubTitle] = useState("CO-FOUNDER & ACADEMIC HEAD");
  const [poonamSignUrl, setPoonamSignUrl] = useState("");
  const [poonamSignFile, setPoonamSignFile] = useState(null);
  const [poonamPreview, setPoonamPreview] = useState("");

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const fetchSignatures = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/certificate-signatures`, {
        withCredentials: true,
      });
      if (res.data?.success && res.data?.settings) {
        const s = res.data.settings;
        setLokeshTitle(s.lokeshTitle || "LOKESH GUPTA");
        setLokeshSubTitle(s.lokeshSubTitle || "FOUNDER & DIRECTOR");
        setLokeshSignUrl(s.lokeshSign || "");
        if (s.lokeshSign) {
          setLokeshPreview(
            s.lokeshSign.startsWith("http")
              ? s.lokeshSign
              : `${API}${s.lokeshSign.startsWith("/") ? "" : "/"}${s.lokeshSign}`
          );
        }

        setPoonamTitle(s.poonamTitle || "POONAM GUPTA");
        setPoonamSubTitle(s.poonamSubTitle || "CO-FOUNDER & ACADEMIC HEAD");
        setPoonamSignUrl(s.poonamSign || "");
        if (s.poonamSign) {
          setPoonamPreview(
            s.poonamSign.startsWith("http")
              ? s.poonamSign
              : `${API}${s.poonamSign.startsWith("/") ? "" : "/"}${s.poonamSign}`
          );
        }
      }
    } catch (err) {
      console.error("Error fetching signature settings:", err);
      toast.error("Failed to load certificate signatures");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignatures();
  }, []);

  const handleLokeshFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLokeshSignFile(file);
      setLokeshPreview(URL.createObjectURL(file));
    }
  };

  const handlePoonamFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPoonamSignFile(file);
      setPoonamPreview(URL.createObjectURL(file));
    }
  };

  const handleClearLokesh = () => {
    setLokeshSignFile(null);
    setLokeshPreview("");
    setLokeshSignUrl("");
  };

  const handleClearPoonam = () => {
    setPoonamSignFile(null);
    setPoonamPreview("");
    setPoonamSignUrl("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("lokeshTitle", lokeshTitle);
      formData.append("lokeshSubTitle", lokeshSubTitle);
      formData.append("poonamTitle", poonamTitle);
      formData.append("poonamSubTitle", poonamSubTitle);

      if (lokeshSignFile) {
        formData.append("lokeshSign", lokeshSignFile);
      } else if (!lokeshSignUrl && !lokeshPreview) {
        formData.append("deleteLokeshSign", "true");
      }

      if (poonamSignFile) {
        formData.append("poonamSign", poonamSignFile);
      } else if (!poonamSignUrl && !poonamPreview) {
        formData.append("deletePoonamSign", "true");
      }

      const res = await axios.post(`${API}/api/certificate-signatures`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        toast.success("Certificate signatures saved successfully!");
        fetchSignatures();
      }
    } catch (err) {
      console.error("Error saving signature settings:", err);
      toast.error(err.response?.data?.message || "Failed to save signatures");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3" />
        <p className="text-sm font-medium text-gray-500">Loading Certificate Signatures...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm">
      {/* Header */}
      <div className="mb-8 pb-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FaPenNib className="text-blue-600" />
            Certificate Signatures
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload and manage official signatures for Lokesh Sir and Poonam Mam. Uploaded signatures automatically render on screen previews and generated PDF certificates.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Side by Side Upload Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Lokesh Sir Signature Card */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 font-semibold text-xs rounded-full uppercase tracking-wider">
                  Left Signature
                </span>
                {lokeshPreview && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <FaCheckCircle /> Active
                  </span>
                )}
              </div>

              <h2 className="text-lg font-bold text-gray-800 mb-1">Lokesh Sir Signature</h2>
              <p className="text-xs text-gray-500 mb-4">FOUNDER &amp; DIRECTOR</p>

              <div className="space-y-3 mb-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Name / Title</label>
                  <input
                    type="text"
                    value={lokeshTitle}
                    onChange={(e) => setLokeshTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={lokeshSubTitle}
                    onChange={(e) => setLokeshSubTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Preview Box */}
              <div className="relative aspect-[3/1] bg-white rounded-xl border border-dashed border-gray-300 flex items-center justify-center p-3 mb-4 overflow-hidden shadow-inner">
                {lokeshPreview ? (
                  <img
                    src={lokeshPreview}
                    alt="Lokesh Sir Signature"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <FaPenNib className="mx-auto text-2xl mb-1 text-gray-300" />
                    <span className="text-xs font-medium">No signature uploaded</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-xs cursor-pointer hover:bg-blue-700 transition-all shadow-sm">
                <FaUpload />
                {lokeshPreview ? "Change Image" : "Upload Signature"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLokeshFileChange}
                  className="hidden"
                />
              </label>

              {lokeshPreview && (
                <button
                  type="button"
                  onClick={handleClearLokesh}
                  className="px-3 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-semibold transition-all"
                  title="Remove signature"
                >
                  <FaTrash />
                </button>
              )}
            </div>
          </div>

          {/* Poonam Mam Signature Card */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 font-semibold text-xs rounded-full uppercase tracking-wider">
                  Right Signature
                </span>
                {poonamPreview && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <FaCheckCircle /> Active
                  </span>
                )}
              </div>

              <h2 className="text-lg font-bold text-gray-800 mb-1">Poonam Mam Signature</h2>
              <p className="text-xs text-gray-500 mb-4">CO-FOUNDER &amp; ACADEMIC HEAD</p>

              <div className="space-y-3 mb-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Name / Title</label>
                  <input
                    type="text"
                    value={poonamTitle}
                    onChange={(e) => setPoonamTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={poonamSubTitle}
                    onChange={(e) => setPoonamSubTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              {/* Preview Box */}
              <div className="relative aspect-[3/1] bg-white rounded-xl border border-dashed border-gray-300 flex items-center justify-center p-3 mb-4 overflow-hidden shadow-inner">
                {poonamPreview ? (
                  <img
                    src={poonamPreview}
                    alt="Poonam Mam Signature"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <FaPenNib className="mx-auto text-2xl mb-1 text-gray-300" />
                    <span className="text-xs font-medium">No signature uploaded</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl font-semibold text-xs cursor-pointer hover:bg-purple-700 transition-all shadow-sm">
                <FaUpload />
                {poonamPreview ? "Change Image" : "Upload Signature"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePoonamFileChange}
                  className="hidden"
                />
              </label>

              {poonamPreview && (
                <button
                  type="button"
                  onClick={handleClearPoonam}
                  className="px-3 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-semibold transition-all"
                  title="Remove signature"
                >
                  <FaTrash />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-95 disabled:opacity-50"
          >
            <FaSave />
            {saving ? "Saving Changes..." : "Save Signatures"}
          </button>
        </div>
      </form>
    </div>
  );
}
