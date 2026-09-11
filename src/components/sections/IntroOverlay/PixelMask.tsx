/* eslint-disable react-refresh/only-export-components */
import { forwardRef } from "react";

const PIXEL_COLS = 128;
const PIXEL_ROWS = 64;
const PIXEL_CELLS = Array.from({ length: PIXEL_COLS * PIXEL_ROWS }, (_, i) => ({
  col: i % PIXEL_COLS,
  row: Math.floor(i / PIXEL_COLS),
}));

// Sort pixel cells by elliptical distance from center (farthest first), ellipse tilted -30deg (bottom-left to top-right), with jitter for a dithered edge.
export function pixelsSortedOutIn(
  container: HTMLElement | null,
): HTMLElement[] {
  if (!container) return [];
  const cells = Array.from(
    container.querySelectorAll<HTMLElement>("[data-pixel]"),
  );
  const cx = (PIXEL_COLS - 1) / 2;
  const cy = (PIXEL_ROWS - 1) / 2;
  const angle = (-30 * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const minorAxisScale = 2.2;
  // Measure real pixel size so the ellipse keeps a true shape on any viewport
  // aspect ratio (grid columns/rows alone distort on narrow mobile screens).
  const rect = container.getBoundingClientRect();
  const cellWidth = rect.width / PIXEL_COLS;
  const cellHeight = rect.height / PIXEL_ROWS;
  const scale = Math.max(rect.width, rect.height) / 2 || 1;
  return cells
    .map((el) => {
      const col = Number(el.dataset.col);
      const row = Number(el.dataset.row);
      const dx = ((col - cx) * cellWidth) / scale;
      const dy = ((row - cy) * cellHeight) / scale;
      const rx = dx * cos + dy * sin;
      const ry = (-dx * sin + dy * cos) * minorAxisScale;
      const dist = Math.sqrt(rx * rx + ry * ry);
      const jitter = (Math.random() - 0.5) * 0.35;
      return { el, d: dist + jitter };
    })
    .sort((a, b) => b.d - a.d)
    .map((w) => w.el);
}

export const PixelMask = forwardRef<HTMLDivElement>((_, ref) => (
  <div
    ref={ref}
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 grid invisible"
    style={{
      gridTemplateColumns: `repeat(${PIXEL_COLS}, 1fr)`,
      gridTemplateRows: `repeat(${PIXEL_ROWS}, 1fr)`,
    }}
  >
    {PIXEL_CELLS.map((p, i) => (
      <span
        key={i}
        data-pixel
        data-col={p.col}
        data-row={p.row}
        className="block opacity-0"
        style={{ backgroundColor: "rgba(210, 48, 48, 1)" }}
      />
    ))}
  </div>
));
