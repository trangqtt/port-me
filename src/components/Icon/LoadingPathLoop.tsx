import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { useRef } from "react";

gsap.registerPlugin(DrawSVGPlugin, useGSAP);

interface LoadingPathLoopProps {
  className?: string;
  repeat?: number;
}

export function LoadingPathLoop({
  className,
  repeat = -1,
}: LoadingPathLoopProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  console.log(repeat);

  useGSAP(
    () => {
      const STEP = 0.07;
      gsap
        .timeline({ repeat: repeat, defaults: { ease: "none" } })
        .set(".asterisk-petal", { opacity: 0 })
        .to(".asterisk-petal", {
          opacity: 1,
          duration: 0.15,
          stagger: STEP,
        })
        .to(
          ".asterisk-petal",
          {
            opacity: 0,
            duration: 0.15,
            stagger: STEP,
          },
          "+=0.25",
        );
    },
    { scope: svgRef },
  );

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 61 60"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g clipPath="url(#asterisk-mark-clip)">
        {/* Ordered clockwise from 12 o'clock so a stagger tween sweeps around the circle. */}
        <path
          className="asterisk-petal"
          d="M41.2197 16.6957C38.8687 17.6454 36.6492 16.276 36.2971 13.9783C35.664 9.85598 38.0115 5.81898 41.8279 4.0797C42.742 3.66355 44.243 3.76314 45.086 4.20063C45.7689 4.55631 46.6296 5.65893 46.8004 6.69396C47.4833 10.8199 45.1713 15.1023 41.2197 16.6957Z"
        />
        <path
          className="asterisk-petal"
          d="M56.1297 18.6094C54.4331 22.4579 50.2965 24.6596 46.2204 23.9696C45.1924 23.7953 44.1005 22.9523 43.7377 22.2658C43.2077 21.2593 43.1793 19.801 43.6808 18.7161C45.4023 15.0064 49.4891 12.7691 53.519 13.4663C55.8949 13.8789 57.1647 16.269 56.1297 18.6094Z"
        />
        <path
          className="asterisk-petal"
          d="M60.0422 29.9342C60.2947 33.6511 52.2136 36.7349 46.3022 32.8046C45.5481 32.3031 44.8225 30.9906 44.7834 30.2401C44.7372 29.3438 45.445 27.9673 46.3093 27.3875C51.9113 23.628 59.7967 26.2707 60.0422 29.9342Z"
        />
        <path
          className="asterisk-petal"
          d="M56.1331 44.8301C54.8633 47.9317 45.9037 46.3951 42.1299 39.847C41.6817 39.0645 41.6177 37.7023 41.9236 37.0976C43.5597 33.8574 52.3202 35.8776 55.8841 42.0309C56.3394 42.8205 56.4141 44.1472 56.1331 44.8301Z"
        />
        <path
          className="asterisk-petal"
          d="M45.278 55.7958C44.7266 56.2262 43.1652 56.244 42.4503 55.8065C36.2365 51.99 33.9104 43.2474 36.3254 41.3587C36.8839 40.9212 38.4666 40.9177 39.1887 41.3658C45.3704 45.2072 47.7037 53.9036 45.278 55.7958Z"
        />
        <path
          className="asterisk-petal"
          d="M30.2967 59.9964C27.6646 60.1991 24.7125 50.8554 28.4009 43.3505C28.6534 42.8383 29.564 42.1874 30.037 42.0807C30.5741 41.9633 31.6589 42.6249 31.9755 43.194C35.5394 49.6105 33.2559 59.7687 30.2967 59.9964Z"
        />
        <path
          className="asterisk-petal"
          d="M25.4667 41.5294C24.5668 49.8595 17.5456 57.3181 15.1804 55.9416C12.9289 54.6327 15.753 44.9404 22.5181 39.9253C22.9556 39.6016 24.0262 39.4202 24.4637 39.5625C24.9581 39.7225 25.5343 40.9034 25.4667 41.5294Z"
        />
        <path
          className="asterisk-petal"
          d="M6.32742 45.7194C5.75477 45.8118 4.58458 45.4562 4.30715 45.0471C3.99059 44.5776 4.3356 43.3149 4.79088 42.7565C9.97316 36.3863 20.3164 32.7156 21.4973 35.2267C22.5963 37.5529 14.3587 44.4104 6.32742 45.7194Z"
        />
        <path
          className="asterisk-petal"
          d="M21.4939 30.0729C18.1469 33.4057 8.77468 32.9682 3.75245 31.9865C2.31193 31.7055 1.21288 31.1577 0 30.1049C3.61017 26.8184 12.801 27.2026 17.8161 28.1878C19.1997 28.4617 20.4482 29.0237 21.4939 30.0729Z"
        />
        <path
          className="asterisk-petal"
          d="M23.9194 26.1782C22.6567 26.7224 21.4616 26.5446 20.2345 26.1213C14.9064 24.2753 10.0976 21.4797 5.87208 17.7521C5.09314 17.0621 4.54539 16.1836 4.05811 15.1414C4.92953 14.9245 5.91832 14.8996 6.68304 15.1201C11.0473 16.3792 14.8459 18.5133 18.5842 21.0031C20.5689 22.4649 22.205 23.8236 23.9194 26.1782Z"
        />
        <path
          className="asterisk-petal"
          d="M27.3268 25.0933C24.6698 23.3967 23.2329 20.6793 21.4047 18.1824C18.9291 13.7648 16.0125 9.6318 15.0664 4.07605C18.2889 6.54804 20.3696 10.1298 22.4219 13.6154C24.5062 17.1651 26.4091 20.6615 27.3268 25.0933Z"
        />
        <path
          className="asterisk-petal"
          d="M30.1151 25.04C28.2051 16.8131 28.2371 8.13445 30.1293 0C31.9255 8.40832 31.986 16.6032 30.1151 25.04Z"
        />
      </g>
      <defs>
        <clipPath id="asterisk-mark-clip">
          <rect width="60.0498" height="60" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
