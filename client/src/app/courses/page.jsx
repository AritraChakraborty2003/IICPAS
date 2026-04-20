"use client";
import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";

const modules = {
  toolbar: [
    [
      {
        font: [
          "arial",
          "roboto",
          "serif",
          "monospace",
          "comic-sans",
          "times-new-roman",
          "courier-new",
          "georgia",
        ],
      },
    ],
    [{ size: ["small", false, "large", "huge"] }],
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ color: [] }, { background: [] }],
    ["bold", "italic", "underline", "strike", "blockquote", "code-block"],
    [{ script: "sub" }, { script: "super" }],
    [
      { list: "ordered" },
      { list: "bullet" },
      { indent: "-1" },
      { indent: "+1" },
    ],
    [{ align: [] }],
    ["link", "image", "video"],
    ["clean"],
  ],
};

const formats = [
  "font",
  "size",
  "header",
  "color",
  "background",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "code-block",
  "script",
  "list",
  "bullet",
  "indent",
  "align",
  "link",
  "image",
  "video",
];

export default function QuillWithVideoPreview() {
  const [content, setContent] = useState("");
  const quillRef = useRef(null);

  // State for the video preview modal
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // --- Custom video handler with preview modal ---
  const videoHandler = () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "video/*");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        setVideoFile(file);
        setVideoPreviewUrl(URL.createObjectURL(file));
        setShowVideoModal(true);
      }
    };
  };

  // Register font whitelist (optional, as in your original code)
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("react-quill-new").then((quillModule) => {
        const Quill = quillModule.Quill || quillModule.default?.Quill;
        if (
          Quill &&
          typeof Quill.import === "function" &&
          Quill.imports &&
          Quill.imports["formats/font"]
        ) {
          const Font = Quill.import("formats/font");
          Font.whitelist = [
            "arial",
            "roboto",
            "serif",
            "monospace",
            "comic-sans",
            "times-new-roman",
            "courier-new",
            "georgia",
          ];
          Quill.register("formats/font", Font, true);
        }
      });
    }
  }, []);

  const quillModules = {
    ...modules,
    toolbar: {
      container: modules.toolbar,
      handlers: {
        video: videoHandler,
        // You can also override image, if you want similar preview for images.
      },
    },
  };

  // --- The modal for previewing and confirming video upload ---
  const handleVideoInsert = async () => {
    if (!videoFile) return;
    const formData = new FormData();
    formData.append("video", videoFile);
    // POST to your backend. Update the URL/endpoint as needed!
    const res = await fetch(`${API_BASE}/blogs/upload`, {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      const { url } = await res.json();
      // Insert at Quill cursor position
      const editor = quillRef.current?.getEditor();
      const range = editor?.getSelection(true);
      if (editor && range) {
        editor.insertEmbed(range.index, "video", url);
        editor.setSelection(range.index + 1);
      }
      // Clean up state
      setShowVideoModal(false);
      setVideoFile(null);
      setVideoPreviewUrl(null);
    }
  };

  // --- Render ---
  return (
    <div className="max-w-3xl mx-auto my-8">
      <h2 className="text-2xl font-bold mb-4">
        React Quill With Video Preview Modal
      </h2>

      <ReactQuill
        ref={quillRef}
        value={content}
        onChange={setContent}
        modules={quillModules}
        formats={formats}
        theme="snow"
        className="lucida-sans-content"
      />

      {/* Video Preview Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-xl space-y-4 w-full max-w-md mx-auto">
            <h3 className="text-lg font-semibold">
              Preview Video Before Inserting
            </h3>
            {videoPreviewUrl && (
              <video
                src={videoPreviewUrl}
                controls
                className="rounded w-full max-h-64"
              />
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowVideoModal(false);
                  setVideoFile(null);
                  setVideoPreviewUrl(null);
                }}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleVideoInsert}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Insert Video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
