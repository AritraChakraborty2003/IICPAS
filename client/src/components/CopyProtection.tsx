"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import toast from "react-hot-toast";

export default function CopyProtection() {
  const pathname = usePathname();

  useEffect(() => {
    const isProtectionDisabledPage = () => {
      const disabledPaths = [
        "/admin-dashboard",
        "/student-login",
        "/student-dashboard",
        "/center-login",
        "/center-dashboard",
        "/teacher-login",
        "/teacher-dashboard",
      ];
      return disabledPaths.some((path) =>
        pathname?.includes(path)
      );
    };

    // Skip protection for auth/dashboard pages.
    if (isProtectionDisabledPage()) {
      document.body.removeAttribute("data-copy-protected");
      return;
    }

    document.body.setAttribute("data-copy-protected", "true");

    let lastToastAt = 0;
    const showProtectionMessage = () => {
      const now = Date.now();
      if (now - lastToastAt < 1500) return;
      lastToastAt = now;

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
      e.preventDefault();
      showProtectionMessage();
      return false;
    };

    // Prevent copy operations
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      showProtectionMessage();
      return false;
    };

    // Prevent cut operations
    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      showProtectionMessage();
      return false;
    };

    // Prevent text selection
    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    const isEditableTarget = (target: EventTarget | null) => {
      const element = target as HTMLElement | null;
      if (!element) return false;
      const tagName = element.tagName;
      return (
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        element.isContentEditable
      );
    };

    // Block keyboard shortcuts (Ctrl/Cmd + C/X/V/A/U)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;

      // Check for Ctrl or Cmd key
      if (e.ctrlKey || e.metaKey) {
        // Block Ctrl/Cmd + C (Copy)
        if (e.key === "c" || e.key === "C") {
          e.preventDefault();
          showProtectionMessage();
          return false;
        }
        // Block Ctrl/Cmd + X (Cut)
        if (e.key === "x" || e.key === "X") {
          e.preventDefault();
          showProtectionMessage();
          return false;
        }
        // Block Ctrl/Cmd + V (Paste)
        if (e.key === "v" || e.key === "V") {
          e.preventDefault();
          showProtectionMessage();
          return false;
        }
        // Block Ctrl/Cmd + A (Select All)
        if (e.key === "a" || e.key === "A") {
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
        if ((e.key === "i" || e.key === "I") && e.shiftKey) {
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
      document.body.removeAttribute("data-copy-protected");
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
