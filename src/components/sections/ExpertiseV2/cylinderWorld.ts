import {
  Color,
  DoubleSide,
  Group,
  MathUtils,
  Mesh,
  NoToneMapping,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import type { Work3D } from "../../../data/works3d";

/** The two arrangements k95.it's home offers, named as its own switch names them. */
export type CylinderMode = "rings" | "spiral";

export interface CylinderWorldOptions {
  canvas: HTMLCanvasElement;
  projects: readonly Work3D[];
  background: string;
  reducedMotion: boolean;
  mode: CylinderMode;
  onHover: (project: Work3D | null) => void;
  /** The card currently dead centre, so the label can follow the turn when nothing is hovered. */
  onFront: (project: Work3D | null) => void;
  onOpen: (project: Work3D) => void;
  onReady: () => void;
}

export interface CylinderWorld {
  /** 0 at the top of the section, 1 at the bottom. Drives the rows' vertical travel and feeds the spin its momentum. */
  setProgress: (progress: number) => void;
  /** Switches arrangement; the cards travel to their new slots rather than jumping. */
  setMode: (mode: CylinderMode) => void;
  destroy: () => void;
}

interface Layout {
  fov: number;
  cameraZ: number;
  radius: number;
  panelW: number;
  panelH: number;
  rowSpacing: number;
}

interface PanelData {
  project: Work3D;
  /** Angle on the stacked rings, and on the single helix; a switch tweens between the two. */
  thetaRing: number;
  thetaSpiral: number;
  /** Height within the row that only the spiral uses, so a ring's cards climb as they come round. */
  ySpiral: number;
  entranceDelay: number;
  entranceDone: boolean;
}

type Panel = Mesh<PlaneGeometry, ShaderMaterial>;

// A port of k95.it's own ThreeCylinderScene (/_nuxt/Ds9T5XbZ.js): a standing cylinder of covers seen side-on, turning
// about its vertical axis while the rows travel past and wrap. Its numbers are kept as they are there — the layout
// table, 5 rows of 12, the 0.72 spiral radius, the 1.08 hover, the 0.92 momentum decay — so the motion matches.
const ROWS = 5;
const PER_ROW = 12;
// Panel sizes in the layout table are all multiples of this.
const PANEL_UNIT = 1.1;
// The spiral pulls the cards in and scales them up to fill the room it frees; a narrow phone gets less of both.
const SPIRAL_RADIUS = 0.72;
const SPIRAL_SCALE = 1.26;
const SPIRAL_SCALE_PHONE = 0.88;
// The turn never stops: this is its speed in rad/s with no scrolling, which scroll momentum adds to.
const IDLE_SPIN = 0.08;
// Momentum per unit of vertical travel, and the share of it left after a second — k95's wheel adds .004 of spin per
// .005 of travel, and decays what it has by .92 sixty times a second.
const MOMENTUM_GAIN = 0.8;
const MOMENTUM_DECAY = 0.92;
const MOMENTUM_MAX = 2;
// Pointing at a card slows the whole scene to this, so the cover you are reading nearly stops.
const HOVER_TIME_SCALE = 0.3;
const HOVER_SCALE = 1.08;
// How far the rows travel over the section's scroll, in whole wraps of the cylinder.
const TRAVEL_WRAPS = 1.5;
const BEND_H_MAX = 0.25;
const BEND_V_MAX = 0.15;
const ENTRANCE_MS = 760;
const ENTRANCE_DELAY_MS = 840;
const ENTRANCE_JITTER_MS = 980;
const READY_TIMEOUT_MS = 1600;
// The last stretch of scroll fades the cylinder out, so the stage is empty by the time it unpins and scrolls away.
// This is ours, not k95's: their canvas is a page of its own and never has to leave.
const EXIT_START = 0.88;

const PANEL_VERTEX = /* glsl */ `
  uniform float uBendH;
  uniform float uBendV;
  uniform float uTime;
  uniform float uPhase;
  varying vec2 vUv;
  varying float vViewZ;

  void main() {
    vUv = uv;
    vec3 pos = position;

    float xn = (uv.x - 0.5) * 2.0;
    float yn = (uv.y - 0.5) * 2.0;
    // Parabolic arch: 1 at the centre, 0 at both edges.
    float archX = 1.0 - xn * xn;
    float archY = 1.0 - yn * yn;

    pos.z -= archX * uBendH;
    pos.z -= archY * uBendV;

    // Idle wave, each panel on its own phase.
    pos.z += sin(uv.y * 6.283 + uTime * 0.55 + uPhase)
           * sin(uv.x * 3.14 + uTime * 0.35 + uPhase * 1.3) * 0.016;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    vViewZ = -mvPos.z;
    gl_Position = projectionMatrix * mvPos;
  }
`;

const PANEL_FRAGMENT = /* glsl */ `
  uniform sampler2D uTexture;
  uniform float uOpacity;
  uniform float uFade;
  uniform float uDepthNear;
  uniform float uDepthFar;
  uniform vec3 uDepthColor;
  uniform float uDepthStrength;
  uniform float uSourceAspect;
  uniform float uTargetAspect;
  varying vec2 vUv;
  varying float vViewZ;

  // k95 samples the panel straight, because its covers already match the panel's shape. Ours do not, so they are
  // cover-fit instead of stretched.
  vec2 cover(vec2 uv) {
    if (uSourceAspect <= 0.0) return uv;
    vec2 result = uv;
    if (uTargetAspect > uSourceAspect) {
      result.y = 0.5 + (uv.y - 0.5) * (uSourceAspect / uTargetAspect);
    } else {
      result.x = 0.5 + (uv.x - 0.5) * (uTargetAspect / uSourceAspect);
    }
    return result;
  }

  void main() {
    vec4 col = texture2D(uTexture, cover(vUv));
    float depthT = smoothstep(uDepthNear, uDepthFar, vViewZ);
    float luma = dot(col.rgb, vec3(0.2126, 0.7152, 0.0722));
    vec3 toned = mix(col.rgb, vec3(luma), depthT * 0.12);
    toned = mix(toned, uDepthColor, depthT * uDepthStrength);
    gl_FragColor = vec4(toned, col.a * uOpacity * uFade);
    #include <colorspace_fragment>
  }
`;

// k95's own breakpoint table, verbatim. The camera only ever has a z: it looks straight at the cylinder's waist, which
// is what makes this read as a wall of covers turning rather than a funnel seen from above.
function layoutFor(width: number, height: number): Layout {
  const portrait = height > width;
  const wide = { fov: 50, cameraZ: 13, radius: 7.8, panelW: 1.4 * PANEL_UNIT, panelH: 1.9 * PANEL_UNIT, rowSpacing: 7 };
  if (width < 768 && !portrait) return wide;
  if (width < 500) {
    return { fov: 70, cameraZ: 7.5, radius: 4.5, panelW: 1 * PANEL_UNIT, panelH: 1.4 * PANEL_UNIT, rowSpacing: 5.5 };
  }
  if (width < 768) {
    return { fov: 70, cameraZ: 9.5, radius: 4.6, panelW: 1 * PANEL_UNIT, panelH: 1.4 * PANEL_UNIT, rowSpacing: 3.8 };
  }
  if (width < 1024 && portrait) {
    return { fov: 65, cameraZ: 9, radius: 5.5, panelW: 1 * PANEL_UNIT, panelH: 1.4 * PANEL_UNIT, rowSpacing: 6.5 };
  }
  if (width < 1024) {
    return { fov: 60, cameraZ: 11, radius: 6.5, panelW: 1.2 * PANEL_UNIT, panelH: 1.6 * PANEL_UNIT, rowSpacing: 4 };
  }
  return wide;
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let n = t;
    n = Math.imul(n ^ (n >>> 15), n | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const out = [...items];
  const random = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function createCylinderWorld(options: CylinderWorldOptions): CylinderWorld {
  const { canvas, projects, reducedMotion, onHover, onFront, onOpen, onReady } = options;
  const host = canvas.parentElement ?? document.body;
  const touch = window.matchMedia("(hover: none)").matches;
  const background = new Color(options.background);
  // The shader works in linear space and three converts on output, so the fog tint has to be linear too.
  const fogColor = background.clone().convertSRGBToLinear();

  const scene = new Scene();
  const camera = new PerspectiveCamera(50, 1, 0.1, 1000);
  const renderer = new WebGLRenderer({ canvas, antialias: !touch, alpha: false });
  renderer.setClearColor(background, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, touch ? 1.5 : 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NoToneMapping;

  const raycaster = new Raycaster();
  const pointerNdc = new Vector2(2, 2);
  const textureLoader = new TextureLoader();
  const textures = new Map<string, { texture: Texture; aspect: { value: number }; ready: Promise<void> }>();

  let layout = layoutFor(1, 1);
  let rows: Group[] = [];
  let panels: Panel[] = [];
  let panelData = new Map<Panel, PanelData>();
  let panelGeometry: PlaneGeometry | null = null;
  let seeds: number[] = [];

  let progress = 0;
  // Vertical travel: a target the scroll sets, an eased follower, and last frame's value to difference against.
  let travelTarget = 0;
  let travel = 0;
  let travelPrev = 0;
  let spin = 0;
  let momentum = 0;
  // Pointing at a card eases the whole scene down to HOVER_TIME_SCALE.
  let timeScale = 1;
  let timeTarget = 1;
  let blend = options.mode === "spiral" ? 1 : 0;
  let blendTarget = blend;
  /** The scale every card carries, which the spiral grows. */
  let modeScale = 1;
  let elapsed = 0;
  let bendH = 0;
  let bendV = 0;
  let mode: CylinderMode = options.mode;
  let last = performance.now();
  let rafId: number | null = null;
  let inView = true;
  let revealed = false;
  let entering = false;
  let entranceStart = 0;
  let hovered: Panel | null = null;
  let front: Panel | null = null;
  let pointerInside = false;
  let destroyed = false;
  let resizeTimer: number | null = null;
  const tmpScale = new Vector3();
  const tmpWorld = new Vector3();

  const loadTexture = (url: string) => {
    const cached = textures.get(url);
    if (cached) return cached;
    const aspect = { value: 0 };
    let resolve!: () => void;
    const ready = new Promise<void>((r) => {
      resolve = r;
    });
    const texture = textureLoader.load(
      url,
      (loaded) => {
        const image = loaded.image as { width?: number; height?: number } | undefined;
        if (image?.width && image?.height) aspect.value = image.width / image.height;
        resolve();
      },
      undefined,
      () => resolve(),
    );
    texture.colorSpace = SRGBColorSpace;
    const entry = { texture, aspect, ready };
    textures.set(url, entry);
    return entry;
  };

  /** Height of one full wrap of the stack, which is also how far a row travels before it comes back. */
  const wrapHeight = () => ROWS * layout.rowSpacing;
  const travelLength = () => wrapHeight() * TRAVEL_WRAPS;
  const phonePortrait = () => window.innerWidth < 768 && window.innerHeight > window.innerWidth;

  const disposeRows = () => {
    for (const row of rows) {
      for (const child of row.children) (child as Panel).material.dispose();
      scene.remove(row);
    }
    rows = [];
    panels = [];
    panelData = new Map();
    panelGeometry?.dispose();
    panelGeometry = null;
  };

  const buildRows = () => {
    if (!projects.length) return;
    disposeRows();
    if (seeds.length !== ROWS) {
      seeds = Array.from({ length: ROWS }, () => (Math.random() * 4294967295) >>> 0);
    }
    const { panelW, panelH, cameraZ, rowSpacing } = layout;
    panelGeometry = new PlaneGeometry(panelW, panelH, 12, 8);
    const depthNear = cameraZ * 0.58;
    const depthFar = cameraZ * 1.85;
    const startOpacity = revealed ? 1 : 0;
    travelPrev = travel;

    for (let r = 0; r < ROWS; r++) {
      const row = new Group();
      const order = seededShuffle(projects, seeds[r]);
      for (let s = 0; s < PER_ROW; s++) {
        const project = order[s % order.length];
        const { texture, aspect } = loadTexture(project.image);
        const material = new ShaderMaterial({
          uniforms: {
            uTexture: { value: texture },
            uBendH: { value: 0 },
            uBendV: { value: 0 },
            uTime: { value: 0 },
            uPhase: { value: Math.random() * Math.PI * 2 },
            uOpacity: { value: startOpacity },
            uFade: { value: 1 },
            uDepthNear: { value: depthNear },
            uDepthFar: { value: depthFar },
            uDepthColor: { value: fogColor },
            uDepthStrength: { value: 0.22 },
            uSourceAspect: aspect,
            uTargetAspect: { value: panelW / panelH },
          },
          vertexShader: PANEL_VERTEX,
          fragmentShader: PANEL_FRAGMENT,
          side: DoubleSide,
          transparent: true,
          depthWrite: true,
          toneMapped: false,
        });
        const panel = new Mesh(panelGeometry, material) as Panel;
        panel.frustumCulled = false;
        panelData.set(panel, {
          project,
          // Neighbouring rows are offset half a slot, so the cards never stack into columns.
          thetaRing: ((s + r * 0.5) / PER_ROW) * Math.PI * 2,
          thetaSpiral: (s / PER_ROW) * Math.PI * 2,
          ySpiral: (s / PER_ROW - 0.5) * rowSpacing,
          entranceDelay: ENTRANCE_DELAY_MS + Math.random() * ENTRANCE_JITTER_MS,
          entranceDone: revealed,
        });
        row.add(panel);
        panels.push(panel);
      }
      row.position.y = r * rowSpacing - ((ROWS - 1) * rowSpacing) / 2;
      rows.push(row);
      scene.add(row);
    }
    applyBlend(blend);
    for (const panel of panels) panel.scale.setScalar(modeScale);
  };

  // k95's own blend: the rings' angles slide to the spiral's, each card takes on the height that turns its row into a
  // helix, the whole thing pulls in to 0.72 of its radius, and the cards grow to fill the room that frees.
  function applyBlend(e: number) {
    const radius = layout.radius * (1 + (SPIRAL_RADIUS - 1) * e);
    modeScale = 1 + ((phonePortrait() ? SPIRAL_SCALE_PHONE : SPIRAL_SCALE) - 1) * e;
    for (const panel of panels) {
      const data = panelData.get(panel)!;
      const theta = data.thetaRing + (data.thetaSpiral - data.thetaRing) * e;
      panel.position.set(Math.cos(theta) * radius, data.ySpiral * e, Math.sin(theta) * radius);
      // Faces the axis, so the camera out at +z sees the front of the near side.
      panel.rotation.y = -(theta - Math.PI / 2);
    }
  }

  const applySize = () => {
    const width = host.clientWidth || 1;
    const height = host.clientHeight || 1;
    layout = layoutFor(width, height);
    camera.fov = layout.fov;
    camera.aspect = width / height;
    // Straight in front of the cylinder's waist: no height, no tilt, no look-at.
    camera.position.set(0, 0, layout.cameraZ);
    camera.rotation.set(0, 0, 0);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };

  const startEntrance = () => {
    if (revealed || destroyed) return;
    revealed = true;
    entering = !reducedMotion;
    entranceStart = performance.now();
    if (!entering) {
      for (const panel of panels) {
        panel.material.uniforms.uOpacity.value = 1;
        panelData.get(panel)!.entranceDone = true;
      }
    }
    onReady();
  };

  const stepEntrance = () => {
    if (!entering) return;
    const since = performance.now() - entranceStart;
    let done = true;
    for (const panel of panels) {
      const data = panelData.get(panel)!;
      if (data.entranceDone) continue;
      const local = since - data.entranceDelay;
      if (local <= 0) {
        done = false;
        continue;
      }
      const t = Math.min(1, local / ENTRANCE_MS);
      panel.material.uniforms.uOpacity.value = 1 - Math.pow(1 - t, 3);
      if (t >= 1) data.entranceDone = true;
      else done = false;
    }
    if (done) entering = false;
  };

  const setHovered = (next: Panel | null) => {
    if (next === hovered) return;
    hovered = next;
    canvas.style.cursor = next ? "pointer" : "";
    timeTarget = next ? HOVER_TIME_SCALE : 1;
    onHover(next ? panelData.get(next)!.project : null);
  };

  const setFront = (next: Panel | null) => {
    if (next === front) return;
    front = next;
    onFront(next ? panelData.get(next)!.project : null);
  };

  const pick = (): Panel | null => {
    raycaster.setFromCamera(pointerNdc, camera);
    const hits = raycaster.intersectObjects(panels, false);
    return hits.length ? (hits[0].object as Panel) : null;
  };

  /** The card closest to the point of the cylinder that faces the camera, which is the one the frame is showing. */
  const findFront = (): Panel | null => {
    const radius = layout.radius * (1 + (SPIRAL_RADIUS - 1) * blend);
    let best: Panel | null = null;
    let bestDistance = Infinity;
    // The rows were just moved, so one tree update covers every panel; render's own call is then a no-op.
    scene.updateMatrixWorld();
    for (const panel of panels) {
      tmpWorld.setFromMatrixPosition(panel.matrixWorld);
      if (tmpWorld.z <= 0) continue;
      const distance = Math.hypot(tmpWorld.x, tmpWorld.y, tmpWorld.z - radius);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = panel;
      }
    }
    return best;
  };

  const tick = (now: number) => {
    rafId = null;
    if (destroyed) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    stepEntrance();

    // Hovering eases the scene's own clock down, so everything but the entrance slows with it.
    timeScale += (timeTarget - timeScale) * 0.1;
    const n = dt * timeScale;
    elapsed += dt;

    if (Math.abs(blendTarget - blend) > 1e-4) {
      blend += (blendTarget - blend) * (1 - Math.exp(-3.2 * dt));
      if (Math.abs(blendTarget - blend) <= 1e-4) blend = blendTarget;
      applyBlend(blend);
    }

    travel += (travelTarget - travel) * 0.1;
    const step = travel - travelPrev;
    travelPrev = travel;

    momentum *= Math.pow(MOMENTUM_DECAY, n * 60);
    spin += (IDLE_SPIN + momentum) * n;
    bendH += (MathUtils.clamp(momentum * 0.1, -BEND_H_MAX, BEND_H_MAX) - bendH) * 0.08;
    bendV += (MathUtils.clamp(step * 8, -BEND_V_MAX, BEND_V_MAX) - bendV) * 0.12;

    // The rows slide past and wrap, so the stack never runs out however far the section is scrolled.
    const wrap = wrapHeight();
    for (const row of rows) {
      row.position.y -= step;
      if (row.position.y > wrap / 2 + layout.rowSpacing) row.position.y -= wrap;
      if (row.position.y < -wrap / 2 - layout.rowSpacing) row.position.y += wrap;
      row.rotation.y = spin;
    }

    const fade = 1 - MathUtils.clamp((progress - EXIT_START) / (1 - EXIT_START), 0, 1);
    const live = revealed && !entering && fade > 0.5;
    setHovered(live && pointerInside && !touch ? pick() : null);
    setFront(live ? findFront() : null);

    const lerpT = 1 - Math.exp(-8 * dt);
    for (const panel of panels) {
      tmpScale.setScalar(modeScale * (hovered === panel ? HOVER_SCALE : 1));
      if (panel.scale.distanceToSquared(tmpScale) > 1e-5) panel.scale.lerp(tmpScale, lerpT);
      const u = panel.material.uniforms;
      u.uBendH.value = bendH;
      u.uBendV.value = bendV;
      u.uTime.value = elapsed;
      u.uFade.value = fade;
    }

    renderer.render(scene, camera);
    if (inView && !document.hidden) rafId = requestAnimationFrame(tick);
  };

  const resume = () => {
    if (rafId !== null || destroyed) return;
    last = performance.now();
    rafId = requestAnimationFrame(tick);
  };

  const pause = () => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
  };

  const updatePointer = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointerNdc.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      ((event.clientY - rect.top) / rect.height) * -2 + 1,
    );
  };

  const onPointerMove = (event: PointerEvent) => {
    pointerInside = true;
    updatePointer(event);
  };
  const onPointerLeave = () => {
    pointerInside = false;
    pointerNdc.set(2, 2);
  };
  const onClick = (event: PointerEvent) => {
    if (!revealed) return;
    updatePointer(event);
    const hit = pick();
    if (hit) onOpen(panelData.get(hit)!.project);
  };
  const onVisibility = () => {
    if (document.hidden) pause();
    else if (inView) resume();
  };

  const resizeObserver = new ResizeObserver(() => {
    applySize();
    if (resizeTimer !== null) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      resizeTimer = null;
      buildRows();
    }, 200);
  });
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) resume();
    else pause();
  });

  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("click", onClick as EventListener);
  document.addEventListener("visibilitychange", onVisibility);
  resizeObserver.observe(host);
  intersectionObserver.observe(canvas);

  applySize();
  buildRows();
  resume();

  const firstUrls = [...new Set(projects.map((p) => p.image))];
  const firstReady = Promise.allSettled(firstUrls.map((url) => loadTexture(url).ready));
  const cap = new Promise<void>((r) => setTimeout(r, READY_TIMEOUT_MS));
  void Promise.race([firstReady, cap]).then(() => startEntrance());

  return {
    setProgress(next) {
      progress = MathUtils.clamp(next, 0, 1);
      const previous = travelTarget;
      // Scrolling down carries the rows upward, which is a falling target.
      travelTarget = -progress * travelLength();
      // What the wheel does on k95: the same gesture that moves the rows also spins the cylinder.
      momentum = MathUtils.clamp(
        momentum + (previous - travelTarget) * MOMENTUM_GAIN,
        -MOMENTUM_MAX,
        MOMENTUM_MAX,
      );
      if (reducedMotion) {
        travel = travelTarget;
        travelPrev = travel;
        momentum = 0;
      }
      resume();
    },
    setMode(next) {
      if (next === mode) return;
      mode = next;
      blendTarget = next === "spiral" ? 1 : 0;
      if (reducedMotion) {
        blend = blendTarget;
        applyBlend(blend);
        for (const panel of panels) panel.scale.setScalar(modeScale);
      }
      resume();
    },
    destroy() {
      destroyed = true;
      pause();
      if (resizeTimer !== null) window.clearTimeout(resizeTimer);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("click", onClick as EventListener);
      document.removeEventListener("visibilitychange", onVisibility);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      disposeRows();
      for (const entry of textures.values()) entry.texture.dispose();
      textures.clear();
      renderer.dispose();
    },
  };
}
