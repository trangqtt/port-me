import type { AnchorHTMLAttributes } from "react";
import { useScrambleText } from "../../hooks/useScrambleText";

interface ScrambleLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  text: string;
}

/** Anchor whose label scrambles into place on hover/focus — reuse instead of duplicating per section. */
export function ScrambleLink({ text, ...props }: ScrambleLinkProps) {
  const { display, onMouseEnter, onMouseLeave, onFocus, onBlur } =
    useScrambleText(text);

  return (
    <a
      {...props}
      aria-label={text}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {display}
    </a>
  );
}
