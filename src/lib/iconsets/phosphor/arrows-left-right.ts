import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhArrowsLeftRight: PhIconDefinition = {
  "name": "arrows-left-right",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 48,
        "y1": 176,
        "x2": 208,
        "y2": 176,
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
        "x1": 208,
        "y1": 80,
        "x2": 48,
        "y2": 80,
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
        "points": "176 144 208 176 176 208",
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
        "points": "80 112 48 80 80 48",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;
