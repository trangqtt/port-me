import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, type RefObject } from "react";
import type { Work3D } from "../../../data/works3d";
import { createCylinderWorld, type CylinderMode, type CylinderWorld } from "./cylinderWorld";

gsap.registerPlugin(ScrollTrigger);

interface CylinderCanvasProps {
  projects: readonly Work3D[];
  /** The tall section whose scroll range drives the rows' travel and the spin's momentum. */
  triggerRef: RefObject<HTMLElement | null>;
  mode: CylinderMode;
  onHover: (project: Work3D | null) => void;
  onFront: (project: Work3D | null) => void;
  onOpen: (project: Work3D) => void;
  onReady: () => void;
}

// Thin React shell: the scene lives in cylinderWorld and is fed the section's scroll progress by a scrubbed ScrollTrigger.
export default function CylinderCanvas({ projects, triggerRef, mode, onHover, onFront, onOpen, onReady }: CylinderCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<CylinderWorld | null>(null);
  // The world outlives any one render, so the callbacks reach it through refs rather than re-creating the scene.
  const onHoverRef = useRef(onHover);
  const onFrontRef = useRef(onFront);
  const onOpenRef = useRef(onOpen);
  const onReadyRef = useRef(onReady);
  const modeRef = useRef(mode);
  onHoverRef.current = onHover;
  onFrontRef.current = onFront;
  onOpenRef.current = onOpen;
  onReadyRef.current = onReady;

  useEffect(() => {
    modeRef.current = mode;
    worldRef.current?.setMode(mode);
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const trigger = triggerRef.current;
    if (!canvas) return;
    // The stage's own background, so the depth fog and the clear colour match whatever the section is painted.
    const styles = getComputedStyle(document.documentElement);
    const background = styles.getPropertyValue("--color-bg-primary").trim() || "#0e0803";
    const world = createCylinderWorld({
      canvas,
      projects,
      background,
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      mode: modeRef.current,
      onHover: (project) => onHoverRef.current(project),
      onFront: (project) => onFrontRef.current(project),
      onOpen: (project) => onOpenRef.current(project),
      onReady: () => onReadyRef.current(),
    });
    worldRef.current = world;

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

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full select-none" />;
}
