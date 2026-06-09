"use client";
import { getApiBase, getApiOrigin } from "@/lib/apiBase";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import Select from "react-select";
import axios from "axios";
import dynamic from "next/dynamic";
import { normalizeDefaultContentFont } from "../../utils/contentFontFamily";
import { joditFontControl } from "../../utils/joditFontConfig";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { FaArrowLeft, FaSave } from "react-icons/fa";

const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });
const MySwal = withReactContent(Swal);
const API_BASE = getApiBase();
const ALLOWED_IMAGE_ACCEPT =
  ".png,.jpg,.jpeg,.gif,.webp,image/png,image/jpeg,image/jpg,image/gif,image/webp";
const JODIT_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];
const RICH_TEXT_FIELDS = new Set([
  "description",
  "examCert",
  "caseStudy",
  "assignment",
  "seoDescription",
]);

const normalizeCategoryOptions = (categories = []) =>
  categories
    .filter((category) => category?.category)
    .map((category) => {
      const value = String(category.category).trim();
      return { value, label: value };
    })
    .filter(
      (option, index, self) =>
        self.findIndex(
          (item) => item.value.toLowerCase() === option.value.toLowerCase()
        ) === index
    );

export default function EditCourse({ courseId, onBack }) {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [simulations, setSimulations] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState([]);

  const joditConfig = useMemo(
    () => ({
      readonly: false,
      height: 200,
      editorClassName: "lucida-sans-content",
      uploader: {
        insertImageAsBase64URI: true,
        accept: ALLOWED_IMAGE_ACCEPT,
        imagesExtensions: JODIT_IMAGE_EXTENSIONS,
      },
      toolbarAdaptive: false,
      showCharsCounter: false,
      showWordsCounter: false,
      spellcheck: true,
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      defaultActionOnPaste: "insert_clear_html",
      enterMode: "BR",
      useSearch: false,
      showXPathInStatusbar: false,
      buttons: [
        "source",
        "|",
        "bold",
        "strikethrough",
        "underline",
        "italic",
        "|",
        "ul",
        "ol",
        "arrowlist",
        "|",
        "outdent",
        "indent",
        "|",
        "font",
        "fontsize",
        "brush",
        "paragraph",
        "|",
        "image",
        "link",
        "table",
        "|",
        "align",
        "undo",
        "redo",
        "|",
        "hr",
        "eraser",
        "copyformat",
        "|",
        "fullsize",
      ],
      controls: {
        font: joditFontControl,
        arrowlist: {
          icon: "➤",
          tooltip: "Arrow List",
          exec: (editor) => {
            const list =
              editor.selection.ancestor("ul") ||
              editor.selection.ancestor("ol");
            if (list) {
              if (list.classList.contains("arrow-list")) {
                list.classList.remove("arrow-list");
              } else {
                list.classList.add("arrow-list");
              }
            } else {
              editor.execCommand("insertUnorderedList");
              setTimeout(() => {
                const newList = editor.selection.ancestor("ul");
                if (newList) newList.classList.add("arrow-list");
              }, 10);
            }
          },
        },
      },
    }),
    []
  );

  // Simple handler without debouncing - works reliably with JoditEditor
  const handleJoditChange = (field) => (value) => {
    setForm((prevForm) => ({ ...prevForm, [field]: value }));
  };

  const richTextHandlers = useMemo(
    () => ({
      description: handleJoditChange("description"),
      examCert: handleJoditChange("examCert"),
      caseStudy: handleJoditChange("caseStudy"),
      assignment: handleJoditChange("assignment"),
      seoDescription: handleJoditChange("seoDescription"),
    }),
    []
  );

  const loadCategories = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/categories`);
      const options = normalizeCategoryOptions(
        Array.isArray(res.data) ? res.data : []
      );
      setCategoryOptions(options);
    } catch {
      setCategoryOptions([]);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    loadCategories();

    const handleFocus = () => {
      loadCategories();
    };

    window.addEventListener("focus", handleFocus);

    // Load course data
    axios.get(`${API_BASE}/courses/${courseId}`).then((res) => {
      const c = res.data;
      const currentCategory = c.category ? String(c.category).trim() : "";
      setForm({
        category: currentCategory
          ? { value: currentCategory, label: currentCategory }
          : null,
        title: c.title || "",
        slug: c.slug || "",
        price: c.price || "",
        discount: c.discount || "",
        status: c.status || "Active",
        duration: c.duration || "",
        video: c.video || "",
        description: normalizeDefaultContentFont(c.description || ""),
        examCert: normalizeDefaultContentFont(c.examCert || ""),
        caseStudy: normalizeDefaultContentFont(c.caseStudy || ""),
        assignment: normalizeDefaultContentFont(c.assignment || ""),
        seoTitle: c.seoTitle || "",
        seoKeywords: c.seoKeywords || "",
        seoDescription: normalizeDefaultContentFont(c.seoDescription || ""),
        metaTitle: c.metaTitle || "",
        metaKeywords: c.metaKeywords || "",
        metaDescription: c.metaDescription || "",
        image: null,
        imageUrl: c.image || "",
        dashboardImage: null,
        dashboardImageUrl: c.dashboardImage || "",
        // Pricing fields for both live and recorded sessions
        recordedSessionPrice: c.pricing?.recordedSession?.price || "",
        recordedSessionDiscount: c.pricing?.recordedSession?.discount || "",
        liveSessionPrice: c.pricing?.liveSession?.price || "",
        liveSessionDiscount: c.pricing?.liveSession?.discount || "",
        // Center pricing fields
        recordedSessionCenterPrice:
          c.pricing?.recordedSessionCenter?.price || "",
        recordedSessionCenterDiscount:
          c.pricing?.recordedSessionCenter?.discount || "",
        liveSessionCenterPrice: c.pricing?.liveSessionCenter?.price || "",
        liveSessionCenterDiscount: c.pricing?.liveSessionCenter?.discount || "",
      });

      // Load simulations
      setSimulations(c.simulations || []);
    });

    return () => window.removeEventListener("focus", handleFocus);
  }, [courseId, loadCategories]);

  if (!form || !mounted) return <div className="p-8">Loading course...</div>;

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    const val = files ? files[0] : value;

    if (name === "title") {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setForm((f) => ({ ...f, title: value, slug }));
    } else {
      setForm((f) => ({ ...f, [name]: val }));
    }
  };

  const handleCategoryChange = (option) =>
    setForm((f) => ({ ...f, category: option }));

  const resolvedCategoryOptions = (() => {
    const currentCategory = form?.category?.value?.trim();
    if (!currentCategory) return categoryOptions;
    if (
      categoryOptions.some(
        (option) => option.value.toLowerCase() === currentCategory.toLowerCase()
      )
    ) {
      return categoryOptions;
    }
    return [{ value: currentCategory, label: currentCategory }, ...categoryOptions];
  })();

  // Simulation image upload handler
  const handleSimulationImageUpload = async (file) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await axios.post(
        `${API_BASE}/courses/upload-simulation-image`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      return response.data.imageUrl;
    } catch (error) {
      console.error("Error uploading simulation image:", error);
      MySwal.fire("Error", "Failed to upload simulation image", "error");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // Add new simulation
  const addSimulation = async () => {
    const title = prompt("Enter simulation title:");
    if (!title) return;

    const description = prompt("Enter simulation description:");
    if (!description) return;

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const imageUrl = await handleSimulationImageUpload(file);
      if (imageUrl) {
        const newSimulation = {
          title,
          description,
          imageUrl,
          order: simulations.length,
        };
        setSimulations([...simulations, newSimulation]);
      }
    };
    fileInput.click();
  };

  // Remove simulation
  const removeSimulation = (index) => {
    setSimulations(simulations.filter((_, i) => i !== index));
  };

  // Update simulation order
  const updateSimulationOrder = (index, newOrder) => {
    const updatedSimulations = [...simulations];
    updatedSimulations[index].order = newOrder;
    setSimulations(updatedSimulations);
  };

  const getFinalPrice = () => {
    const price = parseFloat(form.price) || 0;
    const discount = parseFloat(form.discount) || 0;
    return price && discount
      ? Math.max(0, price - (price * discount) / 100)
      : price || "";
  };

  const getRecordedSessionFinalPrice = () => {
    const price = parseFloat(form.recordedSessionPrice) || 0;
    const discount = parseFloat(form.recordedSessionDiscount) || 0;
    return price && discount
      ? Math.max(0, price - (price * discount) / 100)
      : price || "";
  };

  const getLiveSessionFinalPrice = () => {
    const price = parseFloat(form.liveSessionPrice) || 0;
    const discount = parseFloat(form.liveSessionDiscount) || 0;
    return price && discount
      ? Math.max(0, price - (price * discount) / 100)
      : price || "";
  };

  const getRecordedSessionCenterFinalPrice = () => {
    const price = parseFloat(form.recordedSessionCenterPrice) || 0;
    const discount = parseFloat(form.recordedSessionCenterDiscount) || 0;
    return price && discount
      ? Math.max(0, price - (price * discount) / 100)
      : price || "";
  };

  const getLiveSessionCenterFinalPrice = () => {
    const price = parseFloat(form.liveSessionCenterPrice) || 0;
    const discount = parseFloat(form.liveSessionCenterDiscount) || 0;
    return price && discount
      ? Math.max(0, price - (price * discount) / 100)
      : price || "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("category", form.category?.value || "");

      // Add pricing structure
      const pricing = {
        recordedSession: {
          title: "DIGITAL HUB RECORDED SESSION",
          buttonText: "Add Digital Hub",
          price: parseFloat(form.recordedSessionPrice) || 0,
          discount: parseFloat(form.recordedSessionDiscount) || 0,
          finalPrice: getRecordedSessionFinalPrice(),
        },
        liveSession: {
          title: "DIGITAL HUB LIVE SESSION",
          buttonText: "Add Digital Hub+",
          price: parseFloat(form.liveSessionPrice) || 0,
          discount: parseFloat(form.liveSessionDiscount) || 0,
          finalPrice: getLiveSessionFinalPrice(),
        },
        recordedSessionCenter: {
          title: "DIGITAL HUB+ RECORDED SESSION+ CENTER",
          buttonText: "Add Digital Hub+ Center",
          price: parseFloat(form.recordedSessionCenterPrice) || 0,
          discount: parseFloat(form.recordedSessionCenterDiscount) || 0,
          finalPrice: getRecordedSessionCenterFinalPrice(),
        },
        liveSessionCenter: {
          title: "DIGITAL HUB+ LIVE SESSION+ CENTER",
          buttonText: "Add Digital Hub+ Center",
          price: parseFloat(form.liveSessionCenterPrice) || 0,
          discount: parseFloat(form.liveSessionCenterDiscount) || 0,
          finalPrice: getLiveSessionCenterFinalPrice(),
        },
      };
      fd.append("pricing", JSON.stringify(pricing));

      Object.entries(form).forEach(([k, v]) => {
        if (
          [
            "category",
            "imageUrl",
            "dashboardImageUrl",
            "recordedSessionPrice",
            "recordedSessionDiscount",
            "liveSessionPrice",
            "liveSessionDiscount",
            "recordedSessionCenterPrice",
            "recordedSessionCenterDiscount",
            "liveSessionCenterPrice",
            "liveSessionCenterDiscount",
          ].includes(k)
        )
          return;
        if (v !== null && v !== undefined) {
          fd.append(
            k,
            RICH_TEXT_FIELDS.has(k) ? normalizeDefaultContentFont(v) : v
          );
        }
      });

      // Add simulations data
      fd.append("simulations", JSON.stringify(simulations));

      await axios.put(`${API_BASE}/courses/${courseId}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      MySwal.fire("Success", "Course updated successfully!", "success");
      if (onBack) onBack();
    } catch (err) {
      MySwal.fire("Error", "Failed to update course", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-xl shadow p-10">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-bold">Edit Course</h3>
        <button
          onClick={onBack}
          className="bg-blue-700 text-white px-5 py-2 rounded flex items-center gap-2"
        >
          <FaArrowLeft /> View Courses
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label>Category</label>
            <Select
              options={resolvedCategoryOptions}
              value={form.category}
              onChange={handleCategoryChange}
              placeholder="Select category"
            />
            <label>Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleInputChange}
              className="w-full border p-2 rounded"
              required
            />
            <label>Slug</label>
            <input
              name="slug"
              value={form.slug}
              onChange={handleInputChange}
              className="w-full border p-2 rounded"
            />
            <label>Duration</label>
            <input
              name="duration"
              value={form.duration}
              onChange={handleInputChange}
              className="w-full border p-2 rounded"
              placeholder="e.g., 3 months, 6 weeks, 40 hours"
            />
            <label>Course Image</label>
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleInputChange}
              className="w-full"
            />
            {/* Show existing image */}
            {form.imageUrl && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-1">Current Image:</p>
                <img
                  src={
                    form.imageUrl.startsWith("http")
                      ? form.imageUrl
                      : `${
                          getApiOrigin()
                        }${form.imageUrl}`
                  }
                  alt="Current Course"
                  className="h-24 rounded shadow border"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "block";
                  }}
                />
                <p className="text-xs text-red-500" style={{ display: "none" }}>
                  Image not found
                </p>
              </div>
            )}
            {/* Show preview of newly selected image */}
            {form.image && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-1">New Image Preview:</p>
                <img
                  src={URL.createObjectURL(form.image)}
                  alt="New Course Preview"
                  className="h-24 rounded shadow border"
                />
              </div>
            )}
            
            <label className="mt-4">Dashboard Course Image (Square/Portrait)</label>
            <input
              type="file"
              name="dashboardImage"
              accept="image/*"
              onChange={handleInputChange}
              className="w-full"
            />
            {/* Show existing dashboard image */}
            {form.dashboardImageUrl && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-1">Current Dashboard Image:</p>
                <img
                  src={
                    form.dashboardImageUrl.startsWith("http")
                      ? form.dashboardImageUrl
                      : `${getApiOrigin()}${form.dashboardImageUrl}`
                  }
                  alt="Current Dashboard"
                  className="h-24 rounded shadow border"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
            )}
            {/* Show preview of newly selected dashboard image */}
            {form.dashboardImage && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-1">New Dashboard Preview:</p>
                <img
                  src={URL.createObjectURL(form.dashboardImage)}
                  alt="New Dashboard Preview"
                  className="h-24 rounded shadow border"
                />
              </div>
            )}
            
            <label className="mt-4">Video Link</label>
            <input
              name="video"
              value={form.video}
              onChange={handleInputChange}
              className="w-full border p-2 rounded"
            />
          </div>

          <div className="space-y-4">
            {/* Recorded Session Pricing */}
            <div className="border p-4 rounded-lg bg-green-50">
              <h4 className="font-semibold text-green-800 mb-3">
                Recorded Session Pricing
              </h4>
              <div className="space-y-3">
                <div>
                  <label>Recorded Session Price</label>
                  <input
                    name="recordedSessionPrice"
                    type="number"
                    value={form.recordedSessionPrice}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                    required
                  />
                </div>
                <div>
                  <label>Recorded Session Discount (%)</label>
                  <input
                    name="recordedSessionDiscount"
                    type="number"
                    value={form.recordedSessionDiscount}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                  />
                </div>
                <div>
                  <label>Recorded Session Final Price</label>
                  <input
                    value={getRecordedSessionFinalPrice()}
                    readOnly
                    className="w-full border p-2 rounded bg-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Live Session Pricing */}
            <div className="border p-4 rounded-lg bg-blue-50">
              <h4 className="font-semibold text-blue-800 mb-3">
                Live Session Pricing
              </h4>
              <div className="space-y-3">
                <div>
                  <label>Live Session Price</label>
                  <input
                    name="liveSessionPrice"
                    type="number"
                    value={form.liveSessionPrice}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                    required
                  />
                </div>
                <div>
                  <label>Live Session Discount (%)</label>
                  <input
                    name="liveSessionDiscount"
                    type="number"
                    value={form.liveSessionDiscount}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                  />
                </div>
                <div>
                  <label>Live Session Final Price</label>
                  <input
                    value={getLiveSessionFinalPrice()}
                    readOnly
                    className="w-full border p-2 rounded bg-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Recorded Session + Center Pricing */}
            <div className="border p-4 rounded-lg bg-green-50">
              <h4 className="font-semibold text-green-800 mb-3">
                Recorded Session + Center Pricing
              </h4>
              <div className="space-y-3">
                <div>
                  <label>Recorded Session + Center Price</label>
                  <input
                    name="recordedSessionCenterPrice"
                    type="number"
                    value={form.recordedSessionCenterPrice}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                    required
                  />
                </div>
                <div>
                  <label>Recorded Session + Center Discount (%)</label>
                  <input
                    name="recordedSessionCenterDiscount"
                    type="number"
                    value={form.recordedSessionCenterDiscount}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                  />
                </div>
                <div>
                  <label>Recorded Session + Center Final Price</label>
                  <input
                    value={getRecordedSessionCenterFinalPrice()}
                    readOnly
                    className="w-full border p-2 rounded bg-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Live Session + Center Pricing */}
            <div className="border p-4 rounded-lg bg-blue-50">
              <h4 className="font-semibold text-blue-800 mb-3">
                Live Session + Center Pricing
              </h4>
              <div className="space-y-3">
                <div>
                  <label>Live Session + Center Price</label>
                  <input
                    name="liveSessionCenterPrice"
                    type="number"
                    value={form.liveSessionCenterPrice}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                    required
                  />
                </div>
                <div>
                  <label>Live Session + Center Discount (%)</label>
                  <input
                    name="liveSessionCenterDiscount"
                    type="number"
                    value={form.liveSessionCenterDiscount}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                  />
                </div>
                <div>
                  <label>Live Session + Center Final Price</label>
                  <input
                    value={getLiveSessionCenterFinalPrice()}
                    readOnly
                    className="w-full border p-2 rounded bg-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Legacy Price Fields (for backward compatibility) */}
            <div className="border p-4 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-800 mb-3">
                Legacy Price (Optional)
              </h4>
              <div className="space-y-3">
                <div>
                  <label>Price</label>
                  <input
                    name="price"
                    type="number"
                    value={form.price}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                  />
                </div>
                <div>
                  <label>Discount (%)</label>
                  <input
                    name="discount"
                    type="number"
                    value={form.discount}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                  />
                </div>
                <div>
                  <label>Final Price</label>
                  <input
                    value={getFinalPrice()}
                    readOnly
                    className="w-full border p-2 rounded bg-gray-100"
                  />
                </div>
              </div>
            </div>

            <label>Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleInputChange}
              className="w-full border p-2 rounded"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Rich Text Sections */}
        <div>
          <label className="block font-semibold mb-1">Course Description</label>
          <JoditEditor
            value={form.description}
            config={joditConfig}
            onChange={richTextHandlers.description}
            onBlur={richTextHandlers.description}
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">
            Exam & Certification
          </label>
          <JoditEditor
            value={form.examCert}
            config={joditConfig}
            onChange={richTextHandlers.examCert}
            onBlur={richTextHandlers.examCert}
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Case Study</label>
          <JoditEditor
            value={form.caseStudy}
            config={joditConfig}
            onChange={richTextHandlers.caseStudy}
            onBlur={richTextHandlers.caseStudy}
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Assignment</label>
          <JoditEditor
            value={form.assignment}
            config={joditConfig}
            onChange={richTextHandlers.assignment}
            onBlur={richTextHandlers.assignment}
          />
        </div>

        {/* Simulations Section */}
        <div className="pt-8 border-t mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Simulations</h2>
            <button
              type="button"
              onClick={addSimulation}
              className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
              disabled={uploadingImage}
            >
              {uploadingImage ? "Uploading..." : "+ Add Simulation"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {simulations.map((simulation, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-sm">{simulation.title}</h3>
                  <button
                    type="button"
                    onClick={() => removeSimulation(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-gray-600 mb-2">
                  {simulation.description}
                </p>
                {simulation.imageUrl && (
                  <img
                    src={
                      simulation.imageUrl.startsWith("http")
                        ? simulation.imageUrl
                        : `${
                            getApiOrigin()
                          }${simulation.imageUrl}`
                    }
                    alt={simulation.title}
                    className="w-full h-32 object-cover rounded"
                  />
                )}
                <div className="mt-2">
                  <label className="text-xs text-gray-500">Order:</label>
                  <input
                    type="number"
                    value={simulation.order}
                    onChange={(e) =>
                      updateSimulationOrder(index, parseInt(e.target.value))
                    }
                    className="w-full text-xs border rounded px-2 py-1"
                    min="0"
                  />
                </div>
              </div>
            ))}
          </div>

          {simulations.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              No simulations added yet. Click "Add Simulation" to get started.
            </p>
          )}
        </div>

        {/* SEO Section */}
        <div className="pt-8 border-t mt-8">
          <h2 className="text-xl font-semibold mb-3">SEO Section</h2>
          <label>SEO Title</label>
          <input
            name="seoTitle"
            value={form.seoTitle}
            onChange={handleInputChange}
            className="w-full border p-2 rounded"
          />
          <label>SEO Description</label>
          <JoditEditor
            value={form.seoDescription}
            config={joditConfig}
            onChange={richTextHandlers.seoDescription}
            onBlur={richTextHandlers.seoDescription}
          />
          <label>SEO Keywords</label>
          <textarea
            name="seoKeywords"
            value={form.seoKeywords}
            onChange={handleInputChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Meta Tags Section */}
        <div className="pt-8 border-t mt-8">
          <h2 className="text-xl font-semibold mb-3">Meta Tags</h2>
          <label>Meta Title</label>
          <input
            name="metaTitle"
            value={form.metaTitle}
            onChange={handleInputChange}
            className="w-full border p-2 rounded"
            placeholder="Enter meta title for additional SEO"
          />
          <label>Meta Description</label>
          <div className="jodit-style-editor">
            <div className="jodit-toolbar">
              <div className="jodit-toolbar-editor-collection">
                <div className="jodit-toolbar-group">
                  <button
                    type="button"
                    className="jodit-toolbar-button"
                    disabled
                  >
                    <span className="jodit-icon jodit-icon-bold"></span>
                  </button>
                  <button
                    type="button"
                    className="jodit-toolbar-button"
                    disabled
                  >
                    <span className="jodit-icon jodit-icon-italic"></span>
                  </button>
                  <button
                    type="button"
                    className="jodit-toolbar-button"
                    disabled
                  >
                    <span className="jodit-icon jodit-icon-underline"></span>
                  </button>
                  <button
                    type="button"
                    className="jodit-toolbar-button"
                    disabled
                  >
                    <span className="jodit-icon jodit-icon-strikethrough"></span>
                  </button>
                </div>
                <div className="jodit-toolbar-group">
                  <button
                    type="button"
                    className="jodit-toolbar-button"
                    disabled
                  >
                    <span className="jodit-icon jodit-icon-ul"></span>
                  </button>
                  <button
                    type="button"
                    className="jodit-toolbar-button"
                    disabled
                  >
                    <span className="jodit-icon jodit-icon-ol"></span>
                  </button>
                  <button
                    type="button"
                    className="jodit-toolbar-button"
                    disabled
                  >
                    <span className="jodit-icon jodit-icon-outdent"></span>
                  </button>
                  <button
                    type="button"
                    className="jodit-toolbar-button"
                    disabled
                  >
                    <span className="jodit-icon jodit-icon-indent"></span>
                  </button>
                </div>
                <div className="jodit-toolbar-group">
                  <button
                    type="button"
                    className="jodit-toolbar-button"
                    disabled
                  >
                    <span className="jodit-icon jodit-icon-align-left"></span>
                  </button>
                  <button
                    type="button"
                    className="jodit-toolbar-button"
                    disabled
                  >
                    <span className="jodit-icon jodit-icon-align-center"></span>
                  </button>
                  <button
                    type="button"
                    className="jodit-toolbar-button"
                    disabled
                  >
                    <span className="jodit-icon jodit-icon-align-right"></span>
                  </button>
                  <button
                    type="button"
                    className="jodit-toolbar-button"
                    disabled
                  >
                    <span className="jodit-icon jodit-icon-justify"></span>
                  </button>
                </div>
                <div className="jodit-toolbar-group">
                  <button
                    type="button"
                    className="jodit-toolbar-button"
                    disabled
                  >
                    <span className="jodit-icon jodit-icon-font"></span>
                  </button>
                  <button
                    type="button"
                    className="jodit-toolbar-button"
                    disabled
                  >
                    <span className="jodit-icon jodit-icon-brush"></span>
                  </button>
                </div>
                <div className="jodit-toolbar-group">
                  <button
                    type="button"
                    className="jodit-toolbar-button"
                    disabled
                  >
                    <span className="jodit-icon jodit-icon-sup"></span>
                  </button>
                  <button
                    type="button"
                    className="jodit-toolbar-button"
                    disabled
                  >
                    <span className="jodit-icon jodit-icon-sub"></span>
                  </button>
                </div>
              </div>
              <div className="jodit-toolbar-editor-collection">
                <div className="jodit-toolbar-group">
                  <button
                    type="button"
                    className="jodit-toolbar-button"
                    disabled
                  >
                    <span className="jodit-icon jodit-icon-undo"></span>
                  </button>
                  <button
                    type="button"
                    className="jodit-toolbar-button"
                    disabled
                  >
                    <span className="jodit-icon jodit-icon-redo"></span>
                  </button>
                </div>
                <div className="jodit-toolbar-group">
                  <button
                    type="button"
                    className="jodit-toolbar-button"
                    disabled
                  >
                    <span className="jodit-icon jodit-icon-image"></span>
                  </button>
                  <button
                    type="button"
                    className="jodit-toolbar-button"
                    disabled
                  >
                    <span className="jodit-icon jodit-icon-video"></span>
                  </button>
                  <button
                    type="button"
                    className="jodit-toolbar-button"
                    disabled
                  >
                    <span className="jodit-icon jodit-icon-table"></span>
                  </button>
                  <button
                    type="button"
                    className="jodit-toolbar-button"
                    disabled
                  >
                    <span className="jodit-icon jodit-icon-link"></span>
                  </button>
                </div>
                <div className="jodit-toolbar-group">
                  <button
                    type="button"
                    className="jodit-toolbar-button"
                    disabled
                  >
                    <span className="jodit-icon jodit-icon-code"></span>
                  </button>
                  <button
                    type="button"
                    className="jodit-toolbar-button"
                    disabled
                  >
                    <span className="jodit-icon jodit-icon-hr"></span>
                  </button>
                  <button
                    type="button"
                    className="jodit-toolbar-button"
                    disabled
                  >
                    <span className="jodit-icon jodit-icon-omega"></span>
                  </button>
                </div>
                <div className="jodit-toolbar-group">
                  <button
                    type="button"
                    className="jodit-toolbar-button"
                    disabled
                  >
                    <span className="jodit-icon jodit-icon-search"></span>
                  </button>
                  <button
                    type="button"
                    className="jodit-toolbar-button"
                    disabled
                  >
                    <span className="jodit-icon jodit-icon-source"></span>
                  </button>
                </div>
              </div>
            </div>
            <textarea
              name="metaDescription"
              value={form.metaDescription}
              onChange={handleInputChange}
              className="jodit-editor-textarea"
              rows={8}
              placeholder="Enter meta description..."
              maxLength={160}
            />
            <div className="jodit-status-bar">
              <div
                className={`jodit-character-count ${
                  (form.metaDescription?.length || 0) > 160
                    ? "error"
                    : (form.metaDescription?.length || 0) > 140
                    ? "warning"
                    : ""
                }`}
              >
                {form.metaDescription?.length || 0}/160 characters
              </div>
              <div className="jodit-status-text">
                {(form.metaDescription?.length || 0) > 160
                  ? "⚠️ Too long for SEO"
                  : (form.metaDescription?.length || 0) > 140
                  ? "⚠️ Getting long"
                  : (form.metaDescription?.length || 0) > 0
                  ? "✅ Good length"
                  : "💡 Enter description"}
              </div>
            </div>
          </div>
          <label>Meta Keywords</label>
          <textarea
            name="metaKeywords"
            value={form.metaKeywords}
            onChange={handleInputChange}
            className="w-full border p-2 rounded"
            placeholder="Enter meta keywords separated by commas"
          />
        </div>

        <div className="flex justify-end mt-10">
          <button
            type="submit"
            className="bg-blue-600 text-white px-7 py-2 rounded flex items-center gap-2 text-lg"
            disabled={loading}
          >
            <FaSave /> {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
