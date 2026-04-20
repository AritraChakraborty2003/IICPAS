/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useRef, useEffect, useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { DEFAULT_CONTENT_FONT_FAMILY } from "../utils/contentFontFamily";
import { joditFontControl } from "../utils/joditFontConfig";

// Debounce utility function
const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Dynamically import Jodit editor to avoid SSR issues
const JoditEditor = dynamic(() => import("jodit-react"), {
  ssr: false,
  loading: () => (
    <div className="p-4 border border-gray-300 rounded-md bg-gray-50 text-center">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
      <p className="text-sm text-gray-600">Loading Editor...</p>
    </div>
  ),
});

interface OptimizedJoditEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: (value: string) => void;
  placeholder?: string;
  height?: number;
  readonly?: boolean;
  className?: string;
  uploadApi?: string;
  enableVideo?: boolean;
  videoUploadApi?: string;
}

export default function OptimizedJoditEditor({
  value,
  onChange,
  onBlur,
  placeholder = "Start typing...",
  height = 400,
  readonly = false,
  className = "",
  uploadApi,
  enableVideo = false,
  videoUploadApi,
}: OptimizedJoditEditorProps) {
  const editorRef = useRef<any>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  // Debounced change handler to prevent typing interruption
  const debouncedOnChange = useCallback(
    debounce((newValue: string) => {
      onChange(newValue);
    }, 150),
    [onChange]
  );

  // Optimized Jodit configuration for smooth typing
  const editorConfig = {
    readonly,
    height,
    theme: "default",
    placeholder,
    toolbar: true,
    spellcheck: true,
    language: "en",

    // Performance optimizations
    autoHeight: false,
    saveModeInStorage: false,
    useSearch: false,
    showCharsCounter: false,
    showWordsCounter: false,
    showXPathInStatusbar: false,
    editorClassName: "lucida-sans-content",
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    defaultActionOnPaste: "insert_clear_html" as any,

    // Disable features that cause typing issues
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
      ...(enableVideo ? ["video"] : []),
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

    // Responsive toolbar
    buttonsMD: [
      "bold",
      "italic",
      "underline",
      "|",
      "ul",
      "ol",
      "arrowlist",
      "|",
      "font",
      "fontsize",
      "|",
      "image",
      "link",
      "|",
      "align",
      "undo",
      "redo",
    ],

    buttonsSM: [
      "bold",
      "italic",
      "underline",
      "|",
      "ul",
      "ol",
      "arrowlist",
      "|",
      "image",
      "link",
      "|",
      "undo",
      "redo",
    ],

    buttonsXS: ["bold", "italic", "|", "image", "link"],

    controls: {
      font: joditFontControl,
      arrowlist: {
        icon: "➤",
        tooltip: "Arrow List",
        exec: (editor: any) => {
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

    // Custom events for performance optimization
    events: {
      afterInit: function (editor: any) {
        // Store reference to editor instance
        editorRef.current = editor;

        // Optimize editor performance
        editor.options.saveModeInStorage = false;
        editor.options.autoHeight = false;
        editor.options.useSearch = false;
        editor.options.showCharsCounter = false;
        editor.options.showWordsCounter = false;
        editor.options.showXPathInStatusbar = false;

        // Optimize CSS for smooth typing
        const editorElement = editor.container.querySelector(".jodit-wysiwyg");
        if (editorElement) {
          editorElement.style.minHeight = `${height}px`;
          editorElement.style.fontSize = "16px";
          editorElement.style.lineHeight = "1.6";
          editorElement.style.fontFamily = DEFAULT_CONTENT_FONT_FAMILY;
        }

        // Optimize container performance
        const container = editor.container;
        if (container) {
          container.style.willChange = "auto";
          container.style.transform = "translateZ(0)";
        }

        // Optimize workplace performance
        const workplace = editor.workplace;
        if (workplace) {
          workplace.style.willChange = "auto";
          workplace.style.transform = "translateZ(0)";
          workplace.style.backfaceVisibility = "hidden";
        }

        // Mark editor as ready
        setIsEditorReady(true);

        // Add custom video handling if enabled
        if (enableVideo) {
          // Override video button to handle custom video insertion
          const videoButton = editor.container.querySelector(
            '[data-name="video"]'
          );
          if (videoButton) {
            videoButton.addEventListener("click", function () {
              const videoUrl = prompt(
                "Enter video URL (YouTube, Vimeo, or direct video link):"
              );
              if (videoUrl) {
                let videoHTML = "";

                // Handle YouTube URLs
                if (
                  videoUrl.includes("youtube.com") ||
                  videoUrl.includes("youtu.be")
                ) {
                  const videoId = videoUrl.match(
                    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
                  )?.[1];
                  if (videoId) {
                    videoHTML = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
                  }
                }
                // Handle Vimeo URLs
                else if (videoUrl.includes("vimeo.com")) {
                  const videoId = videoUrl.match(/vimeo\.com\/(\d+)/)?.[1];
                  if (videoId) {
                    videoHTML = `<iframe width="560" height="315" src="https://player.vimeo.com/video/${videoId}" frameborder="0" allowfullscreen></iframe>`;
                  }
                }
                // Handle direct video files
                else if (videoUrl.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv)$/i)) {
                  videoHTML = `<video controls width="400" height="300"><source src="${videoUrl}" type="video/mp4">Your browser does not support the video tag.</video>`;
                }

                if (videoHTML) {
                  editor.selection.insertHTML(videoHTML);
                } else {
                  alert("Please enter a valid video URL");
                }
              }
            });
          }
        }
      },

      // Optimize typing events
      beforeSetValueToEditor: function (value: string) {
        return value;
      },

      afterSetValueToEditor: function () {
        // Ensure smooth typing after value changes
      },

      // Handle input changes efficiently
      input: function () {
        // This will be handled by the onChange prop
      },

      // Handle keydown events for better performance
      keydown: function (event: any) {
        // Prevent unnecessary re-renders during typing
        if (event.key.length === 1) {
          // Single character input - let it process normally
        }
      },
    },

    // Image upload configuration
    uploader: uploadApi
      ? {
          insertImageAsBase64URI: false,
          url: uploadApi,
          pathVariableName: "path",
          withCredentials: false,
          headers: {},
          data: {},
          method: "POST",
          name: "files[]",
          multiple: false,
          accept: "image/*",
          process: function (resp: any) {
            return {
              files: resp.files || [],
              error: resp.error || false,
              message: resp.message || "",
            };
          },
          error: function (e: any) {
            console.error("Upload error:", e);
          },
          success: function (resp: any) {
            console.log("Upload success:", resp);
          },
        }
      : {
          insertImageAsBase64URI: true,
        },

    // Video configuration
    ...(enableVideo
      ? {
          video: {
            defaultWidth: 400,
            defaultHeight: 300,
            parseUrlToVideoEmbed: {},
          },
        }
      : {}),
  };

  // Handle editor changes with debouncing
  const handleChange = useCallback(
    (newValue: string) => {
      if (newValue !== value) {
        debouncedOnChange(newValue);
      }
    },
    [value, debouncedOnChange]
  );

  // Handle editor blur
  const handleBlur = useCallback(
    (newValue: string) => {
      if (onBlur) {
        onBlur(newValue);
      }
      // Also update immediately on blur
      onChange(newValue);
    },
    [onBlur, onChange]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (editorRef.current) {
        editorRef.current = null;
      }
    };
  }, []);

  return (
    <div className={`optimized-jodit-editor ${className}`}>
      <JoditEditor
        value={value}
        config={editorConfig}
        onChange={handleChange}
        onBlur={handleBlur}
      />

      {/* Editor status indicator */}
      {isEditorReady && (
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <span>Editor ready • Smooth typing enabled</span>
          <span className="italic">POWERED BY JODIT</span>
        </div>
      )}

      {/* Custom styles for better performance */}
      <style jsx>{`
        .optimized-jodit-editor :global(.jodit-container) {
          border-radius: 6px;
          overflow: hidden;
        }

        .optimized-jodit-editor :global(.jodit-toolbar) {
          border-bottom: 1px solid #e5e7eb;
        }

        .optimized-jodit-editor :global(.jodit-wysiwyg) {
          padding: 16px;
          font-family: ${DEFAULT_CONTENT_FONT_FAMILY};
        }

        .optimized-jodit-editor :global(.jodit-wysiwyg:focus) {
          outline: none;
        }

        .optimized-jodit-editor :global(.jodit-status-bar) {
          border-top: 1px solid #e5e7eb;
          background-color: #f9fafb;
        }
      `}</style>
    </div>
  );
}
