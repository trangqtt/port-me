import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { describe, expect, it, vi } from "vitest";
import { ExpertiseV2 } from "../../../src/components/sections/ExpertiseV2";
import { works3d } from "../../../src/data/works3d";

// jsdom has no WebGL, so the lazy canvas is replaced with a component that only reports itself ready, which is what
// reveals the chrome over the stage.
vi.mock("../../../src/components/sections/ExpertiseV2/CylinderCanvas", () => ({
  // Named and capitalised so the hook inside reads as a component to eslint's rules-of-hooks.
  default: function CylinderCanvasStub({ onReady }: { onReady: () => void }) {
    useEffect(() => onReady(), [onReady]);
    return null;
  },
}));

describe("ExpertiseV2", () => {
  it("lists every work as a link for crawlers and keyboards", () => {
    render(<ExpertiseV2 />);
    for (const work of works3d) {
      expect(screen.getByRole("link", { name: `${work.title} — ${work.category}` })).toHaveAttribute("href", work.href);
    }
  });

  it("is a tall section with a sticky stage, snapped in three steps", () => {
    render(<ExpertiseV2 />);
    const section = screen.getByRole("region", { name: /Motion Design 01/ });
    expect(section).toHaveAttribute("data-snap-steps", "3");
    expect(section.className).toContain("h-[350dvh]");
    expect(section.querySelector(".sticky")).not.toBeNull();
  });

  it("starts on Rings and switches to Spiral when the pill is pressed", async () => {
    render(<ExpertiseV2 />);
    const rings = screen.getByRole("button", { name: "Rings" });
    const spiral = screen.getByRole("button", { name: "Spiral" });
    expect(rings).toHaveAttribute("aria-pressed", "true");
    expect(spiral).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(spiral);
    expect(spiral).toHaveAttribute("aria-pressed", "true");
    expect(rings).toHaveAttribute("aria-pressed", "false");
  });

  it("labels the active cover and counts it against the set", () => {
    render(<ExpertiseV2 />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      `${works3d[0].title} — ${works3d[0].category}`,
    );
    expect(screen.getByText(/selected works/)).toHaveTextContent(`1 / ${works3d.length} selected works`);
  });
});
