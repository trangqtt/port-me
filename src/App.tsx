import { ReactLenis } from "lenis/react";
import { IntroOverlay } from "./components/sections/IntroOverlay";
import { Header } from "./components/common/Header";

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
        <Header />
        <main className="flex min-h-dvh flex-col items-start justify-center gap-12 px-10 py-20 md:px-20">
          {/* <IntroOverlay /> */}
        </main>
      </ReactLenis>
    </>
  );
}

