import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhCrop: PhIconDefinition = {
  "name": "crop",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 24,
        "y1": 64,
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
      "line",
      {
        "x1": 192,
        "y1": 192,
        "x2": 192,
        "y2": 232,
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
        "points": "64 24 64 192 232 192",
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
        "points": "96 64 192 64 192 160",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;
