import { gsap } from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const DURATION = 0.5;

/** Text-scramble hover effect: characters randomize then resolve left-to-right into the real label. */
export function useScrambleText(text: string) {
  const [display, setDisplay] = useState(text);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  }, []);

  useEffect(() => {
    setDisplay(text);
  }, [text]);

  const scramble = useCallback(() => {
    if (prefersReducedMotion.current) return;
    tweenRef.current?.kill();

    const chars = text.split("");
    const progressPerChar = 1 / chars.length;
    const state = { value: 0 };

    tweenRef.current = gsap.to(state, {
      value: 1,
      duration: DURATION,
      ease: "none",
      onUpdate: () => {
        const revealed = Math.floor(state.value / progressPerChar);
        setDisplay(
          chars
            .map((char, i) => {
              if (char === " ") return " ";
              if (i < revealed) return char;
              return SCRAMBLE_CHARS[
                Math.floor(Math.random() * SCRAMBLE_CHARS.length)
              ];
            })
            .join(""),
        );
      },
      onComplete: () => setDisplay(text),
    });
  }, [text]);

  const reset = useCallback(() => {
    tweenRef.current?.kill();
    setDisplay(text);
  }, [text]);

  useEffect(() => {
    return () => {
      tweenRef.current?.kill();
    };
  }, []);

  return {
    display,
    onMouseEnter: scramble,
    onFocus: scramble,
    onMouseLeave: reset,
    onBlur: reset,
  };
}
