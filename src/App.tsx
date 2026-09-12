import { ReactLenis } from "lenis/react";
import { Header } from "./components/common/Header";
import { Home } from "./components/sections/Home";

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
        <main>
          {/* <IntroOverlay /> */}
          <Home />
        </main>
      </ReactLenis>
    </>
  );
}
