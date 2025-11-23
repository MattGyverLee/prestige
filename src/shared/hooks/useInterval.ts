import { useEffect, useRef } from "react";

/**
 * Declarative interval hook
 *
 * A custom hook that sets up an interval with automatic cleanup.
 * The callback is kept up-to-date using a ref, so you can pass a changing
 * callback without restarting the interval.
 *
 * @param callback - Function to call on each interval tick
 * @param delay - Delay in milliseconds between calls, or null to pause the interval
 *
 * @example
 * ```tsx
 * function Counter() {
 *   const [count, setCount] = useState(0);
 *
 *   useInterval(() => {
 *     setCount(count + 1);
 *   }, 1000);
 *
 *   return <div>{count}</div>;
 * }
 * ```
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
