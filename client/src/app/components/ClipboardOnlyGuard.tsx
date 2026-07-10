"use client";

import { useEffect } from "react";

const EDITABLE_SELECTOR =
  'input, textarea, [contenteditable="true"], [contenteditable=""], [role="textbox"]';

const ALLOWED_SHORTCUT_KEYS = new Set(["a", "c", "v"]);
const NAVIGATION_KEYS = new Set([
  "Tab",
  "Shift",
  "Control",
  "Alt",
  "Meta",
  "Escape",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
]);

function isTextEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const editableRoot = target.closest(EDITABLE_SELECTOR);
  if (!editableRoot) {
    return false;
  }

  // Fields marked with data-allow-typing opt out of the paste-only guard
  if (editableRoot.closest('[data-allow-typing="true"]')) {
    return false;
  }

  if (editableRoot instanceof HTMLInputElement) {
    return ![
      "button",
      "submit",
      "reset",
      "checkbox",
      "radio",
      "file",
      "range",
      "color",
    ].includes(editableRoot.type);
  }

  return true;
}

export default function ClipboardOnlyGuard() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isTextEditableTarget(event.target)) {
        return;
      }

      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const hasModifier = event.ctrlKey || event.metaKey;

      if (hasModifier && ALLOWED_SHORTCUT_KEYS.has(key)) {
        return;
      }

      if (NAVIGATION_KEYS.has(event.key)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    };

    const handleBeforeInput = (event: InputEvent) => {
      if (!isTextEditableTarget(event.target)) {
        return;
      }

      if (event.inputType.startsWith("insertFromPaste")) {
        return;
      }

      if (
        event.inputType.startsWith("insertText") ||
        event.inputType.startsWith("insertComposition") ||
        event.inputType.startsWith("deleteContent")
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const handleCut = (event: ClipboardEvent) => {
      if (!isTextEditableTarget(event.target)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    };

    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("beforeinput", handleBeforeInput, true);
    document.addEventListener("cut", handleCut, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("beforeinput", handleBeforeInput, true);
      document.removeEventListener("cut", handleCut, true);
    };
  }, []);

  return null;
}
