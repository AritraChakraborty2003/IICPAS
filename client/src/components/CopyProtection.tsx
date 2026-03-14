"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import toast from "react-hot-toast";

const AUTH_ROUTES = new Set([
  "/login",
  "/register",
  "/student-login",
  "/teacher-login",
  "/teacher-register",
  "/center-login",
  "/center-register",
]);

export default function CopyProtection() {
  const pathname = usePathname();

  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) {
        return false;
      }

      const editableRoot = target.closest(
        'input, textarea, [contenteditable="true"], [contenteditable=""], [data-allow-copy]'
      );

      if (!editableRoot) {
        return false;
      }

      if (editableRoot instanceof HTMLInputElement) {
        return !["button", "submit", "reset", "checkbox", "radio", "file"].includes(
          editableRoot.type
        );
      }

      return true;
    };

    // Check if we're on an admin dashboard page
    const isAdminDashboard = () => {
      return pathname?.includes("/admin-dashboard") ?? false;
    };

    // Check if we're on an auth page
    const isAuthPage = () => {
      return Boolean(pathname && AUTH_ROUTES.has(pathname));
    };

    // Skip protection on admin dashboard and auth pages
    if (isAdminDashboard() || isAuthPage()) {
      return;
    }

    // Function to show protection message
    const showProtectionMessage = () => {
      toast.error("Content is protected and cannot be copied.", {
        duration: 3000,
        style: {
          background: "#ef4444",
          color: "#fff",
        },
      });
    };

    // Prevent right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      if (isEditableTarget(e.target)) {
        return true;
      }

      e.preventDefault();
      showProtectionMessage();
      return false;
    };

    // Prevent copy operations
    const handleCopy = (e: ClipboardEvent) => {
      if (isEditableTarget(e.target)) {
        return true;
      }

      e.preventDefault();
      showProtectionMessage();
      return false;
    };

    // Prevent cut operations
    const handleCut = (e: ClipboardEvent) => {
      if (isEditableTarget(e.target)) {
        return true;
      }

      e.preventDefault();
      showProtectionMessage();
      return false;
    };

    // Prevent text selection
    const handleSelectStart = (e: Event) => {
      if (isEditableTarget(e.target)) {
        return true;
      }

      e.preventDefault();
      return false;
    };

    // Block keyboard shortcuts (Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+A, Cmd+C, Cmd+X, Cmd+V, Cmd+A)
    const handleKeyDown = (e: KeyboardEvent) => {
      const editableTarget = isEditableTarget(e.target);

      // Check for Ctrl or Cmd key
      if (e.ctrlKey || e.metaKey) {
        // Block Ctrl/Cmd + C (Copy)
        if ((e.key === "c" || e.key === "C") && !editableTarget) {
          e.preventDefault();
          showProtectionMessage();
          return false;
        }
        // Block Ctrl/Cmd + X (Cut)
        if ((e.key === "x" || e.key === "X") && !editableTarget) {
          e.preventDefault();
          showProtectionMessage();
          return false;
        }
        // Block Ctrl/Cmd + V (Paste)
        if ((e.key === "v" || e.key === "V") && !editableTarget) {
          e.preventDefault();
          showProtectionMessage();
          return false;
        }
        // Block Ctrl/Cmd + A (Select All)
        if ((e.key === "a" || e.key === "A") && !editableTarget) {
          e.preventDefault();
          showProtectionMessage();
          return false;
        }
        // Block Ctrl/Cmd + U (View Source)
        if (e.key === "u" || e.key === "U") {
          e.preventDefault();
          showProtectionMessage();
          return false;
        }
        // Block Ctrl/Cmd + Shift + I (Developer Tools)
        if (e.key === "I" && e.shiftKey) {
          e.preventDefault();
          showProtectionMessage();
          return false;
        }
      }
      // Block F12 (Developer Tools)
      if (e.key === "F12") {
        e.preventDefault();
        showProtectionMessage();
        return false;
      }
    };

    // Add event listeners
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCut);
    document.addEventListener("selectstart", handleSelectStart);
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup event listeners on unmount
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("cut", handleCut);
      document.removeEventListener("selectstart", handleSelectStart);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [pathname]);

  // This component doesn't render anything
  return null;
}
