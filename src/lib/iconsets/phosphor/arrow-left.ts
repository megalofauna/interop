import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhArrowLeft: PhIconDefinition = {
  "name": "arrow-left",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 216,
        "y1": 128,
        "x2": 40,
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
        "points": "112 56 40 128 112 200",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;
