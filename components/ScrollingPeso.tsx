"use client";

import { useState, useEffect, useRef } from "react";

export default function ScrollingPeso({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    const from = prevValue.current;
    const to = value;
    prevValue.current = value;
    const startTime = performance.now();
    const duration = 800;

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    }

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  const formatted = (() => {
    const v = display;
    if (v >= 1_000_000_000) return `₱${(v / 1_000_000_000).toFixed(2)}B`;
    if (v >= 1_000_000) return `₱${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1_000) return `₱${Math.round(v).toLocaleString("en-PH")}`;
    return `₱${Math.round(v).toLocaleString("en-PH")}`;
  })();

  return <span className={className}>{formatted}</span>;
}
