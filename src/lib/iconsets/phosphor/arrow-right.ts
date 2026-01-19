import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhArrowRight: PhIconDefinition = {
  "name": "arrow-right",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 40,
        "y1": 128,
        "x2": 216,
        "y2": 128,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ],
    [
      "polyline",
      {
        "points": "144 56 216 128 144 200",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;
