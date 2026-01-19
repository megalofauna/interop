import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhArrowsInSimple: PhIconDefinition = {
  "name": "arrows-in-simple",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 208,
        "y1": 48,
        "x2": 144,
        "y2": 112,
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
        "x1": 48,
        "y1": 208,
        "x2": 112,
        "y2": 144,
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
        "points": "144 64 144 112 192 112",
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
        "points": "64 144 112 144 112 192",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;
