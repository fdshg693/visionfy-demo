import { useState, useCallback, useRef, useEffect } from "react";

interface UseResizablePanelOptions {
  initialWidth: number;
  minWidth: number;
  maxWidth: number;
  storageKey?: string;
}

interface UseResizablePanelReturn {
  width: number;
  isResizing: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
}

function getStoredWidth(
  storageKey: string | undefined,
  fallback: number
): number {
  if (!storageKey || typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored !== null) {
      const parsed = Number(stored);
      if (!Number.isNaN(parsed)) return parsed;
    }
  } catch {
    // localStorage may be unavailable
  }
  return fallback;
}

export function useResizablePanel(
  options: UseResizablePanelOptions
): UseResizablePanelReturn {
  const { initialWidth, minWidth, maxWidth, storageKey } = options;

  const [width, setWidth] = useState<number>(() =>
    getStoredWidth(storageKey, initialWidth)
  );
  const [isResizing, setIsResizing] = useState(false);

  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const handlersRef = useRef<{
    onMouseMove: ((e: MouseEvent) => void) | null;
    onMouseUp: (() => void) | null;
  }>({ onMouseMove: null, onMouseUp: null });

  // Persist width to localStorage when it changes
  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    try {
      localStorage.setItem(storageKey, String(width));
    } catch {
      // localStorage may be unavailable
    }
  }, [width, storageKey]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      startXRef.current = e.clientX;
      startWidthRef.current = width;
      setIsResizing(true);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const onMouseMove = (ev: MouseEvent) => {
        const delta = ev.clientX - startXRef.current;
        const newWidth = Math.min(
          maxWidth,
          Math.max(minWidth, startWidthRef.current + delta)
        );
        setWidth(newWidth);
      };

      const onMouseUp = () => {
        setIsResizing(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        handlersRef.current = { onMouseMove: null, onMouseUp: null };
      };

      handlersRef.current = { onMouseMove, onMouseUp };
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [width, minWidth, maxWidth]
  );

  // Clean up listeners on unmount
  useEffect(() => {
    return () => {
      const { onMouseMove, onMouseUp } = handlersRef.current;
      if (onMouseMove) document.removeEventListener("mousemove", onMouseMove);
      if (onMouseUp) document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  return { width, isResizing, handleMouseDown };
}
