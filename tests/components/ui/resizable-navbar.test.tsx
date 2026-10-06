import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { gsap } from "gsap";
import { describe, expect, it, vi } from "vitest";
import { NavMenu } from "../../../src/components/ui/resizable-navbar";

const CHILD = <a href="#home">Home</a>;

/** Runs the curtain's tween out, so its resting value can be asserted without waiting on real frames. */
function settle() {
  gsap.globalTimeline.time(gsap.globalTimeline.time() + 2);
}

describe("NavMenu", () => {
  it("renders nothing while closed", () => {
    render(
      <NavMenu isOpen={false} onClose={vi.fn()}>
        {CHILD}
      </NavMenu>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  // The regression: the panel only mounts on the render *after* `isOpen` flips, so a tween keyed on `isOpen` alone
  // ran once against a null ref and never again — the curtain stayed clipped shut and its invisible backdrop ate
  // every click on the page. Opening has to end uncovered.
  it("opens to an uncovered panel when isOpen flips after mount", () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <NavMenu isOpen={false} onClose={onClose}>
        {CHILD}
      </NavMenu>,
    );
    rerender(
      <NavMenu isOpen onClose={onClose}>
        {CHILD}
      </NavMenu>,
    );
    const panel = screen.getByRole("dialog", { name: "Site navigation" });
    settle();
    expect(panel.style.clipPath).toBe("inset(0 0 0% 0)");
  });

  it("closes on Escape", async () => {
    const onClose = vi.fn();
    render(
      <NavMenu isOpen onClose={onClose}>
        {CHILD}
      </NavMenu>,
    );
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on a click outside the panel", async () => {
    const onClose = vi.fn();
    const { container } = render(
      <NavMenu isOpen onClose={onClose}>
        {CHILD}
      </NavMenu>,
    );
    const backdrop = container.querySelector('[aria-hidden="true"]');
    expect(backdrop).not.toBeNull();
    await userEvent.click(backdrop as Element);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("moves focus into the panel so the dialog's aria-modal holds", () => {
    render(
      <NavMenu isOpen onClose={vi.fn()}>
        {CHILD}
      </NavMenu>,
    );
    expect(document.activeElement).toBe(screen.getByRole("dialog"));
  });
});
