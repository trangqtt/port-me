import { ReactLenis } from "lenis/react";
import { Header } from "./components/common/Header";
import { About } from "./components/sections/About";
import { Home } from "./components/sections/Home";
import { useLenisSnap } from "./hooks/useLenisSnap";

function ScrollSnapSection() {
  useLenisSnap("main > section");
  return null;
}

export default function App() {
  return (
    <ReactLenis
      root
      options={{
        autoRaf: true,
        smoothWheel: true,
        syncTouch: false,
        // Enables smooth scroll for anchor links (href="#section-id").
        anchors: true,
      }}
    >
      {/* Header must be inside <ReactLenis> so it can access the Lenis
          context — it needs to pause/resume scroll while the menu is open. */}
      <Header />

      <main>
        {/* <IntroOverlay /> */}
        <Home />
        <About />
        <Home />
        <Home />
      </main>
      <ScrollSnapSection />
    </ReactLenis>
  );
}
