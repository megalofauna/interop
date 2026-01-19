import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhArrowUpRight: PhIconDefinition = {
  "name": "arrow-up-right",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 64,
        "y1": 192,
        "x2": 192,
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
        "points": "88 64 192 64 192 168",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;
