import { ReactLenis } from "lenis/react";
import { IntroOverlay } from "./components/IntroOverlay";
import { MorphSVGLoop } from "./components/ui/MorphSVGLoop";

export default function App() {
  return (
    <>
      <ReactLenis
        root
        options={{
          autoRaf: true,
          smoothWheel: true,
          // syncTouch off: native touch scroll feels better on mobile than synced lerp.
          syncTouch: false,
          // Enables smooth scroll for anchor links (href="#section-id").
          anchors: true,
        }}
      >
        <main className="flex min-h-dvh flex-col items-start justify-center gap-12 px-10 py-20 md:px-20">
          <IntroOverlay />{" "}
          {/* Typography & color preview — confirms tokens load before extracting sections */}
          <p className="font-accent text-xs uppercase tracking-[0.3em] text-accent">
            port — me · typography & color preview
          </p>
          <MorphSVGLoop />
          <h1 className="font-display font-bold leading-[0.95] tracking-[-0.04em]">
            Building{" "}
            <em className="font-accent italic font-light text-primary/60">
              interfaces
            </em>
            <br />
            that <span className="text-accent">refuse</span> to whisper.
          </h1>
          <div className="grid w-full max-w-5xl grid-cols-1 gap-10 md:grid-cols-2">
            {/* Display — Helvetica Neue (8 weights, no italic file) */}
            <section>
              <p className="font-accent text-[10px] uppercase tracking-[0.25em] text-primary/50">
                display · helvetica neue
              </p>
              <p className="mt-3 font-display text-3xl font-thin">
                UltraLight 100
              </p>
              <p className="font-display text-3xl font-extralight">Thin 200</p>
              <p className="font-display text-3xl font-light">Light 300</p>
              <p className="font-display text-3xl font-normal">Roman 400</p>
              <p className="font-display text-3xl font-medium">Medium 500</p>
              <p className="font-display text-3xl font-bold">Bold 700</p>
              <p className="font-display text-3xl font-extrabold">Heavy 800</p>
              <p className="font-display text-3xl font-black">Black 900</p>
            </section>

            {/* Accent — Neue Montreal (4 weights × normal/italic) */}
            <section>
              <p className="font-accent text-[10px] uppercase tracking-[0.25em] text-primary/50">
                accent · neue montreal
              </p>
              <p className="mt-3 font-accent text-3xl font-light">
                Light 300 <span className="italic text-primary/60">Italic</span>
              </p>
              <p className="font-accent text-3xl font-normal">
                Regular 400{" "}
                <span className="italic text-primary/60">Italic</span>
              </p>
              <p className="font-accent text-3xl font-medium">
                Medium 500{" "}
                <span className="italic text-primary/60">Italic</span>
              </p>
              <p className="font-accent text-3xl font-bold">
                Bold 700 <span className="italic text-primary/60">Italic</span>
              </p>
            </section>
          </div>
          {/* Color swatches */}
          <div className="grid w-full max-w-5xl grid-cols-2 gap-4 md:grid-cols-5">
            <Swatch
              name="bg-primary"
              hex="#0E0803"
              className="bg-primary text-primary border border-line"
            />
            <Swatch
              name="text-primary"
              hex="#FFFFFF"
              className="bg-[color:var(--color-primary)] text-secondary"
            />
            <Swatch
              name="text-secondary"
              hex="#000000"
              className="bg-[color:var(--color-secondary)] text-primary"
            />
            <Swatch
              name="text-accent"
              hex="#FF3B0E"
              className="bg-accent text-primary"
            />
            <Swatch
              name="bg-secondary"
              hex="#D23030"
              className="bg-secondary text-primary"
            />
          </div>
          {/* Extra spacer to give Lenis something to smooth-scroll through */}
          <div className="h-[150vh] w-full" />
        </main>
      </ReactLenis>
    </>
  );
}

function Swatch({
  name,
  hex,
  className,
}: {
  name: string;
  hex: string;
  className: string;
}) {
  return (
    <div
      className={`flex aspect-square flex-col justify-between p-4 ${className}`}
    >
      <span className="font-accent text-[10px] uppercase tracking-[0.2em]">
        {name}
      </span>
      <span className="font-accent text-xs">{hex}</span>
    </div>
  );
}
