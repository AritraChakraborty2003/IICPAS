"use client";

import React, { useState, useRef, useEffect } from "react";
import { DEFAULT_CONTENT_FONT_FAMILY } from "../utils/contentFontFamily";
import { 
  FaBold, 
  FaItalic, 
  FaUnderline, 
  FaListUl, 
  FaListOl, 
  FaLink, 
  FaImage, 
  FaAlignLeft, 
  FaAlignCenter, 
  FaAlignRight,
  FaCode,
  FaEye,
  FaEyeSlash
} from "react-icons/fa";

const RichTextEditor = ({ 
  value = "", 
  onChange, 
  placeholder = "Compose your email...",
  height = "400px" 
}) => {
  const [isPreview, setIsPreview] = useState(false);
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && !isPreview) {
      editorRef.current.innerHTML = value;
    }
  }, [value, isPreview]);

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
    handleContentChange();
  };

  const handleContentChange = () => {
    if (editorRef.current && !isPreview) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      execCommand("createLink", url);
    }
  };

  const insertImage = () => {
    const url = prompt("Enter image URL:");
    if (url) {
      const img = `<img src="${url}" alt="Image" style="max-width: 100%; height: auto;" />`;
      execCommand("insertHTML", img);
    }
  };

  const togglePreview = () => {
    setIsPreview(!isPreview);
    if (!isPreview) {
      // Switching to preview mode
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  const getPreviewContent = () => {
    return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => execCommand("bold")}
            className="p-2 hover:bg-gray-200 rounded"
            title="Bold"
          >
            <FaBold />
          </button>
          <button
            type="button"
            onClick={() => execCommand("italic")}
            className="p-2 hover:bg-gray-200 rounded"
            title="Italic"
          >
            <FaItalic />
          </button>
          <button
            type="button"
            onClick={() => execCommand("underline")}
            className="p-2 hover:bg-gray-200 rounded"
            title="Underline"
          >
            <FaUnderline />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300"></div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => execCommand("justifyLeft")}
            className="p-2 hover:bg-gray-200 rounded"
            title="Align Left"
          >
            <FaAlignLeft />
          </button>
          <button
            type="button"
            onClick={() => execCommand("justifyCenter")}
            className="p-2 hover:bg-gray-200 rounded"
            title="Align Center"
          >
            <FaAlignCenter />
          </button>
          <button
            type="button"
            onClick={() => execCommand("justifyRight")}
            className="p-2 hover:bg-gray-200 rounded"
            title="Align Right"
          >
            <FaAlignRight />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300"></div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => execCommand("insertUnorderedList")}
            className="p-2 hover:bg-gray-200 rounded"
            title="Bullet List"
          >
            <FaListUl />
          </button>
          <button
            type="button"
            onClick={() => execCommand("insertOrderedList")}
            className="p-2 hover:bg-gray-200 rounded"
            title="Numbered List"
          >
            <FaListOl />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300"></div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={insertLink}
            className="p-2 hover:bg-gray-200 rounded"
            title="Insert Link"
          >
            <FaLink />
          </button>
          <button
            type="button"
            onClick={insertImage}
            className="p-2 hover:bg-gray-200 rounded"
            title="Insert Image"
          >
            <FaImage />
          </button>
        </div>

        <div className="flex-1"></div>

        <button
          type="button"
          onClick={togglePreview}
          className="p-2 hover:bg-gray-200 rounded flex items-center gap-2"
          title={isPreview ? "Edit Mode" : "Preview Mode"}
        >
          {isPreview ? <FaEyeSlash /> : <FaEye />}
          {isPreview ? "Edit" : "Preview"}
        </button>
      </div>

      {/* Editor/Preview Area */}
      <div className="relative">
        {isPreview ? (
          <div 
            className="p-4 min-h-[400px] bg-white lucida-sans-content"
            style={{ height, fontFamily: DEFAULT_CONTENT_FONT_FAMILY }}
            dangerouslySetInnerHTML={{ __html: getPreviewContent() }}
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            className="p-4 min-h-[400px] bg-white focus:outline-none lucida-sans-content"
            style={{ height, fontFamily: DEFAULT_CONTENT_FONT_FAMILY }}
            onInput={handleContentChange}
            onBlur={handleContentChange}
            data-placeholder={placeholder}
            suppressContentEditableWarning={true}
          />
        )}
      </div>

      {/* Placeholder styling */}
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
