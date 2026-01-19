import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhArrowsHorizontal: PhIconDefinition = {
  "name": "arrows-horizontal",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 24,
        "y1": 128,
        "x2": 232,
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
        "points": "56 96 24 128 56 160",
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
        "points": "200 96 232 128 200 160",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;
