import { ReactLenis } from "lenis/react";
import { Footer } from "./components/common/Footer";
import { Header } from "./components/common/Header";
import { About } from "./components/sections/About";
import { Expertise } from "./components/sections/Expertise";
import { Home } from "./components/sections/Home";
import { Skills } from "./components/sections/Skills";
import { WhyChooseMe } from "./components/sections/WhyChooseMe";
import { useLenisSnap } from "./hooks/useLenisSnap";
import { IntroOverlay } from "./components/sections/IntroOverlay";

function ScrollSnapSection() {
  useLenisSnap("main > section, footer");
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
      {/* Header sits inside ReactLenis so it can pause/resume scroll via the Lenis context while the menu is open. */}
      <Header />

      <main>
        {/* <IntroOverlay /> */}
        <Home />
        <About />
        <Skills />
        <Expertise />
        <WhyChooseMe />
        <Footer />
      </main>
      <ScrollSnapSection />
    </ReactLenis>
  );
}
