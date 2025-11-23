import { useRef, useEffect } from "react";

/**
 * Previous value hook
 *
 * A custom hook that returns the previous value of a variable.
 * Useful for comparing current vs. previous values in useEffect,
 * or for animations that need to know the previous state.
 *
 * @param value - The value to track
 * @returns The previous value (undefined on first render)
 *
 * @example
 * ```tsx
 * function Counter() {
 *   const [count, setCount] = useState(0);
 *   const prevCount = usePrevious(count);
 *
 *   return (
 *     <div>
 *       <p>Current: {count}</p>
 *       <p>Previous: {prevCount}</p>
 *       <button onClick={() => setCount(count + 1)}>Increment</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * function VideoPlayer({ currentTime }) {
 *   const prevTime = usePrevious(currentTime);
 *
 *   useEffect(() => {
 *     if (prevTime !== undefined && Math.abs(currentTime - prevTime) > 1) {
 *       console.log('User seeked the video');
 *     }
 *   }, [currentTime, prevTime]);
 * }
 * ```
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
