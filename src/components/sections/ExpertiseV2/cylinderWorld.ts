import {
  BufferGeometry,
  CircleGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  MathUtils,
  Mesh,
  NoToneMapping,
  PerspectiveCamera,
  PlaneGeometry,
  Quaternion,
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

export interface CylinderWorldOptions {
  canvas: HTMLCanvasElement;
  projects: readonly Work3D[];
  background: string;
  reducedMotion: boolean;
  onHover: (project: Work3D | null) => void;
  onOpen: (project: Work3D) => void;
  onReady: () => void;
}

export interface CylinderWorld {
  /** 0 at the top of the section, 1 at the bottom; the helix only moves when this does. */
  setProgress: (progress: number) => void;
  /** Pixels at the bottom of the canvas that copy occupies; the platform is lifted to sit above them. */
  setBottomInset: (px: number) => void;
  destroy: () => void;
}

interface Layout {
  fov: number;
  cameraY: number;
  cameraZ: number;
  radius: number;
  panelW: number;
  panelH: number;
  pitch: number;
}

interface PanelData {
  project: Work3D;
  theta: number;
  baseY: number;
  radiusScale: number;
  sizeScale: number;
  roll: number;
  entranceDelay: number;
  entranceDone: boolean;
}

type Panel = Mesh<BufferGeometry, ShaderMaterial>;

// Figma 424:2388: a helix of curved cards on a cone that opens upward, over a lit platform. It starts sunk below the floor with only a few cards showing, and scrolling lifts it so the cards fly up and spread outward as they climb.
const TURNS = 3;
const PER_TURN = 9;
// Cone radius at the floor and at the top, as multiples of the layout radius.
const R_BOTTOM = 0.5;
const R_TOP = 1.35;
// Cards above the floor before any scroll, and how many turns of orbit a card makes per pitch of climb.
const START_VISIBLE = 4;
const SPIN_PER_PITCH = 0.4;
// The scroll is split in two: the first BUILD_SHARE of it brings the whole helix into view, and the remainder, half a viewport, carries every card on up and out of the top of the frame before the section lets go. RISE_END is how far that exit goes, in multiples of the distance that filled the bowl.
const BUILD_SHARE = 0.8;
const RISE_END = 2.8;
// Each card keeps a fixed random offset from its slot on the helix: angle in radians, height as a share of the pitch, radius and size as multipliers, roll in radians. Scroll still carries every card along the same line; the spacing just stops looking like a grid.
const JITTER_THETA = 0.22;
const JITTER_Y = 0.35;
const JITTER_RADIUS = 0.12;
const JITTER_SIZE = 0.22;
const JITTER_ROLL = 0.08;
// The avatar standing on the platform, and how tall it is in world units.
const FIGURE_SRC = "/images/expertise-v2-figure.webp";
const FIGURE_HEIGHT = 2.2;
// Where the platform's centre lands on the canvas, in clip space: -1 is the bottom edge. The camera is aimed to put it there, so the bowl sits at the bottom of the section rather than floating mid-frame.
const FLOOR_NDC_Y = -0.8;
// The platform's glow spreads below its centre by about this much of the frame, so a lifted floor keeps that much clearance above the copy.
const FLOOR_CLEARANCE = 0.3;
const HOVER_LIFT = 1.06;
const BEND_H_MAX = 0.25;
const BEND_V_MAX = 0.15;
const ENTRANCE_MS = 760;
const ENTRANCE_DELAY_MS = 840;
const ENTRANCE_JITTER_MS = 980;
const READY_TIMEOUT_MS = 1600;
const FLOOR_COLOR = "#3d7be0";

const PANEL_VERTEX = /* glsl */ `
  uniform float uBendH;
  uniform float uBendV;
  varying vec2 vUv;
  varying float vViewZ;
  varying float vWorldY;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float xn = (uv.x - 0.5) * 2.0;
    float yn = (uv.y - 0.5) * 2.0;
    float archX = 1.0 - xn * xn;
    float archY = 1.0 - yn * yn;
    pos.z -= archX * uBendH;
    pos.z -= archY * uBendV;
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldY = worldPos.y;
    vec4 mvPos = viewMatrix * worldPos;
    vViewZ = -mvPos.z;
    gl_Position = projectionMatrix * mvPos;
  }
`;

const PANEL_FRAGMENT = /* glsl */ `
  uniform sampler2D uTexture;
  uniform float uOpacity;
  uniform float uDepthNear;
  uniform float uDepthFar;
  uniform vec3 uDepthColor;
  uniform float uDepthStrength;
  uniform float uSourceAspect;
  uniform float uTargetAspect;
  uniform float uFloorY;
  varying vec2 vUv;
  varying float vViewZ;
  varying float vWorldY;

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
    // The near side of the ring is seen from behind; sampling mirrored there keeps its text readable.
    vec2 uv = gl_FrontFacing ? vUv : vec2(1.0 - vUv.x, vUv.y);
    vec4 col = texture2D(uTexture, cover(uv));
    float depthT = smoothstep(uDepthNear, uDepthFar, vViewZ);
    float luma = dot(col.rgb, vec3(0.2126, 0.7152, 0.0722));
    vec3 toned = mix(col.rgb, vec3(luma), depthT * 0.12);
    toned = mix(toned, uDepthColor, depthT * uDepthStrength);
    float edge = smoothstep(uFloorY - 0.9, uFloorY + 0.3, vWorldY);
    gl_FragColor = vec4(toned, col.a * uOpacity * edge);
    #include <colorspace_fragment>
  }
`;

const FLOOR_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FLOOR_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float core = 1.0 - smoothstep(0.0, 0.55, d);
    float halo = 1.0 - smoothstep(0.25, 1.0, d);
    vec3 col = mix(uColor, vec3(0.86, 0.93, 1.0), core * 0.75);
    gl_FragColor = vec4(col, (core * 0.95 + halo * 0.5) * uOpacity);
    #include <colorspace_fragment>
  }
`;

const FIGURE_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// The cutout ends at the waist, so its base is faded into the platform glow rather than shown as a hard edge.
const FIGURE_FRAGMENT = /* glsl */ `
  uniform sampler2D uTexture;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    vec4 col = texture2D(uTexture, vUv);
    float base = smoothstep(0.0, 0.28, vUv.y);
    gl_FragColor = vec4(col.rgb, col.a * base * uOpacity);
    if (gl_FragColor.a < 0.01) discard;
    #include <colorspace_fragment>
  }
`;

// Camera sits well above the helix and looks down into it at about forty degrees, so the near turn reads large and low and the far turn small and high.
function layoutFor(width: number, height: number): Layout {
  const portrait = height > width;
  if (width < 768 && portrait) {
    return { fov: 60, cameraY: 9.5, cameraZ: 12.5, radius: 4, panelW: 1.45, panelH: 1.45, pitch: 3.2 };
  }
  if (width < 1024) {
    return { fov: 48, cameraY: 10, cameraZ: 13.5, radius: 4.8, panelW: 1.7, panelH: 1.7, pitch: 3.2 };
  }
  return { fov: 40, cameraY: 11, cameraZ: 15, radius: 5.4, panelW: 1.9, panelH: 1.9, pitch: 3.4 };
}

// A plane wrapped onto the cylinder it sits on, so every card curves with the ring instead of cutting through it. Its face points at the axis, so the bend goes toward +z.
function curvedPanelGeometry(width: number, height: number, bendRadius: number, segX = 24, segY = 8) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let iy = 0; iy <= segY; iy++) {
    const v = iy / segY;
    const y = (v - 0.5) * height;
    for (let ix = 0; ix <= segX; ix++) {
      const u = ix / segX;
      const angle = ((u - 0.5) * width) / bendRadius;
      positions.push(Math.sin(angle) * bendRadius, y, (1 - Math.cos(angle)) * bendRadius);
      uvs.push(u, v);
    }
  }
  for (let iy = 0; iy < segY; iy++) {
    for (let ix = 0; ix < segX; ix++) {
      const a = iy * (segX + 1) + ix;
      const b = a + 1;
      const c = a + segX + 1;
      const d = c + 1;
      // Counter-clockwise seen from +z, so the face that points at the axis is the front face.
      indices.push(a, b, c, b, d, c);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
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
  const { canvas, projects, reducedMotion, onHover, onOpen, onReady } = options;
  const host = canvas.parentElement ?? document.body;
  const touch = window.matchMedia("(hover: none)").matches;
  const background = new Color(options.background);

  const scene = new Scene();
  // The avatar is drawn in a second pass over a cleared depth buffer, so no card passing in front can ever cover her.
  const overlay = new Scene();
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
  let panels: Panel[] = [];
  let panelData = new Map<Panel, PanelData>();
  let panelGeometry: BufferGeometry | null = null;
  let floor: Mesh<CircleGeometry, ShaderMaterial> | null = null;
  let figure: Mesh<PlaneGeometry, ShaderMaterial> | null = null;
  let seeds: number[] = [];

  let progress = 0;
  let bottomInset = 0;
  let rise = 0;
  let risePrev = 0;
  let bendH = 0;
  let bendV = 0;
  let last = performance.now();
  let rafId: number | null = null;
  let inView = true;
  let revealed = false;
  let entering = false;
  let entranceStart = 0;
  let hovered: Panel | null = null;
  let pointerInside = false;
  let destroyed = false;
  let resizeTimer: number | null = null;
  const tmpTarget = new Vector3();
  const yAxis = new Vector3(0, 1, 0);
  const xAxis = new Vector3(1, 0, 0);
  const qSpin = new Quaternion();
  const qTilt = new Quaternion();
  const qRoll = new Quaternion();
  const zAxis = new Vector3(0, 0, 1);

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

  const totalHeight = () => TURNS * layout.pitch;
  const floorY = () => -totalHeight() / 2 - 0.15;

  const buildFloor = () => {
    if (floor) {
      scene.remove(floor);
      floor.geometry.dispose();
      floor.material.dispose();
    }
    const material = new ShaderMaterial({
      uniforms: {
        uColor: { value: new Color(FLOOR_COLOR) },
        uOpacity: { value: revealed ? 1 : 0 },
      },
      vertexShader: FLOOR_VERTEX,
      fragmentShader: FLOOR_FRAGMENT,
      transparent: true,
      depthWrite: false,
    });
    floor = new Mesh(new CircleGeometry(layout.radius * R_BOTTOM * 1.5, 72), material);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = floorY();
    floor.renderOrder = -5;
    scene.add(floor);
  };

  const buildFigure = () => {
    if (figure) {
      overlay.remove(figure);
      figure.geometry.dispose();
      figure.material.dispose();
    }
    const { texture, aspect } = loadTexture(FIGURE_SRC);
    const material = new ShaderMaterial({
      uniforms: {
        uTexture: { value: texture },
        uOpacity: { value: revealed ? 1 : 0 },
      },
      vertexShader: FIGURE_VERTEX,
      fragmentShader: FIGURE_FRAGMENT,
      transparent: true,
      depthWrite: false,
    });
    // Width follows the picture's aspect once it has loaded; until then a square placeholder that is invisible anyway.
    const width = aspect.value > 0 ? FIGURE_HEIGHT * aspect.value : FIGURE_HEIGHT;
    figure = new Mesh(new PlaneGeometry(width, FIGURE_HEIGHT), material);
    overlay.add(figure);
    placeFigure();
    void textures.get(FIGURE_SRC)?.ready.then(() => {
      if (destroyed || !figure || aspect.value <= 0) return;
      figure.geometry.dispose();
      figure.geometry = new PlaneGeometry(FIGURE_HEIGHT * aspect.value, FIGURE_HEIGHT);
    });
  };

  // The cutout faces the camera square on rather than standing vertical, so the downward view does not foreshorten her; her base still sits on the platform's centre.
  const figureUp = new Vector3();
  const placeFigure = () => {
    if (!figure) return;
    figure.quaternion.copy(camera.quaternion);
    figureUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
    figure.position.set(0, floorY(), 0).addScaledVector(figureUp, FIGURE_HEIGHT / 2);
  };

  const disposePanels = () => {
    for (const panel of panels) {
      panel.material.dispose();
      scene.remove(panel);
    }
    panels = [];
    panelData = new Map();
    panelGeometry?.dispose();
    panelGeometry = null;
  };

  const buildPanels = () => {
    if (!projects.length) return;
    disposePanels();
    if (seeds.length !== TURNS) {
      seeds = Array.from({ length: TURNS }, () => (Math.random() * 4294967295) >>> 0);
    }
    const { panelW, panelH, radius, pitch } = layout;
    panelGeometry = curvedPanelGeometry(panelW, panelH, radius);
    const depthNear = layout.cameraZ * 0.58;
    const depthFar = layout.cameraZ * 1.85;
    const half = totalHeight() / 2;
    const startOpacity = revealed ? 1 : 0;

    for (let r = 0; r < TURNS; r++) {
      const order = seededShuffle(projects, seeds[r]);
      for (let s = 0; s < PER_TURN; s++) {
        const project = order[s % order.length];
        const { texture, aspect } = loadTexture(project.image);
        const material = new ShaderMaterial({
          uniforms: {
            uTexture: { value: texture },
            uBendH: { value: 0 },
            uBendV: { value: 0 },
            uOpacity: { value: startOpacity },
            uDepthNear: { value: depthNear },
            uDepthFar: { value: depthFar },
            uDepthColor: { value: background.clone() },
            uDepthStrength: { value: 0.22 },
            uSourceAspect: aspect,
            uTargetAspect: { value: panelW / panelH },
            uFloorY: { value: floorY() },
          },
          vertexShader: PANEL_VERTEX,
          fragmentShader: PANEL_FRAGMENT,
          side: DoubleSide,
          transparent: true,
          depthWrite: true,
        });
        const panel = new Mesh(panelGeometry, material) as Panel;
        panel.frustumCulled = false;
        const index = r * PER_TURN + s;
        const jitter = mulberry32(seeds[r] + s * 7919);
        panelData.set(panel, {
          project,
          theta: (s / PER_TURN) * Math.PI * 2 + (jitter() * 2 - 1) * JITTER_THETA,
          baseY: (index / PER_TURN) * pitch - half + (jitter() * 2 - 1) * JITTER_Y * pitch,
          radiusScale: 1 + (jitter() * 2 - 1) * JITTER_RADIUS,
          sizeScale: 1 + (jitter() * 2 - 1) * JITTER_SIZE,
          roll: (jitter() * 2 - 1) * JITTER_ROLL,
          entranceDelay: ENTRANCE_DELAY_MS + Math.random() * ENTRANCE_JITTER_MS,
          entranceDone: revealed,
        });
        panels.push(panel);
        scene.add(panel);
      }
    }
    placeCards();
  };

  // The helix climbs out of the floor as `rise` goes 0 to BUILD_SHARE, is fully in view there, and shoots on out of the top over the rest, orbiting as it goes; radius grows with height, so every card spreads outward as it flies up the cone.
  const placeCards = () => {
    const { radius, pitch } = layout;
    const total = totalHeight();
    const half = total / 2;
    const startDrop = total - (START_VISIBLE / PER_TURN) * pitch;
    const climb =
      rise < BUILD_SHARE
        ? rise / BUILD_SHARE
        : 1 + ((rise - BUILD_SHARE) / (1 - BUILD_SHARE)) * (RISE_END - 1);
    const lift = -startDrop * (1 - climb);
    const spin = -((climb * startDrop) / pitch) * SPIN_PER_PITCH * Math.PI * 2;
    // Cards face the axis, so leaning their tops away from it, out along the widening cone, is a negative tilt.
    const tilt = -Math.atan((radius * (R_TOP - R_BOTTOM)) / total);
    qTilt.setFromAxisAngle(xAxis, tilt);
    for (const panel of panels) {
      const data = panelData.get(panel)!;
      const y = data.baseY + lift;
      const h = MathUtils.clamp((y + half) / total, 0, 1);
      const r = radius * (R_BOTTOM + (R_TOP - R_BOTTOM) * h) * data.radiusScale;
      const theta = data.theta + spin;
      panel.position.set(Math.cos(theta) * r, y, Math.sin(theta) * r);
      // Faces the axis: the camera looks into the bowl, so the far side of the ring, which is most of what is seen, shows its front.
      qSpin.setFromAxisAngle(yAxis, -(theta - Math.PI / 2) + Math.PI);
      qRoll.setFromAxisAngle(zAxis, data.roll);
      panel.quaternion.copy(qSpin).multiply(qTilt).multiply(qRoll);
    }
  };

  const applySize = () => {
    const width = host.clientWidth || 1;
    const height = host.clientHeight || 1;
    layout = layoutFor(width, height);
    camera.fov = layout.fov;
    camera.aspect = width / height;
    camera.position.set(0, layout.cameraY, layout.cameraZ);
    // Aim so the floor projects at FLOOR_NDC_Y, or higher when copy sits under it: the angle down to the floor, less the angle that clip-space height subtends inside the field of view.
    const floorNdc = Math.max(FLOOR_NDC_Y, -1 + (2 * bottomInset) / height + FLOOR_CLEARANCE);
    const toFloor = Math.atan((layout.cameraY - floorY()) / layout.cameraZ);
    const halfFov = (layout.fov * Math.PI) / 360;
    const below = Math.atan(-floorNdc * Math.tan(halfFov));
    const lookY = layout.cameraY - layout.cameraZ * Math.tan(toFloor - below);
    camera.lookAt(0, lookY, 0);
    placeFigure();
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };

  const rebuild = () => {
    applySize();
    buildFloor();
    buildFigure();
    buildPanels();
  };

  const startEntrance = () => {
    if (revealed || destroyed) return;
    revealed = true;
    entering = !reducedMotion;
    entranceStart = performance.now();
    if (floor) floor.material.uniforms.uOpacity.value = 1;
    if (figure) figure.material.uniforms.uOpacity.value = 1;
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
    const elapsed = performance.now() - entranceStart;
    let done = true;
    for (const panel of panels) {
      const data = panelData.get(panel)!;
      if (data.entranceDone) continue;
      const local = elapsed - data.entranceDelay;
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
    onHover(next ? panelData.get(next)!.project : null);
  };

  const pick = (): Panel | null => {
    raycaster.setFromCamera(pointerNdc, camera);
    const hits = raycaster.intersectObjects(panels, false);
    return hits.length ? (hits[0].object as Panel) : null;
  };

  const tick = (now: number) => {
    rafId = null;
    if (destroyed) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    stepEntrance();

    // Scroll is the only driver: the climb eases toward the scrolled position and is still whenever the page is.
    rise += (progress - rise) * (1 - Math.exp(-6 * dt));
    if (Math.abs(progress - rise) < 1e-4) rise = progress;
    const riseVel = dt > 0 ? (rise - risePrev) / dt : 0;
    risePrev = rise;
    bendH += (MathUtils.clamp(riseVel * 0.9, -BEND_H_MAX, BEND_H_MAX) - bendH) * 0.08;
    bendV += (MathUtils.clamp(riseVel * 0.6, -BEND_V_MAX, BEND_V_MAX) - bendV) * 0.12;
    // Settle to exact rest so a parked page renders identical frames instead of sub-pixel drift.
    if (Math.abs(bendH) < 1e-4) bendH = 0;
    if (Math.abs(bendV) < 1e-4) bendV = 0;
    placeCards();

    const canHover = revealed && !entering && pointerInside && !touch;
    setHovered(canHover ? pick() : null);

    const lerpT = 1 - Math.exp(-8 * dt);
    for (const panel of panels) {
      tmpTarget.setScalar(panelData.get(panel)!.sizeScale * (hovered === panel ? HOVER_LIFT : 1));
      if (panel.scale.distanceToSquared(tmpTarget) > 1e-5) panel.scale.lerp(tmpTarget, lerpT);
      const u = panel.material.uniforms;
      u.uBendH.value = bendH;
      u.uBendV.value = bendV;
    }

    renderer.render(scene, camera);
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(overlay, camera);
    renderer.autoClear = true;
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
      buildFloor();
      buildFigure();
      buildPanels();
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

  rebuild();
  resume();

  const firstUrls = [...new Set(projects.map((p) => p.image))].slice(0, touch ? 4 : 12);
  const firstReady = Promise.allSettled(firstUrls.map((url) => loadTexture(url).ready));
  const cap = new Promise<void>((r) => setTimeout(r, READY_TIMEOUT_MS));
  void Promise.race([firstReady, cap]).then(() => startEntrance());

  return {
    setBottomInset(px) {
      if (px === bottomInset) return;
      bottomInset = Math.max(0, px);
      applySize();
      resume();
    },
    setProgress(next) {
      progress = MathUtils.clamp(next, 0, 1);
      if (reducedMotion) {
        rise = progress;
        risePrev = rise;
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
      disposePanels();
      if (floor) {
        scene.remove(floor);
        floor.geometry.dispose();
        floor.material.dispose();
      }
      if (figure) {
        overlay.remove(figure);
        figure.geometry.dispose();
        figure.material.dispose();
      }
      for (const entry of textures.values()) entry.texture.dispose();
      textures.clear();
      renderer.dispose();
    },
  };
}
