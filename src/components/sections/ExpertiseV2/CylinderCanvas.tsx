import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState, type RefObject } from "react";
import type { Work3D } from "../../../data/works3d";
import { cn } from "../../../lib/utils";
import { createCylinderWorld, type CylinderWorld } from "./cylinderWorld";

gsap.registerPlugin(ScrollTrigger);

interface CylinderCanvasProps {
  projects: readonly Work3D[];
  /** The tall section whose scroll range drives the helix. */
  triggerRef: RefObject<HTMLElement | null>;
  onHover: (project: Work3D | null) => void;
  onOpen: (project: Work3D) => void;
  /** Height in px of copy laid over the bottom of the stage; the platform is kept above it. */
  bottomInset?: number;
}

// Thin React shell: the scene lives in cylinderWorld and is fed the section's scroll progress by a scrubbed ScrollTrigger.
export default function CylinderCanvas({ projects, triggerRef, onHover, onOpen, bottomInset = 0 }: CylinderCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<CylinderWorld | null>(null);
  const onHoverRef = useRef(onHover);
  const onOpenRef = useRef(onOpen);
  const bottomInsetRef = useRef(bottomInset);
  const [revealed, setRevealed] = useState(false);
  onHoverRef.current = onHover;
  onOpenRef.current = onOpen;

  useEffect(() => {
    bottomInsetRef.current = bottomInset;
    worldRef.current?.setBottomInset(bottomInset);
  }, [bottomInset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const trigger = triggerRef.current;
    if (!canvas) return;
    const styles = getComputedStyle(document.documentElement);
    const background = styles.getPropertyValue("--color-bg-primary").trim() || "#0e0803";
    const world = createCylinderWorld({
      canvas,
      projects,
      background,
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      onHover: (project) => onHoverRef.current(project),
      onOpen: (project) => onOpenRef.current(project),
      onReady: () => setRevealed(true),
    });
    worldRef.current = world;
    world.setBottomInset(bottomInsetRef.current);

    const scrollTrigger = trigger
      ? ScrollTrigger.create({
          trigger,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          onUpdate: (self) => world.setProgress(self.progress),
        })
      : null;
    world.setProgress(scrollTrigger?.progress ?? 0);

    return () => {
      scrollTrigger?.kill();
      world.destroy();
      worldRef.current = null;
    };
  }, [projects, triggerRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn(
        "absolute inset-0 block h-full w-full select-none transition-opacity duration-700 motion-reduce:transition-none",
        revealed ? "opacity-100" : "opacity-0",
      )}
    />
  );
}
