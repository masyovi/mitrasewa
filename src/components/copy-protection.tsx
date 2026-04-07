"use client";

import { useEffect } from "react";

export function CopyProtection() {
  useEffect(() => {
    // Block right-click context menu
    function handleContextMenu(e: MouseEvent) {
      e.preventDefault();
    }

    // Block text selection via mouse
    function handleSelectStart(e: Event) {
      e.preventDefault();
    }

    // Block copy, cut, paste
    function handleKeyDown(e: KeyboardEvent) {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && (e.key === "c" || e.key === "x" || e.key === "u" || e.key === "a" || e.key === "s")) {
        e.preventDefault();
      }
    }

    // Block drag
    function handleDragStart(e: DragEvent) {
      e.preventDefault();
    }

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("selectstart", handleSelectStart);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("dragstart", handleDragStart);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("selectstart", handleSelectStart);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("dragstart", handleDragStart);
    };
  }, []);

  return null;
}
