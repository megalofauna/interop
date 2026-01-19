import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhArrowDownRight: PhIconDefinition = {
  "name": "arrow-down-right",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 64,
        "y1": 64,
        "x2": 192,
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
        "points": "88 192 192 192 192 88",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;
