"use client";
import { experience } from "../../../data/experience";
import { ExperienceSlider } from "./ExperienceSlider";

export function About() {
  return (
    <section
      id="about"
      aria-label="About"
      className="relative w-full min-h-dvh bg-primary px-5 sm:px-8 lg:px-[4.48vw] lg:py-32"
    >
      <div className="flex flex-col gap-16 lg:gap-24">
        <div className="flex flex-col gap-16 lg:grid lg:grid-cols-2 lg:items-baseline lg:gap-x-8">
          <p className="leading-[1.2] font-medium ">
            <span className="inline-block w-42 md:w-60 align-top text-base uppercase font-accent">
              [About me]{" "}
            </span>
            <span className="font-display text-[26px] leading-[1.1] text-primary md:text-[32px] 2xl:text-[52px] lg:leading-none">
              I am a UI/UX Designer with 4 years of experience{" "}
              <span className="text-primary/50">
                blending strategic UX thinking with sharp visual artistry
              </span>
            </span>
          </p>

          <p className="font-accent text-sm lg:text-base uppercase leading-[1.2] text-primary/70 2xl:mt-16 lg:justify-self-end lg:max-w-121">
            I specialize in building cohesive Design Systems and optimizing User
            Flows to drive conversion rates for Agency, E-commerce, SaaS,
            EDUCATION and Fintech products. By bridging the gap between
            intuitive functionality and high-end aesthetics, I transform complex
            business challenges into seamless digital experiences.
          </p>
        </div>

        <ExperienceSlider items={experience} />
      </div>
    </section>
  );
}
