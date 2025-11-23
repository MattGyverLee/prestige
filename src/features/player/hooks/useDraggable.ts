import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Custom hook for handling drag interactions on UI elements
 *
 * Provides a reusable drag interaction pattern for creating custom sliders,
 * volume controls, and other draggable UI elements. The hook manages mouse
 * down/move/up events and calculates a normalized value (0-1) based on the
 * drag position within the element's bounds.
 *
 * @param onDrag - Callback function called during drag with normalized value (0-1)
 * @returns Object containing isDragging state and handleMouseDown event handler
 *
 * @example
 * ```tsx
 * function VolumeSlider() {
 *   const [volume, setVolume] = useState(0.5);
 *   const { isDragging, handleMouseDown } = useDraggable(setVolume);
 *
 *   return (
 *     <div
 *       onMouseDown={handleMouseDown}
 *       style={{ width: '200px', height: '20px', background: '#ccc' }}
 *     >
 *       <div style={{ width: `${volume * 100}%`, height: '100%', background: '#007bff' }} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useDraggable(onDrag: (value: number) => void) {
  const [isDragging, setIsDragging] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);
  const onDragRef = useRef(onDrag);

  // Keep onDrag callback up-to-date without recreating handlers
  useEffect(() => {
    onDragRef.current = onDrag;
  }, [onDrag]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect();
      const value = (e.clientX - rect.left) / rect.width;
      onDragRef.current(Math.max(0, Math.min(1, value)));
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    elementRef.current = e.currentTarget;
    setIsDragging(true);

    // Immediately set value on click
    const rect = e.currentTarget.getBoundingClientRect();
    const value = (e.clientX - rect.left) / rect.width;
    onDragRef.current(Math.max(0, Math.min(1, value)));
  }, []);

  // Set up global mouse move/up listeners when dragging
  useEffect(() => {
    if (!isDragging) return;

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return { isDragging, handleMouseDown };
}
