import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhArrowDown: PhIconDefinition = {
  "name": "arrow-down",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 128,
        "y1": 40,
        "x2": 128,
        "y2": 216,
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
        "points": "56 144 128 216 200 144",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;
