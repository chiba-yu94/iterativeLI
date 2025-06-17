// src/components/SoulPrint.jsx
import React from "react";

export default function SoulPrint(props) {
  return (
    <svg
      width="1024"
      height="1024"
      viewBox="0 0 1024 1024"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g id="back5">
        <ellipse
          cx="512"
          cy="512"
          rx="495"
          ry="495"
          fill="#13e8ff"
          fillOpacity="0.03"
        />
      </g>
      <g id="back4">
        <ellipse
          cx="512"
          cy="512"
          rx="415"
          ry="415"
          fill="#13e8ff"
          fillOpacity="0.04"
        />
      </g>
      <g id="back3">
        <ellipse
          cx="512"
          cy="512"
          rx="340"
          ry="340"
          fill="#13e8ff"
          fillOpacity="0.07"
        />
      </g>
      <g id="back2">
        <ellipse
          cx="512"
          cy="512"
          rx="270"
          ry="270"
          fill="#13e8ff"
          fillOpacity="0.09"
        />
      </g>
      <g id="back1">
        <ellipse
          cx="512"
          cy="512"
          rx="210"
          ry="210"
          fill="#13e8ff"
          fillOpacity="0.13"
        />
      </g>
      <g id="main">
        <g id="aroundcore">
          <path
            d="M618.7,241.6
              c86.6,31.7,146.4,103.1,146.4,196.6c0,116.5-103.2,208.1-230.5,208.1c-127.3,0-230.5-91.6-230.5-208.1
              c0-93.5,59.8-164.9,146.4-196.6"
            fill="none"
            stroke="#13e8ff"
            strokeWidth="13"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="24, 21"
            opacity="0.8"
          />
        </g>
        <g id="Core">
          <rect
            x="446"
            y="446"
            width="132"
            height="132"
            rx="32"
            fill="#13e8ff"
            fillOpacity="0.26"
            stroke="#13e8ff"
            strokeWidth="8"
          />
          <polygon
            points="512,392 532,472 612,492 532,512 512,592 492,512 412,492 492,472"
            fill="#13e8ff"
            fillOpacity="0.6"
            stroke="#13e8ff"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          <polyline
            points="512,412 524,492 604,504 524,516 512,596 500,516 420,504 500,492 512,412"
            fill="none"
            stroke="#fff"
            strokeWidth="3"
            strokeLinejoin="round"
            opacity="0.7"
          />
        </g>
      </g>
    </svg>
  );
}
