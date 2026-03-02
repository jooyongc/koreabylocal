import { useState, useEffect, useRef } from "react";

interface ScrollState {
  direction: "up" | "down";
  y: number;
  pastThreshold: boolean;
}

export function useScrollDirection(threshold = 200): ScrollState {
  const [state, setState] = useState<ScrollState>({
    direction: "up",
    y: 0,
    pastThreshold: false,
  });
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const direction = y > lastY.current ? "down" : "up";
      lastY.current = y;
      setState({ direction, y, pastThreshold: y > threshold });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return state;
}
