"use client";
import React, { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import { DEFAULT_CONTENT_FONT_FAMILY } from "../utils/contentFontFamily";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const fontWhitelist = [
  "arial",
  "roboto",
  "serif",
  "monospace",
  "comic-sans",
  "times-new-roman",
  "courier-new",
  "georgia",
];

const Editor = ({ value, onChange, uploadApi }) => {
  const quillRef = useRef(null);

  const imageHandler = () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (file && uploadApi) {
        const formData = new FormData();
        formData.append("image", file);
        const res = await fetch(uploadApi, { method: "POST", body: formData });
        if (res.ok) {
          const { url } = await res.json();
          const editor = quillRef.current.getEditor();
          const range = editor.getSelection(true);
          editor.insertEmbed(range.index, "image", url);
        }
      }
    };
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("react-quill-new").then((quillModule) => {
        const Quill = quillModule.Quill || quillModule.default?.Quill;
        if (Quill?.import && Quill.imports?.["formats/font"]) {
          const Font = Quill.import("formats/font");
          Font.whitelist = fontWhitelist;
          Quill.register(Font, true);
        }
      });
    }
  }, []);

  const modules = {
    toolbar: {
      container: [
        [{ font: fontWhitelist }],
        [{ size: ["small", false, "large", "huge"] }],
        [{ header: [1, 2, 3, false] }],
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
      handlers: {
        image: imageHandler,
      },
    },
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

  return (
    <ReactQuill
      ref={quillRef}
      value={value}
      onChange={onChange}
      modules={modules}
      formats={formats}
      theme="snow"
      className="bg-white lucida-sans-content"
      style={{ fontFamily: DEFAULT_CONTENT_FONT_FAMILY }}
    />
  );
};

export default Editor;
