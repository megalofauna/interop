import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhTerminal: PhIconDefinition = {
  "name": "terminal",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 120,
        "y1": 192,
        "x2": 216,
        "y2": 192,
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
        "points": "40 64 112 128 40 192",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;
