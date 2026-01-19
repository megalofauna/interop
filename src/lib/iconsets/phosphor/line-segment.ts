import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhLineSegment: PhIconDefinition = {
  "name": "line-segment",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 175.03,
        "y1": 80.97,
        "x2": 80.97,
        "y2": 175.03,
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
        "cx": 64,
        "cy": 192,
        "r": 24,
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
        "cx": 192,
        "cy": 64,
        "r": 24,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;
