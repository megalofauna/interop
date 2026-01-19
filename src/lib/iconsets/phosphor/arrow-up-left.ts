import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhArrowUpLeft: PhIconDefinition = {
  "name": "arrow-up-left",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 192,
        "y1": 192,
        "x2": 64,
        "y2": 64,
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
        "points": "168 64 64 64 64 168",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;
