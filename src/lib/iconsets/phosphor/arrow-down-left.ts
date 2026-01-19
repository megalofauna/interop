import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhArrowDownLeft: PhIconDefinition = {
  "name": "arrow-down-left",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 192,
        "y1": 64,
        "x2": 64,
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
        "points": "168 192 64 192 64 88",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;
