import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ExpertiseV2 } from "../../../src/components/sections/ExpertiseV2";
import { works3d } from "../../../src/data/works3d";

// jsdom has no WebGL, so the lazy canvas is replaced with an empty component.
vi.mock("../../../src/components/sections/ExpertiseV2/CylinderCanvas", () => ({
  default: () => null,
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
});
