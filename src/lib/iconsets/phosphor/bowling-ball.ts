import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhBowlingBall: PhIconDefinition = {
  "name": "bowling-ball",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "circle",
      {
        "cx": 128,
        "cy": 128,
        "r": 96,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ],
    [
      "circle",
      {
        "cx": 132,
        "cy": 116,
        "r": 12
      }
    ],
    [
      "circle",
      {
        "cx": 164,
        "cy": 92,
        "r": 12
      }
    ],
    [
      "circle",
      {
        "cx": 172,
        "cy": 132,
        "r": 12
      }
    ]
  ]
} as const;
