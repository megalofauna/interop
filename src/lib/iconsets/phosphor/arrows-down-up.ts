import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhArrowsDownUp: PhIconDefinition = {
  "name": "arrows-down-up",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 80,
        "y1": 48,
        "x2": 80,
        "y2": 208,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ],
    [
      "line",
      {
        "x1": 176,
        "y1": 208,
        "x2": 176,
        "y2": 48,
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
        "points": "112 176 80 208 48 176",
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
        "points": "144 80 176 48 208 80",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;
