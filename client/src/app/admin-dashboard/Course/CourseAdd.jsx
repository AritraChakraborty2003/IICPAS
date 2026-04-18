import { getApiBase } from "@/lib/apiBase";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Select from "react-select";
import axios from "axios";
import { FaArrowLeft, FaPlus } from "react-icons/fa";
import dynamic from "next/dynamic";

const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

const API_BASE = getApiBase();
const ALLOWED_IMAGE_ACCEPT =
  ".png,.jpg,.jpeg,.gif,.webp,image/png,image/jpeg,image/jpg,image/gif,image/webp";
const JODIT_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

const initialForm = {
  category: null,
  title: "",
  slug: "",
  price: "",
  discount: "",
  status: "Active",
  video: "",
  description: "",
  examCert: "",
  caseStudy: "",
  seoTitle: "",
  seoKeywords: "",
  seoDescription: "",
  metaTitle: "",
  metaKeywords: "",
  metaDescription: "",
  image: null,
  // Pricing fields for both live and recorded sessions
  recordedSessionPrice: "",
  recordedSessionDiscount: "",
  liveSessionPrice: "",
  liveSessionDiscount: "",
  // Center pricing fields
  recordedSessionCenterPrice: "",
  recordedSessionCenterDiscount: "",
  liveSessionCenterPrice: "",
  liveSessionCenterDiscount: "",
  pricing: {
    recordedSession: {
      title: "DIGITAL HUB RECORDED SESSION",
      buttonText: "Add Digital Hub",
      price: 0,
      discount: 0,
      finalPrice: 0,
    },
    liveSession: {
      title: "DIGITAL HUB LIVE SESSION",
      buttonText: "Add Digital Hub+",
      price: 0,
      discount: 0,
      finalPrice: 0,
    },
  },
  tabs: {
    syllabus: { label: "Syllabus" },
    assignment: { label: "Assignment" },
    assessment: { label: "Assessment & Certificates" },
    schedule: { label: "Live Schedule +" },
    simulator: { label: "Simulator" },
  },
};

export default function CourseAddTab({ onBack }) {
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const joditConfig = {
    readonly: false,
    height: 200,
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
      arrowlist: {
        icon: "➤",
        tooltip: "Arrow List",
        exec: (editor) => {
          const list =
            editor.selection.ancestor("ul") || editor.selection.ancestor("ol");
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
  };

  useEffect(() => {
    // Load categories
    axios
      .get(`${API_BASE}/categories`)
      .then((res) => {
        setCategoryOptions(
          res.data.map((c) => ({
            value: c.category,
            label: c.category,
          }))
        );
      })
      .catch(() => setCategoryOptions([]));
  }, []);

  const handleCategoryChange = (option) =>
    setForm((f) => ({ ...f, category: option }));

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setForm((f) => ({
      ...f,
      [name]: files ? files[0] : value,
    }));
  };

  // Debounced change handler to prevent typing interruption
  const debouncedJoditChange = useCallback(
    (field) => (value) => {
      setForm((f) => ({ ...f, [field]: value }));
    },
    []
  );

  const handleJoditChange = (field) => (value) => {
    setForm((f) => ({ ...f, [field]: value }));
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
    setError("");

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
            "recordedSessionPrice",
            "recordedSessionDiscount",
            "liveSessionPrice",
            "liveSessionDiscount",
            "recordedSessionCenterPrice",
            "recordedSessionCenterDiscount",
            "liveSessionCenterPrice",
            "liveSessionCenterDiscount",
            "pricing",
          ].includes(k)
        )
          return;
        if (v === null || v === undefined) return;

        if (v instanceof File) {
          fd.append(k, v);
        } else if (v instanceof FileList) {
          Array.from(v).forEach((file) => fd.append(k, file));
        } else if (Array.isArray(v)) {
          v.forEach((item, idx) =>
            fd.append(
              `${k}[${idx}]`,
              typeof item === "object" ? JSON.stringify(item) : item
            )
          );
        } else if (typeof v === "object") {
          fd.append(k, JSON.stringify(v));
        } else {
          fd.append(k, v);
        }
      });

      await axios.post(`${API_BASE}/courses`, fd);

      setForm(initialForm);
      if (onBack) onBack();
    } catch (err) {
      setError(err?.response?.data?.message || "Error adding course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[2400px] mx-auto bg-white rounded-2xl p-8 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-bold">Create Course</h3>
        <button
          type="button"
          onClick={onBack}
          className="bg-blue-700 text-white px-5 py-2 rounded flex items-center gap-2"
        >
          <FaArrowLeft /> View Courses
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Top Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-5">
            <div>
              <label className="block mb-1 font-semibold">
                Select Category
              </label>
              <Select
                options={categoryOptions}
                value={form.category}
                onChange={handleCategoryChange}
                placeholder="Select Category"
                required
                styles={{ control: (base) => ({ ...base, minHeight: "40px" }) }}
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">Course Name</label>
              <input
                name="title"
                placeholder="Enter course name"
                className="w-full border p-2 rounded"
                value={form.title}
                onChange={handleInputChange}
                required
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">Course Image</label>
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleInputChange}
                className="w-full"
              />
              {/* Show preview of selected image */}
              {form.image && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-1">Image Preview:</p>
                  <img
                    src={URL.createObjectURL(form.image)}
                    alt="Course Preview"
                    className="h-24 rounded shadow border"
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block mb-1 font-semibold">Discount (%)</label>
              <input
                name="discount"
                type="number"
                className="w-full border p-2 rounded"
                value={form.discount}
                onChange={handleInputChange}
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">
                Course Video Link
              </label>
              <input
                name="video"
                placeholder="Enter the course video link"
                className="w-full border p-2 rounded"
                value={form.video}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block mb-1 font-semibold">Course Slug</label>
              <input
                name="slug"
                placeholder="Enter course slug"
                className="w-full border p-2 rounded"
                value={form.slug || ""}
                onChange={handleInputChange}
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">Actual Price</label>
              <input
                name="price"
                placeholder="Enter actual price"
                type="number"
                className="w-full border p-2 rounded"
                value={form.price}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">
                Price After Discount
              </label>
              <input
                name="finalPrice"
                placeholder="Final Price"
                type="number"
                className="w-full border p-2 rounded bg-gray-100"
                value={getFinalPrice()}
                readOnly
              />
            </div>

            {/* Recorded Session Pricing */}
            <div className="border p-4 rounded-lg bg-green-50">
              <h4 className="font-semibold text-green-800 mb-3">
                Recorded Session Pricing
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block mb-1 font-semibold">
                    Recorded Session Price
                  </label>
                  <input
                    name="recordedSessionPrice"
                    type="number"
                    placeholder="Enter recorded session price"
                    className="w-full border p-2 rounded"
                    value={form.recordedSessionPrice}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">
                    Recorded Session Discount (%)
                  </label>
                  <input
                    name="recordedSessionDiscount"
                    type="number"
                    placeholder="Enter discount percentage"
                    className="w-full border p-2 rounded"
                    value={form.recordedSessionDiscount}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">
                    Recorded Session Final Price
                  </label>
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
                  <label className="block mb-1 font-semibold">
                    Live Session Price
                  </label>
                  <input
                    name="liveSessionPrice"
                    type="number"
                    placeholder="Enter live session price"
                    className="w-full border p-2 rounded"
                    value={form.liveSessionPrice}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">
                    Live Session Discount (%)
                  </label>
                  <input
                    name="liveSessionDiscount"
                    type="number"
                    placeholder="Enter discount percentage"
                    className="w-full border p-2 rounded"
                    value={form.liveSessionDiscount}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">
                    Live Session Final Price
                  </label>
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
                  <label className="block mb-1 font-semibold">
                    Recorded Session + Center Price
                  </label>
                  <input
                    name="recordedSessionCenterPrice"
                    type="number"
                    placeholder="Enter recorded session + center price"
                    className="w-full border p-2 rounded"
                    value={form.recordedSessionCenterPrice}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">
                    Recorded Session + Center Discount (%)
                  </label>
                  <input
                    name="recordedSessionCenterDiscount"
                    type="number"
                    placeholder="Enter discount percentage"
                    className="w-full border p-2 rounded"
                    value={form.recordedSessionCenterDiscount}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">
                    Recorded Session + Center Final Price
                  </label>
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
                  <label className="block mb-1 font-semibold">
                    Live Session + Center Price
                  </label>
                  <input
                    name="liveSessionCenterPrice"
                    type="number"
                    placeholder="Enter live session + center price"
                    className="w-full border p-2 rounded"
                    value={form.liveSessionCenterPrice}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">
                    Live Session + Center Discount (%)
                  </label>
                  <input
                    name="liveSessionCenterDiscount"
                    type="number"
                    placeholder="Enter discount percentage"
                    className="w-full border p-2 rounded"
                    value={form.liveSessionCenterDiscount}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">
                    Live Session + Center Final Price
                  </label>
                  <input
                    value={getLiveSessionCenterFinalPrice()}
                    readOnly
                    className="w-full border p-2 rounded bg-gray-100"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block mb-1 font-semibold">Status</label>
              <select
                name="status"
                className="w-full border p-2 rounded"
                value={form.status}
                onChange={handleInputChange}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Jodit Editors */}
        <div>
          <label className="block mb-1 font-semibold text-lg">
            Course Description
          </label>
          <JoditEditor
            value={form.description}
            config={joditConfig}
            onChange={debouncedJoditChange("description")}
            onBlur={handleJoditChange("description")}
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold border-b mb-3 pb-1">
            Exam and Certification
          </h2>
          <label className="block mb-1 font-semibold">Description</label>
          <JoditEditor
            value={form.examCert}
            config={joditConfig}
            onChange={debouncedJoditChange("examCert")}
            onBlur={handleJoditChange("examCert")}
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold border-b mb-3 pb-1">
            Case Study
          </h2>
          <label className="block mb-1 font-semibold">Description</label>
          <JoditEditor
            value={form.caseStudy}
            config={joditConfig}
            onChange={debouncedJoditChange("caseStudy")}
            onBlur={handleJoditChange("caseStudy")}
          />
        </div>

        {/* Dynamic Configuration Section */}
        <div className="border-t pt-8 mt-8">
          <h2 className="text-xl font-semibold mb-3">Dynamic Configuration</h2>

          {/* Pricing Configuration */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">
              Pricing Cards Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recorded Session */}
              <div className="border p-4 rounded-lg">
                <h4 className="font-semibold mb-3 text-green-600">
                  Recorded Session
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      className="w-full border p-2 rounded"
                      value={form.pricing.recordedSession.title}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          pricing: {
                            ...f.pricing,
                            recordedSession: {
                              ...f.pricing.recordedSession,
                              title: e.target.value,
                            },
                          },
                        }))
                      }
                      placeholder="DIGITAL HUB+RECORDED SESSION"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Button Text
                    </label>
                    <input
                      type="text"
                      className="w-full border p-2 rounded"
                      value={form.pricing.recordedSession.buttonText}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          pricing: {
                            ...f.pricing,
                            recordedSession: {
                              ...f.pricing.recordedSession,
                              buttonText: e.target.value,
                            },
                          },
                        }))
                      }
                      placeholder="Add Digital Hub"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Actual Price (₹)
                    </label>
                    <input
                      type="number"
                      className="w-full border p-2 rounded"
                      value={form.pricing.recordedSession.actualPrice}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          pricing: {
                            ...f.pricing,
                            recordedSession: {
                              ...f.pricing.recordedSession,
                              actualPrice: e.target.value,
                            },
                          },
                        }))
                      }
                      placeholder="e.g., 5000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Discount Price (₹)
                    </label>
                    <input
                      type="number"
                      className="w-full border p-2 rounded"
                      value={form.pricing.recordedSession.discountPrice}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          pricing: {
                            ...f.pricing,
                            recordedSession: {
                              ...f.pricing.recordedSession,
                              discountPrice: e.target.value,
                            },
                          },
                        }))
                      }
                      placeholder="e.g., 12000"
                    />
                  </div>
                </div>
              </div>

              {/* Live Session */}
              <div className="border p-4 rounded-lg">
                <h4 className="font-semibold mb-3 text-blue-600">
                  Live Session
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      className="w-full border p-2 rounded"
                      value={form.pricing.liveSession.title}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          pricing: {
                            ...f.pricing,
                            liveSession: {
                              ...f.pricing.liveSession,
                              title: e.target.value,
                            },
                          },
                        }))
                      }
                      placeholder="DIGITAL HUB+LIVE SESSION"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Button Text
                    </label>
                    <input
                      type="text"
                      className="w-full border p-2 rounded"
                      value={form.pricing.liveSession.buttonText}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          pricing: {
                            ...f.pricing,
                            liveSession: {
                              ...f.pricing.liveSession,
                              buttonText: e.target.value,
                            },
                          },
                        }))
                      }
                      placeholder="Add Digital Hub+"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Price Multiplier
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full border p-2 rounded"
                      value={form.pricing.liveSession.priceMultiplier}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          pricing: {
                            ...f.pricing,
                            liveSession: {
                              ...f.pricing.liveSession,
                              priceMultiplier:
                                parseFloat(e.target.value) || 1.5,
                            },
                          },
                        }))
                      }
                      placeholder="1.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Actual Price (₹)
                    </label>
                    <input
                      type="number"
                      className="w-full border p-2 rounded"
                      value={form.pricing.liveSession.actualPrice}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          pricing: {
                            ...f.pricing,
                            liveSession: {
                              ...f.pricing.liveSession,
                              actualPrice: e.target.value,
                            },
                          },
                        }))
                      }
                      placeholder="e.g., 7500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Discount Price (₹)
                    </label>
                    <input
                      type="number"
                      className="w-full border p-2 rounded"
                      value={form.pricing.liveSession.discountPrice}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          pricing: {
                            ...f.pricing,
                            liveSession: {
                              ...f.pricing.liveSession,
                              discountPrice: e.target.value,
                            },
                          },
                        }))
                      }
                      placeholder="e.g., 24000"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Configuration */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">
              Tab Labels Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Syllabus Tab
                </label>
                <input
                  type="text"
                  className="w-full border p-2 rounded"
                  value={form.tabs.syllabus.label}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      tabs: {
                        ...f.tabs,
                        syllabus: { label: e.target.value },
                      },
                    }))
                  }
                  placeholder="Syllabus"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Assignment Tab
                </label>
                <input
                  type="text"
                  className="w-full border p-2 rounded"
                  value={form.tabs.assignment.label}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      tabs: {
                        ...f.tabs,
                        assignment: { label: e.target.value },
                      },
                    }))
                  }
                  placeholder="Assignment"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Assessment Tab
                </label>
                <input
                  type="text"
                  className="w-full border p-2 rounded"
                  value={form.tabs.assessment.label}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      tabs: {
                        ...f.tabs,
                        assessment: { label: e.target.value },
                      },
                    }))
                  }
                  placeholder="Assessment & Certificates"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Schedule Tab
                </label>
                <input
                  type="text"
                  className="w-full border p-2 rounded"
                  value={form.tabs.schedule.label}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      tabs: {
                        ...f.tabs,
                        schedule: { label: e.target.value },
                      },
                    }))
                  }
                  placeholder="Live Schedule +"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Simulator Tab
                </label>
                <input
                  type="text"
                  className="w-full border p-2 rounded"
                  value={form.tabs.simulator.label}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      tabs: {
                        ...f.tabs,
                        simulator: { label: e.target.value },
                      },
                    }))
                  }
                  placeholder="Simulator"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SEO Section */}
        <div className="border-t pt-8 mt-8">
          <h2 className="text-xl font-semibold mb-3">SEO Section</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div>
              <label className="block mb-1 font-semibold">Title</label>
              <input
                name="seoTitle"
                placeholder="Enter title"
                className="w-full border p-2 rounded"
                value={form.seoTitle}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">Description</label>
              <JoditEditor
                value={form.seoDescription}
                config={{ ...joditConfig, height: 120 }}
                onChange={debouncedJoditChange("seoDescription")}
                onBlur={handleJoditChange("seoDescription")}
              />
            </div>
          </div>
          <div className="mt-5">
            <label className="block mb-1 font-semibold">Keywords</label>
            <textarea
              name="seoKeywords"
              placeholder="Enter keywords"
              className="w-full border p-2 rounded min-h-[48px]"
              value={form.seoKeywords}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* Meta Tags Section */}
        <div className="border-t pt-8 mt-8">
          <h2 className="text-xl font-semibold mb-3">Meta Tags</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div>
              <label className="block mb-1 font-semibold">Meta Title</label>
              <input
                name="metaTitle"
                placeholder="Enter meta title for additional SEO"
                className="w-full border p-2 rounded"
                value={form.metaTitle}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">
                Meta Description
              </label>
              <JoditEditor
                value={form.metaDescription}
                config={{ ...joditConfig, height: 120 }}
                onChange={debouncedJoditChange("metaDescription")}
                onBlur={handleJoditChange("metaDescription")}
              />
            </div>
          </div>
          <div className="mt-5">
            <label className="block mb-1 font-semibold">Meta Keywords</label>
            <textarea
              name="metaKeywords"
              placeholder="Enter meta keywords separated by commas"
              className="w-full border p-2 rounded min-h-[48px]"
              value={form.metaKeywords}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {error && <div className="text-red-600 mt-4">{error}</div>}
        <div className="flex justify-end mt-10">
          <button
            type="submit"
            className="bg-blue-600 text-white px-7 py-2 rounded flex items-center gap-2 text-lg"
            disabled={loading}
          >
            <FaPlus /> {loading ? "Saving..." : "Add Course"}
          </button>
        </div>
      </form>
    </div>
  );
}
